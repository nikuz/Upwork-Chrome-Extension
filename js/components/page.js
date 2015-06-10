'use strict';

import * as $ from 'jquery';

var modes = {
  init: 'pageInitialMode',
  data: 'pageDataExistsMode',
  error: 'pageErrorMode',
  load: 'pageLoadMode',
  settings: 'appSettingsMode',
  empty: 'pageDataEmpty',
  wide: 'pageWideMode',
  full: 'pageNoMoreJobs'
};

var container = $('body');
var getClass = function(mode) {
  return modes[mode] || '';
};

// ----------------
// init global events listeners
// ----------------

GlobalEvents.settingsInit.listen(() => {
  pAdd('settings');
});
GlobalEvents.settingsSaved.listen(() => {
  pRemove('settings');
});
GlobalEvents.settingsHide.listen(() => {
  pRemove('settings');
});

GlobalEvents.feedsAdded.listen(() => {
  pRemove('init');
});

GlobalEvents.jobsPending.listen(() => {
  pAdd('load');
});

GlobalEvents.inboxError.listen(() => {
  pRemove('load');
  pAdd('error');
});
GlobalEvents.inboxFull.listen(() => {
  pRemove('load');
  pAdd('full');
});
GlobalEvents.inboxEmpty.listen(() => {
  pRemove('load');
  pAdd('empty');
});

GlobalEvents.jobsReceived.listen(() => {
  pRemove('load');
  pRemove('full');
  pRemove('empty');
  pRemove('error');
  pAdd('data');
});

// ----------------
// public methods
// ----------------

var pSet = function(mode) {
  container[0].className = getClass(mode);
};

var pGet = function() {
  return container[0].className;
};

var pAdd = function(mode) {
  container.addClass(getClass(mode));
};

var pRemove = function(mode) {
  container.removeClass(getClass(mode));
};

var pHas = function(mode) {
  return container.hasClass(getClass(mode));
};

var pToggle = function(mode) {
  container.toggleClass(getClass(mode));
};

$(() => {
  if (window.innerWidth > 800) {
    pAdd('wide');
  }
});

// ---------
// interface
// ---------

export {
  pGet as get,
  pSet as set,
  pAdd as add,
  pRemove as remove,
  pHas as has,
  pToggle as toggles
};
