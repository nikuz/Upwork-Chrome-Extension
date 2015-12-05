'use strict';

import * as React from 'react';
import * as _ from 'underscore';
import Icon from 'react-fa';

import './style';

class Select extends React.Component {
  static propTypes = {
    name: React.PropTypes.string.isRequired,
    values: React.PropTypes.array.isRequired,
    handler: React.PropTypes.func.isRequired,
    handlerOpen: React.PropTypes.func
  };
  state = {
    err: null,
    values: []
  };
  handlerOpen = () => {
    var handlerOpen = this.props.handlerOpen;
    if (handlerOpen && !this.props.values.length) {
      handlerOpen((err, response) => {
        var state = {
          err: null
        };
        if (err) {
          state.err = err;
        } else {
          state.values = response;
        }
        this.setState(state);
      });
    }
  };
  handlerClickDownloadAgain = () => {
    this.setState({
      err: null,
      values: []
    });
    this.handlerOpen();
  };
  handlerSelect = (e) => {
    var target = e.target;
    this.props.handler([{
      name: target.name,
      value: target.value
    }]);
  };
  componentDidMount = () => {
    this.handlerOpen();
  };
  render() {
    var props = this.props,
      values = props.values,
      error,
      loader,
      select;

    if (!values.length) {
      values = this.state.values;
    }
    if (this.state.err) {
      error = (
        <div className="sgi_legacy_list_error">
          <div>Can't load</div>
          <button onClick={this.handlerClickDownloadAgain}>Try again</button>
        </div>
      );
    } else if (!values.length) {
      loader = (
        <div className="sgi_legacy_list_load">
          <Icon spin name="pulse" />
        </div>
      );
    }
    if (values.length) {
      select = (
        <select className="sgi_legacy_select" name={props.name} onChange={this.handlerSelect} defaultValue={props.value}>
          {values.map(item => {
            var key = _.keys(item)[0],
              value = _.values(item)[0];

            return <option defaultValue={key} key={key}>{value}</option>;
          })}
        </select>
      );
    }

    return (
      <div className="sgi_legacy_select_wrap">
        {error}
        {loader}
        {select}
      </div>
    );
  }
}

export default Select;