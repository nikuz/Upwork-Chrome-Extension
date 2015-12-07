'use strict';

import * as React from 'react';
import * as _ from 'underscore';
import * as EventManager from 'modules/events';
import * as config from '../../config';
import * as request from 'modules/request';
import Skills from 'components/skills/code';
import Manager from 'components/manager/code';
import Icon from 'react-fa';
import timeAgo from 'utils/timeAgo';
import Linkify from 'linkify';

import './style';

class jobItem extends React.Component {
  state = {
    itemData: null,
    showFeedback: null
  };
  updateTimeAgo = () => {
    var newTimeAgo = timeAgo(this.props.date_created);
    if (newTimeAgo !== this.curTimeAgo) {
      this.curTimeAgo = newTimeAgo;
      let item = this.refs.date_created.getDOMNode();
      item.innerHTML = newTimeAgo;
      this.updateTimer = setTimeout(this.updateTimeAgo, 6e4 - new Date().getSeconds() * 1000);
    }
  };
  handlerFeedbackClick = () => {
    this.setState({
      showFeedback: true
    });
  };
  handlerApplyClick = () => {
    window.open(config.UPWORK_url + '/job/' + this.props.id + '/apply', '_system');
  };
  parseJobData = (data) => {
    var assignments = [],
      feedback,
      timezone,
      result;

    if (data.assignments && data.assignments.assignment) {
      _.each(data.assignments.assignment, item => {
        if (item.feedback && item.feedback.score) {
          item.feedback.score = Number(item.feedback.score).toFixed(1);
          assignments.push(item);
        }
      });
    }
    feedback = Number(data.buyer.op_adjusted_score).toFixed(1);
    if (data.buyer.op_timezone) {
      timezone = data.buyer.op_timezone.replace(/^(UTC(?:.\d+\:\d+)?).*$/, '$1');
    }

    result = _.extend({}, this.props, {
      extended: true,
      description: Linkify(_.escape(data.op_description)),
      applicants: data.op_tot_cand,
      interviewing: data.interviewees_total_active,
      feedback: feedback > 0,
      adjusted_score: feedback,
      feedback_ppl: assignments.length || null,
      payment_verified: Number(data.op_cny_upm_verified) > 0,
      engagement_weeks: data.engagement_weeks,
      op_engagement: data.op_engagement,
      buyer: data.buyer,
      buyer_timezone: timezone,
      assignments: assignments,
      total_charge: parseInt(data.buyer.op_tot_charge, 10),
      total_hours: parseInt(data.buyer.op_tot_hours, 10)
    });
    this.setState({
      itemData: result
    });
  };
  requestJobData = () => {
    this.request = request.get({
      url: config.UPWORK_job_url.replace('{id}', this.props.id)
    }, (err, response) => {
      if (err) {
        EventManager.trigger('inboxError');
      } else {
        this.request = null;
        this.parseJobData(response.profile);
      }
    });
  };
  managerEventsHandler = (e) => {
    var targetFolder = 'trash';
    if (e.name === 'btnFavoritesClicked') {
      targetFolder = 'favorites';
    }
    EventManager.trigger('jobHasFolderChanged', {
      id: this.props.id,
      folder: targetFolder
    });
    EventManager.trigger('jobItemHide');
  };
  shareEventsHandler = () => {
    var props = this.props;
    EventManager.trigger('jobItemShare', {
      subject: props.title,
      text: props.title + '\n\n' + props.url,
      link: props.url
    });
  };
  handlerDescriptionClick = (e) => {
    e.preventDefault();
    var target = e.target;
    if (target.tagName === 'A') {
      window.open(target.href, '_system');
    }
  };
  handlerUpdateAfterError = () => {
    this.requestJobData();
  };
  handlerBackBtn() {
    EventManager.trigger('jobItemHide');
  }
  componentDidMount = () => {
    this.requestJobData();
    this.curTimeAgo = timeAgo(this.props.date_created);
    this.updateTimeAgo();
    EventManager.on('btnFavoritesClicked btnTrashClicked', this.managerEventsHandler);
    EventManager.on('btnShareClicked', this.shareEventsHandler);
    EventManager.on('updatedAfterError', this.handlerUpdateAfterError);
    EventManager.on('btnBackClicked', this.handlerBackBtn);
  };
  componentWillUnmount = () => {
    if (this.request) {
      this.request.reject(); // request - it's promise instance
    }
    clearTimeout(this.updateTimer);
    EventManager.off('btnFavoritesClicked btnTrashClicked', this.managerEventsHandler);
    EventManager.off('btnShareClicked', this.shareEventsHandler);
    EventManager.off('updatedAfterError', this.handlerUpdateAfterError);
  };
  render = () => {
    var data = this.state.itemData || this.props;
    return (
      <div>
        <div id="job_menu">
          <Manager favorites trash share back />
        </div>
        <div id="job_description">
          <h1>{data.title}</h1>
          <strong className="jd_s">{data.job_type}</strong> - <span className="jd_s jd_sg">Posted <span ref="date_created">{timeAgo(data.date_created)}</span></span>
          <button id="jd_apply" onClick={this.handlerApplyClick}>
            Apply to this job &nbsp;<Icon name="external-link" />
          </button>
          <div className="fl_r jd_column">
            Client Feedback
            {data.extended ?
              <div className="jd_b">
                {data.feedback_ppl ?
                  <span>{data.adjusted_score} &nbsp; ({data.feedback_ppl} reviews)</span> :
                  <span>No Feedback</span>
                }
              </div>
              : null
            }
          </div>
          <div className="jd_column">
            Budget
            <div className="jd_b">${data.budget || ' - '}</div>
          </div>
          <div className="fl_r jd_column">
            Interviewing
            <div className="jd_b">{data.interviewing}</div>
          </div>
          <div className="jd_column">
            Applicants:
            <div className="jd_b">{data.applicants}</div>
          </div>
          <div id="jd_descr">
            {data.description ?
              <div onClick={this.handlerDescriptionClick}>
                <p dangerouslySetInnerHTML={{__html: data.description}} />
              </div> :
              <div className="jbd_loader">
                <Icon spin name="refresh" />
              </div>
            }
          </div>
          <Skills items={data.skills} />
          {data.engagement_weeks ?
            <div className="jd_edur">
              <h3>Estimated Duration</h3>
              <div className="jd_b">
                {data.engagement_weeks}
              </div>
              <div className="jd_s">{data.op_engagement}</div>
            </div>
            : null
          }
          <h2>Client</h2>
          <div className="jd_b">
            {data.buyer && data.buyer.op_country} {data.buyer_timezone ? <span>({data.buyer_timezone})</span> : null}
          </div>
          <div className="jd_s jd_sg">Member since {data.buyer && data.buyer.op_contract_date}</div>
          <div className="jd_cl_three">
            <div className="jd_s jd_sg">Total Spent</div>
            <div className="jd_b">${data.total_charge}</div>
          </div>
          <div className="jd_cl_three">
            <div className="jd_s jd_sg">Hours Billed</div>
            <div className="jd_b">{data.total_hours}</div>
          </div>
          <div className="jd_cl_three">
            <div className="jd_s jd_sg">Paid Contracts</div>
            <div className="jd_b">{data.buyer && data.buyer.op_tot_asgs}</div>
          </div>
          <dl className="jd_list">
            <dt>Payment method</dt>&nbsp;
            {data.extended ?
              <dd className="jd_b">
                {data.payment_verified ? <span>Verified</span> : <span>Unverified</span>}
              </dd>
              : null
            }
          </dl>
          {data.feedback_ppl ?
            <div>
              {!this.state.showFeedback ?
                <button className="btn_gray" id="get_feedback" onClick={this.handlerFeedbackClick}>View all feedback</button> :
                <ul className="jd_fl">
                  {data.assignments.map((item, key) => {
                    return (
                      <li key={key}>
                        {item.feedback ? <span className="fl_r jd_b jd_ascore">{item.feedback.score}</span> : null}
                        <div className="jd_fttl">{item.as_engagement_title}</div>
                        {item.as_from} - {item.as_to}
                        <p className="jd_fc">{item.comment}</p>
                      </li>
                    );
                  })}
                </ul>
              }
            </div>
            : null
          }
        </div>
      </div>
    );
  }
}

export default jobItem;