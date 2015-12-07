'use strict';

import * as React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import * as EventManager from 'modules/events';

import './style';

class Sharing extends React.Component {
  state = {
    isHide: true
  };
  handlerClick = () => {
    this.setState({isHide: true});
  };
  show = (options) => {
    var opts = options || {};
    this.setState({
      isHide: false,
      subject: opts.subject,
      text: opts.text,
      link: opts.link
    });
  };
  hide = () => {
    this.setState({
      isHide: true
    });
  };
  componentDidMount() {
    EventManager.on('jobItemShare', this.show);
    EventManager.on('btnShareCloseClicked', this.hide);
  };
  componentWillUnmount = () => {
    EventManager.off('jobItemShare', this.show);
    EventManager.off('btnShareCloseClicked', this.hide);
  };
  render() {
    var state = this.state,
      jobSubject = state.subject,
      jobUrl = encodeURIComponent(state.link),
      jobText = state.text;

    return (
      <ReactCSSTransitionGroup transitionName="sharing" onClick={this.handlerClick} transitionEnterTimeout={300} transitionLeaveTimeout={300} component="div">
        {!this.state.isHide ?
          <div className="sharingTooltip">
            <a href={`https://www.facebook.com/sharer.php?u=${jobUrl}&t=${jobSubject}`} target="_blank" className="sharing-icon si-facebook" title="Facebook" />
            <a href={`https://plus.google.com/share?url=${jobUrl}`} className="sharing-icon si-google" target="_blank" title="Google+" />
            <a href={`https://twitter.com/intent/tweet?url=${jobUrl}&text=${jobSubject}`} className="sharing-icon si-twitter" target="_blank" title="Twitter" />
            <a href={`https://www.linkedin.com/shareArticle?url=${jobUrl}&mini=true&title=${jobSubject}&summary=${jobText}`} className="sharing-icon si-linkedin" target="_blank" title="Linkedin" />
          </div>
          : null
        }
      </ReactCSSTransitionGroup>
    );
  }
}

export default Sharing;