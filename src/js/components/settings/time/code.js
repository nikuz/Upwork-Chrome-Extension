'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import './style';

class Time extends React.Component {
  static propTypes = {
    type: React.PropTypes.string.isRequired,
    handler: React.PropTypes.func.isRequired,
    value: React.PropTypes.string.isRequired,
    name: React.PropTypes.string.isRequired
  };
  handlerClick = () => {
    var target = ReactDOM.findDOMNode(this.refs.field),
      value = target.value.split(':'),
      correctedDate = new Date().setHours(Number(value[0]), Number(value[1]));

    var timeOpts = {
      is24Hour: true,
      mode: 'time',
      date: new Date(correctedDate)
    };
    datePicker.show(
      timeOpts,
      date => {
        var hour = date.getHours(),
          minutes = date.getMinutes();

        if (hour < 10) {
          hour = '0' + hour;
        }
        if (minutes < 10) {
          minutes = '0' + minutes;
        }
        target.value = hour + ':' + minutes;
        this.handlerChange();
      }
    );
  };
  handlerChange = () => {
    var target = ReactDOM.findDOMNode(this.refs.field);
    this.props.handler([{
      name: target.name,
      value: target.value
    }]);
  };
  render() {
    var props = this.props,
      className = 'sgi_time',
      name = props.name + props.type;

    className += props.type === 'From' ? ' fl_l' : ' fl_r';

    return (
      <div className={className}>
        <input type="text" ref="field" className="f_text ft_center" name={name} defaultValue={props.value} onChange={this.handlerChange} />
        <div className="blocker" onClick={this.handlerClick}></div>
      </div>
    );
  }
}

export default Time;