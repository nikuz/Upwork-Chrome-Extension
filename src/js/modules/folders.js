'use strict';

import * as _ from 'underscore';
import * as config from '../config';
import * as storage from 'modules/storage';
import * as cache from 'modules/cache';
import * as EventManager from 'modules/events';

// ----------------
// public methods
// ----------------

var pGetJobs = function(options, callback) {
  var opts = options || {},
    cb = callback || _.noop,
    folder = opts.folder,
    page = opts.page;

  if (folder === 'inbox') {
    cache.request({
      page: page
    }, cb);
  } else {
    var jobs = storage.get(folder) || [],
      per_page = config.jobs_per_page,
      start = (page - 1) * per_page,
      end = page * per_page;

    cb(null, jobs.slice(start, end));
  }
};

var pMoveJobs = function(jobs, sourceFolder, targetFolder) {
  var sourceFolderJobs,
    targetFolderJobs;

  switch (sourceFolder) {
    case 'inbox':
      sourceFolder = 'cache';
      sourceFolderJobs = cache.get();
      targetFolderJobs = storage.get(targetFolder);
      break;
    case 'favorites':
      sourceFolderJobs = storage.get(sourceFolder);
      targetFolderJobs = storage.get(targetFolder);
      break;
    case 'trash':
      sourceFolderJobs = storage.get(sourceFolder);
      if (targetFolder === 'trash') {
        targetFolder = 'trash_extra';
      }
      targetFolderJobs = storage.get(targetFolder);
      break;
  }
  sourceFolderJobs = sourceFolderJobs || [];
  targetFolderJobs = targetFolderJobs || [];

  _.each(jobs, jobItem => {
    sourceFolderJobs.every((sourceItem, key) => {
      if (jobItem === sourceItem.id) {
        sourceItem = sourceFolderJobs.splice(key, 1)[0];
        _.extend(sourceItem, {
          checked: false,
          is_new: false
        });
        targetFolderJobs.unshift(sourceItem);
        return false;
      } else {
        return true;
      }
    });
  });

  if (targetFolder === 'trash') {
    let limitTrash = config.trash_limit;
    if (targetFolderJobs.length > limitTrash) {
      let tail = targetFolderJobs.splice(limitTrash, targetFolderJobs.length),
        extra = [];

      targetFolderJobs.length = limitTrash;
      _.each(tail, item => {
        extra.push({
          id: item.id,
          feeds: item.feeds,
          date_created: item.date_created
        });
      });
      var trashExtraName = 'trash_extra',
        trashExtraLimit = config.trash_extra_limit,
        trashExtra = storage.get(trashExtraName) || [];

      trashExtra = trashExtra.concat(extra);
      if (trashExtra.length > trashExtraLimit) {
        trashExtra.length = trashExtraLimit;
      }
      storage.set(trashExtraName, trashExtra);
    }
  }
  if (targetFolder === 'favorites') {
    let limitFavorites = config.favorites_limit;
    if (targetFolderJobs.length > limitFavorites) {
      targetFolderJobs.length = limitFavorites;
    }
  }
  storage.set(targetFolder, targetFolderJobs);
  if (sourceFolder === 'cache') {
    cache.set(sourceFolderJobs);
  } else {
    storage.set(sourceFolder, sourceFolderJobs);
  }
};

var pCheckNew = function(options, callback) {
  var opts = options || {},
    cb = callback || _.noop;

  if (opts.folder === 'inbox') {
    cache.checkNew(cb);
  }
};

var pUpdateItem = function(options, callback) {
  var opts = options || {},
    cb = callback || _.noop,
    items = opts.items,
    folder = opts.folder === 'inbox' ? 'cache' : opts.folder,
    storedItems = storage.get(folder);

  if (storedItems) {
    _.each(items, item => {
      var storedItem = _.findWhere(storedItems, {id: item.id});
      _.extend(storedItem, item.data);
    });
    storage.set(folder, storedItems);
  }
  cb();
};

// ---------
// interface
// ---------

export {
  pMoveJobs as moveJobs,
  pGetJobs as getJobs,
  pCheckNew as checkNew,
  pUpdateItem as updateItem
};
