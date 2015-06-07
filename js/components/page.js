'use strict';

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

var container = document.querySelector('body');
var getClass = mode => {
  return modes[mode] || '';
};

// ----------------
// public methods
// ----------------

var pSet = mode => {
  container.className = getClass(mode);
};

var pGet = () => {
  return container.className;
};

var pAdd = mode => {
  container.classList.add(getClass(mode));
};

var pRemove = mode => {
  container.classList.remove(getClass(mode));
};

var pHas = mode => {
  return container.className.indexOf(getClass(mode)) !== -1;
};

var pToggle = mode => {
  container.classList.toggle(getClass(mode));
};

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
