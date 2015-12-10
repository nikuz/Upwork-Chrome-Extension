'use strict';

import * as React from 'react';
import * as EventManager from 'modules/events';
import * as data from 'tests/data/index';
import Slider from './code';
import * as chai from 'chai';
import TestUtils from 'react-addons-test-utils';

var expect = chai.expect;

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

  it('should insert the Slider to the DOM and get the value from it when onChange event is triggered', (done) => {
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
    var sliderRootEl = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgi_slider'
      ),
      sliderLeftPin = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgispl'
      );

    expect(component.oppositePos).to.be.an('undefined');
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
      expect(component.oppositePos).to.not.be.an('undefined');
      done();
    }, 500);
  });

  it('should change the left value from 0 to 100', (done) => {
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
      ),
      sliderRootEl = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgi_slider'
      ),
      sliderLeftPin = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgispl'
      ),
      fillEl = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgis_fill'
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
      expect(component.oppositePos).to.not.be.an('undefined');
      var leftShift = parseInt(fillEl.style.left, 10);
      expect(leftShift).to.be.above(0);
      done();
    }, 500);
  });

  it('should change the left value from 100 to 0', (done) => {
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
      ),
      sliderRootEl = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgi_slider'
      ),
      sliderLeftPin = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgispl'
      ),
      fillEl = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgis_fill'
      );

    setTimeout(function() {
      TestUtils.Simulate.mouseDown(sliderLeftPin, {
        pageX: 100,
        pageY: 0
      });
      TestUtils.Simulate.mouseMove(sliderRootEl, {
        pageX: 0,
        pageY: 0
      });
      TestUtils.Simulate.mouseUp(sliderRootEl);
      expect(component.oppositePos).to.not.be.an('undefined');
      var leftShift = parseInt(fillEl.style.left, 10);
      expect(leftShift).to.eql(0);
      done();
    }, 500);
  });

  it('should change the right value from 1000000 to 5000', (done) => {
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
      ),
      sliderRootEl = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgi_slider'
      ),
      sliderRightPin = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgispr'
      ),
      fillEl = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgis_fill'
      );

    setTimeout(function() {
      TestUtils.Simulate.mouseDown(sliderRightPin, {
        pageX: 400,
        pageY: 0
      });
      TestUtils.Simulate.mouseMove(sliderRootEl, {
        pageX: 350,
        pageY: 0
      });
      TestUtils.Simulate.mouseUp(sliderRootEl);
      expect(component.oppositePos).to.not.be.an('undefined');
      var rightShift = parseInt(fillEl.style.right, 10);
      expect(rightShift).to.be.above(0);
      done();
    }, 500);
  });

  it('should change the right value from 5000 to 1000000', (done) => {
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
      ),
      sliderRootEl = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgi_slider'
      ),
      sliderRightPin = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgispr'
      ),
      fillEl = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgis_fill'
      );

    setTimeout(function() {
      TestUtils.Simulate.mouseDown(sliderRightPin, {
        pageX: 350,
        pageY: 0
      });
      TestUtils.Simulate.mouseMove(sliderRootEl, {
        pageX: 400,
        pageY: 0
      });
      TestUtils.Simulate.mouseUp(sliderRootEl);
      expect(component.oppositePos).to.not.be.an('undefined');
      var rightShift = parseInt(fillEl.style.right, 10);
      expect(rightShift).to.eql(0);
      done();
    }, 500);
  });
});