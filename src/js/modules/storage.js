'use strict';

// ----------------
// public methods
// ----------------

var pGet = function(name) {
  var data;
  if (name) {
    data = localStorage[name];
    try {
      data = JSON.parse(data);
    } catch (e) {}
  } else {
    data = localStorage;
  }
  return data;
};

var pSet = function(name, data) {
  localStorage[name] = typeof data === 'object' ? JSON.stringify(data) : data;
};
var pCheck = function(name) {
  return !!localStorage[name];
};
var pClear = function(name) {
  delete localStorage[name];
};


// ---------
// interface
// ---------

export {
  pGet as get,
  pSet as set,
  pCheck as check,
  pClear as clear
};

