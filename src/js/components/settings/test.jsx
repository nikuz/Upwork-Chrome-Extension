'use strict';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'underscore';
import * as EventManager from 'modules/events';
import * as data from 'tests/data/index';
import {
  series as asyncSeries,
  each as asyncEach
} from 'async';
import * as settings from 'modules/settings';
import Settings from 'components/settings/code';
import Item from 'components/settings/item/code';
import {expect} from 'chai';
import TestUtils from 'react-addons-test-utils';

describe('Settings', () => {
  beforeEach(function() {
    EventManager.flushEvents();
    data.cleanup();
    data.auth();
  });

  it('should insert the Settings to the DOM', () => {
    var component = TestUtils.renderIntoDocument(
      <Settings />
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
      sData = settings.get();

    asyncSeries([
      function(callback) {
        // trigger change events to get new settings
        asyncEach(renderedComponents, function(component, internalCallback) {
          switch (component.props.type) {
            case 'list':
              let listChange = function() {
                var selectEl = TestUtils.findRenderedDOMComponentWithClass(
                  component, 'sgi_select'
                );
                TestUtils.Simulate.click(selectEl.childNodes[1]);
              };
              if (component.props.name === 'category2') {
                setTimeout(function() {
                  listChange();
                  internalCallback();
                }, 3000);
              } else {
                listChange();
                internalCallback();
              }
              break;
            case 'slider':
              let sliderRootEl = TestUtils.findRenderedDOMComponentWithClass(
                  component, 'sgi_slider'
                ),
                sliderLeftPin = TestUtils.findRenderedDOMComponentWithClass(
                  component, 'sgispl'
                ),
                sliderRightPin = TestUtils.findRenderedDOMComponentWithClass(
                  component, 'sgispr'
                );

              setTimeout(function() {
                TestUtils.Simulate.mouseDown(sliderLeftPin, {
                  pageX: 0,
                  pageY: 0
                });
                TestUtils.Simulate.mouseMove(sliderRootEl, {
                  pageX: 100,
                  pageY: 0
                });
                TestUtils.Simulate.mouseUp(sliderRootEl);
                TestUtils.Simulate.mouseDown(sliderRightPin, {
                  pageX: 400,
                  pageY: 0
                });
                TestUtils.Simulate.mouseMove(sliderRootEl, {
                  pageX: 350,
                  pageY: 0
                });
                TestUtils.Simulate.mouseUp(sliderRootEl);
                internalCallback();
              }, 500);
              break;
            case 'switcher':
              let checkEl = TestUtils.findRenderedDOMComponentWithClass(
                component, 'fch_cust'
              );
              checkEl.checked = !checkEl.checked;
              TestUtils.Simulate.change(checkEl);
              internalCallback();
              break;
            default:
              internalCallback();
          }
        }, callback);
      },
      function(callback) {
        // unmount the Settings component
        var container = ReactDOM.findDOMNode(settingsComponent).parentNode,
          isUnmounted = ReactDOM.unmountComponentAtNode(container);

        expect(isUnmounted).to.eql(true);
        callback();
      },
      function(callback) {
        // check new settings
        var newSData = settings.get(),
          excludeKeys = [
            'useProxy',
            'dndFrom',
            'dndTo'
          ];

        _.each(newSData, function(item, key) {
          if (!_.contains(excludeKeys, key)) {
            expect(item.value).to.not.eql(sData[key].value);
          }
        });
        callback();
      }
    ], done);
  });
});