'use strict';

import * as _ from 'underscore';
import * as settings from 'modules/settings';
import * as storage from 'modules/storage';
import * as data from 'data/data';
import * as background from 'background/daemon';

describe('Background', function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  background.init();
  beforeEach(function() {
    data.addCredentials();
  });
  afterEach(function() {
    data.clear();
  });

  it('should run init script when onInstalled is fired', function(done) {
    chrome.runtime.onInstalled.trigger();
    background.stateCheck((err, response) => {
      expect(err).toBeNull();
      expect(response).toEqual(jasmine.any(Object));
      expect(response.state).toEqual('installed');
      done();
    });
  });
  it('should return notify interval', function(done) {
    background.settingsCheck((err, response) => {
      expect(err).toBeNull();
      expect(response).toBeGreaterThan(1);
      expect(response).toEqual(settings.get('notifyInterval'));
      done();
    });
  });
  it('should return new jobs count', function(done) {
    background.newJobsCheck((err, response) => {
      expect(err).toBeNull();
      expect(response).toEqual(20);
      done();
    });
  });
  it('should show notification', function(done) {
    background.notificationShow({
      count: 5
    }, (err, response) => {
      expect(err).toBeNull();
      expect(response.count).toEqual(5);
      done();
    });
  });
});
