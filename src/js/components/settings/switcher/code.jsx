'use strict';

import * as React from 'react';
import * as EventManager from 'modules/events';

import './style';

class Switcher extends React.Component {
  static propTypes = {
    handler: React.PropTypes.func.isRequired,
    name: React.PropTypes.string.isRequired,
    checked: React.PropTypes.bool.isRequired,
    relations: React.PropTypes.string
  };
  handlerChange = (e) => {
    var target = e.target;
    this.props.handler([{
      name: target.name,
      value: target.checked
    }]);
    if (this.props.relations) {
      EventManager.trigger('stngSwitcherChange', {
        relation: this.props.relations,
        value: target.checked
      });
    }
  };
  render() {
    var props = this.props;
    return (
      <div className="sgi_check">
        <input type="checkbox" className="fch_cust" id={props.name} name={props.name} defaultChecked={props.checked} onChange={this.handlerChange} />
        <label htmlFor={props.name} className="fa fa-toggle-off fl_cust_toggle" />
      </div>
    );
  }
}

export default Switcher;