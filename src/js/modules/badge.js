'use strict';

import * as _ from 'underscore';
import * as cache from 'modules/cache';

// ----------------
// public methods
// ----------------

var pUpdate = function() {
  var curCache = cache.get(),
    newsCount = 0;

  _.each(curCache, item => {
    if (item.is_new) {
      newsCount += 1;
    }
  });
  chrome.browserAction.setBadgeText({
    text: (newsCount || '').toString()
  });
};

// ---------
// interface
// ---------

export {
  pUpdate as update
};

