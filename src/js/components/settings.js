'use strict';

import * as Page from 'components/page';
import * as settings from 'modules/settings';

var formInit = function() {
  var formEl = $('#settings'),
    needToUpdateCache;
  formEl.on('submit', e => {
    needToUpdateCache = false;
    e.preventDefault();
    var sData = settings.get(),
      formField, fieldVal;
    _.each(sData, (item, key) => {
      formField = $('#' + key);
      fieldVal = formField.val();
      if (formField.attr('type') === 'number') {
        fieldVal = parseInt(fieldVal, 10);
      }
      if (formField.attr('type') === 'checkbox') {
        fieldVal = formField.is(':checked');
      }
      if (item.search && item.value !== fieldVal) {
        needToUpdateCache = true;
      }
      _.extend(sData[key], {
        value: fieldVal
      });
    });
    settings.set(sData);
    GlobalEvents.settingsSaved(needToUpdateCache);
  });
};

var init = function() {
  $('#notifyDisabled').on('change', function() {
    var target = $(this);
    $('#notifyInterval').prop('disabled', target.is(':checked'));
  });
  formInit();
};

var show = function() {
  var sData = settings.get(),
    formField;
  _.each(sData, (item, key) => {
    formField = $('#' + key);
    if (formField.attr('type') === 'checkbox') {
      formField.prop('checked', item.value);
    } else {
      formField.val(item.value);
    }
  });
  $('#notifyInterval').prop('disabled', sData.notifyDisabled.value);
};


// ----------------
// public methods
// ----------------

var pInit = function() {
  init();
};

var pShow = function() {
  show();
};

// ---------
// interface
// ---------

export {
  pInit as init,
  pShow as show
};
