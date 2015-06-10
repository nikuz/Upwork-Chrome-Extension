'use strict';

import * as $ from 'jquery';
import * as _ from 'underscore';
import * as storage from 'modules/storage';
import * as cache from 'modules/cache';
import * as Page from 'components/page';
import * as JobsList from 'components/jobs_list';

var jobSelectedCl = 'job_selected',
  curFolder = 'inbox',
  menuWrapper = $('#menu'),
  menuActiveCl = 'menu_active';

var searchInit = function() {
  var searchForm = $('#search');
  searchForm.on('submit', function(e) {
    e.preventDefault();
    if (!Page.has('load')) {
      var value = this.search.value.trim();
      value = value.replace(/\/|\"|\'|\`|\^|\&|\$|\%|\*|\(|\)|\[|\]|\{|\}|\?|\;|\:|<|>|\+|\=|\#|\@|\!/g, '').replace(/\s+/g, ' ');
      if (value.length !== 0) {
        storage.set('feeds', value);
        GlobalEvents.feedsAdded();
      }
    }
  });
  var curFeeds = storage.get('feeds');
  if (curFeeds) {
    GlobalEvents.feedsAdded();
    searchForm[0].search.value = curFeeds;
  }
};
searchInit();

$('#stngs_trigger').on('click', function() {
  if (Page.has('settings')) {
    GlobalEvents.settingsHide();
  } else {
    GlobalEvents.settingsInit();
  }
});

var badgeUpdate = function() {
  var curCache = cache.get(),
    newCount = 0;

  _.each(curCache, item => {
    if (item.is_new) {
      newCount += 1;
    }
  });
  chrome.browserAction.setBadgeText({
    text: newCount.toString()
  });
};

// Select all visible jobs in current folder
var checkAllEl = $('#jl_all');
checkAllEl.on('change', function() {
  var target = $(this),
    checked = target.is(':checked'),
    curCache = JobsList.getCached();

  if (checked) {
    selectedJobs = curCache.length;
    menuWrapper.addClass(menuActiveCl);
  } else {
    selectedJobs = 0;
    menuWrapper.removeClass(menuActiveCl);
  }

  _.each(curCache, item => {
    item.checked = checked;
    var id = item.id.replace('~', ''),
      check = $('#jl_' + id),
      row = check.parents('.jl_item');

    check.prop('checked', checked);
    if (checked) {
      row.addClass(jobSelectedCl);
    } else {
      row.removeClass(jobSelectedCl);
    }
  });
});

// move jobs to favorites, trash, inbox (from trash back to inbox)
$('#m_favorites, #m_trash').on('click', function() {
  var curCache = JobsList.getCached(),
    sourceFolder = curFolder,
    sourceFolderJobs,
    targetFolder = $(this).attr('data-value'),
    targetFolderJobs,
    i, l, j, jl,
    curCacheItem;

  switch (curFolder) {
    case 'inbox':
      sourceFolder = 'cache';
      sourceFolderJobs = cache.get();
      targetFolderJobs = storage.get(targetFolder);
      break;
    case 'favorites':
      sourceFolderJobs = storage.get(curFolder);
      targetFolderJobs = storage.get(targetFolder);
      break;
    case 'trash':
      sourceFolderJobs = storage.get(curFolder);
      if (targetFolder === 'trash') {
        targetFolder = 'cache';
        targetFolderJobs = cache.get();
      } else {
        targetFolderJobs = storage.get(targetFolder);
      }
      break;
  }
  sourceFolderJobs = sourceFolderJobs || [];
  targetFolderJobs = targetFolderJobs || [];

  for (i = 0, l = curCache.length; i < l; i += 1) {
    curCacheItem = curCache[i];
    if (curCacheItem.checked) {
      curCacheItem.checked = false;
      if (curCacheItem.is_new) {
        curCacheItem.is_new = false;
      }
      targetFolderJobs.push(curCache.splice(i, 1)[0]);
      i -= 1; l -= 1;
      for (j = 0, jl = sourceFolderJobs.length; j < jl; j += 1) {
        if (curCacheItem.id === sourceFolderJobs[j].id) {
          sourceFolderJobs.splice(j, 1);
          j -= 1; jl -= 1;
        }
      }
      var id = curCacheItem.id.replace('~', ''),
        row = $('#jl_' + id).parents('.jl_item');

      row.remove();
    }
  }
  targetFolderJobs = _.sortBy(targetFolderJobs, item => {
    return -new Date(item.date_created).getTime();
  });
  if (targetFolder === 'cache') {
    cache.set(targetFolderJobs);
  } else {
    storage.set(targetFolder, targetFolderJobs);
  }
  if (sourceFolder === 'cache') {
    cache.set(sourceFolderJobs);
  } else {
    storage.set(sourceFolder, sourceFolderJobs);
  }
  checkAllEl.prop('checked', false);
  menuWrapper.removeClass(menuActiveCl);
  if (!curCache.length) {
    JobsList.init(curFolder);
  }
  badgeUpdate();
});

// select job item
var selectedJobs = 0;
$('#jobs_list').on('click', function(e) {
  var target = $(e.target);
  if (!target.hasClass('jl_link') && !target.hasClass('fch_cust')) {
    var row = target.parents('.jl_item'),
      check = $('.fch_cust', row),
      checked = check.is(':checked'),
      curCache = JobsList.getCached();

    if (!checked) {
      selectedJobs += 1;
      menuWrapper.addClass(menuActiveCl);
    } else {
      selectedJobs -= 1;
      if (!selectedJobs) {
        checkAllEl.prop('checked', false);
        menuWrapper.removeClass(menuActiveCl);
      }
    }

    _.each(curCache, item => {
      if (item.id === check.val()) {
        item.checked = !checked;
      }
    });

    row.toggleClass(jobSelectedCl);
    if (!target.hasClass('fl_cust')) {
      check.prop('checked', !checked);
    }
  }
  if (target.hasClass('jl_link')) {
    let _id = target.attr('data-value');
    if (cache.get(_id).is_new) {
      cache.update(_id, {
        is_new: false
      });
      badgeUpdate();
    }
    chrome.tabs.create({
      url: target.attr('href')
    });
  }
});

// change current folder
var folders = $('.jf_item');
folders.on('click', function() {
  var selectedCl = 'selected',
    target = $(this);

  _.each(folders, item => {
    $(item).removeClass(selectedCl);
  });
  target.addClass(selectedCl);

  var folderType = target.attr('data-value');
  curFolder = folderType;
  JobsList.init(folderType);
  checkAllEl.prop('checked', false);
  menuWrapper.removeClass(menuActiveCl);
  selectedJobs = 0;
});

GlobalEvents.settingsSaved.listen(function() {
  cache.flush();
  JobsList.init(curFolder);
});

// got notification from bg script when popup is open
window.addEventListener('message', function(e) {
  if (e.data === 'newJobs') {
    GlobalEvents.newJobsFromBg();
  }
}, false);

$('#jl_get_new').on('click', function() {
  JobsList.init('inbox');
});
