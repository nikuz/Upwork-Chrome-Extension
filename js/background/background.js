require.config({
  baseUrl: 'js',
  paths: {
    jquery: '../bower_components/jquery/dist/jquery.min',
    timeago: '../bower_components/jquery-timeago/jquery.timeago',
    underscore: '../bower_components/underscore/underscore-min',
    async: '../bower_components/async/lib/async'
  },
  packages: [{
    name: 'crypto-js',
    location: '../bower_components/crypto-js',
    main: 'index'
  }]
});

require(['background/daemon'], function() {});
