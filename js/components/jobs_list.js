'use strict';

import * as $ from 'jquery';
import * as $time from 'timeago';
import * as _ from 'underscore';
import * as Mustache from 'mustache';
import * as cache from 'modules/cache';
import * as storage from 'modules/storage';
import * as settings from 'modules/settings';

var template = $('#job_tpl').text(),
  wrapper = $('#jobs_list_wrap'),
  container = $('#jobs_list'),
  curPage,
  curFolder,
  curCache = [];

var update = function(jobsList) {
  var result,
    keyShift = (curPage - 1) * settings.get('jobsPerPage');
  _.each(jobsList, (item, key) => {
    key += 1;
    item.cut_id = item.id.replace('~', '');
    item.date = $.timeago(item.date_created);
    item.num = keyShift + key;
  });
  result = Mustache.render(template, {
    jobs: jobsList,
    empty: curFolder !== 'inbox' && !jobsList.length && curPage === 1
  });
  if (curPage === 1) {
    container.html(result);
    curCache = jobsList;
    wrapper.scrollTop(0);
  } else {
    container.append(result);
    curCache = curCache.concat(jobsList);
  }
};

var getJobs = function() {
  GlobalEvents.jobsPending();
  if (curFolder === 'inbox') {
    cache.request({
      page: curPage
    }, (err, jobs) => {
      if (err) {
        GlobalEvents.inboxError();
      } else {
        if (jobs) {
          update(jobs);
          GlobalEvents.jobsReceived();
        } else {
          update([]);
          if (curCache.length) {
            GlobalEvents.inboxFull();
          } else {
            GlobalEvents.inboxEmpty();
          }
        }
      }
    });
  } else {
    var jobs = storage.get(curFolder) || [],
      per_page = settings.get('jobsPerPage'),
      start = (curPage - 1) * per_page,
      end = curPage * per_page;

    jobs = jobs.slice(start, end);
    update(jobs);
    GlobalEvents.jobsReceived();
  }
};

GlobalEvents.feedsAdded.listen(() => {
  wrapper.on('scroll', function() {
    var sHeight = this.scrollTop + this.clientHeight;
    if (sHeight > container.height() - 20) {
      curPage += 1;
      getJobs();
    }
  });
  pInit('inbox');
});

// ----------------
// public methods
// ----------------

var pInit = function(folder) {
  curPage = 1;
  curFolder = folder;
  curCache = [];
  getJobs();
};

var pGetCached = function() {
  return curCache;
};

// ---------
// interface
// ---------

export {
  pInit as init,
  pGetCached as getCached
};
