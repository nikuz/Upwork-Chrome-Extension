'use strict';

import * as $ from 'jquery';
import * as _ from 'underscore';
import * as Page from 'components/page';
import * as settings from 'modules/settings';

var formInit = () => {
  var formEl = $('#settings');
  formEl.on('submit', e => {
    e.preventDefault();
    var sData = settings.get();
    _.each(sData, (value, key) => {
      sData[key] = $('#' + key).val();
    });
    settings.set(sData);
    Page.remove('settings');
  });
};

var initialized;
var init = () => {
  Page.set('settings');
  if (initialized) {
    return;
  }
  initialized = true;
  var sData = settings.get();
  _.each(sData, (value, key) => {
    $('#' + key).val(value);
  });
  formInit();
};

GlobalEvents.settingsInit.listen(() => {
  init();
});
