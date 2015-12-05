'use strict';

import * as React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import * as EventManager from 'modules/events';

import './style';

class Notifications extends React.Component {
  state = {
    isHide: true
  };
  handlerClick = () => {
    this.setState({isHide: true});
    EventManager.trigger('notificationsClicked');
  };
  componentDidMount() {
    EventManager.on('notificationsGot', () => {
      this.setState({isHide: false});
    });
    EventManager.on('backClicked', () => {
      this.setState({isHide: true});
    });
  };
  render() {
    return (
      <ReactCSSTransitionGroup transitionName="notification" onClick={this.handlerClick} transitionEnterTimeout={300} transitionLeaveTimeout={300}>
        {!this.state.isHide ? <span className="notification">Show new jobs</span> : null}
      </ReactCSSTransitionGroup>
    );
  }
}

export default Notifications;