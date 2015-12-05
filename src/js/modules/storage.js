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
  if (data instanceof Date) {
    data = data.toString();
  } else if (data instanceof Object) {
    data = JSON.stringify(data);
  }
  localStorage[name] = data;
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

