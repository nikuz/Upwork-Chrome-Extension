'use strict';

import * as config from 'config';
import * as storage from 'services/localStorage';
import * as odesk from 'modules/odesk';

var noop = () => {};

var nameGet = name => {
  return name.replace(/\s/g, '_');
};
var get = name => {
  return storage.get('cache_' + nameGet(name));
};
var set = (name, data) => {
  return storage.set('cache_' + nameGet(name), data);
};

var check = name => {
  var curCache = get(name),
    response = {
      valid: false
    };

  if(curCache){
    response.exist = true;
    var timeStamp = Date.now(),
      lastJobTime = new Date(curCache[curCache.length - 1].date_created).getTime();

    // valid if less than two hours after update
    response.valid = (timeStamp - lastJobTime) /1000/60/60 < 2;
  }
  return response;
};

var fill = (options, callback) => {
  var opts = options,
    cb = callback,
    query = opts.query,
    update = opts.update,
    page,
    curCache;

  // API pager format is `$offset;$count`.
  // Page size is restricted to be <= 100.
  // Example: page=100;99.
  if (!update) {
    curCache = get(query) || [];
    page = curCache.length;
  } else {
    page = 0;
  }

  odesk.request({
    url: config.API_jobs_url,
    dataType: 'json',
    query: query,
    page: page,
    per_page: config.cache_per_page
  }, (err, response) => {
    if (err) {
      cb(err);
    } else {
      var data = response.jobs;
      if (!update) {
        data = curCache.concat(data);
      }
      set(query, data);
      cb();
    }
  });
};

var request = (options, callback) => {
  var opts = options,
    cb = callback,
    query = opts.query,
    page = opts.page || 1,
    per_page = opts.per_page || 20,
    curCache = get(query),
    start = (page - 1) * per_page,
    end = page * per_page,
    cacheSlice = curCache.slice(start, end);

  if (cacheSlice.length === per_page) {
    callback(null, cacheSlice);
  } else {
    fill(opts, err => {
      if (err) {
        cb(err);
      } else {
        request(opts, cb);
      }
    });
  }
};

// ----------------
// public methods
// ----------------

var pGet = (options, callback) => {
  var opts = options || {},
    cb = callback || noop,
    query = opts.query,
    cache = check(query);

  if (cache.valid) {
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

// ---------
// interface
// ---------

export {
  pGet as get
};
