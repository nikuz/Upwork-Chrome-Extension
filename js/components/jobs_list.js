'use strict';

import * as cache from 'modules/cache';
import * as storage from 'modules/storage';
import * as settings from 'modules/settings';

var template,
  wrapper,
  container,
  curPage,
  curFolder,
  curCache = [];

var update = function(jobsList) {
  var result,
    keyShift = (curPage - 1) * settings.get('jobsPerPage').value;
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
      per_page = settings.get('jobsPerPage').value,
      start = (curPage - 1) * per_page,
      end = curPage * per_page;

    jobs = jobs.slice(start, end);
    update(jobs);
    GlobalEvents.jobsReceived();
  }
};

// ----------------
// public methods
// ----------------

var pInit = function() {
  template = $('#job_tpl').text();
  wrapper = $('#jobs_list_wrap');
  container = $('#jobs_list');
  GlobalEvents.feedsAdded.listen(() => {
    pUpdate('inbox');
    wrapper.on('scroll', function() {
      var sHeight = this.scrollTop + this.clientHeight;
      if (sHeight > container.height() - 20) {
        curPage += 1;
        getJobs();
      }
    });
  });
};

var pUpdate = function(folder) {
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
  pUpdate as update,
  pGetCached as getCached
};
