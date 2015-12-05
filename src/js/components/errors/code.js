'use strict';

import * as React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import * as EventManager from 'modules/events';
import * as settings from 'modules/settings';

import './style';

class Errors extends React.Component {
  state = {
    isHide: true,
    upworkError: false,
    proxyError: false,
    networkError: false
  };
  clearState = () => {
    this.setState({
      isHide: true,
      upworkError: false,
      proxyError: false,
      networkError: false
    });
  };
  handlerRetry = () => {
    this.clearState();
    EventManager.trigger('updatedAfterError');
  };
  handlerChangeServer = () => {
    let sData = settings.get();
    sData.useProxy.value = !sData.useProxy.value;
    settings.set(sData);
    this.handlerRetry();
  };
  componentDidMount() {
    EventManager.on('inboxError', () => {
      var network = navigator.connection.type,
        state = {
          isHide: false
        };
      if (network !== 'none') {
        let useProxy = settings.get('useProxy').value;
        if (useProxy) {
          state.proxyError = true;
        } else {
          state.upworkError = true;
        }
      } else {
        state.networkError = true;
      }
      this.setState(state);
    });
    EventManager.on('backClicked settingsInit', () => {
      this.clearState();
    });
  };
  render() {
    var state = this.state;
    return (
      <ReactCSSTransitionGroup transitionName="errtooltip" component="div" transitionEnterTimeout={300} transitionLeaveTimeout={300}>
        {!state.isHide ?
          <div id="serverError">
            {state.upworkError ?
              <div>
                Upwork.com server internal error. Try to use proxy server instead? <br />
                <button className="btn_blue" onClick={this.handlerRetry}>No, retry</button>
                <button onClick={this.handlerChangeServer}>Yes</button>
              </div>
              : null
            }
            {state.proxyError ?
              <div>
                Proxy server internal error. Try to use Upwork.com server instead? <br />
                <button className="btn_blue" onClick={this.handlerRetry}>No, retry</button>
                <button onClick={this.handlerChangeServer}>Yes</button>
              </div>
              : null
            }
            {state.networkError ?
              <div>
                Check your network connection, then press "Retry" <br />
                <button onClick={this.handlerRetry}>Retry</button>
              </div>
              : null
            }
          </div>
          : null
        }
      </ReactCSSTransitionGroup>
    );
  }
}

export default Errors;