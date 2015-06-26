'use strict';

import * as storage from 'modules/storage';

// search - it is mean, that change this field will refresh search results
var fields = {
  jobsPerPage: {
    value: 10
  },
  budgetFrom: {
    value: 0,
    search: true
  },
  budgetTo: {
    value: 1000000,
    search: true
  },
  daysPosted: {
    value: 50,
    search: true
  },
  notifyInterval: {
    value: 5
  },
  notifyDisabled: {
    value: false
  },
  duration: {
    value: 'All',
    search: true
  },
  jobType: {
    value: 'All',
    search: true
  },
  workload: {
    value: 'All',
    search: true
  }
};

// ----------------
// public methods
// ----------------

var pGet = function(field) {
  var settings = storage.get('settings');
  if (!settings) {
    settings = _.clone(fields);
  }
  if (field) {
    settings = settings[field];
  }
  return settings;
};

var pSet = function(data) {
  var settings = storage.get('settings');
  if (!settings) {
    settings = _.clone(fields);
  }
  _.extend(settings, data);
  storage.set('settings', settings);
  return settings;
};

// ---------
// interface
// ---------

export {
  pGet as get,
  pSet as set
};
