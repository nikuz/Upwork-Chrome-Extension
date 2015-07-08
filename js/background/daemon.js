'use strict';

import * as config from 'config';
import * as storage from 'modules/storage';
import * as settings from 'modules/settings';
import * as odeskR from 'modules/odesk_request';
import * as cache from 'modules/cache';
import * as constants from 'modules/constants';
import * as badge from 'modules/badge';

var noop = function() {};

var notifyInterval,
  state = 'init';

var notificationShow = function(options, callback) {
  var opts = options || {},
    cb = callback || noop,
    count = opts.count;

  var validateParams = function() {
    if (!count) {
      cb(constants.get('REQUIRED', 'count'));
    } else {
      checkEnv();
    }
  };

  var checkEnv = function() {
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
      async.parallel([
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
            if (tab.url.indexOf('//' + extensionId + '/popup.html') !== -1 && activeWindow.focused && activeWindow.id === tab.windowId) {
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
      if (window.env === 'test') {
        showNotification();
      } else {
        checkPermission();
      }
    }
    badge.update();
  };

  var checkPermission = function() {
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
  };

  var showNotification = function() {
    var count = opts.count,
      newestJob = opts.newestJob,
      manifest = chrome.runtime.getManifest(),
      iconPrefix = manifest.name.indexOf('Upwork') !== -1 ? 'upwork' : 'odesk',
      notificationId = manifest.short_name.replace(/\s+/g, '_') + storage.get('feeds') + Date.now(),
      notificationData = {
        type: 'basic',
        title: storage.get('feeds') + ':',
        iconUrl: '/images/' + iconPrefix + '-icon128n.png',
        message: `You have new ${count} vacancies`
      };

    if (newestJob) {
      count -= 1;
      let updatedMessage;
      if (count) {
        updatedMessage = 'And +' + count + ' others...';
      } else {
        updatedMessage = 'Posted: ' + $.timeago(newestJob.date_created);
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
  };

  validateParams();
};

var settingsCheck = function(callback) {
  var cb = callback || noop,
    newInterval = settings.get('notifyInterval').value;

  if (newInterval !== notifyInterval) {
    notifyInterval = newInterval;
    createAlarms();
  }
  cb(null, newInterval);
};

var newJobsCheck = function(callback) {
  var cb = callback || noop,
    feeds = storage.get('feeds'),
    API_access = storage.get('access'),
    useProxy = settings.get('useProxy').value;

  if (!useProxy && (!feeds || !API_access)) {
    cb('No credentials');
    return;
  }

  odeskR.request({
    query: feeds,
    start: 0,
    end: 20
  }, (err, response) => {
    if (err) {
      cb(err);
    } else {
      var downloadedJobs = response.jobs,
        cacheJobs = cache.get() || [],
        favoritesJobs = storage.get('favorites') || [],
        trashJobs = storage.get('trash') || [],
        localJobs = [].concat(cacheJobs).concat(favoritesJobs).concat(trashJobs),
        newJobs = 0;

      _.each(downloadedJobs, downloaded => {
        let included;
        localJobs.every(local => {
          if (local.id === downloaded.id) {
            included = true;
            return false;
          } else {
            return true;
          }
        });
        if (!included) {
          newJobs += 1;
          downloaded.is_new = true;
          cacheJobs.push(downloaded);
        }
      });
      if (cacheJobs.length > config.cache_limit) {
        cacheJobs.length = config.cache_limit;
      }
      let newestJob;
      if (newJobs) {
        cacheJobs = _.sortBy(cacheJobs, item => {
          return -new Date(item.date_created).getTime();
        });
        newestJob = cacheJobs[0];
        cache.set(cacheJobs);
      }
      let allNewJobsCount = 0;
      _.each(cacheJobs, item => {
        if (item.is_new) {
          allNewJobsCount += 1;
        }
      });
      if (allNewJobsCount && window.env !== 'test') {
        notificationShow({
          newestJob: newestJob,
          count: allNewJobsCount
        });
      }
      cb(null, allNewJobsCount);
    }
  });
};

var createAlarms = function() {
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
      periodInMinutes: period
    });
  };
};

// ----------------
// public methods
// ----------------

var pInit = function() {
  chrome.notifications.onClicked.addListener(notificationId => {
    if (notificationId.indexOf(storage.get('feeds')) !== -1) {
      window.open('popup.html');
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
    state = 'installed';
    createAlarms();
  });
  chrome.runtime.onStartup.addListener(function() {
    console.log('Starting browser...');
    state = 'started';
    settingsCheck();
    newJobsCheck();
  });
};

var pStateCheck = function(callback) {
  var cb = callback || noop;
  cb(null, {
    state: state
  });
};

var pNewJobsCheck = function(callback) {
  newJobsCheck(callback);
};

var pSettingsCheck = function(callback) {
  settingsCheck(callback);
};

var pNotificationShow = function(options, callback) {
  notificationShow(options, callback);
};

// ---------
// interface
// ---------

export {
  pInit as init,
  pStateCheck as stateCheck,
  pNewJobsCheck as newJobsCheck,
  pSettingsCheck as settingsCheck,
  pNotificationShow as notificationShow
};
