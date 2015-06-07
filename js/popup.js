'use strict';

import * as $ from 'jquery';
import * as React from 'react';
import * as cache from 'modules/cache';

cache.request({
  query: 'javascript',
  page: 6
}, (err, response) => {
  console.log(err);
  console.log(response);
});

// tutorial1.js
var CommentBox = React.createClass({
  render: function() {
    return (
      <div className="commentBox">
        Hello, world! I am a CommentBox.
      </div>
    );
  }
});
React.render(
  <CommentBox />,
  $('#content')[0]
);