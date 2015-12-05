'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'underscore';
import * as config from '../../config';
import * as EventManager from 'modules/events';
import * as StateManager from 'modules/states';
import * as folders from 'modules/folders';
import * as storage from 'modules/storage';
import * as cache from 'modules/cache';
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
        item = _.findWhere(curItems, {id: itemId});

      EventManager.trigger('jobItemInit', {
        jobItem: item
      });
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
  loaderTrawler = (targetPosition) => {
    var loader = this.refs.swipe_load.getDOMNode();
    if (targetPosition) {
      targetPosition = Number(targetPosition);
      animate({
        initial: this.touch.swipeShift,
        target: targetPosition,
        draw: progress => {
          _.extend(loader.style, {
            '-webkit-transform': 'translate3d(0, ' + progress + 'px, 0) rotate(' + progress * 2 + 'deg)'
          });
        },
        finish: () => {
          if (targetPosition) {
            loader.classList.add('fa-spin');
            this.checkNewItems(true, () => {
              loader.classList.remove('fa-spin');
              this.touch.swipeShift = this.touch.swipeTargetPosition;
              this.loaderTrawler('0');
            });
          }
        }
      });
    } else {
      this.touch.swipeShift = this.touch.yNegativeShift / 2 + 50;
      this.touch.swipeShift = this.touch.swipeShift > 0 ? this.touch.swipeShift : 0;
      _.extend(loader.style, {
        '-webkit-transform': 'translate3d(0, ' + this.touch.swipeShift + 'px, 0) rotate(' + this.touch.swipeShift * 2 + 'deg)',
        borderSpacing: this.touch.swipeShift + 'px'
      });
    }
  };
  getCoordinates(e) {
    var target = e.targetTouches[0];
    return {
      x: Number(target.pageX),
      y: Number(target.pageY)
    };
  }
  touchStartHandler = (e) => {
    this.touch = _.extend(this.getCoordinates(e), {
      swipeTargetPosition: 130
    });
  };
  touchMoveHandler = (e) => {
    if (this.state.load) {
      return;
    }
    var coordinates = this.getCoordinates(e),
      curScroll = ReactDOM.findDOMNode(this).scrollTop;

    this.touch.yShift = coordinates.y - this.touch.y;
    this.touch.xShift = coordinates.x - this.touch.x;

    if (this.touch.swipeUpdateProcess) {
      e.preventDefault();
      this.touch.yNegativeShift = coordinates.y - this.touch.swipeStartPosition;
      this.loaderTrawler();
    } else if (!this.touch.swipeUpdateProcess && this.touch.yShift > 0 && curScroll <= 0) { // vertical move
      e.preventDefault();
      _.extend(this.touch, {
        swipeUpdateProcess: true,
        swipeStartPosition: coordinates.y
      });
      this.loaderTrawler();
    }
  };
  touchEndHandler = () => {
    if (this.touch.swipeUpdateProcess) {
      if (this.touch.swipeShift >= this.touch.swipeTargetPosition) {
        this.loaderTrawler(this.touch.swipeTargetPosition);
      } else {
        this.loaderTrawler('0');
      }
    }
  };
  scrollValue = 0;
  scrollHandler = () => {
    var curScroll = ReactDOM.findDOMNode(this).scrollTop;
    if (curScroll - this.scrollValue > 30 && curScroll > 0) {
      this.scrollValue = curScroll;
      EventManager.trigger('listScrolledBottom');
    } else if (curScroll - this.scrollValue < -30 || curScroll === 0) {
      this.scrollValue = curScroll;
      EventManager.trigger('listScrolledTop');
    }
  };
  checkNewItems = (swipeRefresh, callback) => {
    var cb = callback || _.noop;
    this.setState({
      load: true,
      noFeeds: false,
      swipeRefresh: swipeRefresh
    });
    folders.checkNew({
      folder: 'inbox'
    }, (err, response) => {
      var state = {
        swipeRefresh: false,
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
    console.log('List mounted');
    EventManager.on('ready', () => {
      if (storage.get('feeds')) {
        this.getJobs({
          noFeeds: false
        });
        this.checkNewItems();
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
    EventManager.on('feedsCheckNews resume notificationsClicked', () => {
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
  render = () => {
    var state = this.state;
    return (
      <div id="jobs_list_wrap" onScroll={this.scrollHandler} onTouchStart={this.touchStartHandler} onTouchMove={this.touchMoveHandler} onTouchEnd={this.touchEndHandler}>
        {!state.empty ?
        <div id="jobs_list">
          {state.items.map((item, key) => {
            return <ListItem key={key} {...item} remove={this.itemRemove} select={this.itemSelect} open={this.itemOpen} />;
          })}
        </div> : null}
        {state.full ?
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
        {state.noFeeds ?
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
            {!state.swipeRefresh ? <Icon spin name="pulse" /> : null}
          </div>
          : null
        }
        <Icon name="refresh" ref="swipe_load" id="swipe_load"/>
      </div>
    );
  }
}

export default List;