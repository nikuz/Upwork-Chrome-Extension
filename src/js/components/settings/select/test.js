'use strict';

import * as React from 'react';
import * as EventManager from 'modules/events';
import * as data from 'tests/data/index';
import Select from 'components/settings/select/code';

var TestUtils = React.addons.TestUtils,
  expect = chai.expect;

describe('Select', () => {
  var selectValues = [
    {'5': '5'},
    {'10': '10'},
    {'20': '20'},
    {'30': '30'}
  ];

  beforeEach(function() {
    EventManager.flushEvents();
    data.cleanup();
  });

  it('should insert the Select to the DOM and get the value from it when onChange event is triggered', (done) => {
    var props = {
      name: 'name',
      value: '10',
      values: selectValues,
      handler: function(values) {
        expect(values).to.be.an('array');
        _.each(values, function(item) {
          expect(item.name).to.eql(props.name);
          expect(item.value).to.eql('20');
        });
        done();
      }
    };
    var component = TestUtils.renderIntoDocument(
      <Select {...props} />
    );
    var selectEl = TestUtils.findRenderedDOMComponentWithClass(
      component, 'sgi_legacy_select'
    );
    expect(selectEl.getDOMNode().name).to.eql(props.name);
    expect(selectEl.getDOMNode().value).to.eql(props.value);
    selectEl.getDOMNode().value = '20';
    TestUtils.Simulate.change(selectEl);
  });

  it('should render loading instead select if values is empty', () => {
    var props = {
      name: 'name',
      value: '',
      values: [],
      handler: _.noop
    };
    var component = TestUtils.renderIntoDocument(
      <Select {...props} />
    );
    TestUtils.findRenderedDOMComponentWithClass(
      component, 'sgi_legacy_list_load'
    );
  });

  it('should execute handlerOpen if it\'s defined and values is empty', (done) => {
    var props = {
      name: 'name',
      value: '',
      values: [],
      handler: _.noop,
      handlerOpen: function(callback) {
        expect(callback).to.be.an('function');
        done();
      }
    };
    TestUtils.renderIntoDocument(
      <Select {...props} />
    );
  });

  it('should render error if handlerOpen callback return error in first argument', (done) => {
    var props = {
      name: 'name',
      value: '',
      values: [],
      handler: _.noop,
      handlerOpen: function(callback) {
        expect(callback).to.be.an('function');
        callback('some error');

        setTimeout(function() {
          TestUtils.findRenderedDOMComponentWithClass(
            component, 'sgi_legacy_list_error'
          );
          done();
        }, 100);
      }
    };
    var component = TestUtils.renderIntoDocument(
      <Select {...props} />
    );
  });

  it('should render the Select with new data if handlerOpen callback return new data', (done) => {
    var props = {
      name: 'name',
      value: '',
      values: [],
      handler: _.noop,
      handlerOpen: function(callback) {
        expect(callback).to.be.an('function');
        callback(null, selectValues);

        setTimeout(function() {
          TestUtils.findRenderedDOMComponentWithClass(
            component, 'sgi_legacy_select'
          );
          done();
        }, 100);
      }
    };
    var component = TestUtils.renderIntoDocument(
      <Select {...props} />
    );
  });

  it('should execute handlerOpen again if user click to "Try again" in error message', (done) => {
    var attempt = 1;
    var props = {
      name: 'name',
      value: '',
      values: [],
      handler: _.noop,
      handlerOpen: function(callback) {
        expect(callback).to.be.an('function');
        if (attempt === 1) {
          attempt += 1;
          callback('some error');
          setTimeout(function() {
            TestUtils.findRenderedDOMComponentWithClass(
              component, 'sgi_legacy_list_error'
            );
            var tryAgainBtn = TestUtils.findRenderedDOMComponentWithTag(
              component, 'button'
            );
            TestUtils.Simulate.click(tryAgainBtn);
          }, 100);
        } else {
          callback(null, selectValues);
          setTimeout(function() {
            TestUtils.findRenderedDOMComponentWithClass(
              component, 'sgi_legacy_select'
            );
            done();
          }, 100);
        }
      }
    };
    var component = TestUtils.renderIntoDocument(
      <Select {...props} />
    );
  });
});