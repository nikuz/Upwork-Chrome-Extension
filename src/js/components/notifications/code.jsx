'use strict';

import * as React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import * as EventManager from 'modules/events';
import * as StateManager from 'modules/states';

import './style';

class Notifications extends React.Component {
  state = {
    isHide: true,
    atTop: false
  };
  handlerClick = () => {
    this.setState({
      isHide: true,
      atTop: false
    });
    EventManager.trigger('notificationsClicked');
  };
  componentDidMount() {
    EventManager.on('notificationsGot', () => {
      var state = {
        isHide: false
      };
      var searchEl = document.getElementById('search');
      if (searchEl.classList.contains('hide')) {
        state.atTop = true;
      }
      this.setState(state);
    });
    EventManager.on('listScrolledBottom', () => {
      if (StateManager.is('inbox') && !this.state.isHide) {
        this.setState({
          atTop: true
        });
      }
    });
    EventManager.on('listScrolledTop', () => {
      if (StateManager.is('inbox') && !this.state.isHide) {
        this.setState({
          atTop: false
        });
      }
    });
  };
  render() {
    return (
      <ReactCSSTransitionGroup transitionName="notification" onClick={this.handlerClick} transitionEnterTimeout={300} transitionLeaveTimeout={300}>
        {!this.state.isHide ? <span className={'notification' + (this.state.atTop ? ' attop' : '')}>Show new jobs</span> : null}
      </ReactCSSTransitionGroup>
    );
  }
}

export default Notifications;