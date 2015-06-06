require.config({
  baseUrl: 'js',
  paths: {
    jquery: '../bower_components/jquery/dist/jquery.min',
    react: '../bower_components/react/react-with-addons.min',
    reflux: '../bower_components/reflux/dist/reflux.min'
  }
});

require(['popup'], function(popup) {});
