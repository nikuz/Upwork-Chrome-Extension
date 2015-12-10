'use strict';

import * as upwork from 'modules/upwork';
import * as EventManager from 'modules/events';

// ----------------
// public methods
// ----------------

var pGet = function(options, callback) {
  var opts = options,
    cb = callback,
    requestBody = {
      url: opts.url,
      dataType: 'json'
    };

  if (navigator.onLine) {
    if (opts.data) {
      requestBody.data = opts.data;
    }

    upwork.request(requestBody, (err, response) => {
      if (err) {
        cb(err);
      } else {
        cb(null, response);
      }
    });
    return 'request emitted';
  } else {
    EventManager.trigger('inboxError');
    cb(null, null);
  }
};

// ---------
// interface
// ---------

export {
  pGet as get
};
