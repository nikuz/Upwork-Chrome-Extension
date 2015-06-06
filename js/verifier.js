'use strict';

require.config({
  baseUrl: 'js',
  paths: {
    underscore: '../bower_components/underscore/underscore-min'
  }
});

require(['config', 'services/localStorage', 'underscore'], function(config, storage, _) {
  var location = window.location.href;

  if(location.indexOf('request') !== -1){
    window.location.href = config.APIURL + '/services/api/auth?oauth_token=' + storage.get('token');
  } else {
    var response = window.location.search.split('&');
    _.each(response, function(item) {
      if (item.indexOf('oauth_verifier') !== -1) {
        item = item.split('=');
        storage.set('verifier', item[1]);
      }
    });
    window.location.href = 'popup.html';
  }
});
