'use strict';

var allTestFiles = [];
var TEST_REGEXP = /release\/.+test\..+\.js$/;

Object.keys(window.__karma__.files).forEach(function(file) {
  if (file.indexOf('specs_babel/main') === -1 && TEST_REGEXP.test(file)) {
    allTestFiles.push(file);
  }
});

window.env = 'test';

require.config({
  baseUrl: '/base/release/js',
  // Karma serves files under /base, which is the basePath from your config file
  paths: {
    text:  '../../bower_components/requirejs-text/text',
    jquery: '../../bower_components/jquery/dist/jquery',
    reflux: '../../bower_components/reflux/dist/reflux',
    underscore: '../../bower_components/underscore/underscore',
    async: '../../bower_components/async/lib/async',
    mustache: '../../bower_components/mustache/mustache.min',
    timeago: '../../bower_components/jquery-timeago/jquery.timeago'
  },

  packages: [{
    name: 'crypto-js',
    location: '../../bower_components/crypto-js',
    main: 'index'
  }],

  // dynamically load all test files
  deps: allTestFiles,

  // we have to kickoff jasmine, as it is asynchronous
  callback: window.__karma__.start
});
