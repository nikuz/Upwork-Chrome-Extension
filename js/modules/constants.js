'use strict';

var dictionary = {
  REQUIRED: '`%s` parameter is required'
};

// ----------------
// public functions
// ----------------

var pGet = (entry, vars) => {
  return dictionary[entry].replace('`%s`', vars);
};

// ---------
// interface
// ---------

export {
  pGet as get
};

