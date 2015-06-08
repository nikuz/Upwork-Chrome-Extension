'use strict';

import * as $ from 'jquery';
import * as _ from 'underscore';
import * as JobsList from 'components/jobs_list';

var init = function() {
  JobsList.init('inbox');
};

GlobalEvents.feedsAdded.listen(() => {
  init();
});
