'use strict';

import * as config from 'config';
import * as async from 'async';
import * as storage from 'services/localStorage';
import * as settings from 'modules/settings';
import * as odesk from 'modules/odesk';
import * as cache from 'modules/cache';

var notifyInterval = .1; // TODO: should be undefined
storage.set('feeds', 'javascript'); // TODO: should be removed

var createNotifier = () => {
  var alarmName = 'newJobsNotifier';
  chrome.alarms.clear(alarmName);
  chrome.alarms.create(alarmName, {
    periodInMinutes: notifyInterval
  });
};

var settingsCheck = () => {
  var newInterval = settings.get('notifyInterval');
  if (newInterval !== notifyInterval) {
    createNotifier();
  }
};
settingsCheck();

var checkNewJobs = () => {
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
        newJobs = [];

      _.each(downloadedJobs, downloaded => {
        var included;
        _.each(localJobs, local => {
          if (local.title === downloaded.title && local.date_created === downloaded.date_created) {
            included = true;
          }
        });
        if (!included) {
          downloaded.is_new = true;
          newJobs.push(downloaded);
        }
      });
      cacheJobs.unshift(newJobs);
      //cache.set(feeds, cacheJobs);
      //notificationShow(newJobs.length);
      notificationShow(1);
    }
  });
};

var prevNotificationCount = 0;
var notificationShow = count => {
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


chrome.alarms.create('settingsWatch', {
  periodInMinutes: 1
});

chrome.alarms.onAlarm.addListener(alarm => {
  switch(alarm.name){
    case 'settingsWatch':
      settingsCheck();
      break;
    case 'newJobsNotifier':
      checkNewJobs();
      break;
    default:
  }
});
