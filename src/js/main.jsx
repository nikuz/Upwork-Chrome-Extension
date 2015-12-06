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
    extra: {}
  };
  extraUpdate = (name, component) => {
    var extra = {};
    if (name && component) {
      _.extend(extra, {
        name: name,
        component: component
      });
    }
    this.setState({
      extra: extra
    });
  };
  componentDidMount = () => {
    if (window.innerWidth > 800) {
      this.setState({
        wide: true
      });
    }
    EventManager.on('settingsInit', () => {
      this.extraUpdate('settings', <Settings />);
    });
    EventManager.on('jobItemInit', options => {
      var opts = options || {};
      this.extraUpdate('jobView', <JobView {...opts.jobItem} />);
    });
    EventManager.on('settingsHide jobItemHide', () => {
      this.extraUpdate();
    });
    document.addEventListener('resume', function() {
      EventManager.trigger('resume');
    });
    EventManager.on('backClicked', () => {
      if (this.state.extra.name) {
        this.extraUpdate();
      } else {
        navigator.app.exitApp();
      }
    });
  };
  getExtraHtml = (name) => {
    var extra = this.state.extra,
      active = extra.name === name;

    return (
      <ReactCSSTransitionGroup transitionName="pageextra" component="div" transitionEnterTimeout={300} transitionLeaveTimeout={300}>
        {active ? <div className="page-extra">{extra.component}</div> : null}
      </ReactCSSTransitionGroup>
    );
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
        {this.getExtraHtml('settings')}
        {this.getExtraHtml('jobView')}
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
