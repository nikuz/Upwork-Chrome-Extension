'use strict';

import * as React from 'react';
import * as EventManager from 'modules/events';
import * as data from 'tests/data/index';
import BlockModern from '/code';

var TestUtils = React.addons.TestUtils,
  expect = chai.expect;

describe('Block modern', () => {
  var values = [
    {'5': '5'},
    {'10': '10'},
    {'20': '20'},
    {'30': '30'}
  ];

  beforeEach(function() {
    EventManager.flushEvents();
    data.cleanup();
  });

  it('should render Select to the DOM', () => {
    var props = {
      type: 'list',
      name: 'name',
      value: '10',
      values: values,
      title: 'title',
      handler: _.noop
    };
    var component = TestUtils.renderIntoDocument(
      <BlockModern {...props} />
    );
    TestUtils.findRenderedDOMComponentWithClass(
      component, 'sgi_select'
    );
  });

  it('should render Switcher to the DOM', () => {
    var props = {
      type: 'switcher',
      name: 'name',
      values: values,
      checked: true,
      title: 'title',
      handler: _.noop
    };
    var component = TestUtils.renderIntoDocument(
      <BlockModern {...props} />
    );
    TestUtils.findRenderedDOMComponentWithClass(
      component, 'sgi_check'
    );
  });

  it('should render Slider to the DOM', () => {
    var props = {
      type: 'slider',
      name: 'name',
      values: values,
      from: '10',
      to: '20',
      title: 'title',
      handler: _.noop
    };
    var component = TestUtils.renderIntoDocument(
      <BlockModern {...props} />
    );
    TestUtils.findRenderedDOMComponentWithClass(
      component, 'sgi_slider'
    );
  });

  it('should render Time to the DOM', () => {
    var props = {
      type: 'time',
      name: 'name',
      values: values,
      from: '10',
      to: '20',
      title: 'title',
      handler: _.noop
    };
    var component = TestUtils.renderIntoDocument(
      <BlockModern {...props} />
    );
    TestUtils.findRenderedDOMComponentWithClass(
      component, 'sgi_time fl_l'
    );
    TestUtils.findRenderedDOMComponentWithClass(
      component, 'sgi_time fl_r'
    );
  });

  it('should disable settings Item if stngSwitcherChange event is triggered and relation of Item is matched and switched to false', () => {
    var props = {
      type: 'list',
      name: 'name',
      values: values,
      from: '10',
      to: '20',
      title: 'title',
      relations: 'relations',
      handler: _.noop
    };
    var component = TestUtils.renderIntoDocument(
      <BlockModern {...props} />
    );
    var stngItem = TestUtils.findRenderedDOMComponentWithClass(
      component, 'sg_item'
    );
    EventManager.trigger('stngSwitcherChange', {
      relation: props.relations,
      value: false
    });
    expect(stngItem.getDOMNode().className).to.contain('sgi_block');
  });

  it('should expand the content block if user clicked to the block when content block is closed, and collapse the block back with second click', () => {
    var props = {
      type: 'list',
      name: 'name',
      values: values,
      from: '10',
      to: '20',
      title: 'title',
      relations: 'relations',
      handler: _.noop
    };
    var component = TestUtils.renderIntoDocument(
      <BlockModern {...props} />
    );
    var stngItem = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sg_item'
      ),
      blockerEl = TestUtils.findRenderedDOMComponentWithClass(
        component, 'blocker sgi_blocker'
      ),
      contEl = TestUtils.findRenderedDOMComponentWithClass(
        component, 'sgi_cont_wrap sgc_cont_list'
      );

    var initialContHeight = contEl.getDOMNode().style.height,
      openedCl = 'sgi_opened';

    expect(stngItem.getDOMNode().className).to.not.contain(openedCl);
    TestUtils.Simulate.click(blockerEl);
    expect(stngItem.getDOMNode().className).to.contain(openedCl);
    // actual height is still zero, just check that component tried to change it
    expect(contEl.getDOMNode().style.height).to.not.eql(initialContHeight);
    TestUtils.Simulate.click(blockerEl);
    expect(stngItem.getDOMNode().className).to.not.contain(openedCl);
  });
});