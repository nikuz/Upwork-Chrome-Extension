'use strict';

import * as background from 'background/daemon';

if (window.mochaPhantomJS) {
  mochaPhantomJS.run();
} else {
  mocha.run();
}
