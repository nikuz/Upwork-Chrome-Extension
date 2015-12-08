'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'underscore';
import * as config from 'config';
import * as EventManager from 'modules/events';
import * as StateManager from 'modules/states';
import * as folders from 'modules/folders';
import * as storage from 'modules/storage';
import * as cache from 'modules/cache';
import * as settings from 'modules/settings';
import ListItem from 'components/list/item-code';
import Icon from 'react-fa';
import animate from 'utils/animate';

import './style';

class List extends React.Component {
  state = {
    curFolder: 'inbox',
    curPage: 1,
    full: false,
    empty: true,
    noFeeds: true,
    items: [],
    selectedCount: 0
  };
  getJobs = (options) => {
    if (options) {
      this.setState(options);
    }
    var opts = _.extend(this.state, options || {});
    if (opts.curFolder === 'inbox' && !storage.get('feeds')) {
      this.setState({
        load: false
      });
      return;
    }
    EventManager.trigger('listStartUpdate');
    folders.getJobs({
      folder: opts.curFolder,
      page: opts.curPage
    }, (err, jobs) => {
      var state = {
        load: false
      };
      if (err) {
        EventManager.trigger('inboxError');
      } else {
        EventManager.trigger('jobsReceived');
        jobs = jobs || [];
        if (jobs.length) {
          state.empty = false;
          if (opts.curPage !== 1) {
            jobs = opts.items.concat(jobs);
          }
        } else if (opts.items.length) {
          state.full = true;
        } else {
          state.empty = true;
          EventManager.trigger('listBecomeEmpty');
        }
        state.items = jobs;
      }
      this.setState(state);
    });
  };
  itemSelect = (item, isSelect) => {
    var curItems = this.state.items,
      selectedItems = 0;

    if (item === 'all') {
      _.each(curItems, item => {
        item.selected = isSelect;
      });
    } else {
      item = _.findWhere(curItems, {id: item});
      if (_.isUndefined(isSelect)) {
        isSelect = !item.selected;
      }
      item.selected = isSelect;
    }
    _.each(curItems, function(item) {
      if (item.selected) {
        selectedItems += 1;
      }
    });
    this.setState({
      items: curItems,
      selectedCount: selectedItems
    });
    EventManager.trigger('jobsSelected', {
      amount: selectedItems
    });
  };
  itemRemove = (items, targetFolder = 'trash') => {
    var curItems = this.state.items,
      hiddenItemsCount = 0;

    _.each(items, item => {
      item = _.findWhere(curItems, {id: item});
      if (item.selected) {
        this.state.selectedCount -= 1;
      }
      _.extend(item, {
        hidden: true,
        selected: false
      });
    });
    this.setState({
      items: curItems
    });
    folders.moveJobs(items, this.state.curFolder, targetFolder);
    _.each(curItems, function(item) {
      if (item.hidden) {
        hiddenItemsCount += 1;
      }
    });
    if (hiddenItemsCount === curItems.length) {
      setTimeout(() => {
        this.getJobs({
          curPage: 1,
          items: [],
          load: true
        });
      }, 500);
    }
    if (!this.state.selectedCount) {
      EventManager.trigger('jobsSelected', {
        amount: 0
      });
    }
  };
  itemOpen = (itemId) => {
    if (this.state.selectedCount) {
      this.itemSelect(itemId);
    } else {
      let curItems = this.state.items,
        item = _.findWhere(curItems, {id: itemId}),
        sData = settings.get();

      if (sData.preview.value) {
        EventManager.trigger('jobItemInit', {
          jobItem: item
        });
      } else {
        window.open(config.UPWORK_url + '/job/' + item.id, '_system');
      }

      cache.update(item.id, {
        is_new: false,
        watched: true
      });

      setTimeout(() => {
        _.extend(item, {
          is_new: false,
          watched: true
        });
        this.setState({
          items: curItems
        });
      }, 400);
    }
  };
  itemRead = () => {
    var curItems = this.state.items,
      itemsToUpdate = [];
    _.each(curItems, item => {
      if (item.selected) {
        item.is_new = false;
        itemsToUpdate.push({
          id: item.id,
          data: {
            is_new: false
          }
        });
      }
    });
    this.itemSelect('all', false);
    folders.updateItem({
      items: itemsToUpdate,
      folder: this.state.curFolder
    });
  };
  scrollValue = 0;
  scrollHandler = () => {
    var thisHeight = this.elHeight + this.el.scrollTop,
      curScroll = this.el.scrollTop;

    if (this.listElHeight && thisHeight > this.listElHeight - 100 && !StateManager.is('inbox.loading')) {
      this.getJobs({
        curPage: this.state.curPage + 1,
        load: true
      });
    }
    if (curScroll - this.scrollValue > 30 && curScroll > 0) {
      this.scrollValue = curScroll;
      EventManager.trigger('listScrolledBottom');
    } else if (curScroll - this.scrollValue < -30 || curScroll === 0) {
      this.scrollValue = curScroll;
      EventManager.trigger('listScrolledTop');
    }
  };
  checkNewItems = (callback) => {
    var cb = callback || _.noop;
    this.setState({
      load: true,
      noFeeds: false
    });
    folders.checkNew({
      folder: 'inbox'
    }, (err, response) => {
      var state = {
        load: false
      };
      if (err) {
        EventManager.trigger('inboxError');
      } else if (response) {
        state.curPage = 1;
      }
      this.getJobs(state);
      cb();
    });
  };
  listManagerEventsHandler = (e) => {
    if (StateManager.is('jobView')) {
      return;
    }
    if (!this.state.selectedCount) {
      EventManager.trigger('listHaventSelectedItems');
    } else {
      let selectedItems = [],
        targetFolder = 'trash';

      if (e.name === 'btnFavoritesClicked') {
        targetFolder = 'favorites';
      }
      _.each(this.state.items, item => {
        if (item.selected) {
          selectedItems.push(item.id);
        }
      });
      this.itemRemove(selectedItems, targetFolder);
    }
  };
  componentDidMount = () => {
    this.el = ReactDOM.findDOMNode(this);
    this.elHeight = this.el.clientHeight;
    EventManager.on('ready', () => {
      if (storage.get('feeds')) {
        this.getJobs({
          load: true,
          noFeeds: false
        });
      }
    });
    EventManager.on('feedsAdded', () => {
      this.getJobs({
        curPage: 1,
        items: [],
        load: true,
        noFeeds: false
      });
    });
    EventManager.on('feedsCheckNews notificationsClicked', () => {
      ReactDOM.findDOMNode(this).scrollTop = 0;
      this.checkNewItems();
    });
    EventManager.on('folderChanged', options => {
      var opts = options || {};
      ReactDOM.findDOMNode(this).scrollTop = 0;
      this.getJobs({
        curPage: 1,
        items: [],
        load: true,
        curFolder: opts.folder
      });
    });
    EventManager.on('btnFavoritesClicked btnTrashClicked', this.listManagerEventsHandler);
    EventManager.on('btnSelectAllClicked', options => {
      var opts = options || {};
      this.itemSelect('all', opts.select);
    });
    EventManager.on('btnReadClicked', () => {
      if (!StateManager.is('jobView')) {
        if (!this.state.selectedCount) {
          EventManager.trigger('listHaventSelectedItems');
        } else {
          this.itemRead();
        }
      }
    });
    EventManager.on('jobHasFolderChanged', (options) => {
      var opts = options || {},
        id = opts.id,
        folder = opts.folder;

      if (id && folder) {
        this.itemRemove([id], folder);
      }
    });
    EventManager.on('settingsSaved', (options) => {
      var opts = options || {};
      if (opts.needToUpdateCache) {
        cache.flush();
        EventManager.trigger('folderChanged', {
          folder: 'inbox'
        });
      }
    });
    EventManager.on('updatedAfterError', () => {
      if (!StateManager.is('jobView')) {
        this.checkNewItems();
      }
    });
  };
  componentDidUpdate = () => {
    var listEl = ReactDOM.findDOMNode(this.refs.jobs_list);
    if (listEl) {
      this.listElHeight = listEl.clientHeight;
    }
  };
  render = () => {
    var state = this.state;
    return (
      <div id="jobs_list_wrap" onScroll={this.scrollHandler}>
        {!state.empty ?
        <div id="jobs_list" ref="jobs_list">
          {state.items.map((item, key) => {
            return <ListItem key={key} {...item} remove={this.itemRemove} select={this.itemSelect} open={this.itemOpen} />;
          })}
        </div> : null}
        {state.full && state.curFolder === 'inbox' ?
          <div className="jl_full">No more jobs that match your search</div>
          : null
        }
        {state.empty && state.curFolder !== 'inbox' ?
          <div className="jl_info">
            <div className="jli_data">
              <Icon name="folder-open-o" />
              <span className="jl_info_folder">{state.curFolder}</span> is empty
            </div>
          </div>
          : null
        }
        {state.noFeeds && state.curFolder === 'inbox' ?
          <div className="jl_info jli_suggest">
            <div className="jli_data">
              <Icon name="arrow-up" />
              Please write your query <br />to the field above
            </div>
          </div>
          : null
        }
        {!state.noFeeds && !state.load && state.empty && state.curFolder === 'inbox' ?
          <div className="jl_response_empty">
            Upwork didn't find any jobs that match your search. Please modify your search to expand it.
          </div>
          : null
        }
        {state.load ?
          <div id="jl_loader">
            <Icon spin name="refresh" />
          </div>
          : null
        }
      </div>
    );
  }
}

export default List;