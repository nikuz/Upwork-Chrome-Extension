'use strict';

import * as _ from 'underscore';
import * as config from '../config';
import * as storage from 'modules/storage';
import * as settings from 'modules/settings';
import * as request from 'modules/request';
import * as CryptoJS from 'crypto-js';
import * as EventManager from 'modules/events';
import dateCorrect from 'utils/date';

var noop = function() {};

var cacheLiveTime = 36e5 * 3; // 3 hours

var pick = function(jobs) {
  var allowedFields = [
    'id',
    'cut_id',
    'category2',
    'budget',
    'date_created',
    'date',
    'duration',
    'job_type',
    'skills',
    'title',
    'url',
    'workload',
    'is_new',
    'watched',
    'feeds'
  ];
  _.each(jobs, (item, key) => {
    jobs[key] = _.pick(item, allowedFields);
  });
  return jobs;
};

var generateFeedSum = function() {
  var s = settings.get(),
    feeds = storage.get('feeds'),
    fieldsToSum = [
      'category2',
      'budgetFrom',
      'budgetTo',
      'duration',
      'jobType',
      'workload'
    ],
    sum = feeds;

  if (!s || !feeds) {
    return null;
  } else {
    _.each(fieldsToSum, item => {
      if (s[item]) {
        sum += s[item].value.toString();
      }
    });
    return CryptoJS.MD5(sum).toString();
  }
};

var getCashedJobs = function(curCache) {
  curCache = curCache || pGet();
  var favoritesJobs = storage.get('favorites') || [],
    trashJobs = storage.get('trash') || [];

  return [].concat(curCache).concat(favoritesJobs).concat(trashJobs);
};


// if cached (inbox, favorites, trash) jobs has the same feedsSum as current request
// and if cached jobs has date_created earlier than last inbox job + 3 hours
var calculatePagerStart = function() {
  var start = 0,
    feedsSum = generateFeedSum(),
    curCache = pGet(),
    lastInboxJobDate = curCache.length ? _.last(curCache).date_created : null,
    threeHoursAgo = Date.now() - cacheLiveTime,
    localJobs = getCashedJobs(curCache),
    trashExtra = storage.get('trash_extra') || [];

  if (lastInboxJobDate) {
    lastInboxJobDate = new Date(lastInboxJobDate).getTime() - cacheLiveTime;
  }

  var checks = function(item) {
    var createdAt = new Date(item.date_created).getTime();
    if (item.feeds === feedsSum && ((!lastInboxJobDate && createdAt > threeHoursAgo) || (lastInboxJobDate && createdAt > lastInboxJobDate))) {
      start += 1;
    }
  };

  _.each(localJobs, checks);
  _.each(trashExtra, checks);
  return start;
};

var filter = function(feedsSum, jobs, update) {
  var result = [],
    cacheTime = storage.get('last_job_date');

  if (cacheTime) {
    cacheTime = new Date(cacheTime);
  }
  // fast double response (less than 3 second between responses)
  if (cacheTime && Date.now() - cacheTime.getTime() < 3000) {
    return result;
  }
  // background response may be delayed
  if (generateFeedSum() !== feedsSum) {
    return result;
  }
  var localJobs = getCashedJobs(),
    trashExtra = storage.get('trash_extra') || [],
    localJobsIds = _.map(localJobs, item => {
      return item.id;
    }),
    trashExtraIds = _.map(trashExtra, item => {
      return item.id;
    });

  _.each(jobs, downloaded => {
    downloaded.date_created = dateCorrect(downloaded.date_created);
    var jobDate = new Date(downloaded.date_created);
    // new job isn't contains in local jobs
    // and if it's update operation, date created of new job is higher than last_job_date
    // or if it's not the update operation
    if (!_.contains(localJobsIds, downloaded.id) && !_.contains(trashExtraIds, downloaded.id) && (!update || !cacheTime || jobDate > cacheTime)) {
      downloaded.cut_id = downloaded.id.replace(/^~+/, '_');
      downloaded.feeds = feedsSum;
      if (update && cacheTime) {
        downloaded.is_new = true;
      }
      result.push(downloaded);
    }
  });
  return result;
};

var reqFieldPrepare = function(field) {
  field = field.toLowerCase();
  return field === 'all' ? '' : field.replace(/\s+/g, '_');
};

