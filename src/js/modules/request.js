'use strict';

import * as _ from 'underscore';
import * as config from 'config';
import * as storage from 'modules/storage';
import * as settings from 'modules/settings';
import * as ajax from 'utils/ajax';
import * as upwork from 'modules/upwork';
import Promise from 'utils/promise';

var noop = function() {};

// ----------------
// public methods
// ----------------

var pGet = function(options, callback) {
  var opts = options,
    cb = callback,
    s = settings.get(),
    useProxy = s.useProxy.value,
    request,
    requestBody = {
      url: opts.url,
      dataType: 'json'
    };

  if (opts.data) {
    requestBody.data = opts.data;
  }

  if (useProxy) {
    _.extend(requestBody, {
      url: config.API_url + opts.url,
      success: data => {
        cb(null, data);
      },
      error: (jqXHR, textStatus) => {
        cb(textStatus);
        //Raven.captureException(textStatus);
      }
    });
    request = ajax.get(requestBody);
  } else {
    request = upwork.request(requestBody, (err, response) => {
      if (err) {
        cb(err);
      } else {
        cb(null, response);
      }
    });
  }

  return new Promise(_.noop, function() {
    if (request instanceof XMLHttpRequest) {
      request.abort();
    } else {
      request.reject();
    }
  });
};

// ---------
// interface
// ---------

export {
  pGet as get
};
