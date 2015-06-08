'use strict';

import * as config from 'config';
import * as async from 'async';
import * as _ from 'underscore';
import * as storage from 'modules/storage';
import * as settings from 'modules/settings';
import * as odesk from 'modules/odesk';
import * as cache from 'modules/cache';

var notifyInterval;

var prevNotificationCount = 0;
var notificationShow = function(count) {
  if (!count || count === prevNotificationCount) {
    return;
  }
  prevNotificationCount = count;
  chrome.notifications.getPermissionLevel(permission => {
    if (permission === 'granted') {
      chrome.notifications.create(storage.get('feeds') + ':', {
        type: 'basic',
        title: config.APP_name,
        iconUrl: '/images/icon128n.png',
        message: `You have new ${count} vacancies`
      });
    }
  });
};
chrome.notifications.onClicked.addListener(notificationId => {
  if (notificationId === storage.get('feeds') + ':') {
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
settingsCheck();

var checkNewJobs = function() {
  var feeds = storage.get('feeds'),
    API_access = storage.get('access');

  if (!feeds || !API_access) {
    return;
  }

  odesk.request({
    url: config.API_jobs_url,
    dataType: 'json',
    query: feeds,
    page: 0,
    per_page: 20
  }, (err, response) => {
    if (err) {
      console.log(err);
    } else {
      var downloadedJobs = response.jobs,
        cacheJobs = cache.get(feeds) || [],
        favoritesJobs = storage.get('favorites') || [],
        trashJobs = storage.get('trash') || [],
        localJobs = [].concat(cacheJobs).concat(favoritesJobs).concat(trashJobs),
        newJobs = 0;

      _.each(downloadedJobs, downloaded => {
        var included;
        _.each(localJobs, local => {
          if (local.title === downloaded.title && local.date_created === downloaded.date_created) {
            included = true;
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
      cache.set(feeds, cacheJobs);
      notificationShow(newJobs.length);
    }
  });
};

chrome.alarms.create('settingsWatch', {
  periodInMinutes: 1
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
