'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'underscore';
import Icon from 'react-fa';

import './style';

class List extends React.Component {
  static propTypes = {
    name: React.PropTypes.string.isRequired,
    values: React.PropTypes.array.isRequired,
    handler: React.PropTypes.func.isRequired,
    handlerOpen: React.PropTypes.func,
    handlerResize: React.PropTypes.func
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
        this.props.handlerResize();
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
    var target = e.target,
      listEl = ReactDOM.findDOMNode(this.refs.list),
      name = listEl.getAttribute('data-name'),
      value = target.getAttribute('data-value'),
      valueText = target.innerText;

    _.each(listEl.childNodes, function(item) {
      item.className = item === target ? 'selected' : '';
    });

    this.props.handler([{
      name: name,
      value: value
    }], valueText);
  };
  componentDidMount = () => {
    this.handlerOpen();
  };
  render() {
    var props = this.props,
      values = props.values,
      error,
      loader;

    if (!values.length) {
      values = this.state.values;
    }
    if (this.state.err) {
      error = (
        <li className="sgi_list_error">
          <div>Can't load</div>
          <button onClick={this.handlerClickDownloadAgain}>Try again</button>
        </li>
      );
    } else if (!values.length) {
      loader = (
        <li className="sgi_list_load">
          <Icon spin name="pulse" />
        </li>
      );
    }

    return (
      <ul className="sgi_select" ref="list" data-name={props.name}>
        {error}
        {loader}
        {values.map(item => {
          var key = _.keys(item)[0],
            value = _.values(item)[0],
            className = key == props.value ? 'selected' : ''; // need to not strict compare because object keys

          return <li data-value={key} key={key} onClick={this.handlerSelect} className={className}>{value}</li>;
        })}
      </ul>
    );
  }
}

export default List;