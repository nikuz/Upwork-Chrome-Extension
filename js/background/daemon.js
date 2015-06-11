'use strict';

import * as config from 'config';
import * as async from 'async';
import * as _ from 'underscore';
import * as $ from 'jquery';
import * as $time from 'timeago';
import * as storage from 'modules/storage';
import * as settings from 'modules/settings';
import * as odeskR from 'modules/odesk_request';
import * as cache from 'modules/cache';

var notifyInterval,
  prevNotificationCount;

var notificationShow = function(newestJob, count) {
  if (!count || count === prevNotificationCount) {
    return;
  }
  prevNotificationCount = count;
  var popup = chrome.extension.getViews({type: 'popup'})[0];
  if (popup) {
    popup.postMessage('newJobs', '*');
  } else {
    chrome.notifications.getPermissionLevel(permission => {
      if (permission === 'granted') {
        let notificationId = config.APP_name + storage.get('feeds') + Date.now(),
          notificationData = {
          type: 'basic',
          title: storage.get('feeds') + ':',
          iconUrl: '/images/icon128n.png',
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
      }
    });
  }
  chrome.browserAction.setBadgeText({
    text: count.toString()
  });
};
chrome.notifications.onClicked.addListener(notificationId => {
  if (notificationId.indexOf(storage.get('feeds')) !== -1) {
    window.open('popup.html');
  }
});

var createNotifier = function() {
  var alarmName = 'newJobsNotifier';
  chrome.alarms.clear(alarmName);
  chrome.alarms.create(alarmName, {
    periodInMinutes: notifyInterval
  });
};

var settingsCheck = function() {
  var newInterval = settings.get('notifyInterval');
  if (newInterval !== notifyInterval) {
    notifyInterval = newInterval;
    createNotifier();
  }
};

var checkNewJobs = function() {
  var feeds = storage.get('feeds'),
    API_access = storage.get('access');

  if (!feeds || !API_access) {
    return;
  }

  odeskR.request({
    query: feeds,
    start: 0,
    end: 20
  }, (err, response) => {
    if (err) {
      console.log(err);
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
          if (local.title === downloaded.title && local.date_created === downloaded.date_created) {
            included = true;
            return false;
          }
        });
        if (!included) {
          newJobs += 1;
          downloaded.is_new = true;
          cacheJobs.unshift(downloaded);
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
      if (allNewJobsCount) {
        notificationShow(newestJob, allNewJobsCount);
      }
    }
  });
};

var onInit = function() {
  prevNotificationCount = 0;
  settingsCheck();
  var alarmName = 'settingsWatch';
  chrome.alarms.clear(alarmName);
  chrome.alarms.create(alarmName, {
    periodInMinutes: 1
  });
};

chrome.runtime.onInstalled.addListener(function() {
  console.log('App installed...');
  onInit();
});
chrome.runtime.onStartup.addListener(function() {
  console.log('Starting browser...');
  onInit();
});
chrome.alarms.onAlarm.addListener(alarm => {
  switch (alarm.name) {
    case 'settingsWatch':
      settingsCheck();
      break;
    case 'newJobsNotifier':
      checkNewJobs();
      break;
    default:
  }
});
