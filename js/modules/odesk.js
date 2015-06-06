'use strict';

import * as config from 'config';
import * as Reflux from 'reflux';
import * as $ from 'jquery';
import * as _ from 'underscore';
import * as async from 'async';
import * as storage from 'services/localStorage';
import * as OAuth from 'modules/oauth';
import * as constants from 'modules/constants';

var noop = () => {};
var oauth;

var storeResponse = (name, targetName, data) => {
  var set = (name, value) => {
    value = 'oauth_' + value;
    if(data[value]){
      storage.set(name, data[value]);
    }
  };
  if(!data){
    data = targetName;
    targetName = name;
  }
  data = oauth.deParam(data);
  if(_.isArray(name)){
    _.each(name, (val, key) => {
      set(targetName[key], name[key]);
    });
  } else {
    set(targetName, name);
  }
};

var init = callback => {
  if (!oauth) {
    oauth = OAuth.init({
      consumer: {
        'public': config.key,
        'secret': config.secret
      }
    });
  }
  callback();
};

var getToken = callback => {
  var cb = callback,
    token = storage.get('token'),
    token_secret = storage.get('token_secret');

  if (token && token_secret) {
    cb();
  } else {
    request({
      url: '/api/auth/v1/oauth/token/request',
      method: 'POST',
      data: {
        'oauth_callback': chrome.runtime.getURL(config.verifierPage)
      }
    }, (err, response) => {
      if (err) {
        cb(err);
      } else {
        storeResponse(['token', 'token_secret'], response);
        cb();
      }
    });
  }
};

var getVerifier = callback => {
  var cb = callback,
    verifier = storage.get('verifier');

  if (verifier) {
    cb(null, verifier);
  } else {
    chrome.tabs.create({
      'url': chrome.runtime.getURL(config.verifierPage + '?request=1')
    });
    cb();
  }
};

var getAccess = callback => {
  var cb = callback,
    access = storage.get('access');

  if (access) {
    cb();
  } else {
    request({
      url: '/api/auth/v1/oauth/token/access',
      method: 'POST',
      data: {
        oauth_token: storage.get('token'),
        oauth_verifier: storage.get('verifier')
      }
    }, (err, response) => {
      if (err) {
        cb(err);
      } else {
        storeResponse(['token', 'token_secret'], response);
        storeResponse('token', 'access', response);
        cb();
      }
    });
  }
};

var request = (options, callback) => {
  var opts = options,
    cb = callback,
    url = opts.url,
    method = opts.method || 'GET',
    actions = Reflux.createActions([
      'validateParams',
      'makeRequest'
    ]);

  actions.validateParams.listen(() => {
    var errors = [];
    if (!url) {
      errors.push(constants.get('REQUIRED', 'url'));
    }
    if (errors.length) {
      cb(errors);
    } else {
      actions.makeRequest();
    }
  });

  actions.makeRequest.listen(() => {
    var token = storage.get('token'),
      request_data = {
        url: config.APIURL + url,
        method: method,
        data: _.extend(opts.data || {}, token && {'oauth_token': token})
      };

    $.ajax({
      url: config.APIURL + url,
      method: method,
      dataType: opts.dataType || 'text',
      data: oauth.authorize(request_data, {
        'secret': storage.get('token_secret')
      }),
      success: data => {
        cb(null, data);
      },
      error: (jqXHR, textStatus) => {
        cb(textStatus);
      }
    });
  });

  actions.validateParams();
};

// ----------------
// public functions
// ----------------

var pRequest = (options, callback) => {
  var opts = options || {},
    cb = callback || noop,
    result;

  async.series([
    internalCallback => {
      init(internalCallback);
    },
    internalCallback => {
      getToken(internalCallback);
    },
    internalCallback => {
      getVerifier((err, response) => {
        internalCallback(err ? err : !response);
      });
    },
    internalCallback => {
      getAccess(internalCallback);
    },
    internalCallback => {
      request(opts, (err, response) => {
        result = response;
        internalCallback(err);
      });
    }
  ], err => {
    if (err) {
      cb(err);
    } else {
      cb(null, result);
    }
  });
};

pRequest({
  url: '/api/profiles/v2/search/jobs.json',
  dataType: 'json',
  data: {
    q: 'javascript'
  }
}, (err, response) => {
  console.log(err);
  console.log(response);
});

// ---------
// interface
// ---------

export {
  pRequest as request
};
