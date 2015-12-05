'use strict';

import * as _ from 'underscore';

var EasingFunctions = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < .5 ? 2 * t * t :  - 1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: t => t * t * t * t,
  easeOutQuart: t => 1 - (--t) * t * t * t,
  easeInOutQuart: t => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  easeInQuint: t => t * t * t * t * t,
  easeOutQuint: t => 1 + (--t) * t * t * t * t,
  easeInOutQuint: t => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
};

function animate(options) {
  var opts = options || {},
    initial = opts.initial,
    target = opts.target,
    start = performance.now(),
    duration = opts.duration || 500,
    type = opts.type || 'easeInQuad',
    draw = opts.draw || _.noop,
    finish = opts.finish || _.noop;

  requestAnimationFrame(function animate(time) {
    var timeFraction = (time - start) / duration,
      progress;

    if (timeFraction > 1) timeFraction = 1;
    progress = EasingFunctions[type](timeFraction) * 500;
    if (initial < target) {
      progress += initial;
      if (progress > target) {
        progress = target;
      }
    } else {
      progress = initial - progress;
      if (progress < target) {
        progress = target;
      }
    }
    draw(progress);
    if (timeFraction < 1 && ((initial < target && progress < target) || (initial > target && progress > target))) {
      requestAnimationFrame(animate);
    } else {
      finish();
    }
  });
}

export default animate;
