'use strict';

import * as _ from 'underscore';
import * as storage from 'modules/storage';
import * as EventManager from 'modules/events';

var currentPage,
  prevPage;
const pages = [
  'inbox',
  'favorites',
  'trash'
];
function setPage(page, savePrev) {
  if (page) {
    if (_.contains(pages, page)) {
      if (savePrev) {
        prevPage = currentPage;
      }
      currentPage = page;
    } else {
      throw new Error(`AppState page ${page} not found`);
    }
  } else if (prevPage) {
    currentPage = prevPage;
  }
}

var currentOverlay = null;
const overlays = [
  'settings',
  'jobView'
];
function setOverlay(overlay) {
  if (overlay) {
    if (_.contains(overlays, overlay)) {
      currentOverlay = overlay;
    } else {
      throw new Error(`AppState overlay ${overlay} not found`);
    }
  } else {
    currentOverlay = null;
  }
}

var currentState;
const states = [
  'loading',
  'ready',
  'error',
  'empty'
];
function setState(state = 'ready') {
  if (_.contains(states, state)) {
    currentState = state;
  } else {
    throw new Error(`AppState state ${state} not found`);
  }
}
EventManager.on('ready', () => {
  setPage('inbox');
  setState('empty');
});
EventManager.on('listStartUpdate', () => {
  setState('loading');
});
EventManager.on('jobsReceived', () => {
  setState('ready');
});
EventManager.on('settingsInit', () => {
  setOverlay('settings');
});
EventManager.on('folderChanged', options => {
  var opts = options || {},
    folder = opts.folder;

  if (folder === 'favorites' || folder === 'trash') {
    let folderData = storage.get(folder);
    if (!folderData || !folderData.length) {
      setState('empty');
    }
  }

  setPage(opts.folder);
});
EventManager.on('jobItemInit', () => {
  setOverlay('jobView');
});
EventManager.on('settingsHide settingsSaved jobItemHide', () => {
  setOverlay();
});

// ----------------
// public methods
// ----------------

// format of state is: (page|overlay).state
var pIs = function(state) {
  state = state.split('.');
  var page = state.shift(),
    stateMatch = (page === currentPage || page === currentOverlay);

  if (stateMatch && state.length) {
    stateMatch = false;
    _.each(state, function(stateItem) {
      stateItem = stateItem.split('|');
      stateItem.every(item => {
        if (item === currentState) {
          stateMatch = true;
          return false;
        } else {
          return true;
        }
      });
    });
  }

  return stateMatch;
};

// ---------
// interface
// ---------

export {
  pIs as is
};
