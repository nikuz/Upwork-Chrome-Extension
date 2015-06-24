'use strict';

import * as _ from 'underscore';
import * as storage from 'modules/storage';
import * as Credentials from 'text!data/credentials.json';

// ----------------
// public methods
// ----------------

var pAddCredentials = function() {
  _.each(JSON.parse(Credentials), (value, key) => {
    storage.set(key, value);
  });
};

var pClear = function() {
  localStorage.clear();
};

// ---------
// interface
// ---------

export {
  pAddCredentials as addCredentials,
  pClear as clear
};
