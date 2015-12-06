'use strict';

import * as React from 'react';
import * as EventManager from 'modules/events';
import * as StateManager from 'modules/states';
import Icon from 'react-fa';

import './style';

class Header extends React.Component {
  state = {
    settingsOpened: false
  };
  handleSettingsClick = () => {
    if (!StateManager.is('settings')) {
      EventManager.trigger('settingsInit');
      this.setState({
        settingsOpened: true
      });
    } else {
      EventManager.trigger('settingsHide');
      this.setState({
        settingsOpened: false
      });
    }
  };
  render = () => {
    return (
      <header>
        <div id="logo" title="Upwatcher"></div>
        <Icon name="sliders" className={'blocker_loader' + (this.state.settingsOpened ? ' stgns-tr-open' : '')} id="stngs_trigger" onClick={this.handleSettingsClick} />
      </header>
    );
  }
}

export default Header;