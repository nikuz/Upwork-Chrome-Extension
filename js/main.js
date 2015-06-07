require.config({
  baseUrl: 'js',
  paths: {
    jquery: '../bower_components/jquery/dist/jquery.min',
    underscore: '../bower_components/underscore/underscore-min',
    async: '../bower_components/async/lib/async',
    reflux: '../bower_components/reflux/dist/reflux.min'
  },
  shim: {
    popup: {
      deps: ['components/settings', 'components/inbox']
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
    'settingsInit'
  ]);
  require(['popup', 'components/settings', 'components/inbox']);
});
