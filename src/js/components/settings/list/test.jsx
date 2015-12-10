'use strict';

import * as React from 'react';
import * as _ from 'underscore';
import * as EventManager from 'modules/events';
import * as data from 'tests/data/index';
import List from './code';
import * as chai from 'chai';
import TestUtils from 'react-addons-test-utils';

var expect = chai.expect;

describe('List', () => {
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

  it('should insert the List to the DOM and get the value from it when onChange event is triggered', (done) => {
    var props = {
      name: 'name',
      value: '10',
      values: selectValues,
      handler: function(values) {
        expect(values).to.be.an('array');
        _.each(values, function(item) {
          expect(item.name).to.eql(props.name);
          expect(item.value).to.eql('30');
        });
        done();
      }
    };
    var component = TestUtils.renderIntoDocument(
      <List {...props} />
    );
    var selectEl = TestUtils.findRenderedDOMComponentWithClass(
      component, 'sgi_select'
    );
    expect(selectEl.getAttribute('data-name')).to.eql(props.name);
    _.each(selectEl.childNodes, function(listItem) {
      if (listItem.className === 'selected') {
        expect(listItem.getAttribute('data-value')).to.eql(props.value);
      }
    });
    TestUtils.Simulate.click(selectEl.childNodes[3]);
  });

  it('should render empty list with loading if values is empty', () => {
    var props = {
      name: 'name',
      value: '',
      values: [],
      handler: _.noop
    };
    var component = TestUtils.renderIntoDocument(
      <List {...props} />
    );
    TestUtils.findRenderedDOMComponentWithClass(
      component, 'sgi_select'
    );
    TestUtils.findRenderedDOMComponentWithClass(
      component, 'sgi_list_load'
    );
  });

  it('should execute handlerOpen if it\' defined and values is empty', (done) => {
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
      <List {...props} />
    );
  });

  it('should render empty list with error if handlerOpen callback return error in first argument', (done) => {
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
            component, 'sgi_list_error'
          );
          done();
        }, 100);
      },
      handlerResize: _.noop
    };
    var component = TestUtils.renderIntoDocument(
      <List {...props} />
    );
  });

  it('should render the List with new data if handlerOpen callback return new data', (done) => {
    var props = {
      name: 'name',
      value: '',
      values: [],
      handler: _.noop,
      handlerOpen: function(callback) {
        expect(callback).to.be.an('function');
        callback(null, selectValues);

        setTimeout(function() {
          var list = TestUtils.findRenderedDOMComponentWithClass(
            component, 'sgi_select'
          );
          expect(list.childNodes).to.have.length.above(1);
          done();
        }, 100);
      },
      handlerResize: _.noop
    };
    var component = TestUtils.renderIntoDocument(
      <List {...props} />
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
              component, 'sgi_list_error'
            );
            var tryAgainBtn = TestUtils.findRenderedDOMComponentWithTag(
              component, 'button'
            );
            TestUtils.Simulate.click(tryAgainBtn);
          }, 100);
        } else {
          callback(null, selectValues);
          setTimeout(function() {
            var list = TestUtils.findRenderedDOMComponentWithClass(
              component, 'sgi_select'
            );
            expect(list.childNodes).to.have.length.above(1);
            done();
          }, 100);
        }
      },
      handlerResize: _.noop
    };
    var component = TestUtils.renderIntoDocument(
      <List {...props} />
    );
  });
});