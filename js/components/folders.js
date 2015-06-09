'use strict';

import * as $ from 'jquery';
import * as _ from 'underscore';
import * as storage from 'modules/storage';
import * as cache from 'modules/cache';
import * as JobsList from 'components/jobs_list';

var jobSelectedCl = 'job_selected';
var curFolder = 'inbox';
//document.write(chrome.runtime.getURL('popup.html'));

var checkAllEl = $('#jl_all');
checkAllEl.on('change', function(e) {
  var target = $(this),
    checked = target.is(':checked'),
    curCache = JobsList.getCached();

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

$('#m_favorites, #m_trash').on('click', function(e) {
  var curCache = JobsList.getCached(),
    sourceFolder = curFolder,
    sourceFolderJobs,
    targetFolder = $(this).attr('data-value'),
    targetFolderJobs,
    i, l;

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

  _.each(curCache, curCacheItem => {
    if (curCacheItem.checked) {
      curCacheItem.checked = false;
      targetFolderJobs.push(curCacheItem);
      for (i = 0, l = sourceFolderJobs.length; i < l; i += 1) {
        if (curCacheItem.id === sourceFolderJobs[i].id) {
          sourceFolderJobs.splice(i, 1);
          i -= 1; l -= 1;
        }
      }
      var id = curCacheItem.id.replace('~', ''),
        row = $('#jl_' + id).parents('.jl_item');

      row.remove();
    }
  });
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
});

$('#jobs_list').on('click', e => {
  var target = $(e.target);

  if (!target.hasClass('jl_link') && !target.hasClass('fch_cust')) {
    var row = target.parents('.jl_item'),
      check = $('.fch_cust', row),
      checked = check.is(':checked'),
      curCache = JobsList.getCached();

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
});

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
});
