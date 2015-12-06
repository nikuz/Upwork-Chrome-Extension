'use strict';

import * as React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import * as _ from 'underscore';
import Skills from 'components/skills/code';
import Icon from 'react-fa';
import timeAgo from 'utils/timeAgo';
import animate from 'utils/animate';

class ListItem extends React.Component {
  touch = {};
  updateTimeAgo = () => {
    var newTimeAgo = timeAgo(this.props.date_created);
    if (newTimeAgo !== this.curTimeAgo) {
      this.curTimeAgo = newTimeAgo;
      let item = this.refs.date_created.getDOMNode();
      item.innerHTML = newTimeAgo;
      this.updateTimer = setTimeout(this.updateTimeAgo, 6e4 - new Date().getSeconds() * 1000);
    }
  };
  getCoordinates(e) {
    return {
      x: Number(e.pageX),
      y: Number(e.pageY)
    };
  }
  touchStartHandler = (e) => {
    this.touch = _.extend(this.getCoordinates(e), {
      el: e.target.parentNode,
      time: Date.now(),
      holdTimer: setTimeout(this.holdChecker, 500)
    });
  };
  touchMoveHandler = (e) => {
    if (this.touch.isScrolled || !this.touch.el) {
      return;
    }
    var coordinates = this.getCoordinates(e);
    this.touch.yShift = coordinates.y - this.touch.y;
    this.touch.xShiftPrev = this.touch.xShift;
    this.touch.xShift = coordinates.x - this.touch.x;

    if (this.touch.isTrawled) {
      e.preventDefault();
      this.trawler();
    } else if (!this.touch.isScrolled && Math.abs(this.touch.xShift) > 3 && Math.abs(this.touch.yShift) < 10) { // horizontal move
      e.preventDefault();
      this.touch.isTrawled = true;
      this.trawler();
    } else if (!this.touch.isTrawled && !this.touch.isScrolled && Math.abs(this.touch.yShift) > 5) { // vertical move
      this.touch.isScrolled = true;
    }
  };
  touchEndHandler = () => {
    if (!this.touch.el) {
      return;
    }
    clearTimeout(this.touch.holdTimer);
    if (this.touch.holdCatch) {
      this.touch = {};
      return;
    }
    var jobId = this.props.id;
    if (this.touch.isTrawled) {
      if (this.touch.xShift > this.touch.xShiftPrev && this.touch.xShift > 50) {
        this.trawler('100%', () => {
          this.touch = {};
        });
        this.props.remove([jobId]);
      } else {
        this.trawler('0', () => {
          this.touch = {};
        });
      }
    } else if (!this.touch.isScrolled) {
      this.touch = {};
      this.props.open(jobId);
    }
  };
  holdChecker = () => {
    if (!this.touch.isTrawled && !this.touch.isScrolled) {
      this.touch.holdCatch = true;
      this.props.select(this.props.id);
    }
  };
  trawler = (targetPosition, callback) => {
    var cb = callback || _.noop;
    if (_.isUndefined(targetPosition)) {
      _.extend(this.touch.el.style, {
        left: this.touch.xShift + 'px'
      });
      cb();
    } else {
      let animateType = null,
        duration = 500;
      if (Math.abs(this.touch.xShift - this.touch.xShiftPrev) > 20) {
        animateType = 'easeOutQuart';
        duration = 1000;
      }
      animate({
        initial: this.touch.xShift,
        duration: duration,
        target: targetPosition === '100%' ? this.touch.el.clientWidth : 0,
        draw: progress => {
          if (this.touch.el) {
            _.extend(this.touch.el.style, {
              left: progress + 'px'
            });
          }
        },
        type: animateType,
        finish: cb
      });
    }
  };
  componentWillUnmount = () => {
    clearTimeout(this.updateTimer);
  };
  componentDidMount = () => {
    this.curTimeAgo = timeAgo(this.props.date_created);
    this.updateTimeAgo();
  };
  render = () => {
    var props = this.props,
      cl = 'jl_item';

    if (props.watched) {
      cl += ' watched_job';
    } else if (props.selected) {
      cl += ' selected';
    }

    return (
      <ReactCSSTransitionGroup transitionName="listitem" transitionEnter={false} component="div" transitionEnterTimeout={300} transitionLeaveTimeout={300}>
        {!props.hidden ?
          <div className={cl}>
            <div className="jl_item_cont">
              {props.is_new && <div className="jli_new">new</div>}
              <a className="jl_link">{props.title}</a>
              <div className="jli_params">
                <strong>{props.job_type} - </strong>
                {props.duration && <span>Est. Time: {props.duration} - </span>}
                {props.budget && <span>Est. Budget: {props.budget} - </span>}
                Posted: <span ref="date_created">{timeAgo(props.date_created)}</span>
              </div>
              <Skills items={props.skills} />
              <div className="blocker" onMouseDown={this.touchStartHandler} onMouseMove={this.touchMoveHandler} onMouseUp={this.touchEndHandler} onMouseOut={this.touchEndHandler}></div>
            </div>
            <Icon name="trash" className="jl_trash_i" />
          </div>
          : null
        }
      </ReactCSSTransitionGroup>
    );
  }
}

export default ListItem;