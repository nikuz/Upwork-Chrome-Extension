'use strict';

import * as storage from 'modules/storage';
import * as _ from 'underscore';

var preset = {
  curPage:        0,
  jobsPerPage:    10,
  budgetFrom:     0,
  budgetTo:       1000000,
  daysPosted:     50,
  notifyInterval: 5, // TODO: initial should be 5
  notifyDisabled: false,
  duration:       'All',
  jobType:        'All',
  workload:       'All'
};

// ----------------
// public methods
// ----------------

var pGet = field => {
  var settings = storage.get('settings');
  if (!settings) {
    settings = _.clone(preset);
  }
  if (field) {
    settings = settings[field];
  }
  return settings;
};

var pSet = data => {
  var settings = storage.get('settings');
  if (!settings) {
    settings = _.clone(preset);
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
