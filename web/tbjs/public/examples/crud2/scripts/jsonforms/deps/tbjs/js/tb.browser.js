;(function(window){
'use strict';
var TB = window.TB || {};
window.TB = TB;
/**
* Namespace holder
* @type {Object}
*/
TB.browser = {};

/**
* Gets as much data from window.navigator as possible
* @return {Object}
*/
TB.browser.getFullInfo = function() {
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
TB.browser.bowser = bowser || null;})( typeof window === "undefined" ? this : window );
