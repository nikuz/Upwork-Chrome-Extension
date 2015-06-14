'use strict';

import * as text from 'text';
import * as _ from 'underscore';
import * as settings from 'modules/settings';
import * as storage from 'modules/storage';
import * as Credentials from 'text!data/credentials.json';
import * as background from 'background/daemon';

var credentials = JSON.parse(_.clone(Credentials));

describe('Background', function() {
  var bgState = background.checkState();
  it('should run init script when onInstalled is fired', function() {
    expect(bgState.prevNotificationCount).toBeUndefined();
    chrome.runtime.onInstalled.trigger();
    bgState = background.checkState();
    expect(bgState.prevNotificationCount).toEqual(0);
  });
  it('should return notify interval', function() {
    var interval = bgState.settingsCheck();
    expect(interval).toBeGreaterThan(1);
    expect(interval).toEqual(settings.get('notifyInterval'));
  });
});
