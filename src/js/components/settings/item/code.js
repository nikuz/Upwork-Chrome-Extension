'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'underscore';
import * as EventManager from 'modules/events';
import List from 'components/settings/list/code';
import Slider from 'components/settings/slider/code';
import Time from 'components/settings/time/code';
import Switcher from 'components/settings/switcher/code';

import './style';

class BlockModern extends React.Component {
  static propTypes = {
    handler: React.PropTypes.func.isRequired,
    handlerOpen: React.PropTypes.func,
    title: React.PropTypes.string.isRequired,
    type: React.PropTypes.string.isRequired,
    name: React.PropTypes.string.isRequired,
    values: React.PropTypes.array,
    relations: React.PropTypes.string,
    from: React.PropTypes.string,
    to: React.PropTypes.string,
    descr: React.PropTypes.string
  };
  openCl = 'sgi_opened';
  disableCl = 'sgi_block';
  expand = () => {
    var contWrapEl = ReactDOM.findDOMNode(this.refs.cont_wrap),
      contEl = ReactDOM.findDOMNode(this.refs.cont);

    _.extend(contWrapEl.style, {
      height: contEl.clientHeight + 'px'
    });
  };
  collapse = () => {
    var sgi = ReactDOM.findDOMNode(this.refs.sg_item),
      contWrapEl = ReactDOM.findDOMNode(this.refs.cont_wrap);

    if (contWrapEl) {
      _.extend(contWrapEl.style, {
        height: 0
      });
    }
    if (sgi) {
      sgi.classList.remove(this.openCl);
    }
  };
  resize = () => {
    var sgi = ReactDOM.findDOMNode(this.refs.sg_item);
    if (_.contains(sgi.classList, this.openCl)) {
      this.expand();
    }
  };
  handleSelect = (options) => {
    var opts = options || {},
      sgi = ReactDOM.findDOMNode(this.refs.sg_item);
    if (opts.sgi === sgi) {
      if (_.contains(sgi.classList, this.openCl)) {
        this.expand();
      } else {
        this.collapse();
      }
    } else if (sgi && _.contains(sgi.classList, this.openCl)) {
      this.collapse();
    }
  };
  handleSwitcherChange = (options) => {
    var opts = options || {};
    if (opts.relation && opts.relation === this.props.relations) {
      this.collapse();
      var sgi = ReactDOM.findDOMNode(this.refs.sg_item);
      if (sgi) {
        if (opts.value) {
          sgi.classList.remove(this.disableCl);
        } else {
          sgi.classList.add(this.disableCl);
        }
        EventManager.trigger('stngListSelected', {
          sgi
        });
      }
    }
  };
  handlerChange = (values, valueText, doNotBubbling) => {
    switch (this.props.type) {
      case 'list':
        let sgi = ReactDOM.findDOMNode(this.refs.sg_item);
        sgi.classList.remove(this.openCl);
        EventManager.trigger('stngListSelected', {
          sgi
        });
        break;

      case 'time':
        let name = values[0].name,
          value = values[0].value;

        if (/from/i.test(name)) {
          this.values.from = value;
        } else {
          this.values.to = value;
        }
        valueText = this.values.from + ' - ' + this.values.to;
        break;
    }
    ReactDOM.findDOMNode(this.refs.value).innerText = valueText;
    if (!doNotBubbling) {
      this.props.handler(values);
    }
  };
  handleClick = () => {
    var sgi = ReactDOM.findDOMNode(this.refs.sg_item),
      cl = this.openCl;

    if (_.contains(sgi.classList, this.disableCl)) {
      return;
    }
    if (_.contains(sgi.classList, cl)) {
      sgi.classList.remove(cl);
    } else {
      sgi.classList.add(cl);
    }
    EventManager.trigger('stngListSelected', {
      sgi
    });
  };
  getValueText = () => {
    var text;
    this.props.values.every(item => {
      if (_.keys(item)[0] == this.props.value) { // need to not strict compare because object keys
        text = _.values(item)[0];
        return false;
      } else {
        return true;
      }
    });
    return text || this.props.value;
  };
  componentDidMount = () => {
    EventManager.on('stngListSelected', this.handleSelect);
    EventManager.on('stngSwitcherChange', this.handleSwitcherChange);
    this.values = _.clone(this.props);
  };
  componentWillUnmount = () => {
    EventManager.off('stngListSelected', this.handleSelect);
    EventManager.off('stngSwitcherChange', this.handleSwitcherChange);
  };
  render() {
    var props = this.props,
      type = props.type,
      value = '',
      element,
      sgiCl = 'sg_item',
      valueCl = 'sgi_value',
      contCl = 'sgi_cont_wrap sgc_cont_' + type,
      body;

    if (props.disable) {
      sgiCl += ' ' + this.disableCl;
    }

    switch (type) {
      case 'list':
        element = (
          <List
            handler={this.handlerChange}
            handlerOpen={this.props.handlerOpen}
            handlerResize={this.resize}
            name={props.name}
            value={props.value}
            values={props.values}
          />
        );
        value = this.getValueText();
        break;
      case 'slider':
        element = (
          <Slider
            handler={this.handlerChange}
            from={props.from}
            to={props.to}
            values={props.values}
          />
        );
        valueCl += ' permanent';
        value = props.valueText;
        break;
      case 'time':
        element = (
          <div className="sgi_time_wrap">
            <Time type="From" name={props.name} value={props.from} handler={this.handlerChange} />
            <Time type="To" name={props.name} value={props.to} handler={this.handlerChange} />
          </div>
        );
        value = props.valueText;
        break;
      case 'switcher':
        element = (
          <Switcher
            handler={props.handler}
            relations={props.relations}
            name={props.name}
            checked={props.checked}
          />
        );
        sgiCl += ' sgi_checks';
        break;
    }

    if (type === 'switcher') {
      body = (
        <div className={sgiCl}>
          <h4 className="sgi_title">{props.title}</h4>
          <p className="sgi_descr">{props.descr}</p>
          {element}
          <label htmlFor={props.name} className="blocker sgi_blocker"></label>
        </div>
      );
    } else {
      body = (
        <div className={sgiCl} ref="sg_item">
          <div className="sgi_head">
            <h4 className="sgi_title">{props.title}</h4>
            <p className={valueCl} ref="value">{value}</p>
            <div className="blocker sgi_blocker" onClick={this.handleClick}></div>
          </div>
          <div className={contCl} ref="cont_wrap">
            <div className="sgi_cont" ref="cont">
              {element}
            </div>
          </div>
        </div>
      );
    }

    return body;
  }
}

export default BlockModern;