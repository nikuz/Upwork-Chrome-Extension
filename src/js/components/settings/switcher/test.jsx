'use strict';

import * as React from 'react';
import * as _ from 'underscore';
import * as EventManager from 'modules/events';
import * as data from 'tests/data/index';
import Switcher from './code';
import * as chai from 'chai';
import TestUtils from 'react-addons-test-utils';

var expect = chai.expect;

describe('Switcher', () => {
  beforeEach(function() {
    EventManager.flushEvents();
    data.cleanup();
  });

  it('should insert the Switcher to the DOM and get the value from it when onChange event is triggered', () => {
    var props = {
      name: 'name',
      checked: true,
      handler: function(values) {
        expect(values).to.be.an('array');
        _.each(values, function(item) {
          expect(item.name).to.eql(props.name);
          //expect(item.value).to.eql(!value);
        });
      }
    };
    var component = TestUtils.renderIntoDocument(
      <Switcher {...props} />
    );
    var checkEl = TestUtils.findRenderedDOMComponentWithClass(
      component, 'fch_cust'
    );

    expect(checkEl.checked).to.eql(props.checked);
    TestUtils.Simulate.change(checkEl);
  });

  it('should init the `stngSwitcherChange` event when onChange event is triggered and relations is defined', () => {
    var props = {
      name: 'name',
      checked: true,
      relations: 'relation',
      handler: _.noop
    };
    EventManager.on('stngSwitcherChange', function(options) {
      var opts = options || {};
      expect(opts.relation).to.eql(props.relations);
      //expect(opts.value).to.eql(!value);
    });
    var component = TestUtils.renderIntoDocument(
      <Switcher {...props} />
    );
    var checkEl = TestUtils.findRenderedDOMComponentWithClass(
      component, 'fch_cust'
    );

    TestUtils.Simulate.change(checkEl);
  });
});