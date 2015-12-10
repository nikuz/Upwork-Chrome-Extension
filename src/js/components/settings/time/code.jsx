'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import TimePicker from 'react-time-picker';

import './style';

class Time extends React.Component {
  state = {
    value: null
  };
  static propTypes = {
    type: React.PropTypes.string.isRequired,
    handler: React.PropTypes.func.isRequired,
    value: React.PropTypes.string.isRequired,
    name: React.PropTypes.string.isRequired
  };
  handlerChange = (value) => {
    var target = ReactDOM.findDOMNode(this.refs.field);
    target.value = value;
    this.props.handler([{
      name: target.getAttribute('data-name'),
      value: target.value
    }]);
    this.setState({value: value});
  };
  render() {
    var props = this.props,
      value = this.state.value ? this.state.value : props.value,
      className = 'sgi_time',
      name = props.name + props.type,
      style = {
        width: '250px',
        borderColor: '#ccc'
      },
      hourStyle = {
        fontSize: '1.5em'
      };

    className += props.type === 'From' ? ' fl_l' : ' fl_r';

    return (
      <div className={className}>
        <TimePicker value={value} onChange={this.handlerChange} data-name={name} ref="field" style={style} hourStyle={hourStyle} />
      </div>
    );
  }
}

export default Time;