require.config({
  baseUrl: 'js',
  paths: {
    jquery: '../bower_components/jquery/dist/jquery.min',
    underscore: '../bower_components/underscore/underscore-min',
    async: '../bower_components/async/lib/async',
    reflux: '../bower_components/reflux/dist/reflux.min',
    react: '../bower_components/react/react-with-addons.min'
  },
  packages: [{
    name: 'crypto-js',
    location: '../bower_components/crypto-js',
    main: 'index'
  }]
});

require(['background/background'], function() {});
