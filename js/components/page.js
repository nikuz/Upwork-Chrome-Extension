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
  full: 'pageNoMoreJobs',
  extraInitial: 'pageExtraInitial'
};

var container = $('body');
var getClass = mode => {
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
  pAdd('error');
});

GlobalEvents.jobsReceived.listen(() => {
  pRemove('load');
  pAdd('data');
});

// ----------------
// public methods
// ----------------

var pSet = mode => {
  container[0].className = getClass(mode);
};

var pGet = () => {
  return container[0].className;
};

var pAdd = mode => {
  container.addClass(getClass(mode));
};

var pRemove = mode => {
  container.removeClass(getClass(mode));
};

var pHas = mode => {
  return container.hasClass(getClass(mode));
};

var pToggle = mode => {
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
