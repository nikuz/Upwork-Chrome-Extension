'use strict';

import * as _ from 'underscore';

var addParamsMarker = function(rUrl){
  return (/\?/.test(rUrl) ? '&' : '?');
};

var paramsSerialise = function(data){
  var dataString = '';
  _.each(data, (value, key) => {
    if(_.isArray(value)){
      _.each(value, item => {
        dataString += `${key}[]=${encodeURIComponent(item)}&`;
      });
    } else {
      dataString += `${key}=${encodeURIComponent(value)}&`;
    }
  });
  return dataString.replace(/&$/, '');
};

var ajax = function(options) {
  var opts = options || {},
    request = new XMLHttpRequest,
    success = opts.success || _.noop,
    error = opts.error || _.noop,
    rType = opts.type,
    rUrl = opts.url,
    dataString = null;

  if(opts.cache === false){
    rUrl += `${addParamsMarker(rUrl)}t=${Date.now()}`;
  }
  if(rType === 'GET' && opts.data){
    rUrl += addParamsMarker(rUrl) + paramsSerialise(opts.data);
  }

  request.open(rType, rUrl, true);

  if(opts.data && rType === 'POST'){
    request.setRequestHeader('content-type', 'application/x-www-form-urlencoded; charset=utf-8');
    dataString = paramsSerialise(opts.data);
  }

  request.onload = function(){
    var response = request.responseText;
    if(request.status >= 200 && request.status < 400){
      if(opts.dataType === 'json'){
        response = JSON.parse(response);
      }
      success(response);
    } else {
      error(request.status);
    }
  };

  request.onerror = function(response){
    error(response);
  };

  request.send(dataString || null);
  return request;
};

// ----------------
// public methods
// ----------------

var pGet = function(options) {
  return ajax(_.extend(options, {
    type: 'GET'
  }));
};

var pPost = function(options) {
  return ajax(_.extend(options, {
    type: 'POST'
  }));
};

// ---------
// interface
// ---------

export {
  pGet as get,
  pPost as post
};
