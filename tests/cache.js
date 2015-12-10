'use strict';

import * as config from 'config';
import * as settings from 'modules/settings';
import * as data from 'tests/data/index';
import * as cache from 'modules/cache';
import * as storage from 'modules/storage';
import {series as asyncSeries} from 'async';
import * as chai from 'chai';

var expect = chai.expect;

describe('Generate feeds sum MD5 string', () => {
  beforeEach(() => {
    data.cleanup();
  });

  it('should equal to pre calculated sum', () => {
    data.populate(['feeds', 'settings']);
    var sum = data.generateFeedsSum(),
      result = cache.generateFeedSum();

    expect(result).to.eql(sum);
  });
  it('should not equal to pre calculated sum', () => {
    data.populate(['feeds', 'settingsWithoutCategory']);
    var sum = data.generateFeedsSum(),
      result = cache.generateFeedSum();

    expect(result).to.not.eql(sum);
  });
  it('should return null if feeds or settings is not defined', () => {
    var result = cache.generateFeedSum();
    expect(result).to.be.an('null');
  });
});

describe('Calculate pager offset start', () => {
  beforeEach(() => {
    data.cleanup();
    data.populate(['feeds', 'settings', 'favorites', 'trash', 'trashExtra']);
  });

  it('should return pager offset based on cached jobs', () => {
    data.populate(['cache']);
    data.cacheDateUpdate(['cache', 'favorites', 'trash', 'trashExtra']);
    var cachedJobs = data.get('cache'),
      favoritesJobs = data.get('favorites'),
      trashJobs = data.get('trash'),
      trashExtraJobs = data.get('trashExtra'),
      result = cache.calculatePagerStart();

    expect(result).to.eql(cachedJobs.length + favoritesJobs.length + trashJobs.length + trashExtraJobs.length);
  });
  it('should return pager offset equal to inbox jobs counts even if cached jobs is present but their create date is more than 3 hours', () => {
    data.populate(['cache']);
    data.cacheDateUpdate(['cache']);
    var cachedJobs = data.get('cache'),
      result = cache.calculatePagerStart();

    expect(result).to.eql(cachedJobs.length);
  });
  it('should return 0 offset of pager even if cached jobs is present but their create date is more than 3 hours, and inbox is empty', () => {
    var result = cache.calculatePagerStart();
    expect(result).to.eql(0);
  });
});

describe('Filter received jobs', () => {
  beforeEach(() => {
    data.cleanup();
    data.populate(['feeds', 'lastJobDate', 'settings', 'favorites', 'trash', 'trashExtra']);
  });

  it('should return all jobs, because it not contains in local jobs', () => {
    var newJobs = data.get('newJobs'),
      result = cache.filter(data.generateFeedsSum(), newJobs);

    expect(result).to.be.an('array');
    expect(result).to.have.length(newJobs.length);
  });
  it('should return empty array if last_job_date is less than 3 seconds', () => {
    var newJobs = data.get('newJobs');
    data.cacheDateUpdate(['lastJobDate']);
    var result = cache.filter(data.generateFeedsSum(), newJobs);

    expect(result).to.be.an('array');
    expect(result).to.have.length(0);
  });
  it('should return empty array if the current feeds sum is not equal to the feeds sum that was is when the request is was sent', () => {
    var newJobs = data.get('newJobs'),
      result = cache.filter('new feeds', newJobs);

    expect(result).to.be.an('array');
    expect(result).to.have.length(0);
  });
  it('should return empty array because all received jobs contains in local cache', () => {
    var newJobs = data.get('favorites'),
      result = cache.filter(data.generateFeedsSum(), newJobs);

    expect(result).to.be.an('array');
    expect(result).to.have.length(0);
  });
  it('should return only jobs that not contains in local cache', () => {
    var favoritesJobs = data.get('favorites'),
      newJobs = data.get('newJobs'),
      allJobs = newJobs.concat(favoritesJobs),
      result = cache.filter(data.generateFeedsSum(), allJobs);

    expect(result).to.be.an('array');
    expect(result).to.have.length(allJobs.length - favoritesJobs.length);
  });
  it('should return only jobs that not contains in extra trash', () => {
    var extraTrash = data.get('trashExtra'),
      newJobs = data.get('newJobs'),
      allJobs = newJobs.concat(extraTrash),
      result = cache.filter(data.generateFeedsSum(), allJobs);

    expect(result).to.be.an('array');
    expect(result).to.have.length(allJobs.length - extraTrash.length);
  });
  it('should return only jobs date_created of which is earlier than last_job_date', () => {
    var newJobs = data.sourceDateUpdate('newJobs', new Date(Date.now() - 36e5 * 4)), // 4 hours ago
      newJobs2 = data.sourceDateUpdate('newJobs2', new Date(Date.now() - 36e5 * 2)), // 2 hours ago
      allJobs = newJobs.concat(newJobs2);

    data.cacheDateUpdate(['lastJobDate'], new Date(Date.now() - 36e5 * 3)); // last_job_date is 3 hours ago
    var result = cache.filter(data.generateFeedsSum(), allJobs, true);

    expect(result).to.be.an('array');
    expect(result).to.have.length(allJobs.length - newJobs.length);
  });
});

