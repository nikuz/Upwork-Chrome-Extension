require.config({
  baseUrl: 'js',
  paths: {
    jquery: '../bower_components/jquery/dist/jquery.min',
    underscore: '../bower_components/underscore/underscore-min',
    async: '../bower_components/async/lib/async',
    reflux: '../bower_components/reflux/dist/reflux.min',
    mustache: '../bower_components/mustache/mustache.min',
    timeago: '../bower_components/jquery-timeago/jquery.timeago'
  },
  shim: {
    popup: {
      deps: ['components/page', 'components/settings', 'components/inbox']
    }
  },
  packages: [{
    name: 'crypto-js',
    location: '../bower_components/crypto-js',
    main: 'index'
  }]
});

var GlobalEvents;
require(['reflux'], function(Reflux) {
  GlobalEvents = Reflux.createActions([
    'feedsAdded',
    'settingsInit',
    'settingsHide',
    'settingsSaved',
    'inboxError',
    'jobsReceived',
    'jobsPending'
  ]);
  require(['popup', 'components/settings', 'components/inbox']);
});
