'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as EventManager from 'modules/events';
import * as StateManager from 'modules/states';
import * as storage from 'modules/storage';
import * as cache from 'modules/cache';

import './style';

class Search extends React.Component {
  state = {
    isHide: false,
    isHideByListManager: false,
    feedsValue: storage.get('feeds')
  };
  trim(value) {
    var unallowedCharacters = /\/|\"|\'|\`|\^|\&|\$|\%|\*|\(|\)|\[|\]|\{|\}|\?|\;|\:|<|>|\+|\=|\#|\@|\!/g;
    value = value.trim().replace(unallowedCharacters, '').replace(/\s+/g, ' ');
    return value.length ? value : null;
  }
  handlerSubmit = (e) => {
    e.preventDefault();
    var formEl = ReactDOM.findDOMNode(this),
      inputEl = formEl.search,
      value = this.trim(inputEl.value);

    if (value) {
      let fName = 'feeds',
        curFeeds = storage.get(fName);
      if (value !== curFeeds) {
        cache.flush();
        storage.set(fName, value);
        EventManager.trigger('feedsAdded');
      } else {
        EventManager.trigger('feedsCheckNews');
      }
      inputEl.blur();
    } else {
      inputEl.focus();
    }
  };
  componentDidMount = () => {
    EventManager.on('jobsSelected', (options) => {
      var opts = options || {};
      this.setState({
        isHideByListManager: opts.amount
      });
    });
    EventManager.on('folderChanged', options => {
      var opts = options || {},
        isHide = false;

      if (opts.folder === 'favorites' || opts.folder === 'trash') {
        isHide = true;
      }
      this.setState({
        isHide: isHide,
        isHideByListManager: false
      });
    });
    EventManager.on('listScrolledBottom', () => {
      if (StateManager.is('inbox')) {
        var formEl = ReactDOM.findDOMNode(this);
        formEl.search.blur();
        this.setState({isHide: true});
      }
    });
    EventManager.on('listScrolledTop', () => {
      if (StateManager.is('inbox')) {
        this.setState({isHide: false});
      }
    });
    EventManager.on('gotNewJobsCount', (options) => {
      var opts = options || {};
      if (StateManager.is('inbox')) {
        this.setState({
          resultsCount: opts.count
        });
      }
    });
  };
  render() {
    var classString = this.state.isHide || this.state.isHideByListManager ? 'hide' : '',
      resultsCount = this.state.resultsCount || Number(storage.get('found_jobs'));

    if (resultsCount) {
      classString += ' found-some-jobs';
    }

    return (
      <form id="search" className={classString} onSubmit={this.handlerSubmit}>
        <input type="text" name="search" defaultValue={this.state.feedsValue} placeholder="Find Jobs" id="searchField" className="f_text" />
        <label htmlFor="searchField" id="searchLabel">Found {resultsCount} job</label>
        <button type="submit" className="js_submit fa fa-search" title="Find" />
      </form>
    );
  }
}

export default Search;