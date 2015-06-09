'use strict';

import * as config from 'config';
import * as _ from 'underscore';
import * as storage from 'modules/storage';
import * as settings from 'modules/settings';
import * as odesk from 'modules/odesk';

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

var fill = function(options, callback) {
  var opts = options,
    cb = callback,
    query = opts.query,
    update = opts.update,
    start,
    curCache;

  // API pager format is `$offset;$count`.
  // Page size is restricted to be <= 100.
  // Example: page=100;99.
  if (!update) {
    curCache = pGet() || [];
    start = curCache.length;
  } else {
    start = 0;
  }

  odesk.request({
    url: config.API_jobs_url,
    dataType: 'json',
    query: query,
    start: start,
    end: config.cache_per_page
  }, (err, response) => {
    if (err) {
      cb(err);
    } else {
      var data = response.jobs,
        jobsCount = data.length;

      if (!update) {
        data = curCache.concat(data);
      }
      pSet(data);
      storage.set('validate', Date.now());
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

  opts.query = storage.get('feeds');

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

var pGet = function() {
  return storage.get('cache_' + nameGet());
};

var pSet = function(data) {
  return storage.set('cache_' + nameGet(), data);
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

// ---------
// interface
// ---------

export {
  pRequest as request,
  pGet as get,
  pSet as set,
  pUpdate as update
};
