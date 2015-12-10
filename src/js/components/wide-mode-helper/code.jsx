'use strict';

import * as React from 'react';

import './style';

class WideModeHelper extends React.Component {
  render() {
    return (
      <div id="popup_helper">
        <span id="ph_icon" />
        You can close this tab and work through extension popup.
      </div>
    );
  }
}

export default WideModeHelper;