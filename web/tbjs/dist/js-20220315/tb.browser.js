/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @desc Get browser info
 * @module Browser
 * @memberOf TB
 */
;(function(global, factory) {
  if(typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('tb.xerrors'));
  } else if (typeof define === 'function' && define.amd) {
    define(['tb.xerrors'], function() {
      return factory.apply(factory, arguments);
    });
  } else {
    global.TB = global.TB || {};
    global.TB.Browser = factory(global.TB);
  }
})(this, function(TB) {
  'use strict';

  /**
  * Namespace holder
  * @type {Object}
  */
  var Browser = {};

  /**
  * Gets as much data from window.navigator as possible
  * @return {Object}
  */
  Browser.getFullInfo = function() {
    var data = {};

    for ( var key in window.navigator ) {
      data = window.navigator[ key ];
    }

    return data;
  };

  /**
  * Sets bowser object if bowser.js is loaded
  * @type {?Function}
  */
  Browser.bowser = bowser || null;

  TB.Browser = Browser;

  return Browser;
});
