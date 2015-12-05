'use strict';

import * as config from 'config';
import * as settings from 'modules/settings';
import * as odesk from 'modules/odesk';

var noop = function() {};

var fieldPrepare = function(field) {
  field = field.toLocaleLowerCase().replace(' ', '_');
  return field === 'all' ? '' : field;
};

// ----------------
// public methods
// ----------------

var pRequest = function(options, callback) {
  var opts = options,
    cb = callback,
    s = settings.get(),
    useProxy = s.useProxy.value,
    requestBody = {
      url: config.API_jobs_url,
      dataType: 'json',
      data: {
        q: opts.query,
        budget: '[' + s.budgetFrom.value + ' TO ' + s.budgetTo.value + ']',
        days_posted: s.daysPosted.value,
        duration: fieldPrepare(s.duration.value),
        job_type: fieldPrepare(s.jobType.value),
        workload: fieldPrepare(s.workload.value),
        paging: opts.start + ';' + opts.end
      }
    };

  if (useProxy) {
    _.extend(requestBody, {
      url: config.PROXY_url + config.PROXY_jobs_url,
      success: data => {
        cb(null, data);
      },
      error: (jqXHR, textStatus) => {
        cb(textStatus);
      }
    });
    $.ajax(requestBody);
  } else {
    odesk.request(requestBody, (err, response) => {
      if (err) {
        cb(err);
      } else {
        cb(null, response);
      }
    });
  }
};

// ---------
// interface
// ---------

export {
  pRequest as request
};
