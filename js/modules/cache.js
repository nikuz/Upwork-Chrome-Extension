'use strict';

import * as config from 'config';
import * as storage from 'modules/storage';
import * as settings from 'modules/settings';
import * as odeskR from 'modules/odesk_request';
import * as badge from 'modules/badge';

var noop = function() {};

var nameGet = function() {
  var name = storage.get('feeds');
  return name.replace(/\s/g, '_');
};

var validate = function() {
  var cacheTime = parseInt(storage.get('validate'), 10),
    response = false;

  if (cacheTime) {
    // valid if less than two hours after update
    response = (Date.now() - cacheTime) / 1000 / 60 / 60 < 2;
  }
  return response;
};

var pick = function(jobs) {
  var allowedFields = [
    'id',
    'budget',
    'date_created',
    'duration',
    'job_type',
    'skills',
    'title',
    'url',
    'workload',
    'is_new'
  ];
  _.each(jobs, (item, key) => {
    jobs[key] = _.pick(item, allowedFields);
  });
  return jobs;
};

var filter = function(jobs, localJobs) {
  var result = [];
  _.each(jobs, downloaded => {
    let localDuplicate;
    localJobs.every(local => {
      if (local.id === downloaded.id && local.title === downloaded.title && local.date_created === downloaded.date_created) {
        localDuplicate = true;
        return false;
      } else {
        return true;
      }
    });
    if (!localDuplicate) {
      result.push(downloaded);
    }
  });
  result = _.sortBy(result, item => {
    return -new Date(item.date_created).getTime();
  });
  return result;
};

var fill = function(options, callback) {
  var opts = options,
    cb = callback,
    query = storage.get('feeds'),
    update = opts.update,
    start,
    curCache,
    favoritesJobs = storage.get('favorites') || [],
    trashJobs = storage.get('trash') || [],
    localJobs = [].concat(favoritesJobs).concat(trashJobs);

  // API pager format is `$offset;$count`.
  // Page size is restricted to be <= 100.
  // Example: page=100;99.
  if (!update) {
    curCache = pGet() || [];
    start = curCache.length + localJobs.length;
  } else {
    start = 0;
  }

  odeskR.request({
    query: query,
    start: start,
    end: config.cache_per_page
  }, (err, response) => {
    if (err) {
      cb(err);
    } else {
      var data = filter(response.jobs, localJobs),
        jobsCount = data.length;

      if (!update) {
        data = curCache.concat(data);
      }
      pSet(data);
      cb(null, jobsCount);
    }
  });
};

var request = function(options, callback) {
  var opts = options,
    cb = callback,
    page = opts.page || 1,
    per_page = settings.get('jobsPerPage'),
    curCache = pGet() || [],
    start = (page - 1) * per_page,
    end = page * per_page,
    cacheSlice = curCache.slice(start, end);

  if (cacheSlice.length === per_page) {
    callback(null, cacheSlice);
  } else {
    fill(opts, (err, response) => {
      if (err) {
        cb(err);
      } else {
        if (response > 0) {
          request(opts, cb);
        } else {
          cb(null, null);
        }
      }
    });
  }
};

// ----------------
// public methods
// ----------------

var pRequest = function(options, callback) {
  var opts = options || {},
    cb = callback || noop;

  if (validate()) {
    request(opts, cb);
  } else {
    opts.update = true;
    fill(opts, err => {
      if (err) {
        cb(err);
      } else {
        opts.update = false;
        request(opts, cb);
      }
    });
  }
};

var pGet = function(id) {
  var curCache = storage.get('cache_' + nameGet());
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
  storage.set('validate', Date.now());
  storage.set('cache_' + nameGet(), pick(data));
  badge.update();
};

var pUpdate = function(id, data) {
  var cacheName = storage.get('feeds'),
    curCache = pGet(cacheName);
  _.each(curCache, item => {
    if (item.id === id) {
      _.extend(item, data);
    }
  });
  pSet(curCache);
};

var pFlush = function() {
  var data = storage.get(),
    keys = _.keys(data);

  _.each(keys, item => {
    if (item.indexOf('cache_') !== -1) {
      storage.clear(item);
    }
  });
};

// ---------
// interface
// ---------

export {
  pRequest as request,
  pGet as get,
  pSet as set,
  pUpdate as update,
  pFlush as flush
};
