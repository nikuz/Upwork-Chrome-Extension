'use strict';

import * as settings from 'modules/settings';

var modes = {
  init: 'pageInitialMode',
  data: 'pageDataExistsMode',
  error_proxy: 'pageErrorProxyMode',
  error_api: 'pageErrorApiMode',
  load: 'pageLoadMode',
  settings: 'appSettingsMode',
  empty: 'pageDataEmpty',
  wide: 'pageWideMode',
  full: 'pageNoMoreJobs',
  bg: 'pageNewJobsFromBg'
};

var container;
var getClass = function(mode) {
  return modes[mode] || '';
};

// ----------------
// public methods
// ----------------

var pInit = function() {
  container = $('body');
  // defined in main.js
  GlobalEvents = Reflux.createActions([
    'feedsAdded',
    'settingsInit',
    'settingsHide',
    'settingsSaved',
    'inboxError',
    'jobsReceived',
    'jobsPending',
    'inboxFull',
    'inboxEmpty',
    'newJobsFromBg'
  ]);

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
    var useProxy = settings.get('useProxy').value;
    pRemove('load');
    if (useProxy) {
      pAdd('error_proxy');
      pRemove('error_api');
    } else {
      pAdd('error_api');
      pRemove('error_proxy');
    }
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
    pRemove('error_proxy');
    pRemove('error_api');
    pRemove('bg');
    pRemove('settings');
    pAdd('data');
  });

  GlobalEvents.newJobsFromBg.listen(() => {
    pAdd('bg');
  });

  if (window.innerWidth > 800) {
    pAdd('wide');
  }
};

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

// ---------
// interface
// ---------

export {
  pInit as init,
  pGet as get,
  pSet as set,
  pAdd as add,
  pRemove as remove,
  pHas as has,
  pToggle as toggles
};
