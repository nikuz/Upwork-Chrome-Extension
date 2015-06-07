'use strict';

import * as $ from 'jquery';
import * as storage from 'modules/storage';
import * as Page from 'components/page';

var searchInit = () => {
  var searchForm = $('#search');
  searchForm.on('submit', function(e) {
    e.preventDefault();
    if (!Page.has('load')) {
      var value = this.search.value.trim();
      value = value.replace(/\/|\"|\'|\`|\^|\&|\$|\%|\*|\(|\)|\[|\]|\{|\}|\?|\;|\:|<|>|\+|\=|\#|\@|\!/g, '').replace(/\s+/g, ' ');
      if (value.length !== 0) {
        storage.set('feeds', value);
        GlobalEvents.feedsAdded();
      }
    }
  });
  var curFeeds = storage.get('feeds');
  if (curFeeds) {
    GlobalEvents.feedsAdded();
    searchForm[0].search.value = curFeeds;
  }
};
searchInit();

$('#stngs_trigger').on('click', () => {
  GlobalEvents.settingsInit();
});
