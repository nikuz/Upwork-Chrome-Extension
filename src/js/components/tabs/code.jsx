'use strict';

import * as React from 'react';
import * as EventManager from 'modules/events';

import './style';

class Tabs extends React.Component {
  state = {
    activeTab: 'inbox',
    tabs: [{
      name: 'Inbox',
      value: 'inbox'
    }, {
      name: 'Favorites',
      value: 'favorites'
    }, {
      name: 'Trash',
      value: 'trash'
    }]
  };
  handlerClick = (e) => {
    var target = e.target,
      tab = target.getAttribute('data-value');

    this.setState({
      activeTab: tab
    });
    EventManager.trigger('folderChanged', {
      folder: tab
    });
  };
  componentDidMount = () => {
    EventManager.on('folderChanged', options => {
      var opts = options || {};
      if (opts.folder !== this.state.activeTab) {
        this.setState({
          activeTab: opts.folder
        });
      }
    });
  };
  render() {
    var state = this.state,
      tabCl = 'jf_item',
      sCl = 'selected';

    return (
      <ul id="jobFolders">
        {state.tabs.map(tab => {
          var cl = tab.value === state.activeTab ? tabCl + ' ' + sCl : tabCl;
          return <li className={cl} data-value={tab.value} key={tab.value} onClick={this.handlerClick}>{tab.name}</li>;
        })}
      </ul>
    );
  }
}

export default Tabs;
