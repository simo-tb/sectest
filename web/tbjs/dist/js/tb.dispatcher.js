/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @desc Dispatch events from current class. Used for pub/sub pattern
 * @module Dispatcher
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
    global.TB.Dispatcher = factory(global.TB);
  }
})(this, function(TB) {
  'use strict';
  /**
   * TB.Dispatcher object - dispatching and listening to events easy
   * @constructor
   * @memberof TB
   * @example
   * // use it seperately
   * var dispatcher = new Dispatcher();
   * dispatcher.on( 'event', function( greeting ) { console.log( greeting ); } );
   * dispatcher.dispatch( 'event', 'Hello world!' );
   * @example
   * // extend class with dispatcher
   * function ClassName () {
   *   TB.Dispatcher.call( this );
   * }
   * TB.classExtend( ClassName, TB.Dispatcher );
   */
  function Dispatcher() {
    if ( !( this instanceof Dispatcher ) ) {
      return new Dispatcher();
    }

    var listeners = {};

    /**
     * Adds event listener
     * @param  {String} eventName event name to attach listener
     * @param  {Function} handler   listener to execute when event occures
     * @return {Object}           returns this for chaining
     */
    this.on = function( eventName, handler ) {
      listeners[ eventName ] = listeners[ eventName ] || [];
      listeners[ eventName ].push( handler );

      return this;
    };

    /**
     * Remove event listener. If no handler passed, then remove all listeners
     * @param  {String} eventName event name to remove
     * @param  {?Function} handler   event handler to remove
     * @return {Object}           returns this for chaining
     */
    this.off = function( eventName, handler ) {
      if ( !listeners.hasOwnProperty( eventName ) ) {
        return this;
      }

      // Remove all event listeners if no handler provided
      if ( TB.isEmpty( handler ) ) {
        listeners[ eventName ].length = 0;
      }

      ASSERT.isFunction( handler );

      var indexOfHandler = listeners[ eventName ].indexOf( handler );

      if ( indexOfHandler >= 0 ) {
        listeners[ eventName ].splice( indexOfHandler, 1 );
      }

      return this;
    };

    /**
     * Dispatches event with given name and data
     * @param  {String} eventName event name to dispatch
     * @param  {*} data      data to pass as first argument to listeners
     * @return {Object}           returns this for chaining
     */
    this.dispatch = function( eventName, data ) {
      if ( listeners.hasOwnProperty( eventName ) ) {
        for ( var i = 0; i < listeners[ eventName ].length; i++ ) {
          var callback = listeners[ eventName ][ i ];

          callback( data );
        }
      }

      return this;
    };
  }

  /** @lends TB.Dispatcher.prototype */
  Dispatcher.prototype = {};

  return Dispatcher;
});
