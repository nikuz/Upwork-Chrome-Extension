'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'underscore';
import * as EventManager from 'modules/events';
import * as config from '../../config';
import * as settings from 'modules/settings';
import * as request from 'modules/request';
import Item from 'components/settings/item/code';

import './style';

class Settings extends React.Component {
  handlerListSelect = (options) => {
    var opts = options || {};
    var wrapper = ReactDOM.findDOMNode(this),
      cl = 'some_sgi_opened';

    if (_.contains(opts.sgi.classList, 'sgi_opened')) {
      wrapper.classList.add(cl);
    } else {
      wrapper.classList.remove(cl);
    }
  };
  getCategoriesHandler = (callback) => {
    var cb = callback || _.noop,
      sData = settings.get();

    if (!sData.category2.values.length) {
      request.get({
        url: config.UPWORK_jobs_categories
      }, (err, response) => {
        if (err) {
          cb(err);
          //Raven.captureException(err);
        } else if (!response) {
          cb(null, null);
        } else {
          var categories = _.pluck(response.categories, 'title');
          categories.unshift('All');
          _.each(categories, item => {
            let category = {};
            category[item] = item;
            sData.category2.values.push(category);
            this.tmpSettings.category2.values.push(category);
          });
          settings.set(sData);
          cb(null, sData.category2.values);
        }
      });
    }
  };
  tmpSettings = {};
  handlerChange = (values) => {
    //console.log('Some temp settings changed');
    _.each(values, item => {
      this.tmpSettings[item.name].value = item.value;
    });
  };
  componentDidMount = () => {
    this.tmpSettings = settings.get();
    EventManager.on('stngListSelected', this.handlerListSelect);
  };
  componentWillUnmount = () => {
    var cur_settings = settings.get(),
      needToUpdateCache = false,
      changed = false;

    _.each(cur_settings, (item, key) => {
      if (item.value !== this.tmpSettings[key].value) {
        if (item.search) {
          needToUpdateCache = true;
        }
        changed = true;
      }
    });
    if (changed) {
      settings.set(this.tmpSettings);
    }
    if (changed || needToUpdateCache) {
      EventManager.trigger('settingsSaved', {
        changed,
        needToUpdateCache
      });
    }
    this.tmpSettings = {};
    EventManager.off('stngListSelected', this.handlerListSelect);
  };
  render() {
    var sData = settings.get(),
      budgetValueText = sData.budgetFrom.value + '$ - ' + sData.budgetTo.value + '$',
      dndValueText = sData.dndFrom.value + ' - ' + sData.dndTo.value;

    return (
      <div id="settings">
        <Item
          handler={this.handlerChange}
          title="Category"
          type="list"
          name="category2"
          value={sData.category2.value}
          values={sData.category2.values}
          handlerOpen={this.getCategoriesHandler}
        />
        <Item
          handler={this.handlerChange}
          title="Budget"
          type="slider"
          name="budget"
          value={sData.budgetFrom.value}
          values={sData.budgetFrom.values}
          valueText={budgetValueText}
          from={sData.budgetFrom.value}
          to={sData.budgetTo.value}
        />
        <Item
          handler={this.handlerChange}
          title="Job type"
          type="list"
          name="jobType"
          value={sData.jobType.value}
          values={sData.jobType.values}
        />
        <Item
          handler={this.handlerChange}
          title="Duration"
          type="list"
          name="duration"
          value={sData.duration.value}
          values={sData.duration.values}
        />
        <Item
          handler={this.handlerChange}
          title="Workload"
          type="list"
          name="workload"
          value={sData.workload.value}
          values={sData.workload.values}
        />
        <Item
          handler={this.handlerChange}
          title="Allow notifications"
          type="switcher"
          relations="notifications"
          name="notifyAllow"
          checked={sData.notifyAllow.value}
        />
        <Item
          handler={this.handlerChange}
          title="Notify every"
          type="list"
          relations="notifications"
          name="notifyInterval"
          value={sData.notifyInterval.value}
          values={sData.notifyInterval.values}
          disable={!sData.notifyAllow.value}
        />
        <Item
          handler={this.handlerChange}
          title="Do not disturb"
          type="time"
          relations="notifications"
          name="dnd"
          value={sData.dndFrom.value}
          values={sData.dndFrom.values}
          from={sData.dndFrom.value}
          to={sData.dndTo.value}
          valueText={dndValueText}
          disable={!sData.notifyAllow.value}
        />
        <Item
          handler={this.handlerChange}
          title="Preview in extension"
          type="switcher"
          name="preview"
          descr="See the job description directly in extension"
          checked={sData.preview.value}
        />
      </div>
    );
  }
}

export default Settings;