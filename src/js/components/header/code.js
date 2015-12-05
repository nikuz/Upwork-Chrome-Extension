'use strict';

import * as React from 'react';
import * as EventManager from 'modules/events';
import * as StateManager from 'modules/states';
import Icon from 'react-fa';

import './style';

class Header extends React.Component {
  handleSettingsClick = () => {
    if (!StateManager.is('settings')) {
      EventManager.trigger('settingsInit');
    }
  };
  render = () => {
    return (
      <header>
        <div id="logo" title="Upwatcher"></div>
        <Icon name="sliders" className="blocker_loader" id="stngs_trigger" onClick={this.handleSettingsClick} />
      </header>
    );
  }
}

export default Header;