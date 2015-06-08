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
  curFolder;

var containerHeightFixed;
var containerHeightFix = function() {
  if (!containerHeightFixed) {
    var wh = window.innerHeight;
    if (wh < 600) {
      wrapper.css('max-height', wh - 161 + 'px');
    }
    containerHeightFixed = true;
  }
};
GlobalEvents.jobsReceived.listen(() => {
  containerHeightFix();
});

var update = function(jobsList) {
  var result = '';
  _.each(jobsList, item => {
    item.date_created = $.timeago(item.date_created);
    result += Mustache.render(template, item);
  });
  container.append(result);
  GlobalEvents.jobsReceived();
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
        update(jobs);
      }
    });
  } else {
    var jobs = storage.get(curFolder),
      per_page = settings.get('jobsPerPage'),
      start = (curPage - 1) * per_page,
      end = curPage * per_page;

    jobs = jobs.slice(start, end);
    update(jobs);
  }
};

GlobalEvents.feedsAdded.listen(() => {
  container.on('click', e => {
    var target = $(e.target);
    if (target.hasClass('jl_link')) {
      chrome.tabs.create({
        url: target.attr('href')
      });
    }
  });
  wrapper.on('scroll', function() {
    var sHeight = this.scrollTop + this.clientHeight;
    if (sHeight > container.height() - 100) {
      curPage += 1;
      getJobs();
    }
  });
});

// ----------------
// public methods
// ----------------

var pInit = function(folder) {
  curPage = 1;
  curFolder = folder;
  getJobs();
};

// ---------
// interface
// ---------

export {
  pInit as init
};
