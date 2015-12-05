'use strict';

// ----------------
// public methods
// ----------------

var pParallel = function(stack, callback) {
  var i = 0, j = 0, l = stack.length,
    result = [], error;

  if (l) {
    for(; i < l; i += 1){
      (function(item) {
        stack[i](function(err, data) {
          j += 1;
          if (err) {
            callback(err);
            error = true;
          } else {
            result[item] = data;
          }
          if (j === l && !error) {
            callback(null, result);
          }
        });
      })(i);
    }
  } else {
    callback(null, []);
  }
};

var pSeries = function(stack, callback) {
  var i = 0, l = stack.length,
    loop = function() {
      stack[i](function(err) {
        i += 1;
        if (err) {
          callback(err);
        } else {
          if (i === l) {
            callback(null);
          } else {
            loop();
          }
        }
      });
    };

  if (l) {
    loop();
  } else {
    callback(null);
  }
};

// ---------
// interface
// ---------

export {
  pParallel as parallel,
  pSeries as series
};
