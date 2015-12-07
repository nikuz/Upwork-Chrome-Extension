'use strict';

import * as React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import * as EventManager from 'modules/events';
import * as StateManager from 'modules/states';
import Manager from 'components/manager/code';

class ListManager extends React.Component {
  state = {
    isHide: true,
    isShownTooltip: false
  };
  componentDidMount = () => {
    EventManager.on('jobsSelected', (options) => {
      if (StateManager.is('inbox')) {
        var opts = options || {};
        this.setState({
          isHide: !opts.amount
        });
      }
    });
    EventManager.on('folderChanged', () => {
      var isHide = true;
      if (StateManager.is('favorites.ready') || StateManager.is('trash.ready')) {
        isHide = false;
      }
      this.setState({
        isHide: isHide
      });
    });
    EventManager.on('listBecomeEmpty', () => {
      this.setState({
        isHide: true
      });
    });
    EventManager.on('listHaventSelectedItems', () => {
      this.setState({
        isShownTooltip: true
      });
      setTimeout(() => {
        this.setState({
          isShownTooltip: false
        });
      }, 1000);
    });
  };
  render() {
    return (
      <div>
        <ReactCSSTransitionGroup transitionName="listmanager" component="div" transitionEnterTimeout={300} transitionLeaveTimeout={300}>
          {!this.state.isHide ?
            <div id="listManager">
              <Manager select favorites trash read />
            </div>
            : null
          }
        </ReactCSSTransitionGroup>
        <ReactCSSTransitionGroup transitionName="tooltip" transitionEnterTimeout={300} transitionLeaveTimeout={300}>
          {this.state.isShownTooltip ?
            <span id="lm_tooltip">First select the job</span>
            : null
          }
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

export default ListManager;