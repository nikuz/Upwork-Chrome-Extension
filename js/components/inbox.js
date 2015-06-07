'use strict';

import * as $ from 'jquery';
import * as _ from 'underscore';
import * as cache from 'modules/cache';
import * as storage from 'modules/storage';
import * as Page from 'components/page';

var init = () => {
  cache.request({
    query: storage.get('feeds'),
    page: 1
  }, (err, response) => {
    console.log(err);
    console.log(response);
  });
};

GlobalEvents.feedsAdded.listen(() => {
  init();
});
