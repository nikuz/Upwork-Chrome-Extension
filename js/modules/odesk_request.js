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
    query = opts.query,
    start = opts.start,
    end = opts.end,
    s = settings.get();

  odesk.request({
    url: config.API_jobs_url,
    dataType: 'json',
    data: {
      q: query,
      budget: '[' + s.budgetFrom + ' TO ' + s.budgetTo + ']',
      days_posted: s.daysPosted,
      duration: fieldPrepare(s.duration),
      job_type: fieldPrepare(s.jobType),
      workload: fieldPrepare(s.workload),
      paging: start + ';' + end
    }
  }, (err, response) => {
    if (err) {
      cb(err);
    } else {
      cb(null, response);
    }
  });
};

// ---------
// interface
// ---------

export {
  pRequest as request
};
