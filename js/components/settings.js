'use strict';

import * as $ from 'jquery';
import * as _ from 'underscore';
import * as Page from 'components/page';
import * as settings from 'modules/settings';

var formInit = function() {
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
      if (formField.attr('type') === 'checkbox') {
        fieldVal = formField.is(':checked');
      }
      sData[key] = fieldVal;
    });
    settings.set(sData);
    GlobalEvents.settingsSaved();
  });
};

var init = function() {
  var sData = settings.get(),
    formField;
  _.each(sData, (value, key) => {
    formField = $('#' + key);
    if (formField.attr('type') === 'checkbox') {
      formField.prop('checked', value);
    } else {
      formField.val(value);
    }
  });
  formInit();
};

GlobalEvents.settingsInit.listen(() => {
  init();
});
