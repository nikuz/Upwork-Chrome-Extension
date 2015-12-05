'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as EventManager from 'modules/events';
import * as data from 'tests/data/index';
import * as async from 'async';
import * as settings from 'modules/settings';
import Settings from 'components/settings/code';
import Item from 'components/settings/item/code';
import Time from 'components/settings/time/code';

var TestUtils = React.addons.TestUtils,
  expect = chai.expect;

describe('Settings', () => {
  beforeEach(function() {
    EventManager.flushEvents();
    data.cleanup();
  });

  it('should insert the Settings to the DOM', () => {
    var component = TestUtils.renderIntoDocument(
      <div id="test_container">
        <Settings />
      </div>
    );
    TestUtils.findRenderedComponentWithType(
      component, Settings
    );
  });

  it('should save new settings before unmount', (done) => {
    var settingsComponent = TestUtils.renderIntoDocument(
        <Settings />
      ),
      renderedComponents = TestUtils.findAllInRenderedTree(settingsComponent, function(node) {
        return TestUtils.isCompositeComponentWithType(node, Item);
      }),
      sData;

    async.series([
      function(callback) {
        // get initial settings
        sData = settings.get();
        callback();
      },
      function(callback) {
        // trigger change events to get new settings
        async.each(renderedComponents, function(component, internalCallback) {
          switch (component.props.type) {
            case 'list':
              let listChange = function() {
                var selectEl = TestUtils.findRenderedDOMComponentWithClass(
                    component, 'sgi_select'
                  ),
                  slNode = selectEl.getDOMNode();
                TestUtils.Simulate.click(slNode.childNodes[1]);
              };
              if (component.props.name === 'category2') {
                setTimeout(function() {
                  listChange();
                  internalCallback();
                }, 2000);
              } else {
                listChange();
                internalCallback();
              }
              break;
            case 'slider':
              let sliderLeftPin = TestUtils.findRenderedDOMComponentWithClass(
                  component, 'sgispl'
                ),
                sliderRightPin = TestUtils.findRenderedDOMComponentWithClass(
                  component, 'sgispr'
                );
              TestUtils.Simulate.touchStart(sliderLeftPin, {
                targetTouches: [{
                  target: sliderLeftPin.getDOMNode(),
                  pageX: 0,
                  pageY: 0
                }]
              });
              TestUtils.Simulate.touchMove(sliderLeftPin, {
                targetTouches: [{
                  target: sliderLeftPin.getDOMNode(),
                  pageX: 100,
                  pageY: 0
                }]
              });
              TestUtils.Simulate.touchEnd(sliderLeftPin);
              TestUtils.Simulate.touchStart(sliderRightPin, {
                targetTouches: [{
                  target: sliderRightPin.getDOMNode(),
                  pageX: 400,
                  pageY: 0
                }]
              });
              TestUtils.Simulate.touchMove(sliderRightPin, {
                targetTouches: [{
                  target: sliderRightPin.getDOMNode(),
                  pageX: 350,
                  pageY: 0
                }]
              });
              TestUtils.Simulate.touchEnd(sliderRightPin);
              internalCallback();
              break;
            case 'switcher':
              let checkEl = TestUtils.findRenderedDOMComponentWithClass(
                component, 'fch_cust'
              );
              checkEl.getDOMNode().checked = !checkEl.getDOMNode().checked;
              TestUtils.Simulate.change(checkEl);
              internalCallback();
              break;
            case 'time':
              TestUtils.findAllInRenderedTree(component, function(node) {
                if (TestUtils.isCompositeComponentWithType(node, Time)) {
                  let timeEl = TestUtils.findRenderedDOMComponentWithClass(
                    node, 'f_text'
                  );
                  timeEl.getDOMNode().value = '20:00';
                  TestUtils.Simulate.change(timeEl);
                }
              });
              internalCallback();
              break;
          }
        }, callback);
      },
      function(callback) {
        // unmount the Settings component
        var container = ReactDOM.findDOMNode(settingsComponent).parentNode,
          isUnmounted = React.unmountComponentAtNode(container);
        expect(isUnmounted).to.eql(true);
        callback();
      },
      function(callback) {
        // check new settings
        var newSData = settings.get();
        _.each(newSData, function(item, key) {
          expect(item.value).to.not.eql(sData[key].value);
        });
        callback();
      }
    ], done);
  });
});