describe('Get', () => {
  beforeEach(() => {
    data.cleanup();
  });

  it('should return array of local stored cached jobs', () => {
    data.populate(['cache']);
    var result = cache.get(),
      cachedJobs = data.get('cache');

    expect(result).to.be.an('array');
    expect(result).to.have.length(cachedJobs.length);
  });
  it('should return specific job from local stored cached jobs', () => {
    data.populate(['cache']);
    var jobId = '~0167e29d55a0f06175234',
      result = cache.get(jobId);

    expect(result).to.be.an('object');
    expect(result.id).to.eql(jobId);
  });
  it('should return empty array because cache is empty', () => {
    var result = cache.get();
    expect(result).to.be.an('array');
    expect(result).to.have.length(0);
  });
});

describe('Update', () => {
  beforeEach(() => {
    data.cleanup();
    data.populate(['cache']);
  });

  it('should update specific job of local stored cached jobs', () => {
    var jobId = '~0167e29d55a0f06175234',
      title = 'new title';

    cache.update(jobId, {
      title: title
    });
    var result = cache.get(jobId);
    expect(result).to.be.an('object');
    expect(result.id).to.eql(jobId);
    expect(result.title).to.eql(title);
  });
});

describe('Populate', () => {
  beforeEach(() => {
    data.cleanup();
    data.auth();
    data.populate(['feeds', 'settings']);
  });

  it('should populate cache based on user\'s settings', (done) => {
    var populatedJobsCount;
    asyncSeries([
      function(callback) {
        cache.populate({}, function(err, response) {
          expect(err).to.be.an('null');
          expect(response).to.eql(config.cache_per_request);
          populatedJobsCount = response;
          callback();
        });
      },
      function(callback) {
        var result = cache.get();
        expect(result).to.be.an('array');
        expect(result).to.have.length(populatedJobsCount);
        expect(cache.isEmpty()).to.eql(false);
        expect(storage.get('cache_last_update')).to.eql(new Date().toString());
        expect(storage.get('last_job_date')).to.eql(result[0].date_created);
        callback();
      }
    ], done);
  });
  it('should add new jobs to the end of exiting cached jobs array', (done) => {
    data.populate(['cache']);
    var cachedJobs = data.get('cache'),
      populatedJobsCount;

    asyncSeries([
      function(callback) {
        cache.populate({}, function(err, response) {
          expect(err).to.be.an('null');
          expect(response).to.eql(config.cache_per_request);
          populatedJobsCount = response;
          callback();
        });
      },
      function(callback) {
        var result = cache.get();
        expect(result).to.be.an('array');
        expect(result).to.have.length(populatedJobsCount + cachedJobs.length);
        var i = 0, l = cachedJobs.length;
        for (; i < l; i += 1) {
          expect(new Date(result[i].date_created)).to.be.below(new Date(result[l].date_created));
        }
        callback();
      }
    ], done);
  });
  it('should add new jobs to the top of exiting cached jobs array', (done) => {
    data.populate(['cache']);
    var cachedJobs = data.get('cache'),
      populatedJobsCount;

    asyncSeries([
      function(callback) {
        cache.populate({
          update: true
        }, function(err, response) {
          expect(err).to.be.an('null');
          expect(response).to.eql(config.cache_per_request);
          populatedJobsCount = response;
          callback();
        });
      },
      function(callback) {
        var result = cache.get();
        expect(result).to.be.an('array');
        expect(result).to.have.length(populatedJobsCount + cachedJobs.length);
        var i = 0, l = populatedJobsCount;
        for (; i < l; i += 1) {
          expect(new Date(result[i].date_created)).to.be.above(new Date(result[l].date_created));
        }
        callback();
      }
    ], done);
  });
});

