'use strict';

import * as React from 'react';
import * as EventManager from 'modules/events';
import * as data from 'tests/data/index';
import Slider from 'components/settings/slider/code';

var TestUtils = React.addons.TestUtils,
  expect = chai.expect;

describe('Slider', () => {
  var values = [
    '0',
    '100',
    '200',
    '300',
    '500',
    '1000',
    '2000',
    '3000',
    '5000',
    '1000000'
  ];

  beforeEach(function() {
    EventManager.flushEvents();
    data.cleanup();
  });

  it('should insert the Slider to the DOM and get the value from it when onChange event is triggered', () => {
    var props = {
      from: '0',
      to: '200',
      values: values,
      handler: function(values, text, doNotBubbling) {
        if (doNotBubbling) {
          expect(values).to.be.an('null');
        } else {
          expect(values).to.be.an('array');
        }
        expect(text).to.be.an('string');
      }
    };
    var component = TestUtils.renderIntoDocument(
      <Slider {...props} />
    );
    TestUtils.findRenderedDOMComponentWithClass(
      component, 'sgis_fill'
    );
    var sliderLeftPin = TestUtils.findRenderedDOMComponentWithClass(
      component, 'sgispl'
    );
    expect(component.oppositePos).to.be.an('undefined');
    TestUtils.Simulate.touchStart(sliderLeftPin, {
      targetTouches: [{
        target: sliderLeftPin.getDOMNode(),
        pageX: 0,
        pageY: 0
      }]
    });
    expect(component.oppositePos).to.not.be.an('undefined');
    TestUtils.Simulate.touchMove(sliderLeftPin, {
      targetTouches: [{
        target: sliderLeftPin.getDOMNode(),
        pageX: 100,
        pageY: 0
      }]
    });
  });

  it('should change the left value from 0 to 100', () => {
    var props = {
      from: '0',
      to: '200',
      values: values,
      handler: function(values, text, doNotBubbling) {
        if (!doNotBubbling) {
          expect(values).to.be.an('array');
          expect(values[0].value).to.eql('100');
        }
      }
    };
    var component = TestUtils.renderIntoDocument(
      <Slider {...props} />
    );
    var sliderLeftPin = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgispl'
      ),
      fillEl = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgis_fill'
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
    var leftShift = parseInt(fillEl.getDOMNode().style.left, 10);
    expect(leftShift).to.be.above(0);
  });

  it('should change the left value from 100 to 0', () => {
    var props = {
      from: '100',
      to: '200',
      values: values,
      handler: function(values, text, doNotBubbling) {
        if (!doNotBubbling) {
          expect(values).to.be.an('array');
          expect(values[0].value).to.eql('0');
        }
      }
    };
    var component = TestUtils.renderIntoDocument(
      <Slider {...props} />
    );
    var sliderLeftPin = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgispl'
      ),
      fillEl = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgis_fill'
      );

    TestUtils.Simulate.touchStart(sliderLeftPin, {
      targetTouches: [{
        target: sliderLeftPin.getDOMNode(),
        pageX: 100,
        pageY: 0
      }]
    });
    TestUtils.Simulate.touchMove(sliderLeftPin, {
      targetTouches: [{
        target: sliderLeftPin.getDOMNode(),
        pageX: 0,
        pageY: 0
      }]
    });
    TestUtils.Simulate.touchEnd(sliderLeftPin);
    var leftShift = parseInt(fillEl.getDOMNode().style.left, 10);
    expect(leftShift).to.eql(0);
  });

  it('should change the right value from 1000000 to 5000', () => {
    var props = {
      from: '100',
      to: '1000000',
      values: values,
      handler: function(values, text, doNotBubbling) {
        if (!doNotBubbling) {
          expect(values).to.be.an('array');
          expect(values[1].value).to.eql('5000');
        }
      }
    };
    var component = TestUtils.renderIntoDocument(
      <Slider {...props} />
    );
    var sliderRightPin = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgispr'
      ),
      fillEl = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgis_fill'
      );

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
    var rightShift = parseInt(fillEl.getDOMNode().style.right, 10);
    expect(rightShift).to.be.above(0);
  });

  it('should change the right value from 5000 to 1000000', () => {
    var props = {
      from: '100',
      to: '5000',
      values: values,
      handler: function(values, text, doNotBubbling) {
        if (!doNotBubbling) {
          expect(values).to.be.an('array');
          expect(values[1].value).to.eql('1000000');
        }
      }
    };
    var component = TestUtils.renderIntoDocument(
      <Slider {...props} />
    );
    var sliderRightPin = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgispr'
      ),
      fillEl = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgis_fill'
      );

    TestUtils.Simulate.touchStart(sliderRightPin, {
      targetTouches: [{
        target: sliderRightPin.getDOMNode(),
        pageX: 350,
        pageY: 0
      }]
    });
    TestUtils.Simulate.touchMove(sliderRightPin, {
      targetTouches: [{
        target: sliderRightPin.getDOMNode(),
        pageX: 400,
        pageY: 0
      }]
    });
    TestUtils.Simulate.touchEnd(sliderRightPin);
    var rightShift = parseInt(fillEl.getDOMNode().style.right, 10);
    expect(rightShift).to.eql(0);
  });
});