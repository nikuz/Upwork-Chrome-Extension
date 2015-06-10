'use strict';

import * as $ from 'jquery';
import * as _ from 'underscore';
import * as Page from 'components/page';
import * as settings from 'modules/settings';

var formInit = () => {
  var formEl = $('#settings');
  formEl.on('submit', e => {
    e.preventDefault();
    var sData = settings.get(),
      formField, fieldVal;
    _.each(sData, (value, key) => {
      formField = $('#' + key);
      fieldVal = formField.val();
      if (formField.attr('type') === 'number') {
        fieldVal = parseInt(fieldVal, 10);
      }
      sData[key] = fieldVal;
    });
    settings.set(sData);
    GlobalEvents.settingsSaved();
  });
};

var initialized;
var init = () => {
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
