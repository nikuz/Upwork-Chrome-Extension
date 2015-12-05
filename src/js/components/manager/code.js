'use strict';

import * as React from 'react';
import * as EventManager from 'modules/events';
import * as StateManager from 'modules/states';
import Icon from 'react-fa';

import './style';

class Manager extends React.Component {
  handlerSelectAll = (e) => {
    var target = e.target;
    EventManager.trigger('btnSelectAllClicked', {
      select: target.checked
    });
  };
  handlerClick = (e) => {
    var target = e.target,
      value = target.getAttribute('data-value');

    switch (value) {
      case 'favorites':
        if (!StateManager.is('favorites')) {
          EventManager.trigger('btnFavoritesClicked');
        }
        break;
      case 'trash':
        EventManager.trigger('btnTrashClicked');
        break;
      case 'read':
        EventManager.trigger('btnReadClicked');
        break;
      case 'share':
        EventManager.trigger('btnShareClicked');
        break;
    }
  };
  render() {
    var props = this.props;
    return (
      <div>
        {props.select ?
          <div className="msiw">
            <label htmlFor="jl_all" className="msitem m_select" id="m_all">
              <input type="checkbox" className="fch_cust" id="jl_all" onChange={this.handlerSelectAll} />
              <Icon name="check" className="fl_cust" />
            </label>
          </div>
          : null
        }
        {props.favorites ?
          <div className={'msiw' + (StateManager.is('favorites') ? ' disabled' : '')}>
            <Icon name="star" className="msitem m_favorites" data-value="favorites" onClick={this.handlerClick} />
          </div>
          : null
        }
        {props.trash ?
          <div className="msiw">
            <Icon name="trash" className="msitem m_delete" data-value="trash" onClick={this.handlerClick} />
          </div>
          : null
        }
        {props.read ?
          <div className="msiw">
            <Icon name="eye" className="msitem m_read" data-value="read" onClick={this.handlerClick} />
          </div>
          : null
        }
        {props.share ?
          <div className="msiw">
            <Icon name="share-alt" className="msitem m_share" data-value="share" onClick={this.handlerClick} />
          </div>
          : null
        }
      </div>
    );
  }
}

export default Manager;