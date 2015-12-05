'use strict';

var noop = function() {};

export default class Promise {
  constructor(resolveCallback, rejectCallback) {
    this.resolveCallback = resolveCallback || noop;
    this.rejectCallback = rejectCallback || noop;
  }
  pending = true;
  fulfilled = undefined;
  rejected = undefined;
  then(callback) {
    this.resolveCallback = callback || noop;
  }
  catch(callback) {
    this.rejectCallback = callback || noop;
  }
  resolve() {
    if (!this.rejected && !this.fulfilled) {
      this.fulfilled = true;
      this.resolveCallback();
    } else if (this.fulfilled) {
      throw new Error('Already resolved');
    } else {
      throw new Error('Already rejected');
    }
  };
  reject() {
    if (!this.fulfilled && !this.rejected) {
      this.rejected = true;
      this.rejectCallback();
    } else if (this.rejected) {
      throw new Error('Already rejected');
    } else {
      throw new Error('Already resolved');
    }
  };
}
