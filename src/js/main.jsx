'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import * as _ from 'underscore';
import * as async from 'utils/async';
import * as EventManager from 'modules/events';
import Header from 'components/header/code';
import ListManager from 'components/list/manager-code';
import Search from 'components/search/code';
import Notifications from 'components/notifications/code';
import Errors from 'components/errors/code';
import Tabs from 'components/tabs/code';
import Settings from 'components/settings/code';
import List from 'components/list/code';
import JobView from 'components/jobItem/code';

import 'css/basic';
import 'css/form';

class App extends React.Component {
  state = {
    wide: false,
    extra: null
  };
  getExtraContent = (content) => {
    return (
      <ReactCSSTransitionGroup transitionName="pageextra" transitionAppear transitionEnterTimeout={300} transitionAppearTimeout={300} transitionLeaveTimeout={300} component="div">
        {content ?
        <div className="page-extra">{content}</div>
          : null
          }
      </ReactCSSTransitionGroup>
    );
  };
  insertExtraContent = (name, content) => {
    var settingsCont,
      jobViewCont;

    if (name === 'settings') {
      settingsCont = content;
    } else if (name === 'jobView') {
      jobViewCont = content;
    }

    ReactDOM.render(
      this.getExtraContent(settingsCont),
      this.settingsContainer
    );
    ReactDOM.render(
      this.getExtraContent(jobViewCont),
      this.jobViewContainer
    );
  };
  componentDidMount = () => {
    this.settingsContainer = ReactDOM.findDOMNode(this.refs.settingsContainer);
    this.jobViewContainer = ReactDOM.findDOMNode(this.refs.jobViewContainer);
    if (window.innerWidth > 800) {
      this.setState({
        wide: true
      });
    }
    EventManager.on('settingsInit', () => {
      this.insertExtraContent('settings', <Settings />);
    });
    EventManager.on('jobItemInit', options => {
      var opts = options || {};
      this.insertExtraContent('jobView', <JobView {...opts.jobItem} />);
    });
    EventManager.on('settingsHide jobItemHide', () => {
      this.insertExtraContent();
    });
  };
  render() {
    return (
      <div id="content" className={this.state.wide ? 'pageWideMode' : ''}>
        <Header />
        <ListManager />
        <Search />
        <Notifications />
        <Errors />
        <List />
        <Tabs />
        <div ref="settingsContainer" />
        <div ref="jobViewContainer" />
      </div>
    );
  }
}

document.addEventListener('DOMContentLoaded', function() {
  ReactDOM.render(
    <App />,
    document.getElementById('wrap')
  );
  EventManager.trigger('ready');
});

window.addEventListener('message', function(e) {
  if (e.data === 'newJobs') {
    EventManager.trigger('notificationsGot');
  }
}, false);
