'use strict';

import * as _ from 'underscore';
import * as config from 'config';
import * as storage from 'modules/storage';
import * as settings from 'modules/settings';
import * as cache from 'modules/cache';
import * as constants from 'modules/constants';
import * as badge from 'modules/badge';
import {parallel as asyncParallel} from 'async';
import timeAgo from 'utils/timeAgo';

var notifyInterval = 5,
  notifyAllow = true,
  isDnDTimeNow = false;

function notificationShow(options, callback) {
  var opts = options || {},
    cb = callback || _.noop,
    count = opts.count;

  var validateParams = function() {
    if (!count) {
      cb(constants.get('REQUIRED', 'count'));
    } else {
      checkEnv();
    }
  };

  function checkEnv() {
    var popup = chrome.extension.getViews({type: 'popup'}),
      tabs = chrome.extension.getViews({type: 'tab'});

    if (popup && popup[0]) {
      popup[0].postMessage('newJobs', '*');
      cb(null, 'Popup is opened');
    } else if (tabs && tabs[0]) {
      _.each(tabs, tab => {
        tab.postMessage('newJobs', '*');
      });
      // if extension tab is active tab
      asyncParallel([
        function(callback) {
          chrome.windows.getCurrent({
            populate: false
          }, window => {
            callback(null, {
              id: window.id,
              focused: window.focused
            });
          });
        },
        function(callback) {
          chrome.tabs.query({
            active: true
          }, activeTabs => {
            callback(null, activeTabs);
          });
        }
      ], function(err, results) {
        if (err) {
          cb(err);
        } else {
          var activeWindow = results[0],
            activeTabs = results[1],
            extensionTabIsCurrent,
            extensionId = chrome.runtime.id;

          activeTabs.every(tab => {
            if (tab.url.indexOf('//' + extensionId + '/index.html') !== -1 && activeWindow.focused && activeWindow.id === tab.windowId) {
              extensionTabIsCurrent = true;
              return false;
            } else {
              return true;
            }
          });
          if (extensionTabIsCurrent) {
            cb(null, 'Tab is opened');
          } else {
            checkPermission();
          }
        }
      });
    } else {
      checkPermission();
    }
    badge.update();
  }

  function checkPermission() {
    chrome.notifications.getPermissionLevel(permission => {
      if (permission !== 'granted') {
        cb('Have not permissions to show notification');
      } else {
        chrome.notifications.getAll(notifications => {
          _.each(notifications, (item, key) => {
            chrome.notifications.clear(key);
          });
          showNotification();
        });
      }
    });
  }

  function showNotification() {
    var count = opts.count,
      newestJob = opts.newestJob,
      manifest = chrome.runtime.getManifest(),
      notificationId = manifest.short_name.replace(/\s+/g, '_') + storage.get('feeds') + Date.now(),
      notificationData = {
        type: 'basic',
        title: storage.get('feeds') + ':',
        iconUrl: '/images/icon128.png',
        message: `You have new ${count} vacancies`
      };

    if (newestJob) {
      count -= 1;
      let updatedMessage;
      if (count) {
        updatedMessage = `And +${count} others...`;
      } else {
        updatedMessage = 'Posted: ' + timeAgo(newestJob.date_created);
      }
      _.extend(notificationData, {
        title: newestJob.title.substr(0, 300),
        message: updatedMessage
      });
    }
    chrome.notifications.create(notificationId, notificationData);
    cb(null, {
      notification: notificationData,
      count: count
    });
  }

  validateParams();
}

function isDnDTimeCheck(sData) {
  var timeReg = /\d{2}:\d{2}/,
    today = new Date(),
    curMinute = today.getHours() * 60 + today.getMinutes(),
    minutesDND = function(dndTime) {
      if (!timeReg.test(dndTime)) {
        return null;
      }
      dndTime = dndTime.split(':');
      return Number(dndTime[0]) * 60 + Number(dndTime[1]);
    },
    from = minutesDND(sData.dndFrom.value),
    to = minutesDND(sData.dndTo.value);

  if (from === to) {
    return;
  }
  isDnDTimeNow = (from < to && curMinute >= from && curMinute <= to) || (from > to && (curMinute >= from || curMinute <= to));
}

function settingsCheck(callback) {
  var cb = callback || _.noop,
    sData = settings.get(),
    newInterval = sData.notifyInterval.value;

  notifyAllow = sData.notifyAllow.value;
  isDnDTimeCheck(sData);

  if (newInterval !== notifyInterval) {
    notifyInterval = newInterval;
    createAlarms();
  }
  cb(null, newInterval);
}

function newJobsCheck(callback) {
  var cb = callback || _.noop,
    feeds = storage.get('feeds'),
    API_access = storage.get('access');

  if (!feeds || !API_access || isDnDTimeNow || !notifyAllow) {
    cb('No credentials');
    return;
  }

  cache.checkNew(function(err, response) {
    if (err) {
      cb(err);
    } else if (!response) {
      cb(null, null);
    } else {
      let newestCacheJob = cache.get()[0];
      notificationShow({
        newestJob: newestCacheJob,
        count: response
      });
    }
  });
}

function createAlarms() {
  var alarms = {
    settingsWatch: 1,
    newJobsNotifier: notifyInterval || 1
  };
  _.each(alarms, (value, key) => {
    chrome.alarms.get(key, alarm => {
      if (alarm) {
        chrome.alarms.clear(alarm.name, () => {
          create(key, value);
        });
      } else {
        create(key, value);
      }
    });
  });

  var create = function(name, period) {
    chrome.alarms.create(name, {
      periodInMinutes: Number(period)
    });
  };
}

// ----------------
// public methods
// ----------------

chrome.notifications.onClicked.addListener(notificationId => {
  if (notificationId.indexOf(storage.get('feeds')) !== -1) {
    window.open('index.html');
    chrome.notifications.clear(notificationId);
  }
});
chrome.alarms.onAlarm.addListener(alarm => {
  switch (alarm.name) {
    case 'settingsWatch':
      settingsCheck();
      break;
    case 'newJobsNotifier':
      newJobsCheck();
      break;
  }
});
chrome.runtime.onInstalled.addListener(function() {
  console.log('App installed...');
  createAlarms();
});
chrome.runtime.onStartup.addListener(function() {
  console.log('Starting browser...');
  settingsCheck();
  newJobsCheck();
});
