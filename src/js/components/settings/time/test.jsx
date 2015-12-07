'use strict';

import * as React from 'react';
import * as EventManager from 'modules/events';
import * as data from 'tests/data/index';
import Time from 'components/settings/time/code';

var TestUtils = React.addons.TestUtils,
  expect = chai.expect;

describe('Time', () => {
  it('should insert the Time to the DOM and get the value from it when onChange event is triggered', (done) => {
    var props = {
      type: 'type',
      name: 'name',
      value: '10',
      handler: function(values) {
        expect(values).to.be.an('array');
        _.each(values, function(item) {
          expect(item.name).to.eql(props.name + props.type);
          expect(item.value).to.eql('20');
        });
        done();
      }
    };
    var component = TestUtils.renderIntoDocument(
      <Time {...props} />
    );
    var timeEl = TestUtils.findRenderedDOMComponentWithClass(
      component, 'f_text'
    );
    expect(timeEl.getDOMNode().name).to.eql(props.name + props.type);
    expect(timeEl.getDOMNode().value).to.eql(props.value);
    timeEl.getDOMNode().value = '20';
    TestUtils.Simulate.change(timeEl);
  });
});