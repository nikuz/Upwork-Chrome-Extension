'use strict';

import * as _ from 'underscore';
import * as config from 'config';
import * as storage from 'modules/storage';

var location = window.location.href;

if (location.indexOf('request') !== -1) {
  window.location.href = config.UPWORK_url + config.UPWORK_verifier_url + '?oauth_token=' + storage.get('token');
} else {
  var response = window.location.search.split('&');
  _.each(response, function(item) {
    if (item.indexOf('oauth_verifier') !== -1) {
      item = item.split('=');
      storage.set('verifier', item[1]);
    }
  });
  window.location.href = 'index.html';
}
