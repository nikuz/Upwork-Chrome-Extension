'use strict';

import * as storage from 'modules/storage';

var settingsName = 'settings';

// search - it is mean, that change this field will refresh search results
var data = {
  category2: {
    values: [],
    value: 'All',
    search: true
  },
  budgetFrom: {
    values: [
      '0',
      '100',
      '200',
      '300',
      '500',
      '1000',
      '2000',
      '3000',
      '5000',
      '1000000'
    ],
    value: '0',
    search: true
  },
  budgetTo: {
    value: '1000000',
    search: true
  },
  notifyInterval: {
    values: [
      {5: '5 minutes'},
      {10: '10 minutes'},
      {20: '20 minutes'},
      {30: '30 minutes'},
      {60: '1 hour'},
      {180: '3 hours'}
    ],
    value: 5
  },
  notifyAllow: {
    value: true
  },
  dndFrom: {
    value: '00:00'
  },
  dndTo: {
    value: '06:00'
  },
  duration: {
    values: [
      {'All': 'All'},
      {'Week': 'Week'},
      {'Month': 'Month'},
      {'Quarter': 'Quarter'},
      {'Semester': 'Semester'},
      {'Ongoing': 'Ongoing'}
    ],
    value: 'All',
    search: true
  },
  jobType: {
    values: [
      {'All': 'All'},
      {'Hourly': 'Hourly'},
      {'Fixed': 'Fixed'}
    ],
    value: 'All',
    search: true
  },
  workload: {
    values: [
      {'All': 'All'},
      {'As needed': 'As needed'},
      {'Part time': 'Part time'},
      {'Full time': 'Full time'}
    ],
    value: 'All',
    search: true
  },
  useProxy: {
    value: false
  },
  preview: {
    value: true
  }
};

var clone = function() {
  return JSON.parse(JSON.stringify(data)); // full clone
};

// ----------------
// public methods
// ----------------

var pGet = function(field) {
  var settings = storage.get(settingsName);
  if (!settings) {
    settings = clone();
  }
  if (field) {
    settings = settings[field];
  }
  return settings;
};

var pSet = function(data) {
  storage.set(settingsName, data);
};

// ---------
// interface
// ---------

export {
  pGet as get,
  pSet as set
};
