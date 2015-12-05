'use strict';

require.config({
  baseUrl: 'js'
});

require(['config', 'modules/storage'], function(config, storage) {
  var location = window.location.href;

  if (location.indexOf('request') !== -1) {
    window.location.href = config.API_url + config.API_verifier_url + '?oauth_token=' + storage.get('token');
  } else {
    var response = window.location.search.split('&');
    response.forEach(function(item) {
      if (item.indexOf('oauth_verifier') !== -1) {
        item = item.split('=');
        storage.set('verifier', item[1]);
      }
    });
    window.location.href = 'popup.html';
  }
});
