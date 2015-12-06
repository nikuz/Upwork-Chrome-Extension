'use strict';

import * as _ from 'underscore';
import * as config from '../config';
import * as storage from 'modules/storage';
import * as OAuth from 'modules/oauth';
import * as constants from 'modules/constants';
import * as async from 'utils/async';
import * as ajax from 'utils/ajax';
import Promise from 'utils/promise';

var noop = function() {};
var oauth;

var init = function(callback) {
  if (!oauth) {
    oauth = OAuth.init({
      consumer: {
        public: config.UPWORK_key,
        secret: config.UPWORK_secret
      }
    });
  }
  callback();
};

var flushAccess = function() {
  var accessFields = [
    'token',
    'token_secret',
    'verifier',
    'access',
    'token_time'
  ];
  _.each(accessFields, function(item) {
    storage.clear(item);
  });
};

var getToken = function(callback) {
  var cb = callback,
    token = storage.get('token'),
    token_secret = storage.get('token_secret'),
    verifier = storage.get('verifier'),
    access = storage.get('access'),
    token_time = Number(storage.get('token_time'));

  if (token && token_secret && ((verifier && access) || (Date.now() - token_time) / 1000 / 60 < 4)) { // less than 4 min
    cb();
  } else {
    flushAccess();
    request({
      url: config.UPWORK_token_url,
      method: 'POST',
      data: {
        oauth_callback: chrome.runtime.getURL(config.verifier_page)
      }
    }, (err, response) => {
      if (err) {
        cb(err);
      } else {
        response = oauth.deParam(response);
        if (!response.oauth_token || !response.oauth_token_secret) {
          cb('Can\'t get Upwork token');
        } else {
          storage.set('token_time', Date.now());
          storage.set('token', response.oauth_token);
          storage.set('token_secret', response.oauth_token_secret);
          cb();
        }
      }
    });
  }
};

var getVerifier = function(callback) {
  var cb = callback,
    verifier = storage.get('verifier');

  if (verifier) {
    cb(null, verifier);
  } else {
    chrome.tabs.create({
      url: chrome.runtime.getURL(config.verifier_page + '?request=1')
    });
    cb();
  }
};

var getAccess = function(callback) {
  var cb = callback,
    access = storage.get('access');

  if (access) {
    cb();
  } else {
    request({
      url: config.UPWORK_access_url,
      method: 'POST',
      data: {
        oauth_token: storage.get('token'),
        oauth_verifier: storage.get('verifier')
      }
    }, (err, response) => {
      if (err) {
        cb(err);
      } else {
        response = oauth.deParam(response);
        if (!response.oauth_token || !response.oauth_token_secret) {
          cb('Can\'t get Upwork access');
        } else {
          storage.set('access', response.oauth_token);
          storage.set('token', response.oauth_token);
          storage.set('token_secret', response.oauth_token_secret);
          cb();
        }
      }
    });
  }
};

var errorWithCredentials = 0;
var request = function(options, callback) {
  var opts = options || {},
    cb = callback,
    url = opts.url,
    method = opts.method || 'GET',
    promise = opts.promise;

  var validateParams = function() {
    if (!url) {
      cb(constants.get('REQUIRED', 'url'));
    } else {
      makeRequest();
    }
  };

  var makeRequest = function() {
    var token = storage.get('token'),
      request = ajax.get,
      request_data = {
        url: config.UPWORK_url + url,
        method: method,
        data: _.extend(opts.data || {}, token && {oauth_token: token})
      },
      request_obj = {
        url: config.UPWORK_url + url,
        dataType: opts.dataType || 'text',
        success: data => {
          cb(null, data);
        },
        error: (jqXHR, textStatus) => {
          cb(textStatus);
        }
      };

    if (method === 'POST') {
      request = ajax.post;
    }
    request_data = oauth.authorize(request_data, {
      secret: storage.get('token_secret')
    });
    request_obj.data = request_data;
    request = request(request_obj);
    if (promise) {
      promise.catch(function() {
        request.abort();
        cb();
      });
    }
  };

  validateParams();
};

// ----------------
// public methods
// ----------------

var pRequest = function(options, callback) {
  var cb = callback || noop,
    result = {},
    promise = new Promise();

  options.promise = promise;

  async.series([
    function(internalCallback) {
      init(internalCallback);
    },
    function(internalCallback) {
      getToken(internalCallback);
    },
    function(internalCallback) {
      getVerifier(function(err, verifier) {
        if (err) {
          internalCallback(err);
        } else if (!verifier) {
          internalCallback('go_to_verifier');
        } else {
          internalCallback();
        }
      });
    },
    function(internalCallback) {
      getAccess(internalCallback);
    },
    function(internalCallback) {
      request(options, function(err, response) {
        if (err) {
          internalCallback(err);
        } else {
          result = response;
          internalCallback();
        }
      });
    }
  ], function(err) {
    if (err) {
      if (err === 'go_to_verifier') {
        cb(null, null);
      } else {
        cb(err);
        //Raven.captureException(err);
        var access = storage.get('access');
        if (access) {
          errorWithCredentials += 1;
        }
        if (!access || errorWithCredentials === 2) {
          errorWithCredentials = 0;
          flushAccess();
        }
      }
    } else if (!promise.rejected) {
      cb(null, result);
    }
  });
  return promise;
};

// ---------
// interface
// ---------

export {
  pRequest as request
};