describe('Check is empty', () => {
  beforeEach(() => {
    data.cleanup();
    data.auth();
    data.populate(['feeds', 'settings']);
  });

  it('should return true', () => {
    expect(cache.isEmpty()).to.eql(true);
  });
  it('should return false', (done) => {
    asyncSeries([
      function(callback) {
        cache.populate({}, function(err, response) {
          expect(err).to.be.an('null');
          callback();
        });
      },
      function(callback) {
        expect(cache.isEmpty()).to.eql(false);
        callback();
      }
    ], done);
  });
});

describe('Flush', () => {
  beforeEach(() => {
    data.cleanup();
    data.populate(['cache', 'lastJobDate']);
  });

  it('should flush all local stored cached jobs', () => {
    var cachedJobs = cache.get();
    expect(cachedJobs).to.be.an('array');
    expect(cachedJobs).to.have.length.above(0);
    expect(storage.get('last_job_date')).not.be.an('undefined');
    expect(cache.isEmpty()).to.eql(false);

    cache.flush();

    cachedJobs = cache.get();
    expect(cachedJobs).to.be.an('array');
    expect(cachedJobs).to.have.length(0);
    expect(storage.get('last_job_date')).to.be.an('undefined');
    expect(cache.isEmpty()).to.eql(true);
  });
});

describe('Check live time', () => {
  beforeEach(() => {
    data.cleanup();
    data.populate(['feeds', 'cache', 'cacheLastUpdate']);
  });

  it('should flush local cache if live time of cache more than 3 hours, and return true', () => {
    var cachedJobs = cache.get();
    expect(cachedJobs).to.be.an('array');
    expect(cachedJobs).to.have.length(data.get('cache').length);
    var result = cache.checkInboxCacheLiveTime();
    expect(result).to.eql(true);
    cachedJobs = cache.get();
    expect(cachedJobs).to.be.an('array');
    expect(cachedJobs).to.have.length(0);
  });
  it('should do nothing if live time of cache less than 3 hours, and return false', () => {
    var cachedJobs = cache.get(),
      cacheLength = data.get('cache').length;

    data.cacheDateUpdate(['cacheLastUpdate'], new Date());

    expect(cachedJobs).to.be.an('array');
    expect(cachedJobs).to.have.length(cacheLength);
    var result = cache.checkInboxCacheLiveTime();
    expect(result).to.eql(false);
    cachedJobs = cache.get();
    expect(cachedJobs).to.be.an('array');
    expect(cachedJobs).to.have.length(cacheLength);
  });
});

describe('Request to local cache', () => {
  beforeEach(() => {
    data.cleanup();
    data.auth();
    data.populate(['feeds', 'settings', 'cache']);
  });

  it('should return jobs from local cache if there is sufficient', (done) => {
    var cachedJobs = cache.get();
    cache.request({}, function(err, response) {
      expect(err).to.be.an('null');
      expect(response).to.be.an('array');
      expect(response).to.have.length(config.jobs_per_page);
      var newCachedJobs = cache.get();
      expect(cachedJobs).to.have.length(newCachedJobs.length); // without expanding local cache
      done();
    });
  });
  it('should populate more jobs to local cache from remote server if there isn\'t sufficient and return it', (done) => {
    var cachedJobs = cache.get(),
      page = 5;

    cache.request({
      page: page
    }, function(err, response) {
      expect(err).to.be.an('null');
      expect(response).to.be.an('array');
      expect(response).to.have.length(config.jobs_per_page);
      var newCachedJobs = cache.get();
      expect(cachedJobs).to.have.length.below(newCachedJobs.length); // with expanding local cache
      expect(newCachedJobs).to.have.length(config.cache_per_request * 2);
      done();
    });
  });
});
