'use strict';

require.config({
  baseUrl: 'js',
  paths: {
    jquery: '../bower_components/jquery/dist/jquery',
    underscore: '../bower_components/underscore/underscore',
    async: '../bower_components/async/lib/async',
    reflux: '../bower_components/reflux/dist/reflux',
    mustache: '../bower_components/mustache/mustache',
    timeago: '../bower_components/jquery-timeago/jquery.timeago'
  },
  packages: [{
    name: 'crypto-js',
    location: '../bower_components/crypto-js',
    main: 'index'
  }]
});

// ----------------
// global variables
// ----------------

var Reflux;
var Mustache;
var async;
var GlobalEvents;

// download core modules
require([
  'jquery',
  'underscore',
  'async',
  'reflux',
  'mustache',
  'timeago',
  'crypto-js',
  'popup',
  'background/daemon'
], function($, _, a, r, m, t, c, popup, background) {
  // global define core modules
  Reflux = r;
  Mustache = m;
  async = a;
  if (window.location.pathname.indexOf('popup') !== -1) {
    popup.init();
  } else {
    background.init();
  }
}, null, true);
