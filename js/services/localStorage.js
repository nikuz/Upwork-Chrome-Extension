'use strict';

import * as _ from 'underscore';

// ----------------
// public methods
// ----------------

var pGet = name => {
  var data = localStorage[name];
  try {
    data = JSON.parse(data);
  } catch (e){}

  return data;
};

var pSet = (name, data) => {
  localStorage[name] = _.isObject(data) ? JSON.stringify(data) : data;
};
var pCheck = name => {
  return !!localStorage[name];
};
var pClear = name => {
  delete localStorage[name];
};


// ---------
// interface
// ---------

export {
  pGet as get,
  pSet as set,
  pCheck as check,
  pClear as clear,
};