// if cache updated more than 3 hours ago, need to update inbox cache totally
var checkInboxCacheLiveTime = function() {
  var lastUpdate = storage.get('cache_last_update'),
    isUpdated = false;

  if (lastUpdate) {
    lastUpdate = new Date(lastUpdate);
    if (Date.now() - lastUpdate.getTime() > cacheLiveTime) {
      pFlush();
      isUpdated = true;
    }
  }
  return isUpdated;
};

var populate = function(options, callback) {
  var opts = options,
    cb = callback,
    s = settings.get(),
    feeds = storage.get('feeds'),
    feedsSum = generateFeedSum(),
    update = opts.update,
    start = update ? 0 : calculatePagerStart(),
    curCache = pGet();

  if (start === 0) {
    update = true;
  }

  var requestData = {
    q: feeds,
    budget: '[' + s.budgetFrom.value + ' TO ' + s.budgetTo.value + ']',
    days_posted: config.UPWORK_jobs_days_posted,
    duration: reqFieldPrepare(s.duration.value),
    job_type: reqFieldPrepare(s.jobType.value),
    workload: reqFieldPrepare(s.workload.value),
    paging: start + ';' + config.cache_per_request, // API pager format is `$offset;$count`
    sort: 'create_time desc'
  };
  if (s.category2.value !== 'All') {
    requestData.category2 = s.category2.value;
  }
  request.get({
    url: config.UPWORK_jobs_url,
    data: requestData
  }, (err, response) => {
    if (err) {
      cb(err);
    } else {
      var jobsTotal = (response.paging && response.paging.total) || 0;
      EventManager.trigger('gotNewJobsCount', {
        count: jobsTotal
      });
      response = filter(feedsSum, response.jobs, update);
      var jobsCount = response.length;

      if (response.length) {
        if (update || !curCache.length) {
          storage.set('cache_last_update', new Date());
        }
        if (update) {
          let newLastJobDate = response[0].date_created;
          storage.set('last_job_date', newLastJobDate);
          EventManager.trigger('cacheUpdated', {
            newLastJobDate
          });
          response = response.concat(curCache);
          if (response.length > config.cache_limit) {
            response.length = config.cache_limit;
          }
        } else {
          response = curCache.concat(response);
        }
        pSet(response);
      }

      cb(null, jobsCount);
    }
  });
};

// ----------------
// public methods
// ----------------

var pRequest = function(options, callback) {
  var opts = options,
    cb = callback,
    page = opts.page || 1,
    per_page = config.jobs_per_page,
    curCache = pGet(),
    cacheSlice;

  function getJobs() {
    var start = (page - 1) * per_page,
      end = page * per_page;

    cacheSlice = curCache.slice(start, end);

    if (cacheSlice.length === per_page) {
      cb(null, cacheSlice);
    } else {
      getMoreJobs();
    }
  }
  function getMoreJobs() {
    opts.update = checkInboxCacheLiveTime();
    populate(opts, (err, response) => {
      if (err) {
        cb(err);
      } else {
        if (response > 0) {
          curCache = pGet();
          getJobs();
        } else {
          cb(null, cacheSlice);
        }
      }
    });
  }

  getJobs();
};

var pCheckNew = function(callback) {
  var cb = callback || noop;
  checkInboxCacheLiveTime();
  populate({
    update: true
  }, cb);
};

var pGet = function(id) {
  var curCache = storage.get('cache') || [];
  if (id) {
    curCache.every(item => {
      if (item.id === id) {
        curCache = item;
        return false;
      } else {
        return true;
      }
    });
  }
  return curCache;
};

var pSet = function(data) {
  storage.set('cache', pick(data));
};

var pUpdate = function(id, data) {
  var curCache = pGet();
  _.each(curCache, item => {
    if (item.id === id) {
      _.extend(item, data);
    }
  });
  pSet(curCache);
};

var pFlush = function() {
  storage.clear('cache');
  storage.clear('last_job_date');
};

var pIsEmpty = function() {
  return pGet().length === 0;
};

// ---------
// interface
// ---------

export {
  pRequest as request,
  pCheckNew as checkNew,
  pGet as get,
  pSet as set,
  pUpdate as update,
  pFlush as flush,
  pIsEmpty as isEmpty,
  // for tests
  generateFeedSum,
  calculatePagerStart,
  filter,
  checkInboxCacheLiveTime,
  populate
};
