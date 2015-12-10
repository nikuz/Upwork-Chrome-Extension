'use strict';

import * as CryptoJS from 'crypto-js';
import * as _ from 'underscore';

// data sources
import * as authData from 'json!./auth.json';
import * as feeds from 'json!./feeds.json';
import * as settings from 'json!./settings.json';
import * as settingsWithoutCategory from 'json!./settingsWithoutCategory.json';
import * as cache from 'json!./cache.json';
import * as favorites from 'json!./favorites.json';
import * as trash from 'json!./trash.json';
import * as trashExtra from 'json!./trashExtra.json';
import * as newJobs from 'json!./newJobs.json';
import * as newJobs2 from 'json!./newJobs2.json';
import * as lastJobDate from 'json!./lastJobDate.json';
import * as cacheLastUpdate from 'json!./cacheLastUpdate.json';

var data = {
  feeds,
  settings,
  settingsWithoutCategory,
  cache,
  favorites,
  trash,
  trashExtra,
  newJobs,
  newJobs2,
  lastJobDate,
  cacheLastUpdate
};

// ----------------
// public methods
// ----------------

var pAuth = function() {
  _.each(authData, function(value, key) {
    localStorage.setItem(key, value);
  });
};

var pPopulate = function(names) {
  _.each(names, name => {
    if (data[name]) {
      let dataSource = data[name],
        value = dataSource.data;

      value = _.isObject(value) ? JSON.stringify(value) : value;

      localStorage.setItem(dataSource.name, value);
    } else {
      console.log('Data source is not exists');
    }
  });
};

var pCleanup = function() {
  localStorage.clear();
};

var pGet = function(name) {
  if (data[name]) {
    return data[name].data;
  } else {
    console.log('Data source is not exists');
  }
};

var pCacheDateUpdate = function(names, date) {
  date = date || new Date();
  _.each(names, name => {
    if (data[name]) {
      let dataSource = data[name],
        value = dataSource.data,
        cache = localStorage.getItem(dataSource.name);

      if (_.isObject(value)) {
        cache = JSON.parse(cache);
        _.each(cache, item => {
          item.date_created = date;
        });
        cache = JSON.stringify(cache);
      } else {
        cache = date.toString();
      }
      localStorage.setItem(dataSource.name, cache);
    } else {
      console.log('Data source is not exists');
    }
  });
};

var pSourceDateUpdate = function(name, date) {
  date = date || new Date();
  var dataSource;
  if (data[name]) {
    dataSource = data[name];
    let value = dataSource.data;
    if (_.isObject(value)) {
      _.each(value, item => {
        item.date_created = date;
      });
    } else {
      dataSource.data = date;
    }
  } else {
    console.log('Data source is not exists');
  }
  return dataSource.data;
};

var pGenerateFeedsSum = function() {
  var fieldsToSum = [
      'category2',
      'budgetFrom',
      'budgetTo',
      'duration',
      'jobType',
      'workload'
    ],
    s = pGet('settings'),
    sum = pGet('feeds');

  _.each(fieldsToSum, item => {
    sum += s[item].value.toString();
  });
  return CryptoJS.MD5(sum).toString();
};

// ---------
// interface
// ---------

export {
  pAuth as auth,
  pPopulate as populate,
  pCleanup as cleanup,
  pGet as get,
  pCacheDateUpdate as cacheDateUpdate,
  pSourceDateUpdate as sourceDateUpdate,
  pGenerateFeedsSum as generateFeedsSum
};
