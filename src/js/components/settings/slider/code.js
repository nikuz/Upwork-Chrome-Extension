'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

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
    var props = this.props,
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
    var props = this.props,
      index = Math.round(value / this.state.step),
      changed,
      newValue;

    if (this.isRight) {
      newValue = props.values[this.state.sliderStep - 1 - index];
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
    var target = e.targetTouches[0];
    return {
      x: Number(target.pageX),
      y: Number(target.pageY)
    };
  }
  movePin = (coordinates) => {
    var prop = 'left',
      offset = this.state.offset,
      width = this.state.width,
      step = this.state.step,
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
    this.start = this.getCoordinates(e);
    this.isRight = false;
    this.scrolled = false;
    var pin = e.targetTouches[0].target,
      props = this.props,
      values = props.values,
      from = props.from,
      to = props.to;

    if (pin.getAttribute('data-value') === 'right') {
      this.isRight = true;
    }

    this.oppositePos = values.indexOf(this.isRight ? from : to) * this.state.step;
  };
  moveHandler = (e) => {
    if (this.scrolled) {
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
    } else if (!this.isMoved && !this.scrolled && Math.abs(this.start.yShift) > 5) { // vertical move
      this.scrolled = true;
    }
  };
  endHandler = () => {
    if (this.scrolled) {
      return;
    }
    var prop = 'left',
      step = this.state.step,
      nearPosition = Math.round(this.start.position / step) * step;

    if (this.isRight) {
      prop = 'right';
    }
    ReactDOM.findDOMNode(this.refs.fill).style[prop] = nearPosition + 'px';
    this.setValue();
  };
  recalculateSizes = () => {
    var props = this.props,
      from = props.from,
      to = props.to,
      values = props.values,
      fillEl = ReactDOM.findDOMNode(this.refs.fill),
      sliderWidth = fillEl.clientWidth || 400, // default value for tests
      sliderOffset = fillEl.offsetLeft,
      step = sliderWidth / this.state.sliderStep;

    this.setState({
      step: step,
      width: sliderWidth,
      offset: sliderOffset,
      left: values.indexOf(from) * step,
      right: (this.state.sliderStep - 1 - values.indexOf(to)) * step
    });
  };
  windowResizeHandler = () => {
    this.recalculateSizes();
  };
  componentDidMount = () => {
    setTimeout(this.recalculateSizes, 400);
    window.addEventListener('resize', this.windowResizeHandler);
  };
  componentWillUnmount = () => {
    window.removeEventListener('resize', this.windowResizeHandler);
  };
  render() {
    var filPosition = {
      left: this.state.left + 'px',
      right: this.state.right + 'px'
    };
    return (
      <div className="sgi_slider" ref="wrap">
        <div className="sgis_fill" ref="fill" style={filPosition}>
          <div className="sgis_pin sgispl" onTouchStart={this.startHandler} onTouchMove={this.moveHandler} onTouchEnd={this.endHandler} data-value="left"></div>
          <div className="sgis_pin sgispr" onTouchStart={this.startHandler} onTouchMove={this.moveHandler} onTouchEnd={this.endHandler} data-value="right"></div>
        </div>
      </div>
    );
  }
}

export default Slider;