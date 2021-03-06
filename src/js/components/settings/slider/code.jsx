'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'underscore';

import './style';

class Slider extends React.Component {
  static propTypes = {
    handler: React.PropTypes.func.isRequired,
    from: React.PropTypes.string.isRequired,
    to: React.PropTypes.string.isRequired,
    values: React.PropTypes.array.isRequired
  };
  state = {
    left: 0,
    right: 0,
    sliderStep: 10
  };
  setValue = () => {
    var props = this.values,
      text = props.from + '$ - ' + props.to + '$';

    this.props.handler([{
      name: 'budgetFrom',
      value: props.from
    }, {
      name: 'budgetTo',
      value: props.to
    }], text);
  };
  setValueText = (value) => {
    var props = this.values,
      index = Math.round(value / this.values.step),
      changed,
      newValue;

    if (this.isRight) {
      newValue = props.values[this.values.sliderStep - 1 - index];
      if (newValue !== props.to) {
        props.to = newValue;
        changed = true;
      }
    } else {
      newValue = props.values[index];
      if (newValue !== props.from) {
        props.from = newValue;
        changed = true;
      }
    }
    if (changed) {
      this.props.handler(null, props.from + '$ - ' + props.to + '$', true);
    }
  };
  getCoordinates(e) {
    return {
      x: Number(e.pageX),
      y: Number(e.pageY)
    };
  }
  movePin = (coordinates) => {
    var prop = 'left',
      offset = this.values.offset,
      width = this.values.width,
      step = this.values.step,
      pointWidth = 50,
      value = coordinates.x - offset - pointWidth / 2,
      fillEl = ReactDOM.findDOMNode(this.refs.fill);

    if (this.isRight) {
      prop = 'right';
      value = coordinates.x - offset - width;
      if (value < 0) {
        value = Math.abs(value);
      } else {
        value = 0;
      }
      if (width - value < this.oppositePos + step * 2) {
        value = width - this.oppositePos - step * 2;
      }
    } else {
      if (value > this.oppositePos - step) {
        value = this.oppositePos - step;
      }
    }
    if (value < 0) {
      value = 0;
    } else if (value > width - pointWidth) {
      value = width - pointWidth;
    }
    fillEl.style[prop] = value + 'px';
    this.start.position = value;
    this.setValueText(value);
  };
  startHandler = (e) => {
    var pin = e.target,
      props = this.values,
      values = props.values,
      from = props.from,
      to = props.to;

    this.start = this.getCoordinates(e);
    this.isRight = false;
    this.scrolled = false;

    if (pin.getAttribute('data-value') === 'right') {
      this.isRight = true;
    }

    this.oppositePos = values.indexOf(this.isRight ? from : to) * props.step;
  };
  moveHandler = (e) => {
    if (!this.start) {
      return;
    }

    var coordinates = this.getCoordinates(e);
    this.start.yShift = coordinates.y - this.start.y;
    this.start.xShift = coordinates.x - this.start.x;

    if (this.isMoved) {
      e.preventDefault();
      this.movePin(coordinates);
    } else if (!this.scrolled && Math.abs(this.start.xShift) > 3 && Math.abs(this.start.yShift) < 10) { // horizontal move
      e.preventDefault();
      this.isMoved = true;
      this.movePin(coordinates);
    }
  };
  endHandler = () => {
    if (!this.start) {
      return;
    }
    var prop = 'left',
      step = this.values.step,
      nearPosition = Math.round(this.start.position / step) * step;

    if (this.isRight) {
      prop = 'right';
    }
    ReactDOM.findDOMNode(this.refs.fill).style[prop] = nearPosition + 'px';
    this.setValue();
    this.start = null;
  };
  recalculateSizes = () => {
    var props = this.props,
      from = props.from,
      to = props.to,
      values = props.values,
      fillEl = ReactDOM.findDOMNode(this.refs.fill),
      sliderWidth = fillEl.clientWidth || 400, // default value for tests
      sliderOffset = fillEl.offsetLeft,
      step = sliderWidth / this.state.sliderStep,
      contentBlock = document.getElementById('content');

    if (contentBlock) {
      sliderOffset += contentBlock.offsetLeft;
    }

    this.values = _.extend({
      step: step,
      sliderStep: this.state.sliderStep,
      width: sliderWidth,
      offset: sliderOffset,
      left: values.indexOf(from) * step,
      right: (this.state.sliderStep - 1 - values.indexOf(to)) * step
    }, _.clone(this.props));

    this.setState({
      left: this.values.left,
      right: this.values.right
    });
  };
  componentDidMount = () => {
    setTimeout(this.recalculateSizes, 400);
  };
  render() {
    var filPosition = {
      left: this.state.left + 'px',
      right: this.state.right + 'px'
    };
    return (
      <div className="sgi_slider" ref="wrap" onMouseMove={this.moveHandler} onMouseUp={this.endHandler} onMouseLeave={this.endHandler}>
        <div className="sgis_fill" ref="fill" style={filPosition}>
          <div className="sgis_pin sgispl" data-value="left" onMouseDown={this.startHandler} />
          <div className="sgis_pin sgispr" data-value="right" onMouseDown={this.startHandler} />
        </div>
      </div>
    );
  }
}

export default Slider;