;(function(window){
'use strict';
var TB = window.TB || {};
window.TB = TB;
/**
 * @namespace {Object} TB
 * @augments module:xerrors
 */

/**
 * @memberOf TB
 * @alias TB.CONFIG
 * @type {Object}
 * @property {Boolean} XERRORS_LOG_CONSOLE append log messages in navigator's console ( console.log() )
 * @property {Boolean} XERRORS_LOG_LOCALSTORAGE append log message in navigator's localStorage
 * @property {String} XERRORS_LOG_LOCALSTORAGE_NAME name of navigator's localStorage to append log messages
 */
TB.CONFIG = TB.CONFIG || {};
TB.CONFIG.ERR_PEER = 'peer_error';
TB.CONFIG.ERR_USER = 'user_error';
TB.CONFIG.ERR_SYS = 'sys_error';


TB.CONFIG.DEBUG_IN_GLOBAL_SCOPE = true;
TB.CONFIG.ASSERTS_DISABLED = !false;
TB.CONFIG.ASSERTS_DEFAULT_MSG_DELIMITER = ' ';
TB.CONFIG.TYPE_DELIMITER = '|';
TB.CONFIG.TRACE_ARGUMENTS_DELIMITER = ' ';
TB.CONFIG.TRACE_OPEN_PLACEHOLDER_STR = '';
TB.CONFIG.TRACE_CLOSE_PLACEHOLDER_STR = '';
TB.CONFIG.TRACE_OPEN_TYPE_PLACEHOLDER_STR = '[[';
TB.CONFIG.TRACE_CLOSE_TYPE_PLACEHOLDER_STR = ']]';
TB.CONFIG.EMPTY_DATE = '';


TB.CONFIG.XERRORS_LOG_CONSOLE = (typeof TB.CONFIG.XERRORS_LOG_CONSOLE !== 'undefined') ? TB.CONFIG.XERRORS_LOG_CONSOLE  : true;
TB.CONFIG.XERRORS_LOG_LOCALSTORAGE = (typeof TB.CONFIG.XERRORS_LOG_LOCALSTORAGE !== 'undefined') ? TB.CONFIG.XERRORS_LOG_LOCALSTORAGE  : false;
TB.CONFIG.XERRORS_LOG_LOCALSTORAGE_NAME = '__TB_XERRORS__';


/**
 * Generates unique id for current browser window. Starts from 1 and increments with one each time it's called.
 * If prefix set, it's prefixed before the number.
 * @param  {String) prefix string to prepend before unique number
 * @return {String}   unique id
 */
TB.getUniqueId = (function() {
  var idCounter = 0;
  return function(prefix) {
    prefix = prefix || '';

    return prefix + ++idCounter + '';
  }
})();

/**
 * If object has length property
 * @param {*} obj object to check
 * @return {Boolean} true if has property length
 */
TB.isArrayLike = function( obj ) {
  var length = TB.isString( obj ) ? obj.length : TB.get( obj, 'length' );

  return ( typeof length === 'number' ) && length >= 0 && length <= Number.MAX_SAFE_INTEGER;
};

/**
 * Convert to array
 * @param  {*} obj iteratable object
 * @return {Array}
 */
TB.toArray = function( obj ) {
  if ( TB.isUndefined( obj ) ) {
    return [];
  }
  if ( TB.isArray( obj ) ) {
    return Array.prototype.slice.call( obj, 0 );
  }

  if ( TB.isArrayLike( obj ) ) {
    return TB.map( obj, function( value ) { return value; } );
  }
  return TB.values( obj );
};

/**
 * Map over object
 * @param  {Object} obj      object to map
 * @param  {Function} iteratee function to fire
 * @param  {*} [context]  context for iteratee function
 * @return {Array}          results
 */
TB.map = function( obj, iteratee, context ) {
  var keys = !TB.isArrayLike( obj ) && Object.keys( obj );
  var length = ( keys || obj ).length;
  var results = Array( length );

  for ( var index = 0; index < length; index++ ) {
    var currentKey = keys ? keys[index] : index;

    results[ index ] = iteratee.bind( context || this )( obj[ currentKey ], currentKey, obj );
  }
  return results;
};

/**
 * Convert object to array of it's property values
 * @param {Object} obj object
 * @return {Array} list of property values
 */
TB.values = function( obj ) {
  var keys = Object.keys( obj );
  var result = [];

  for ( var i = 0; i < keys.length; i++ ) {
    var val = obj[ keys[ i ] ];

    result.push( val );
  }

  return result;
};

/**
 * Empty function
 */
TB.noop = function() {};

/**
 * Add 'px' suffix
 * @param  {Number} value value to concatenate
 * @return {String}       concatenated value with px
 */
TB.toPx = function( value ) {
  return value + 'px';
};

/**
 * Get property value by path
 * @param  {Object} obj          object to search in
 * @param  {(String|Array)} path         path to search; if string, properties are using "." (dot) delimiter
 * @param  {*} defaultValue default value if undefined
 * @return {*}              found value
 * @example
 * var obj = { foo: { bar: 5, qux: undefined } };
 * TB.get( obj, 'foo.bar', null ); // 5
 * TB.get( obj, 'foo.baz' ); // undefined
 * TB.get( obj, 'foo.qux', null ); // null
 * TB.get( obj, 'foo.baz.qux', null ); // null
 * TB.get( obj, ['foo', 'bar'] ); // 5
 */
TB.get = function( obj, path, defaultValue ) {
  var pathArr = ( typeof path === 'string' ) ? path.split( '.' ) : path;

  return pathArr.reduce( function( prev, curr ) {
    return ( prev && prev[curr] !== undefined ) ? prev[curr] : defaultValue;
  }, obj );
};

/**
 * Set property value
 * @param {Object} obj   object to set property
 * @param {(String|Array)} path  path to search; if string, properties are using "." (dot) delimiter
 * @param {*} value value to set on given path
 * @example
 * var obj = { foo: { bar: 5 } };
 * TB.set( obj, 'foo.bar', 6 ); // obj.foo.bar === 6
 * TB.set( obj, 'foo.qux', 'value' ); // obj.foo.qux === 'value'
 * TB.set( obj, 'foo.bar.qux', 'value' ); // throws new TypeError
 */
TB.set = function( obj, path, value ) {
  var a = ( typeof path === 'string' ) ? path.split( '.' ) : path;
  var o = obj;

  for ( var i = 0; i < a.length - 1; i++ ) {
    var n = a[ i ];

    if ( n in o ) {
      o = o[n];
    } else {
      o[n] = {};
      o = o[n];
    }
  }
  o[ a[ a.length - 1 ] ] = value;

  return value;
};

/**
 * Clone function
 * @param  {Function} fn function to clone
 * @return {Function}      cloned function
 */
TB.cloneFunction = function( fn ) {
  var temp = function temporary() { return fn.apply( this, arguments ); };

  for ( var key in fn ) {
    if ( fn.hasOwnProperty( key ) ) {
      temp[ key ] = fn[ key ];
    }
  }

  return temp;
};


/**
 * Assign properties of obj2 to obj1
 * @param  {Object} obj1 destination
 * @param  {Object} obj2 source
 * @return {Object}      destination
 */
TB.assign = function( obj1, obj2 ) {
  for ( var key in obj2 ) {
    obj1[key] = obj2[key];
  }
  return obj1;
};

TB.clone = TB.assign;

/**
 * Set properties of source to destination by value
 * @param  {Object} destination destination object
 * @param  {Object} source      source object
 * @return {Object}             destination object (NOTE: destination argument is passed by reference, so it's already extended and it's === with return value)
 */
TB.merge = function( destination, source ) {
  for ( var property in source ) {
    if ( source[property] && source[property].constructor && source[property].constructor === Object ) {
      destination[property] = destination[property] || {};
      TB.merge( destination[property], source[property] );
    }else if ( source[property] && source[property].constructor && source[property].constructor === Array ) {
      destination[property] = destination[property] || [];
      TB.merge( destination[property], source[property] );
    } else {
      destination[property] = source[property];
    }
  }

  return destination;
};

/**
 * Values is between values
 * @param  {Number}  value     value to check
 * @param  {down}  down      minimum of the range
 * @param  {up}  up        maximum of the range
 * @param  {Boolean}  inclusive range inclusive
 * @return {Boolean}           true if in range
 */
TB.isBetween = function( value, down, up, inclusive ) {
  return ( inclusive )
    ? ( value >= down && value <= up )
    : ( value > down && value < up );
};
/**
 * If value is out of range, set it to closest range border
 * @param  {Number} value value to check
 * @param  {Number} down  minimum of the range
 * @param  {Number} up    maximum of the range
 * @return {Number}       ranged value
 * @example
 * TB.limitToRange( 105, 1, 100 ) // returns 100
 * TB.limitToRange( -15, 1, 100 ) // returns 1
 * TB.limitToRange( 76, 1, 100 ) // returns 76
 */
TB.limitToRange = function( value, down, up ) {
  if ( value > up ) {
    return up;
  } else if ( value < down ) {
    return down;
  } else {
    return value;
  }
};

/**
 * If object contains value
 * @todo support String and Object
 * @param  {(Array)} arr  where to search for value
 * @param  {*} item value to search for
 * @return {Boolean}
 */
TB.contains = function( arr, item ) {
  return arr.indexOf( item ) >= 0;
};

/**
 * Checks if value is a boolean
 * @param  {*}  value value to check
 * @return {Boolean}       true if value is a boolean
 */
TB.isBoolean = function( value ) {
  return typeof value === 'boolean';
};

/**
 * Checks if value is a number
 * @param  {*}  value value to check
 * @return {Boolean}       true if value is a number
 */
TB.isNumber = function( value ) {
  return ( typeof value === 'number' || value instanceof Number );
};

/**
 * Checks if value is defined
 * @param  {*}  value         value to check
 * @param  {Boolean}  nullIsDefined treat null as defined value
 * @return {Boolean}               true if value is defined
 */
TB.isDefined = function( value, nullIsDefined ) {
  return ( nullIsDefined )
    ? typeof value !== 'undefined'
    : typeof value !== 'undefined' && value !== null;
};

/**
 * Checks if value is not defined
 * @param  {*}  value         value to check
 * @param  {Boolean}  nullIsDefined treat null as defined value
 * @return {Boolean}               true if value is not defined
 */
TB.isUndefined = function( value, nullIsDefined ) {
  return !( TB.isDefined( value, nullIsDefined ) );
};

/**
 * Checks if value is object
 * @param  {*}  value value to check
 * @return {Boolean}       true if value is an object
 */
TB.isObject = function( value ) {
  return value === Object( value );
};

/**
 * Checks if value is a sting
 * @param  {*}  value value to check
 * @return {Boolean} true if value is a string
 */
TB.isString = function( value ) {
  return typeof value === 'string';
};

/**
 * Checks if value is a function
 * @param  {*}  value value to check
 * @return {Boolean}       true if values is a function
 */
TB.isFunction = function( value ) {
  return typeof value === 'function';
};
/**
 * Checks if object is a date
 * @param  {*}  date value to check
 * @return {Boolean}      true if value is instance of Date
 */
TB.isDate = function( value ) {
  return ( value && typeof value === 'object' && value.constructor === Date );
};

/**
 * Checks if object is an array
 * @param  {*}  arr value to check
 * @return {Boolean} true if values is an array
 */
TB.isArray = function( value ) {
  return ( value && typeof value === 'object' && value.constructor === Array );
};

/**
 * Checks if value is empty
 * @param  {*}  value value to check
 * @return {Boolean}       true if value is NaN,
 * infinity, null, undefined, empty string, empty array, empty object
 */
TB.isEmpty = function( value ) {
  switch ( TB.typeof( value ) ) {

  case 'NaN' :
  case 'infinity' :
  case 'null' :
  case 'undefined' :
    return true;
  case 'string' :
    return ( value === '' );
  case 'array' :
    return ( value.length <= 0 );
  case 'object' :
    return ( Object.keys( value ).length <= 0 );
  default:
    return false;

  }
};
/**
 * Custom typeof
 * @param  {*} val value to check type
 * @return {String}     any of types object, array, null, NaN, infinity, number, string, symbol, undefined, boolean, function
 */
TB.typeof = function( val ) {
  switch ( typeof val ) {

  case 'object':
    if ( val === null ) {
      return 'null';
    } else if ( TB.isArray( val ) ) {
      return 'array';
    } else {
      return 'object';
    }
    break;
  case 'number':
    if ( val !== val ) {
      return 'NaN';
    }

    if ( !isFinite( val ) ) {
      return 'infinity';
    }

    return 'number';
  case 'string':
  case 'symbol':
  case 'undefined':
  case 'boolean':
  case 'function':
  default:
    return typeof val;

  }
};

/**
 * Applies cssText to document
 * @param  {String} idSelector          id of the style tag; if element found, replace contents, else create new
 * @param  {String} cssText             CSS content
 * @param  {?Object} destinationDocument destination document; use when style applied in child window objects (iframe, child windows etc)
 */
TB.applyCssRules = function( idSelector, cssText, destinationDocument ) {
  var destination = destinationDocument || window.document;
  var style = destination.getElementById( idSelector );

  if ( !style ) {
    var container = destination;

    style = window.document.createElement( 'style' );
    style.id = idSelector;
    style.type = 'text/css';

    if ( destination instanceof Document ) {
      container = destination.head;
    }

    container.appendChild( style );
  }

  style.textContent = cssText;
};

/**
 * Converts selector and jsonCss object to CSS style definition
 * @param {DOMSelector} selector selector string
 * @param {Object<String, String>} jsonCss  object where keys are css properties and values are css values
 * @return {String} generated css style definition
 */
TB.JSON2CSS = function( selector, jsonCss ) {
  var resultCss = ' ';

  ASSERT.ofTbType( selector, 'string' );
  ASSERT.ofTbType( jsonCss, 'object' );

  resultCss += selector;
  resultCss += ' { ';

  for ( var cssProperty in jsonCss ) {
    ASSERT.ofTbType( cssProperty, 'string' );
    ASSERT.ofTbTypes( jsonCss[cssProperty], 'string|number' );

    resultCss += TB.camelCaseToDashes( cssProperty );
    resultCss += ': ';
    resultCss += jsonCss[cssProperty];
    resultCss += '; ';
  }
  resultCss += ' } ';

  return resultCss;
};

/**
 * Convert camel or pascal cased words to dashed string
 * @param  {String} str camel or pascal cased string
 * @return {String}     dashed string
 */
TB.camelCaseToDashes = function( str ) {
  return str.replace( /([a-z])([A-Z])/g, '$1-$2' ).toLowerCase();
};

/**
 * Convert underscored words to dashed string
 * @param  {String} str underscored string
 * @return {String}        dashed string
 */
TB.underscoreToDash = function( str ) {
  return str.replace( '_', '-' );
};

/**
 * Extends class with another one
 * @param  {Object} extendedClass  extended class
 * @param  {Object} extensionClass class to extend with
 * @return {Object}                extended class (NOTE: extendedClass argument is passed by reference, so it's already extended and it's === with return value)
 */
TB.classExtend = function( extendedClass, extensionClass ) {
  extendedClass.prototype = TB.merge( Object.create( extensionClass.prototype ), extendedClass.prototype );
  extendedClass.prototype.constructor = extendedClass;
  return extendedClass;
};

/**
 * Append query string to url
 * @param  {String} url         url
 * @param  {String} queryString query string to append
 * @return {String}             resulted url
 */
TB.urlAppend = function( url, queryString ) {
  return url + ( /\?/.test( url ) ? '&' : '?' ) + ( TB.isEmpty( queryString ) ? '' : queryString );
};

/**
 * Convert ISO like date to ISO date
 * @param  {String} date iso like string
 * @return {String}      iso date
 */
TB.normalizeDate = function( date ) {
  if ( !( date instanceof Date) && TB.isEmpty( date ) ) {
    return '';
  }

  if ( date instanceof String || typeof date === 'string' ) {
    date = date.replace( /(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/, '$1T$2' );
    date = new Date( date );
  }

  return date;
};


/**
 * Parse query params
 * @return {Object}
 */
TB.parseQueryParams = function() {
  var search = /([^&;=]+)=?([^&;]*)/g;
  var decode = function( s ) {
    return decodeURIComponent( s.replace( /\+/g, ' ' ) );
  };
  var query = window.location.search.substring( 1 );
  var urlParams = {};
  var match;

  while ( match = search.exec( query ) ) {
    urlParams[ decode( match[1] ) ] = decode( match[2] );
  }

  return urlParams;
};

/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @file setting up all debug utilities for applications
 * @module xerrors
 * @memberOf TB
 */

var traceData = [];
var benchmarkData = {};

/**
 * Very complicated to explain, please see the source
 * @todo refactor this hell
 * @param {...*} msgPartials message partials
 * @return {String} String
 */
function makeMsg( ) {
  // if single parameter, return it
  if ( arguments.length < 2 ) {
    return arguments[ 0 ];
  }

  var argsArr = TB.toArray( arguments );
  var typeOfScalar = ( TB.isBoolean( argsArr[ 0 ] ) ) ? argsArr.shift( ) : true;
  var baseStr = argsArr[ 0 ];
  var placeholdersCount = 0;

  if ( typeof baseStr !== 'string' ) {
    if ( typeof baseStr === 'number' && typeof baseStr.toString === 'function' ) {
      baseStr = baseStr.toString( );
    } else {
      var argsArrLength = argsArr.length;

      baseStr = '';

      while ( argsArrLength-- ) {
        baseStr += '%s ';
      }
    }
  }

  placeholdersCount = ( baseStr.match( /%[ sid ]/g ) || [] ).length;
  argsArr[ 0 ] = baseStr;

  for ( var i = 1, l = argsArr.length; i < l; i++ ) {
    var item = argsArr[ i ];
    var str = '';
    var type = '';

    if ( item === null ) {
      type = 'null';
    } else if ( item === undefined ) {
      type = 'undefined';
    } else if ( typeof item === 'number' ) {
      type = 'number';
      str += item;
    } else if ( typeof item === 'string' ) {
      type = 'string';
      str += item;
    } else if ( typeof item === 'function' ) {
      type = 'function';
      str += item.toString( );
    } else if ( TB.isBoolean( item ) ) {
      type = 'boolean';
      str += item;
    } else if ( TB.isDate( item ) ) {
      type = 'date';
      str += item.toISOString( );
    } else {
      type = typeof item;

      if ( typeof item === 'object' ) {
        if ( TB.isArray( item ) ) {
          type = 'array';
        }
      }

      try {
        str += JSON.stringify( item );
      } catch( e ) {
        str += 'error while stringifying object: ' + e.message;
      }
    }

    if ( i > placeholdersCount ) {
      argsArr[ 0 ] += TB.CONFIG.TRACE_ARGUMENTS_DELIMITER + '%s';
    }

    if ( !typeOfScalar && ( type === 'string' || type === 'number' ) ) {
      argsArr[ i ] = TB.CONFIG.TRACE_OPEN_PLACEHOLDER_STR + str + TB.CONFIG.TRACE_CLOSE_PLACEHOLDER_STR;
    } else {
      argsArr[ i ] = TB.CONFIG.TRACE_OPEN_TYPE_PLACEHOLDER_STR + ' ( ' + type + ' ) ' + str + ' ' + TB.CONFIG.TRACE_CLOSE_TYPE_PLACEHOLDER_STR;
    }

  }

  var k = 0;
  var result = argsArr.shift( )
    .replace( /%s/g, function( ) {
      return argsArr[ k++ ];
    } );

  return result;
}

/**
 * Traces content
 * @alias TRACE
 * @memberOf module:xerrors
 * @param {...(String|*)} msgPartials message partials for the trace {@link module:xerrors~makeMsg}
 * @todo optimize appending to localStorage by cashing current messages
 * @return {String} traced msg
 */
function trace() {
  var msgStr = makeMsg.apply( this, arguments );

  if ( TB.CONFIG.XERRORS_LOG_CONSOLE && window.console.log ) {
    console.log( msgStr );
  }

  if ( TB.CONFIG.XERRORS_LOG_LOCALSTORAGE && window.localStorage ) {
    var logSoFar = window.localStorage.getItem( '__TB_XERRORS__' ) || '';
    var log = logSoFar + msgStr;

    window.localStorage.setItem( '__TB_XERRORS__', log );
  }

  if ( TB.CONFIG.MAX_TRACE_LINES !== null && traceData.length >= TB.CONFIG.MAX_TRACE_LINES ) {
    traceData.shift( );
  }

  traceData.push( msgStr );

  return msgStr;
}

function throwError( ) {
  var argsArr = TB.toArray( arguments );
  var errMsgStr;
  var errObj;
  var errData = null;

  if ( TB.isObject(argsArr[0]) ) {
    errData = argsArr.shift();
  }

  argsArr.unshift( true );
  errMsgStr = makeMsg.apply( this, argsArr );
  errObj = new Error( errMsgStr );
  errObj.errData = errData;

  TB.LAST_ERROR = errObj;
  throw errObj;
}

function throwErrorWrapper( type ) {
  var errMsgStr = 'ERROR( ' + type + ' ) ';

  return function( ) {
    var argsArr = TB.toArray( arguments );

    if ( TB.typeof( argsArr[ 0 ] ) === 'string' ) {
      argsArr[ 0 ] = errMsgStr + argsArr[ 0 ];
    } else {
      argsArr.unshift( errMsgStr );
    }

    argsArr.unshift({
      throw: true,
      type: type,
    });

    return throwError.apply( this, argsArr );
  };
}


function assertWrapper( type ) {
  var func;
  /**
   * @alias ASSERT
   * @memberOf module:xerrors
   * @param {(Boolean|*)} condition condition to check of trueable
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @return {Boolean}
   */
  function assert( condition ) {
    if ( condition ) {
      return true;
    }

    var msgStr = 'ASSERT( ' + type + ' ) ';
    var argsArr = TB.toArray( arguments );

    argsArr[ 0 ] = true;


    msgStr += makeMsg.apply( this, argsArr );

    trace.call( this, msgStr );

    throwError( {
      assert: true,
      type: type,
    }, msgStr );

    return false;
  }

  function assertSugar( condition, parentArgsArr ) {
    var argsArr = TB.toArray( arguments );
    var msg = '';

    argsArr.splice( 0, 2, false );

    if ( parentArgsArr.length > 0 ) {
      parentArgsArr.unshift( false );
      msg += makeMsg.apply( this, parentArgsArr );
      msg += TB.CONFIG.ASSERTS_DEFAULT_MSG_DELIMITER;
    }

    msg += makeMsg.apply( this, argsArr );

    return assert( condition, msg );
  }

  if ( TB.CONFIG.ASSERTS_DISABLED ) {
    func = TB.cloneFunction( TB.noop );
    func.isDefined = TB.noop;
    func.isUndefined = TB.noop;
    func.hasProperty = TB.noop;
    func.hasPropertyOfTbType = TB.noop;
    func.hasPropertyOfTbTypes = TB.noop;
    func.ofTbType = TB.noop;
    func.ofTbTypes = TB.noop;
  } else {
    func = assert;
  }


  /**
   * Assert two values are equal
   * @alias ASSERT.eq
   * @memberOf  module:xerrors
   * @param {*} lOperand first value
   * @param {*} rOperand second value
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @return {Boolean}
   */
  assert.eq = function( lOperand, rOperand ) {
    return assertSugar( lOperand === rOperand, TB.toArray( arguments ).slice( 2 ), 'Value %s must be equal to %s', lOperand, rOperand );
  };

  /**
   * Assert first value is less than the second
   * @alias ASSERT.lt
   * @memberOf  module:xerrors
   * @param {*} lOperand first value
   * @param {*} rOperand second value
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @return {Boolean}
   */
  assert.lt = function( lOperand, rOperand ) {
    return assertSugar( lOperand < rOperand, TB.toArray( arguments ).slice( 2 ), 'Value %s must be less than %s', lOperand, rOperand );
  };

  /**
   * Assert first value is less or equal to the second
   * @alias ASSERT.le
   * @memberOf  module:xerrors
   * @param {*} lOperand first value
   * @param {*} rOperand second value
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @return {Boolean}
   */
  assert.le = function( lOperand, rOperand ) {
    return assertSugar( lOperand <= rOperand, TB.toArray( arguments ).slice( 2 ), 'Value %s must be less or equal to %s', lOperand, rOperand );
  };

  /**
   * Assert first value is greater than the second
   * @alias ASSERT.gt
   * @memberOf  module:xerrors
   * @param {*} lOperand first value
   * @param {*} rOperand second value
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @return {Boolean}
   */
  assert.gt = function( lOperand, rOperand ) {
    return assertSugar( lOperand > rOperand, TB.toArray( arguments ).slice( 2 ), 'Value %s must be greater than %s', lOperand, rOperand );
  };

  /**
   * Assert first value is greater or equal to the second
   * @alias ASSERT.ge
   * @memberOf  module:xerrors
   * @param {*} lOperand first value
   * @param {*} rOperand second value
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @return {Boolean}
   */
  assert.ge = function( lOperand, rOperand ) {
    return assertSugar( lOperand >= rOperand, TB.toArray( arguments ).slice( 2 ), 'Value %s must be greater or equal to %s', lOperand, rOperand );
  };

  /**
   * Assert value is defined
   * @alias ASSERT.isDefined
   * @memberOf  module:xerrors
   * @param {*} value value to check
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @return {Boolean}
   */
  assert.isDefined = function( value ) {
    return assertSugar( TB.isDefined( value ), TB.toArray( arguments ).slice( 1 ), 'Value must not be undefined for %s', value );
  };

  /**
   * Assert value is not defined
   * @alias ASSERT.isUndefined
   * @memberOf  module:xerrors
   * @param {*} value value to check
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @return {Boolean}
   */
  assert.isUndefined = function( value ) {
    return assertSugar( !TB.isDefined( value ), TB.toArray( arguments ).slice( 1 ), 'Value must be undefined, given "%s" for %s', typeof value, value );
  };

  /**
   * Assert value is empty
   * @alias ASSERT.isEmpty
   * @memberOf  module:xerrors
   * @param {*}  value value to check
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @return {Boolean}
   */
  assert.isEmpty = function( value ) {
    var msg = '';

    switch ( TB.typeof( value ) ) {
    case 'array':
      msg = makeMsg( 'Value must be array with no elements, given "%s" for %s', value.length, value );
      break;
    case 'object':
      msg = makeMsg( 'Value must be object without keys, given "%s" keys for %s', Object.keys( value ).join( ', ' ), value );
      break;
    default :
      msg = makeMsg( 'Value must be empty (null, undefined etc), given "%s"', value );
      break;
    }

    return assertSugar( TB.isEmpty( value ), TB.toArray( arguments ).slice( 1 ), msg );
  };

  /**
   * Assert value is empty
   * @alias ASSERT.isNotEmpty
   * @memberOf  module:xerrors
   * @param {*}  value value to check
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @return {Boolean}
   */
  assert.isNotEmpty = function( value ) {
    return assertSugar( !TB.isEmpty( value ), TB.toArray( arguments ).slice( 1 ), 'Value must not be empty (null, undefined, empty array, empty object etc), given empty with type "%s" for "%s"', TB.typeof( value ), value );
  };

  /**
   * Assert if object has own property
   * @alias ASSERT.hasProperty
   * @memberOf  module:xerrors
   * @param {Object}  value value to check
   * @param {String}  property property to check
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @return {Boolean}
   */
  assert.hasProperty = function( value, property ) {
    return assertSugar( TB.isObject( value ) && value.hasOwnProperty( property ), TB.toArray( arguments ).slice( 2 ), 'Value must have property "%s" for %s', property, value );
  };

  /**
   * Assert if value has own property of type
   * @alias ASSERT.hasPropertyOfTbTypes
   * @memberOf  module:xerrors
   * @param {Object}  value value to check
   * @param {String}  property property to check
   * @param {String} types types to check
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @see type is determined using {@link TB.typeof}
   * @return {Boolean}
   */
  assert.hasPropertyOfTbType = function( value, property, types ) {
    var typesArr;
    var tbType;
    var tbTypeProperty;

    if ( TB.isString( types ) ) {
      typesArr = types.split( TB.CONFIG.TYPE_DELIMITER );
    } else if ( TB.isArray( types ) ) {
      typesArr = types;
    } else {
      assert( false, 'Failed in assert: expected types to be string or array, but "%s" given for %s', types, value );
    }

    tbType = TB.typeof( value );
    tbTypeProperty = ( tbType === 'object' ) ? TB.typeof( value[ property ] ) : 'undefined';

    return assertSugar( tbType === 'object' && TB.contains( typesArr, tbTypeProperty ), TB.toArray( arguments ).slice( 3 ), 'Value must have property "%s" of any of types "%s", but "%s" given for %s', property, types, tbTypeProperty, value );
  };

  /**
   * Assert if value has own property of type
   * @alias ASSERT.hasPropertyOfTbTypes
   * @memberOf  module:xerrors
   * @param {Object}  value value to check
   * @param {String}  property property to check
   * @param {String} types types to check
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @see type is determined using {@link TB.typeof}
   * @return {Boolean}
   */
  assert.hasPropertyOfTbTypes = assert.hasPropertyOfTbType;

  /**
   * Assert if value of type
   * @alias ASSERT.ofTbType
   * @memberOf  module:xerrors
   * @param {Object}  value value to check
   * @param {String} types types to check
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @see type is determined using {@link TB.typeof}
   * @return {Boolean}
   */
  assert.ofTbType = function( value, types ) {
    var typesArr;
    var tbType;

    if ( TB.isString( types ) ) {
      typesArr = types.split( TB.CONFIG.TYPE_DELIMITER );
    } else if ( TB.isArray( type ) ) {
      typesArr = types;
    } else {
      assert( false, 'Failed in assert: expected types to be string or array, but "%s" given for %s', types, value );
    }
    tbType = TB.typeof( value );

    return assertSugar( TB.contains( typesArr, tbType ), TB.toArray( arguments ).slice( 2 ), 'Value must be of any of types "%s", but "%s" given for %s', types, tbType, value );
  };

  /**
     * Assert if value of type
     * @alias ASSERT.ofTbTypes
     * @memberOf  module:xerrors
     * @param {Object}  value value to check
     * @param {String} types types to check
     * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
     * @see type is determined using {@link TB.typeof}
     * @return {Boolean}
     */
  assert.ofTbTypes = assert.ofTbType;

  return assert;
}

/**
 * Traces content
 * @todo this function must really send http request one day
 * @deprecated it's not implemented yet
 * @alias FLUSH
 * @param {String} level DEBUG|NOTICE|WARNING|ERROR
 * @param {String} msg
 * @param {*} data
 * @memberOf module:xerrors
 * @return {object} promise
 */
var flush = function( level, msg, data ) {
  var data = {
    level: level || 'NOTICE',
    msg: msg || null,
    data: data,
    trace: traceData.join( '\r\n' ),
    browser: TB.Browser && TB.Browser.getFullInfo( ),
  };

  return TB.XERRORS_FLUSH(data);
};

/**
 * Starts a code benchmark
 * @alias BENCHMARK_START
 * @memberOf module:xerrors
 * @param  {String} [name] name of the benchmark; if not provided will be used the value of TB.CONFIG.DEFAULT_BENCHMARK_NAME
 */
var benchmarkStart = function( name ) {
  name = name || TB.CONFIG.DEFAULT_BENCHMARK_NAME;

  benchmarkData[ name ] = {
    start: new Date( ),
  };
  console.time( name );
  trace( 'Benchmark start %s at %s', name, benchmarkData[ name ].start );
};
/**
 * Starts a code benchmark
 * @alias BENCHMARK_END
 * @memberOf module:xerrors
 * @param  {String} [name] name of the benchmark; if not provided will be used the value of TB.CONFIG.DEFAULT_BENCHMARK_NAME
 */
var benchmarkEnd = function( name ) {
  name = name || TB.CONFIG.DEFAULT_BENCHMARK_NAME;

  if ( !benchmarkData.hasOwnProperty( name ) ) {
    return;
  }

  benchmarkData[ name ].end = new Date( );
  var period = benchmarkData[ name ].end - benchmarkData[ name ].start;

  console.timeEnd( name );
  trace( 'Benchmark end "%s" for %s ( %s|%s )', name, period, benchmarkData[ name ].start.toISOString( ), benchmarkData[ name ].end.toISOString( ) );
  delete benchmarkData[ name ];
};

var dataFlusher = function(flushData) {
  var promise = new Promise(TB.noop);
  var data = {
    cgi: 'cgi',
    api_key: TB.API_KEY,
    err_data: JSON.stringify(flushData),
    command: 'ui_trace',
  };

  if(TB.Request) {
    var reqSettings = {
      httpMethod: 'POST',
      url: TB.API_URL,
      data: data
    };

    promise = new TB.Request(reqSettings).promise;
  } else {
    promise = new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      var formData = new FormData();

      for(var k in data) {
        if(typeof data[k] === 'object') {
          data[k] = JSON.stringify(data[k]);
        }

        formData.append(k, data[k]);
      }

      xhr.open('POST', TB.API_URL, true);
      xhr.onload = function(event) {
          if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                  trace('Debug info successfully sent');
                  resolve();
              } else {
                  trace('Sending debug info failed with status ', xhr.statusText);
                  reject();
              }
          }
      };
      xhr.onerror = function(e) {
          trace('Sending debug info failed with status ', xhr.statusText);
      };

      xhr.send(formData);
    });
  }

  return promise;
};

var errorHandler = function(event) {
  var errData = null;
  var errMsg = 'Unexpected error';

  if(event.error === TB.LAST_ERROR) {
      errData = TB.LAST_ERROR.errData;
      errMsg = TB.LAST_ERROR.message;
  }

  TB.FLUSH('ERROR', errMsg, errData);

  TB.LAST_ERROR = null;
};

TB.TRACE = trace;
TB.ASSERT = assertWrapper( TB.CONFIG.ERR_SYS );
TB.ASSERT_PEER = assertWrapper( TB.CONFIG.ERR_PEER );
TB.ASSERT_USER = assertWrapper( TB.CONFIG.ERR_USER );
TB.THROW = throwErrorWrapper( TB.CONFIG.ERR_SYS );
TB.THROW_PEER = throwErrorWrapper( TB.CONFIG.ERR_PEER );
TB.THROW_USER = throwErrorWrapper( TB.CONFIG.ERR_USER );
TB.FLUSH = flush;
TB.BENCHMARK_START = benchmarkStart;
TB.BENCHMARK_END = benchmarkEnd;
TB.XERRORS_FLUSH = dataFlusher;
TB.ERROR_HANDLER = errorHandler;

if ( TB.CONFIG.DEBUG_IN_GLOBAL_SCOPE ) {
  var globalDebugFunctionNames = ['ASSERT', 'ASSERT_PEER', 'ASSERT_USER', 'TRACE', 'THROW', 'THROW_PEER', 'THROW_USER', 'FLUSH', 'BENCHMARK_START', 'BENCHMARK_END'];

  for ( var i = 0, l = globalDebugFunctionNames.length; i < l; i++ ) {
    var debugFunctionName = globalDebugFunctionNames[ i ];

    window[ debugFunctionName ] = TB[ debugFunctionName ];
  }
}


window.addEventListener('error', function(event) {
  TB.ERROR_HANDLER.apply(this, event);
});

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
 * TB.extendClass( ClassName, TB.Dispatcher );
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

    ASSERT.ofTbType( handler, 'function' );

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


TB.Dispatcher = Dispatcher;

window.DENSITY = 10;

/**
 * TB.Livegrid plugin
 * @constructor
 * @memberof TB
 * @alias TB.Livegrid
 * @augments Dispatch
 * @param {Object} settings init settings for the plugin
 * @param {( DOMSelector|DOMElement )} settings.element parent element of the plugin
 * @param {( DOMSelector|DOMElement )} settings.menuElement parent element of the menu
 * @param {Object.<String,InitTypeObject>} settings.types definition of types
 * @param {Boolean} [settings.externalControlMenu=false] DEPRECATED see hideInactiveMenu
 * @param {Boolean} [settings.hideInactiveMenu=false] do not show inactive menu
 * @param {Boolean} [settings.menuItems=['save', 'edit', 'resize', 'zoom', 'opacity']] if empty array or defined falsable value, do not show menu in active mode at all, else it's array of strings, explaining order and type of menu items. Possible values: 'zoom', 'resize', 'cancel', 'save', 'opacity'
 * @param {String} [settings.prefixClassName='tb-lg-class-'] prefix of all autogenerated class names
 * @param {?Object} settings.CSSJSON extend default tb.livegrid.css
 * @param {?String} settings.backgroundImage background image settings
 * @param {?String} settings.backgroundImage.src background image src
 * @param {?String} settings.backgroundImage.width background image width
 * @param {?String} settings.backgroundImage.height background image height
 * @param {?Object} settings.grid if falsable value, there is no grid
 * @param {Boolean} [settings.grid.isEditable=false] whether items are editable ( can be repositioned etc )
 * @param {Boolean} [settings.grid.isEnabled=true] if true, there would be a grid
 * @param {Boolean} [settings.grid.autoscale=false] if true, the grid autoscales to show all elements on the grid
 * @param {Boolean} [settings.grid.autoscaleUnpositionedOnly=true] if true, the grid autoscales only when there are unpositioned items
 * @param {Boolean} [settings.grid.autosize=false] DEPRECATED
 * @param {Boolean} [settings.grid.autoheight=true] set height automatically
 * @param {Boolean} [settings.grid.itemAutoscale=true] scale item's content until it fits
 * @param {Number} [settings.grid.itemWidth=100] width of a single item in pixels
 * @param {Number} [settings.grid.itemHeight=100] height of a single item in pixels
 * @param {Number} [settings.grid.minItemWidth=50] minumum width of a single item in pixels
 * @param {Number} [settings.grid.maxItemWidth=300] maximum width of a single item in pixels
 * @param {Number} [settings.grid.minItemHeight=50] minumum height of a single item in pixels
 * @param {Number} [settings.grid.maxItemHeight=300] maximum height of a single item in pixels
 * @param {Number} [settings.grid.stepZoom=0.1] step zoom level
 * @param {Number} [settings.grid.minZoom=0.1] minimum zoom level
 * @param {Number} [settings.grid.maxZoom=1] maximum zoom level
 * @param {Number} [settings.grid.stepOpacity=0.1] step opacity level
 * @param {Number} [settings.grid.minOpacity=0.5] minimum opacity level
 * @param {Number} [settings.grid.maxOpacity=1] maximum opacity level
 * @param {Number} [settings.grid.disableWheelZoom=false] disable mousewheel zoom
 * @param {Number} [settings.grid.disablePanningInNormalMode=true] enable map panning only in edit mode
 * @param {Number} [settings.grid.itemsBuffer=10] number of spare items from the left and bottom most items
 * @param {Number} [settings.grid.rotateDegStep=15] how many degrees to rotate clockwise on click on grid-item
 * @param {Number} [settings.grid.unpositionedItemsPerRow=20]
 * @param {Number} [settings.grid.unpositionedItemsBuffer=1]
 * @param {Array} [settings.data] block's data
 */
function Livegrid( settings, data ) {
  if ( !( this instanceof Livegrid ) ) {
    return new Livegrid( settings, data );
  }

  ASSERT.ofTbType( settings, 'object' );
  ASSERT.hasProperty( settings, 'element' );
  ASSERT.hasPropertyOfTbType( settings, 'types', 'object' );

  TB.Dispatcher.call( this );

  var defaultSettings = {
    element: null,
    menuElement: null,
    types: null,
    hideInactiveMenu: false,
    menuItems: ['save', 'edit', 'resizeH', 'resizeW', 'zoom', 'opacity', 'snap'],
    prefixClassName: 'tb-lg-class-',
    CSSJSON: TB.merge( {}, this.templates.CSSJSON ),
    backgroundImage: null,
    grid: {
      isEditable: false,
      isEnabled: false,
      autoscale: false,
      autoscaleUnpositionedOnly: true,
      autosize: false,
      itemAutoscale: true,
      itemWidth: 100,
      itemHeight: 100,
      minItemWidth: 50,
      maxItemWidth: 300,
      minItemHeight: 50,
      maxItemHeight: 300,
      stepZoom: 0.1,
      minZoom: 0.1,
      maxZoom: 1,
      stepOpacity: 0.1,
      minOpacity: 0.5,
      maxOpacity: 1,
      itemsBuffer: 10000,
      unpositionedItemsPerRow: 10,
      unpositionedItemsBuffer: 1,
      disableWheelZoom: false,
      rotateDegStep: 15,
      autoheight: true,
      disablePanningInNormalMode: true,
      // snapPrecision: 1,
    },
  };

  var mergedSettings = TB.merge( TB.merge( {}, defaultSettings ), settings );

  if ( settings.menuItems !== undefined ) {
    mergedSettings.menuItems = settings.menuItems;
  }

  /**
   * Keeps d3 selection container element, passed on initialization
   * @name TB.Livegrid#DOMel
   * @type {D3selection}
   */
  this.DOMel = null;
  /**
   * Keeps d3 selection container menu element, passed on initialization
   * @name TB.Livegrid#DOMmenuEl
   * @type {D3selection}
   */
  this.DOMmenuEl = null;
  /**
   * Wraps around blocks and background grid
   * @name TB.Livegrid#DOMwrapper
   * @type {D3selection}
   */
  this.DOMwrapper = null;
  /**
   * Wraps around blocks
   * @name TB.Livegrid#DOMitemsContainer
   * @type {D3selection}
   */
  this.DOMitemsContainer = null;
  /**
   * Navbar
   * @name TB.Livegrid#DOMnavbar
   * @type {D3selection}
   */
  this.DOMnavbar = null;
  /**
   * Edit button
   * @name TB.Livegrid#DOMbtnEdit
   * @type {D3Selection}
   */
  this.DOMbtnEdit = null;
  /**
   * Save button
   * @name TB.Livegrid#DOMbtnSave
   * @type {D3Selection}
   */
  this.DOMbtnSave = null;
  /**
   * Plugin DOM element width
   * @type {Number}
   */
  this.elWidth = null;
  /**
   * Plugin DOM element height
   * @type {Number}
   */
  this.elHeight = null;
  /**
   * Holdя settings of the plugin
   * @name TB.Livegrid#s
   * @type {Object}
   * @readonly
   */
  this.s = mergedSettings;
  /**
   * Flag is menu is disabled at all
   * @type {Boolean}
   */
  this.disableMenu = ( TB.isArray( this.s.menuItems ) )
    ? !( this.s.menuItems.length )
    : ( ( this.s.menuItems !== undefined )
      ? !!( this.s.menuItems )
      : true
      );
  /**
   * Map of defined block types
   * @name TB.Livegrid#types
   * @type {Object}
   */
  this.types = {};
  /**
   * Ordered CSS rules
   * @name TB.Livegrid#css
   * @type {Array}
   */
  this.css = [];
  /**
   * Objects list
   * @name TB.Livegrid#objList
   * @type {Array}
   */
  this.objList = [];
  /**
   * Objects hash map
   * @name TB.Livegrid#objList
   * @type {Object}
   */
  this.objHash = {};
  /**
   * Grid members holder
   * @name TB.Livegrid#g
   * @type {Object}
   * @property {Boolean} isEnabled grid to be drawn
   * @property {Boolean} editMode is in edit mode
   * @property {Boolean} snapMode is in snap mode, each element can be moved only from cell to cell
   * @property {Number} translateX translate position X axis
   * @property {Number} translateY translate position Y axis
   * @property {Number} minPositionedX minimum X coordinate of all current grid items
   * @property {Number} maxPositionedX maximum X coordinate of all current grid items
   * @property {Number} minPositionedY minimum Y coordinate of all current grid items
   * @property {Number} maxPositionedY maximum Y coordinate of all current grid items
   * @property {Number} colsCount number of grid columns
   * @property {Number} rowsCount number of grid rows
   * @property {Number} itemWidth width of single grid item
   * @property {Number} itemHeight height of single grid item
   * @property {Number} wrapperActiveWidth width of items wrapper (actual width of the whole grid)
   * @property {Number} wrapperActiveHeight width of items wrapper (actual height of the whole grid)
   * @property {Array} unpositionedElements unpositioned items without fixed place on the grid
   * @property {indexTable} indexTable index table for items with fixed coordinates
   * @property {indexTable} indexTableAll index table for items with calculated coordinates
   * @property {indexTable} indexTableSnapshot index table for items with temporary coordinates (in editMode)
   */
  this.g = {
    isEnabled: this.s.grid.isEnabled,
    editMode: false,
    snapMode: true,

    translateX: 0,
    translateY: 0,

    minPositionedX: null,
    maxPositionedX: null,
    minPositionedY: null,
    maxPositionedY: null,

    colsCount: this.s.grid.itemsBuffer,
    rowsCount: this.s.grid.itemsBuffer,

    itemWidth: this.s.grid.itemWidth,
    itemHeight: this.s.grid.itemHeight,

    wrapperActiveWidth: null,
    wrapperActiveHeight: null,

    unpositionedElements: [],
    hadUnpositionedElements: false,

    indexTable: [],
    indexTableAll: [],
    indexTableSnapshot: null,
  };
  /**
   * Timeouts map
   * @type {Object}
   */
  this._timeouts = {};
  /**
   * Flag if there is currently dragged item
   * @type {Object}
   */
  this.isDragging = false;



  this._init();


  if ( this.g.isEnabled ) {
    ASSERT.ofTbType( this.s.grid, 'object' );
    ASSERT.hasPropertyOfTbType( this.s.grid, 'itemWidth', 'number' );
    ASSERT.hasPropertyOfTbType( this.s.grid, 'itemHeight', 'number' );
    ASSERT.hasPropertyOfTbTypes( this.s.grid, 'linesWidth', 'number|undefined' );

    this._d3SetupGrid();
  }

  TB.applyCssRules( 'tb-lg-global-css', this._prepareGlobalCSS() );
  TB.applyCssRules( 'tb-lg-styles', this._stringifyCssRules() );

  this.emit( 'tb.lg.init', {
    instance: this,
  } );

  if ( data ) {
    this.updateItems( data );

    if ( this.g.isEnabled && this.s.grid.autoscale ) {

      if ( !this.s.grid.autoscaleUnpositionedOnly ) {
        this._gAutoscale();
      } else if ( this.g.hadUnpositionedElements ) {
        this._gAutoscale();
      }
    }

    if ( this.g.isEnabled && this.s.grid.autosize ) {
      this._gAutosize();
    }
  }
}

/** @lends TB.Livegrid.prototype */
Livegrid.prototype = {
  templates: {
    CSSJSON: {
      '.tb-lg-element': {
        'position': 'relative',
        'overflow': 'hidden'
      },
      '.tb-lg-element *': {
        'box-sizing': 'border-box',
        'padding': '0px',
        'margin': '0px'
      },
      '.tb-lg-element.tb-lg-panning': {
        'cursor': 'move'
      },
      '.tb-lg-resize': {
        'height': '100%',
        'position': 'relative',
        'overflow': 'visible'
      },
      '.tb-lg-wrapper': {
        'position': 'relative',
        'transform-origin': '0px 0px'
      },
      '.tb-lg-background': {
        'position': 'absolute',
        'top': 0,
        'left': 0,
        'z-index': -1
      },
      '.tb-lg-wrapper-container': {
        'height': '100%',
        'overflow': 'hidden'
      },
      '.tb-lg-element .tb-lg-navbar': {
        'height': '3.5rem',
        'display': 'initial'
      },
      '.tb-lg-navbar': {
        'position': 'absolute',
        'display': 'none',
        'left': '0px',
        'height': '0px',
        'top': '-2.5rem',
        'padding-bottom': '1rem 1rem',
        'background': 'rgba(0, 0, 0, 0.2)',
        'transition': '250ms all',
        'color': 'white',
        'font-family': 'sans-serif'
      },
      '.tb-lg-navbar:hover,\n        .tb-lg-navbar.tb-lg-active': {
        'height': '2.5rem',
        'padding': '0px',
        'top': '0px',
        'background': 'rgba(0, 0, 0, 0.8)',
        'transition': '250ms all'
      },
      '.tb-lg-navbar input[type=\'range\']': {
        'height': '5rem',
        'width': '1rem',
        'writing-mode': 'bt-lr',
        '/* IE */\n            -webkit-appearance': 'slider-vertical'
      },
      '.tb-lg-navbar .tb-lg-btn': {
        'height': '2.1rem'
      },
      '.tb-lg-navbar .tb-lg-btn[name=\'save\']:disabled': {
        'max-width': '0px',
        'padding': '0px',
        'border': 'none',
        'margin': '0px'
      },
      '.tb-lg-navbar .tb-lg-btn[name=\'save\']': {
        'max-width': '100px'
      },
      '.tb-lg-navbar:hover .tb-lg-subnavbar:hover .tb-lg-content': {
        'top': '2.5rem'
      },
      '.tb-lg-navbar:hover .tb-lg-subnavbar .tb-lg-content': {
        'top': '2.5rem'
      },
      '.tb-lg-navbar .tb-lg-subnavbar .tb-lg-content': {
        'top': '3.5rem'
      },
      '.tb-lg-subnavbar': {
        'display': 'inline-block',
        'position': 'relative'
      },
      '.tb-lg-subnavbar .tb-lg-content': {
        'height': '0px',
        'min-width': '100%',
        'overflow': 'hidden',
        'position': 'absolute',
        'transition': '250ms all',
        'background': 'rgba(0, 0, 0, 0.2)'
      },
      '.tb-lg-subnavbar:hover .tb-lg-content': {
        'height': '12rem',
        'background': 'rgba(0, 0, 0, 0.8)'
      },
      '.tb-lg-navbar table': {
        'text-align': 'center',
        'width': '100%',
        'vertical-align': 'middle'
      },
      '.tb-lg-navbar td': {
        'height': '1rem'
      },
      '.tb-lg-btn': {
        'display': 'inline-block',
        'font-size': '1rem',
        'font-weight': 'normal',
        'line-height': '1.9rem',
        'text-align': 'center',
        'white-space': 'nowrap',
        'vertical-align': 'middle',
        'touch-action': 'manipulation',
        'cursor': 'pointer',
        'user-select': 'none',
        'background-image': 'none',
        'background': 'rgba(255, 255, 255, 1)',
        'border': '1px outset rgba(180, 180, 180, 1)',
        'color': 'black',
        'padding': '1px 6px',
        'margin': '0rem 0.2rem'
      },
      '.tb-lg-btn:active, .tb-lg-btn.tb-lg-active': {
        'background': 'rgba(200, 200, 200, 1)',
        'border-style': 'inset'
      },
      '.tb-lg-items-container': {
        'position': 'relative'
      },
      '.tb-lg-item': {
        'display': 'inline-block',
        'overflow': 'auto'
      },
      '.tb-lg-element:not(.tb-lg-editing) .tb-lg-item .tb-lg-navbar': {
        'height': '0px'
      },
      '.tb-lg-element.tb-lg-editing .tb-lg-item .tb-lg-navbar': {
        'height': '0px'
      },
      '.tb-lg-element.tb-lg-griddable .tb-lg-item': {
        'position': 'absolute'
      },
      '.tb-lg-element.tb-lg-griddable .tb-lg-items-container': {
        'width': '100%',
        'height': '100%'
      },
      '.tb-lg-element.tb-lg-griddable .tb-lg-item .tb-lg-item-content': {
        'width': '100%',
        'height': '100%'
      },
      'svg.tb-lg-grid': {
        'position': 'absolute',
        'top': '0px',
        'left': '0px',
        'overflow': 'visible',
        'display': 'none'
      },
      'svg.tb-lg-grid line': {
        'stroke': 'rgb(6,120,155)',
        'stroke-width': '2px'
      },
      '.tb-lg-editing svg.tb-lg-grid': {
        'display': 'block'
      }
    },
    elContent: ' \
      <div class="tb-lg-resize"> \
        <div class="tb-lg-wrapper-container"> \
          <div class="tb-lg-wrapper"> \
            <div class="tb-lg-items-container"></div> \
          </div> \
        </div>\
        <div class="tb-lg-navbar"> \
          <button class="tb-lg-btn" name="edit" data-role="none" hidden="hidden">Edit</button> \
          <button class="tb-lg-btn" name="save" data-role="none" disabled="disabled">Save</button> \
          <button class="tb-lg-btn" name="snap" data-role="none" disabled="disabled">Snap</button> \
          <!-- <div class="tb-lg-subnavbar tb-lg-subnavbar-resize tb-lg-subnavbar-resize-both"> \
            <button type="button" class="tb-lg-btn" data-role="none">Resize</button> \
            <div class="tb-lg-content"> \
              <table> \
                <tr> \
                  <td data-name="w-value"></td> \
                  <td data-name="h-value"></td> \
                </tr> \
                <tr> \
                  <td><button type="button" class="tb-lg-btn" name="w-plus" data-role="none">+</button></td> \
                  <td><button type="button" class="tb-lg-btn" name="h-plus" data-role="none">+</button></td> \
                </tr> \
                <tr> \
                  <td><input type="range" name="w-slider" data-role="none" orient="vertical" /></td> \
                  <td><input type="range" name="h-slider" data-role="none" orient="vertical" /></td> \
                </tr> \
                <tr> \
                  <td><button type="button" class="tb-lg-btn" name="w-minus" data-role="none">-</button></td> \
                  <td><button type="button" class="tb-lg-btn" name="h-minus" data-role="none">-</button></td> \
                </tr> \
              </table> \
            </div> \
          </div> --> \
          <div class="tb-lg-subnavbar tb-lg-subnavbar-opacity"> \
            <button type="button" class="tb-lg-btn" data-role="none">O</button> \
            <div class="tb-lg-content"> \
              <table> \
                <tr> \
                  <td data-name="opacity-value"></td> \
                </tr> \
                <tr> \
                  <td><button type="button" class="tb-lg-btn" name="opacity-plus" data-role="none">+</button></td> \
                </tr> \
                <tr> \
                  <td><input type="range" name="opacity-slider" data-role="none" orient="vertical" /></td> \
                </tr> \
                <tr> \
                  <td><button type="button" class="tb-lg-btn" name="opacity-minus" data-role="none">-</button></td> \
                </tr> \
              </table> \
            </div> \
          </div> \
          <div class="tb-lg-subnavbar tb-lg-subnavbar-resize tb-lg-subnavbar-resize-w"> \
            <button type="button" class="tb-lg-btn" data-role="none">&#8596;</button> \
            <div class="tb-lg-content"> \
              <table> \
                <tr> \
                  <td data-name="w-value"></td> \
                </tr> \
                <tr> \
                  <td><button type="button" class="tb-lg-btn" name="w-plus" data-role="none">+</button></td> \
                </tr> \
                <tr> \
                  <td><input type="range" name="w-slider" data-role="none" orient="vertical" /></td> \
                </tr> \
                <tr> \
                  <td><button type="button" class="tb-lg-btn" name="w-minus" data-role="none">-</button></td> \
                </tr> \
              </table> \
            </div> \
          </div> \
          <div class="tb-lg-subnavbar tb-lg-subnavbar-resize tb-lg-subnavbar-resize-h"> \
            <button type="button" class="tb-lg-btn" data-role="none">&#8597;</button> \
            <div class="tb-lg-content"> \
              <table> \
                <tr> \
                  <td data-name="h-value"></td> \
                </tr> \
                <tr> \
                  <td><button type="button" class="tb-lg-btn" name="h-plus" data-role="none">+</button></td> \
                </tr> \
                <tr> \
                  <td><input type="range" name="h-slider" data-role="none" orient="vertical" /></td> \
                </tr> \
                <tr> \
                  <td><button type="button" class="tb-lg-btn" name="h-minus" data-role="none">-</button></td> \
                </tr> \
              </table> \
            </div> \
          </div> \
          <div class="tb-lg-subnavbar tb-lg-subnavbar-zoom"> \
            <span class="tb-lg-btnset"> \
              <button type="button" class="tb-lg-btn" data-role="none">Zoom</button> \
              <!-- <button type="button" class="tb-lg-btn" name="zoom-in" data-role="none">+</button> --> \
              <!-- <button type="button" class="tb-lg-btn" name="zoom-out" data-role="none">-</button> --> \
            </span> \
            <div class="tb-lg-content"> \
              <table> \
                <tr> \
                  <td data-name="zoom-value">x1</td> \
                </tr> \
                <tr> \
                  <td><button type="button" class="tb-lg-btn" name="zoom-in" data-role="none">+</button></td> \
                </tr> \
                <tr> \
                  <td><input type="range" name="scale-slider" data-role="none" orient="vertical" /></td> \
                </tr> \
                <tr> \
                  <td><button type="button" class="tb-lg-btn" name="zoom-out" data-role="none">-</button></td> \
                </tr> \
              </table> \
            </div> \
          </div> \
        </div>\
      </div>\
      ',
  },
  /**
   * Init function
   * @memberof Livegrid
   * @private
   * @instance
   */
  _init: function() {
    this._parseSettingsTypes();
    this._d3init();
  },
  /**
   * Parse settings types
   * @memberof Livegrid
   * @private
   * @instance
   */
  _parseSettingsTypes: function() {
    var types = this.s['types'];

    this.css[0] = this.css[0] || [];

    // Parse type, attribute, state and class definitions
    for ( var typeName in types ) {
      var rawTypeSettings = types[ typeName ];

      ASSERT.ofTbType( typeName, 'string' );
      ASSERT.hasPropertyOfTbType( rawTypeSettings, 'template', 'string' );
      ASSERT.hasPropertyOfTbType( rawTypeSettings, 'attributes', 'object' );
      ASSERT.hasPropertyOfTbType( rawTypeSettings, 'contents', 'object' );
      ASSERT.hasPropertyOfTbTypes( rawTypeSettings, 'cssjson', 'null|object' );

      var typeSettings = {
        name: typeName,
        template: rawTypeSettings.template,
        contentScaleSelector: rawTypeSettings.contentScaleSelector,
        attributesNameList: Object.keys( rawTypeSettings.attributes ),
        contentsNameList: Object.keys( rawTypeSettings.contents ),
        className: this.prefixClassName( typeName ),
        attributes: {},
        contents: {},
      };


      if ( rawTypeSettings.cssjson ) {
        this._parseCSSJSON( typeSettings.className, 0, rawTypeSettings.cssjson );
      }


      this.types[ typeName ] = typeSettings;


      for ( var contentName in rawTypeSettings.contents ) {
        ASSERT.ofTbType( contentName, 'string' );
        ASSERT.ofTbType( rawTypeSettings.contents[ contentName ], 'object' );
        ASSERT.hasPropertyOfTbType( rawTypeSettings.contents[ contentName ], 'selector', 'string' );
        ASSERT.hasPropertyOfTbTypes( rawTypeSettings.contents[ contentName ], 'property', 'string|undefined' );
        ASSERT.hasPropertyOfTbTypes( rawTypeSettings.contents[ contentName ], 'attribute', 'string|undefined' );
        ASSERT( TB.isEmpty( rawTypeSettings.contents[ contentName ].property ) || TB.isEmpty( rawTypeSettings.contents[ contentName ].attribute ) );


        var rawContentSettings = rawTypeSettings.contents[ contentName ];
        var contentSettings = {
          selector: rawContentSettings.selector,
          property: null,
          propertyArr: null,
          attribute: null,
        };


        if ( rawContentSettings.attribute ) {
          contentSettings.attribute = rawContentSettings.attribute;
        } else {
          contentSettings.property = rawContentSettings.property || 'textContent';
          contentSettings.propertyArr = contentSettings.property.split( '.' );
        }

        this.types[ typeName ].contents[contentName] = contentSettings;
      }


      for ( var attributeName in rawTypeSettings.attributes ) {
        ASSERT.ofTbType( attributeName, 'string' );
        ASSERT.ofTbType( rawTypeSettings.attributes[ attributeName ], 'object' );
        ASSERT.hasPropertyOfTbType( rawTypeSettings.attributes[ attributeName ], 'states', 'object' );
        ASSERT.hasPropertyOfTbType( rawTypeSettings.attributes[ attributeName ], 'priority', 'number' );
        ASSERT.gt( rawTypeSettings.attributes[ attributeName ].priority, 0 );


        var rawAttributeSettings = rawTypeSettings.attributes[ attributeName ];
        var attributeSettings = {
          name: attributeName,
          priority: parseInt( rawAttributeSettings.priority ),
          stateList: Object.keys( rawAttributeSettings.states ),
          stateClassNames: {},
        };


        typeSettings.attributes[attributeName] = attributeSettings;
        this.css[rawAttributeSettings.priority] = this.css[rawAttributeSettings.priority] || [];


        for ( var stateName in rawAttributeSettings.states ) {
          ASSERT.ofTbType( stateName, 'string' );
          ASSERT.ofTbType( rawAttributeSettings.states[ stateName ], 'object' );
          ASSERT.hasPropertyOfTbType( rawAttributeSettings.states[ stateName ], 'cssjson', 'object' );


          var rawStateSettings = rawAttributeSettings.states[ stateName ];
          var stateClassName = this.prefixClassName( [typeName, attributeName, stateName].join( '-' ) );


          attributeSettings.stateClassNames[ stateName ] = stateClassName;


          this._parseCSSJSON( stateClassName, rawAttributeSettings.priority, rawStateSettings.cssjson );
        }
      }
    }
  },
  /**
   * Converts JSON object to css and add it to this.css
   * @memberof Livegrid
   * @param {Object} cssjson JSON containing css // e.g. {".selector span": { borderColor: "red", "line-height": "2em"}}
   * @todo Support cssSelector containing comma // e.g. "p .something, div .something"
   */
  _parseCSSJSON: function( CSSnamespace, priority, cssjson ) {
    for ( var cssSelector in cssjson ) {
      ASSERT.ofTbType( cssSelector, 'string' );
      ASSERT.ofTbType( cssjson[cssSelector], 'object' );


      // Add empty space when not matching states ( :focus, :active, :hover, etc )
      var emptySpace = ( /^:/ ).test( cssSelector ) ? '' : ' ';
      var fullSelector = ['.' + CSSnamespace, emptySpace, cssSelector].join( '' );

      this.css[ priority ].push( {
        selector: fullSelector,
        originalSelector: cssSelector,
        cssjson: cssjson[ cssSelector ],
      } );
    }
  },
  /**
   * Set prefix to generated class names to prevent collision
   * @param  {String} className class name to prefix
   * @return {String}           Prefixed class name
   */
  prefixClassName: function( className ) {
    return ( ( TB.isString( this.s.prefixClassName ) ) ? this.s.prefixClassName : '' ) + className;
  },
  /**
   * Update element's coordinates with new value or use old ones
   * @param  {Object} rawObj raw update object data
   * @param  {Object} obj    object to get updated
   */
  _gUpdateItemCoordinates: function( rawObj, obj ) {
    ASSERT.eq( TB.isDefined( rawObj.x ), TB.isDefined( rawObj.y ), 'Both x and y must be either defined or undefined' );

    if ( TB.isDefined( rawObj.x ) ) {
      var swapObj = this._gGetItemAtIndex( rawObj.x, rawObj.y, this.g.indexTable );

      if ( swapObj === obj ) {
        return;
      }

      ASSERT( TB.isUndefined( swapObj ) || swapObj.lastUpdate !== obj.lastUpdate, 'Two elements have the same coordinates x: %s and y: %s for obj1 %s and obj2 %s', rawObj.x, rawObj.y, rawObj, swapObj );

      this._gRemoveItemAtIndex( obj.x, obj.y, this.g.indexTable );
      this._gSetItemAtIndex( rawObj.x, rawObj.y, obj, this.g.indexTable );
      this._gRemoveItemAtIndex( obj.x, obj.y, this.g.indexTableAll );
      this._gSetItemAtIndex( rawObj.x, rawObj.y, obj, this.g.indexTableAll );

      obj.xCalc = rawObj.x;
      obj.yCalc = rawObj.y;
      obj.x = rawObj.x;
      obj.y = rawObj.y;

      this._gUpdateMinMaxPositionedXY( obj.x, obj.y );

    } else if ( TB.isEmpty( obj.x ) ) {
      this.g.unpositionedElements.push( obj );
    } else {
      // TODO why this is empty?
    }
  },
  /**
   * Updates temporary coordinates for unpositioned items (items without X and Y
   * coordinates )
   */
  _gUpdateUnpositionedItemsCoordinates: function() {
    this.g.hadUnpositionedElements = (this.g.unpositionedElements.length > 0);

    if ( this.g.unpositionedElements.length === 0 ) {
      return;
    }

    var indexOfUnpositionedRow = ( this.g.unpositionedElements.length !== this.objList.length )
      ? ((this.g.maxPositionedY + this.s.grid.unpositionedItemsBuffer * this.g.itemHeight) / this.g.itemHeight)
      : 0;

    outerLoop: for ( var i = indexOfUnpositionedRow; true; i++ ) {
      innerLoop: for ( var j = 0; j < this.s.grid.unpositionedItemsPerRow; j++ ) {
        var el = this._gGetItemAtIndex( j, i, this.g.indexTable );

        if ( TB.isDefined( el ) ) {
          continue innerLoop;
        }

        var unpositionedItem = this.g.unpositionedElements.shift();

        if ( TB.isUndefined( unpositionedItem ) ) {
          break outerLoop;
        }

        var xCoord = j * this.g.itemWidth;
        var yCoord = i * this.g.itemHeight;

        unpositionedItem.xCalc = xCoord;
        unpositionedItem.yCalc = yCoord;

        this._gRemoveItemAtIndex( xCoord, yCoord, this.g.indexTableAll );
        this._gSetItemAtIndex( xCoord, yCoord, unpositionedItem, this.g.indexTableAll );
        this._gUpdateMinMaxPositionedXY( xCoord, yCoord );
      }
    }

    ASSERT.isEmpty( this.g.unpositionedElements );
  },
  /**
   * Event handler when zoom slider gets input
   */
  _handlerOnInputSliderZoom: function() {
    this.g.zoom.scale( TB.limitToRange( this.DOMsliderZoom[0][0].value, this.s.grid.minZoom, this.s.grid.maxZoom ) );
    this._gZoomCallback();
  },
  /**
   * Event handler zoom buttons clicked
   * @private
   */
  _handlerOnChangeSliderZoom: function() {
    this.g.zoom.scale( TB.limitToRange( this.DOMsliderZoom[0][0].value, this.s.grid.minZoom, this.s.grid.maxZoom ) );
    this._gZoomCallback();
  },
  /**
   * Event handler when zoom buttons are clicked
   * @private
   */
  _handlerOnClickBtnZoom: function() {
    switch ( d3.event.target.name ) {
    case 'zoom-in':
      this.DOMsliderZoom[0][0].stepUp();
      break;
    case 'zoom-out':
      this.DOMsliderZoom[0][0].stepDown();
      break;
    default:
      THROW( 'Unknown button' );
    }

    this.g.zoom.scale( TB.limitToRange( this.DOMsliderZoom[0][0].value, this.s.grid.minZoom, this.s.grid.maxZoom ) );
    this._gZoomCallback();
  },
  /**
   *
   **/
  _handlerOnInputSliderOpacity: function() {
    if( this.g.svgGrid ) {
      this.g.svgGrid.style( 'opacity', TB.limitToRange( this.DOMsliderOpacity[0][0].value, this.s.grid.minOpacity, this.s.grid.maxOpacity ) );
    }

    this.DOMitemsContainer.style( 'opacity', TB.limitToRange( this.DOMsliderOpacity[0][0].value, this.s.grid.minOpacity, this.s.grid.maxOpacity ) );
    this._d3UpdateOpacityValue();
  },
  /**
   *
   **/
  _handlerOnChangeSliderOpacity: function() {
    if( this.g.svgGrid ) {
      this.g.svgGrid.style( 'opacity', TB.limitToRange( this.DOMsliderOpacity[0][0].value, this.s.grid.minOpacity, this.s.grid.maxOpacity ) );
    }

    this.DOMitemsContainer.style( 'opacity', TB.limitToRange( this.DOMsliderOpacity[0][0].value, this.s.grid.minOpacity, this.s.grid.maxOpacity ) );
    this._d3UpdateOpacityValue();
  },
  /**
   *
   **/
  _handlerOnClickBtnOpacity: function() {
    switch ( d3.event.target.name ) {
    case 'opacity-plus':
      this.DOMsliderOpacity[0][0].stepUp();
      break;
    case 'opacity-minus':
      this.DOMsliderOpacity[0][0].stepDown();
      break;
    default:
      THROW( 'Unknown button' );
    }

    if( this.g.svgGrid ) {
      this.g.svgGrid.style( 'opacity', TB.limitToRange( this.DOMsliderOpacity[0][0].value, this.s.grid.minOpacity, this.s.grid.maxOpacity ) );
    }

    this.DOMitemsContainer.style( 'opacity', TB.limitToRange( this.DOMsliderOpacity[0][0].value, this.s.grid.minOpacity, this.s.grid.maxOpacity ) );
    this._d3UpdateOpacityValue();
  },
  /**
   * Event handler when resize slider gets input
   * @private
   */
  _handlerOnInputSliderResize: function() {
    this._gApplyResizeItems();
  },
  /**
   * Event handler when resize slider is changed
   * @private
   */
  _handlerOnChangeSliderResize: function() {
    this._gApplyResizeItems();
  },
  /**
   * Event handler when resize slider is mousewheeled
   * @private
   */
  _handlerOnMousewheelSliderResize: function() {
    d3.event.stopPropagation();
    d3.event.preventDefault();

    if ( d3.event.deltaY === 0 ) {
      return;
    } else if ( d3.event.deltaY > 0 ) {
      d3.event.target.stepUp( 5 );
    } else {
      d3.event.target.stepDown( 5 );
    }

    this._gApplyResizeItems();
  },
  /**
   * Event handler when resize items buttons are clicked
   * @private
   */
  _handlerOnClickBtnResize: function() {
    switch ( d3.event.target.name ) {
    case 'w-plus':
      this.DOMsliderWidth[0][0].stepUp();
      break;
    case 'w-minus':
      this.DOMsliderWidth[0][0].stepDown();
      break;
    case 'h-plus':
      this.DOMsliderHeight[0][0].stepUp();
      break;
    case 'h-minus':
      this.DOMsliderHeight[0][0].stepDown();
      break;
    default:
      THROW( 'Unknown button' );
    }

    this._gApplyResizeItems();
  },
  /**
   * Event handler when clear coordinates of item is clicked
   * @param  {Object} item item object
   */
  _handlerOnClickBtnClear: function( item ) {
    this._gRemoveItemAtIndex( item.x, item.y, this.g.indexTable );
    this._gRemoveItemAtIndex( item.x, item.y, this.g.indexTableAll );

    item.x = null;
    item.y = null;
  },
  /**
   * Apply resize of items in the grid
   * @private
   */
  _gApplyResizeItems: function() {
    var self = this;

    this.g.oldItemWidth = this.g.itemWidth;
    this.g.oldItemHeight = this.g.itemHeight;

    this.g.itemHeight = TB.limitToRange( this.DOMsliderHeight[0][0].value, this.s.grid.minItemHeight, this.s.grid.maxItemHeight );
    this.g.itemWidth = TB.limitToRange( this.DOMsliderWidth[0][0].value, this.s.grid.minItemWidth, this.s.grid.maxItemWidth );

    var xDiff = this.g.itemWidth - this.g.oldItemWidth;
    var yDiff = this.g.itemHeight - this.g.oldItemHeight;


    this.objList.forEach(function(obj) {
      var colIndex = Math.floor(obj.xCalcTemp / self.g.oldItemWidth);
      var rowIndex = Math.floor(obj.yCalcTemp / self.g.oldItemHeight);

      obj.xCalcTemp += xDiff * colIndex;
      obj.yCalcTemp += yDiff * rowIndex;
    });

    this._d3UpdateResizeValues();
    this._d3UpdateWrapper();
    this._d3UpdateBackgroundGrid();
    this._d3UpdateItems();
  },
  /**
   * Update grid's min and max positioned element coordinates
   * @private
   * @param  {Number} x check value for X axis
   * @param  {Number} y check value for Y axis
   */
  _gUpdateMinMaxPositionedXY: function( x, y ) {
    this.g.minPositionedX = ( x < this.g.minPositionedX || this.g.minPositionedX === null ) ? x : this.g.minPositionedX;
    this.g.minPositionedY = ( y < this.g.minPositionedY || this.g.minPositionedY === null ) ? y : this.g.minPositionedY;
    this.g.maxPositionedX = ( x > this.g.maxPositionedX || this.g.maxPositionedX === null ) ? x : this.g.maxPositionedX;
    this.g.maxPositionedY = ( y > this.g.maxPositionedY || this.g.maxPositionedY === null ) ? y : this.g.maxPositionedY;

    this.g.rowsCount = this.g.maxPositionedY + this.s.grid.itemsBuffer;
    this.g.colsCount = this.g.maxPositionedX + this.s.grid.itemsBuffer;
  },
  /**
   * Update grid's min and max positioned element coordinates to 0
   * @private
   */
  _gResetMinMaxPositionedXY: function( ) {
    this.g.minPositionedX = 0;
    this.g.minPositionedY = 0;
    this.g.maxPositionedX = 0;
    this.g.maxPositionedY = 0;

    this.g.rowsCount = this.s.grid.itemsBuffer;
    this.g.colsCount = this.s.grid.itemsBuffer;
  },
  /**
   * Autoscale container elements. Set's zoom level to value which allowes
   * displaying all elements in current container element size
   * @private
   */
  _gAutoscale: function() {
    var positionedElementsWidth = ( Math.floor( this.g.maxPositionedX / this.g.itemWidth ) - Math.floor( this.g.minPositionedX / this.g.itemWidth ) + 1 ) * this.g.itemWidth;
    var positionedElementsHeight = ( Math.floor( this.g.maxPositionedY / this.g.itemHeight ) - Math.floor( this.g.minPositionedY / this.g.itemHeight) + 1 ) * this.g.itemHeight;
    var scale = Math.min( this.elWidth / positionedElementsWidth, this.elHeight / positionedElementsHeight );

    this.g.translateX = this.g.minPositionedX * this.g.itemWidth;
    this.g.translateY = this.g.minPositionedY * this.g.itemHeight;

    this.g.zoom.scale( TB.limitToRange( scale, this.s.grid.minZoom, this.s.grid.maxZoom ) );
    this._gZoomCallback();
  },
  /**
   * Autosize containers element size (width and height). grid will be shown
   * with zoom level 1, even when screen size is not enough, so in most
   * cases it'll produce scrollbars to the window (or overflowed parent)
   * @deprecated Experimental feature, please do not use
   */
  _gAutosize: function() {
    var positionedElementsWidth = ( this.g.maxPositionedX - this.g.minPositionedX + 1 ) * this.g.itemWidth;
    var positionedElementsHeight = ( this.g.maxPositionedY - this.g.minPositionedY + 1 ) * this.g.itemHeight;

    this.g.translateX = this.g.minPositionedX * this.g.itemWidth;
    this.g.translateY = this.g.minPositionedY * this.g.itemHeight;

    this.g.zoom.scale( 1 );
    this._gUpdateElementSize( positionedElementsWidth, positionedElementsHeight );
    this._gZoomCallback();
  },
  /**
   * Updates container element size (width and height) with passed parameters
   * @private
   * @param {Number} width width in pixels
   * @param {Number} height height in pixels
   */
  _gUpdateElementSize: function( width, height ) {
    ASSERT.gt( width, 0 );
    ASSERT.gt( height, 0 );

    this.DOMel.style( 'width', TB.toPx( width ) );
    this.DOMel.style( 'height', TB.toPx( height ) );
  },
  /**
   * Set timeout to expire object
   * @param  {Object} obj [description]
   */
  _timeoutExpireObject: function( obj ) {
    obj.timeouts.expires = setTimeout( function() {
      var index = this.objList.indexOf( obj );

      if ( index < 0 ) {
        return;
      }

      delete this.objHash[ obj.id ];
      delete this._timeouts[ obj.expiresIn ][ obj.timeouts.expires ];

      this.objList.splice( index, 1 );

      this._gRemoveItemAtIndex( obj.x, obj.y, this.g.indexTable );
      this._gRemoveItemAtIndex( obj.x, obj.y, this.g.indexTableAll );

      if ( this.g.indexTableTemp ) {
        this._gRemoveItemAtIndex( obj.x, obj.y, this.g.indexTableTemp );
      }


      if ( Object.keys( this._timeouts[ obj.expiresIn ] ).length === 0 ) {
        this._d3UpdateItems();
      }
    }.bind( this ), obj.expiresIn * 1000 );

    this._timeouts[ obj.expiresIn ] = this._timeouts[ obj.expiresIn ] || {};
    this._timeouts[ obj.expiresIn ][ obj.timeouts.expires ] = true;
  },
  /**
   * Init DOM elements
   * @memberof Livegrid
   * @private
   * @instance
   */
  _d3init: function() {
    var self = this;
    var element = this.s.element;

    ASSERT( element instanceof HTMLElement || TB.isString( element ), 'Element must be an HTMLElement or string' );

    this.DOMel = d3.select( element )
      .classed( 'tb-lg-element', true )
      .html( this.templates.elContent );

    ASSERT( this.DOMel.length > 0 && this.DOMel[0] !== null, 'Element was not found for "%s"', element );

    this.DOMwrapper = this.DOMel.select( '.tb-lg-wrapper' );
    this.DOMitemsContainer = this.DOMwrapper.select( '.tb-lg-items-container' );
    this.DOMnavbar = this.DOMel.select( '.tb-lg-navbar' );

    this.elHeight = parseInt( this.DOMel.style( 'height' ), 10 );
    this.elWidth = parseInt( this.DOMel.style( 'width' ), 10 );


    if( this.s.backgroundImage && this.s.backgroundImage.src ) {
      var img = new Image();

      img.onload = function () {
        this.DOMwrapper.insert( 'img', ':first-child' )
          .classed( 'tb-lg-background', true )
          .attr( 'src', this.s.backgroundImage.src )
          .attr( 'width', this.s.backgroundImage.width || 'auto' )
          .attr( 'height', this.s.backgroundImage.height || 'auto' );
      }.bind(this);

      img.src = this.s.backgroundImage.src;
    }

    if ( !this.g.isEnabled || this.s.hideInactiveMenu || this.disableMenu ) {
      this.DOMnavbar.style( 'display', 'none' );
      // return;
    }

    var subnavbarZoom = this.DOMnavbar.select( '.tb-lg-subnavbar-zoom' ).style( 'display', 'none' );
    var subnavbarResizeBoth = this.DOMnavbar.select( '.tb-lg-subnavbar-resize-both' ).style( 'display', 'none' );
    var subnavbarResizeH = this.DOMnavbar.select( '.tb-lg-subnavbar-resize-h' ).style( 'display', 'none' );
    var subnavbarResizeW = this.DOMnavbar.select( '.tb-lg-subnavbar-resize-w' ).style( 'display', 'none' );
    var subnavbarOpacity = this.DOMnavbar.select( '.tb-lg-subnavbar-opacity' ).style( 'display', 'none' );

    this.DOMbtnEdit = this.DOMnavbar.select( '.tb-lg-btn[name="edit"]' );
    this.DOMbtnSave = this.DOMnavbar.select( '.tb-lg-btn[name="save"]' );
    this.DOMbtnSnap = this.DOMnavbar.select( '.tb-lg-btn[name="snap"]' );


    this.DOMnavbar.selectAll( '.tb-lg-subnavbar-zoom .tb-lg-btn' )
      .on( 'click', this._handlerOnClickBtnZoom.bind( this ) );


    this.DOMsliderZoom = this.DOMnavbar.select( '.tb-lg-subnavbar-zoom input[name="scale-slider"]' )
      .property( 'min', this.s.grid.minZoom )
      .property( 'max', this.s.grid.maxZoom )
      .property( 'step', this.s.grid.stepZoom )
      .property( 'value', Math.min( 1, this.s.grid.maxZoom ) )
      .on( 'input', this._handlerOnInputSliderZoom.bind( this ) )
      .on( 'change', this._handlerOnChangeSliderZoom.bind( this ) );


    this.DOMnavbar.selectAll( '.tb-lg-subnavbar-resize .tb-lg-content .tb-lg-btn' )
      .on( 'click', this._handlerOnClickBtnResize.bind( this ) );


    if ( this.s.menuElement ) {
      this.DOMmenuEl = d3.select( this.s.menuElement );
      this.DOMmenuEl[0][0].appendChild( this.DOMnavbar[0][0] );
    }


    this.DOMsliderZoomValue = this.DOMnavbar.selectAll( '.tb-lg-subnavbar-zoom .tb-lg-content [data-name="zoom-value"]' );
    this.DOMsliderOpacityValue = this.DOMnavbar.selectAll( '.tb-lg-subnavbar-opacity .tb-lg-content [data-name="opacity-value"]' );
    this.DOMsliderOpacityValue.text( (+this.s.grid.maxOpacity).toFixed(2) );

    this.DOMsliderHeightValue = this.DOMnavbar.selectAll( '.tb-lg-subnavbar-resize .tb-lg-content [data-name="h-value"]' )
      .text( this.g.itemHeight );

    this.DOMsliderHeight = this.DOMnavbar.selectAll( '.tb-lg-subnavbar-resize .tb-lg-content input[name="h-slider"]' )
      .property( 'min', this.s.grid.minItemHeight )
      .property( 'max', this.s.grid.maxItemHeight )
      .property( 'value', this.g.itemHeight )
      .on( 'input', this._handlerOnInputSliderResize.bind( this ) )
      .on( 'change', this._handlerOnChangeSliderResize.bind( this ) )
      .on( 'mousewheel', this._handlerOnMousewheelSliderResize.bind( this ) );

    this.DOMsliderWidthValue = this.DOMnavbar.selectAll( '.tb-lg-subnavbar-resize .tb-lg-content [data-name="w-value"]' )
      .text( this.g.itemWidth );

    this.DOMsliderWidth = this.DOMnavbar.selectAll( '.tb-lg-subnavbar-resize .tb-lg-content input[name="w-slider"]' )
      .property( 'min', this.s.grid.minItemWidth )
      .property( 'max', this.s.grid.maxItemWidth )
      .property( 'value', this.g.itemWidth )
      .on( 'input', this._handlerOnInputSliderResize.bind( this ) )
      .on( 'change', this._handlerOnChangeSliderResize.bind( this ) )
      .on( 'mousewheel', this._handlerOnMousewheelSliderResize.bind( this ) );

    this.DOMnavbar.selectAll( '.tb-lg-subnavbar-opacity .tb-lg-btn' )
      .on( 'click', this._handlerOnClickBtnOpacity.bind( this ) );

    this.DOMsliderOpacity = this.DOMnavbar.selectAll( '.tb-lg-subnavbar-opacity .tb-lg-content input[name="opacity-slider"]' )
      .property( 'min', this.s.grid.minOpacity )
      .property( 'max', this.s.grid.maxOpacity )
      .property( 'step', this.s.grid.stepOpacity )
      .property( 'value', this.s.grid.maxOpacity )
      .on( 'input', this._handlerOnInputSliderOpacity.bind( this ) )
      .on( 'change', this._handlerOnChangeSliderOpacity.bind( this ) );

    if ( this.g.isEnabled ) {
      this.DOMbtnEdit
        .on( 'click', this.toggleEditMode.bind(this) )
        .style( 'display', 'none' );

      this.DOMbtnSave
        .classed( 'tb-lg-btn', true )
        .attr( 'disabled', true )
        .style( 'display', 'none' )
        .text( 'Save' )
        .on( 'click', this.save.bind( this ) );

      this.DOMbtnSnap
        .classed( 'tb-lg-btn', true )
        .attr( 'disabled', true )
        .on( 'click', this.toggleSnapMode.bind(this) )
    }

    var menuItemsMap = {
      edit: this.DOMbtnEdit,
      save: this.DOMbtnSave,
      snap: this.DOMbtnSnap,
      zoom: subnavbarZoom,
      opacity: subnavbarOpacity,
      // resizeBoth: subnavbarResizeBoth, /** @todo implement */
      resizeH: subnavbarResizeH,
      resizeW: subnavbarResizeW,
    };

    for ( var i = 0, l = this.s.menuItems.length; i < l; i++ ) {
      var menuItem = this.s.menuItems[ i ];
      var DOMmenuItemElement = menuItemsMap[ menuItem ];

      if ( DOMmenuItemElement ) {
        DOMmenuItemElement.style( 'display', 'inline-block' );

        this.DOMnavbar[0][0]
          .appendChild( DOMmenuItemElement[0][0] );
      }
    }
  },
  /**
   * Update content of item's resize values shown in the upper navbar
   * @private
   */
  _d3UpdateResizeValues: function() {
    this.DOMsliderWidthValue.text( this.g.itemWidth );
    this.DOMsliderHeightValue.text( this.g.itemHeight );
  },
  /**
   * Update content of item's zoom value shown in the upper navbar
   * @private
   */
  _d3UpdateZoomValue: function() {
    this.DOMsliderZoomValue.text( 'x' + this.g.zoom.scale().toFixed( 2 ) );
  },
  /**
   * Update content of item's opacity value shown in the upper navbar
   * @private
   */
  _d3UpdateOpacityValue: function() {
    this.DOMsliderOpacityValue.text( (+this.DOMsliderOpacity[0][0].value).toFixed( 2 ) );
  },
  /**
   * Redraw background grid
   * @private
   */
  _d3UpdateBackgroundGrid: function() {
    var zoomedWrapperWidth = this.g.wrapperActiveWidth;
    var zoomedWrapperHeight = this.g.wrapperActiveHeight;
    var xaxiscoorddata = d3.range( 0, zoomedWrapperWidth, this.g.itemWidth );
    var yaxiscoorddata = d3.range( 0, zoomedWrapperHeight, this.g.itemHeight );
    var verticalLines = this.g.svgGrid.selectAll( 'line.vertical' )
      .data( xaxiscoorddata );
    var horizontalLines = this.g.svgGrid.selectAll( 'line.horizontal' )
      .data( yaxiscoorddata );

    verticalLines.exit().remove();
    verticalLines.enter().append( 'svg:line' )
      .classed( 'vertical', true )
      .attr( 'y1', 0 );
    verticalLines
      .attr( 'x1', this._returnDatum() )
      .attr( 'x2', this._returnDatum() )
      .attr( 'y2', zoomedWrapperHeight );


    horizontalLines.exit().remove();
    horizontalLines.enter().append( 'svg:line' )
      .classed( 'horizontal', true )
      .attr( 'x1', 0 );
    horizontalLines
      .attr( 'y1', this._returnDatum() )
      .attr( 'y2', this._returnDatum() )
      .attr( 'x2', zoomedWrapperWidth );

  },
  /**
   * Make grid zoomable using d3 zoom behaviour
   * @private
   */
  _d3GridZoomable: function() {
    var self = this;

    this.g.zoom = d3.behavior.zoom()
      .scaleExtent( [this.s.grid.minZoom, this.s.grid.maxZoom] )
      .on( 'zoom', this._gZoomCallback.bind( this ) );

    this.g.zoomDrag = d3.behavior.drag()
      .on( 'dragstart', function() {
        if ( self.s.grid.disablePanningInNormalMode && !self.g.editMode ) {
          return;
        }

        d3.event.sourceEvent.stopPropagation();
        self.DOMel.classed( 'tb-lg-panning', true );
      } )
      .on( 'drag', function() {
        if ( self.s.grid.disablePanningInNormalMode && !self.g.editMode ) {
          return;
        }

        var scale = self.g.zoom.scale();
        var values = '';

        self.g.translateX = TB.limitToRange( self.g.translateX + d3.event.dx, -Math.max( 0, self.g.wrapperActiveWidth * scale - self.elWidth ), 0 );
        self.g.translateY = TB.limitToRange( self.g.translateY + d3.event.dy, -Math.max( 0, self.g.wrapperActiveHeight * scale - self.elHeight ), 0 );

        values = [self.g.translateX, self.g.translateY].map( function( x ) { return TB.toPx( x ); } ).join( ',' );

        self.DOMwrapper.style( 'transform', 'translate( ' + values + ') scale( ' + scale + ')' );
      } )
      .on( 'dragend', function() {
        if ( self.s.grid.disablePanningInNormalMode && !self.g.editMode ) {
          return;
        }

        self.DOMel.classed( 'tb-lg-panning', false );
      } );


    this.DOMwrapper
      .on( 'mousedown.zoom', null );

    this.DOMwrapper
      .call( this.g.zoom )
      .on( 'mousedown.zoom', null )
      .on( 'touchstart.zoom', null )
      .on( 'touchmove.zoom', null )
      .on( 'touchmove.zoom', null )
      .on( 'dblclick.zoom', null )
      .call( this.g.zoomDrag );

    if ( this.s.grid.disableWheelZoom ) {
      this.DOMwrapper
        .on( 'wheel.zoom', null );
    }
  },
  /**
   * Maked grid's items draggable (changing their position)
   * @private
   * @todo support swapping two objects
   * @todo support draging items out of current visible grid
   */
  _d3GridItemsDraggable: function() {
    var self = this;

    var dragStart = {
      x: 0,
      y: 0
    };

    this.g.D3dragItems = d3.behavior.drag()
      .on( 'dragstart', function() {
        d3.event.sourceEvent.stopPropagation();
        self.DOMel.classed( 'tb-lg-dragging', true );
        d3.select( this ).classed( 'tb-lg-active', true );

        var coords = d3.mouse(this);

        dragStart.x = coords[0];
        dragStart.y = coords[1];
      } )
      .on( 'drag', function() {
        var scale = self.g.zoom.scale();
        var obj = self.objHash[ d3.select( this ).data()[0].id ];

        // TODO когато е завъртян елемента, се получава леко изместване, трябва да се отчита завъртането също!
        var tempX = d3.event.x - dragStart.x;
        var tempY = d3.event.y - dragStart.y;
        var newX;
        var newY;

        if(self.g.snapMode) {
          newX = TB.limitToRange( Math.floor( tempX / self.g.itemWidth / scale ), 0, self.g.colsCount ) * self.g.itemWidth;
          newY = TB.limitToRange( Math.floor( tempY / self.g.itemHeight / scale ), 0, self.g.rowsCount ) * self.g.itemHeight;
        } else {
          newX = TB.limitToRange( Math.floor( tempX / scale ), 0, self.g.colsCount );
          newY = TB.limitToRange( Math.floor( tempY / scale ), 0, self.g.rowsCount );
        }

        var swapObj = self._gGetItemAtIndex( newX, newY, self.g.indexTableTemp );

        self.isDragging = true;

        if ( !obj ) {
          return;
        }

        if ( newX === obj.xCalcTemp && newY === obj.yCalcTemp ) {
          return;
        }

        if ( TB.isDefined( swapObj ) && swapObj !== obj ) {
          return;
        }

        self._gRemoveItemAtIndex( obj.xCalcTemp, obj.yCalcTemp, self.g.indexTableTemp );
        self._gSetItemAtIndex( newX, newY, obj, self.g.indexTableTemp );

        obj.xCalcTemp = newX;
        obj.yCalcTemp = newY;

        d3.select( this )
          .style( 'left', TB.toPx( newX ) )
          .style( 'top', TB.toPx( newY ) );
      } )
      .on( 'dragend', function() {
        setTimeout(function() {
          self.isDragging = false;
        });

        d3.event.sourceEvent.stopPropagation();
        self.DOMel.classed( 'tb-lg-dragging', false );
        d3.select( this ).classed( 'tb-lg-active', false );
      } );
  },
  /**
   * Updates wrapper size (width and height) by given values or set it to best
   * size to show all content
   * @private
   * @param {?Number} width width in pixels
   * @param {?Number} height height in pixels
   */
  _d3UpdateWrapper: function( width, height ) {
    if ( TB.isEmpty( width ) ) {
      var itemsPerRowZoom = Math.ceil( ( this.elWidth / this.g.itemWidth ) / this.s.grid.minZoom );

      this.g.wrapperActiveWidth = Math.max( itemsPerRowZoom, this.g.rowsCount ) * this.g.itemWidth;
    } else {
      this.g.wrapperActiveWidth = width;
    }

    if ( TB.isEmpty( height ) ) {
      var itemsPerColZoom = Math.ceil( ( this.elHeight / this.g.itemHeight ) / this.s.grid.minZoom );

      this.g.wrapperActiveHeight = Math.max( itemsPerColZoom, this.g.colsCount ) * this.g.itemHeight;
    } else {
      this.g.wrapperActiveHeight = height;
    }

    this.DOMwrapper
      .style( 'width', TB.toPx( this.g.wrapperActiveWidth ) )
      .style( 'height', TB.toPx( this.g.wrapperActiveHeight ) );

    if ( this.elHeight === 0 && this.s.grid.autoheight ) {
      var newHeight = 2 * this.g.itemHeight;

      this.elHeight = newHeight;
      this.DOMel.style( 'height', TB.toPx( newHeight ) );
    }
  },
  /**
   * Executes when grid is enabled.
   * @private
   */
  _d3SetupGrid: function() {
    this.DOMel
      .classed( 'tb-lg-griddable', true );

    this.g.svgGrid = this.DOMwrapper.insert( 'svg', ':first-child' )
        .classed( 'tb-lg-grid', true );

    this._d3UpdateWrapper();
    this._d3UpdateBackgroundGrid();
    this._d3GridZoomable();


    if ( this.s.grid.isEditable ) {
      this._d3GridItemsDraggable();
    }
  },
  /**
   * After zoom apply new X and Y translation to wrapper
   * @private
   */
  _gZoomCallback: function() {
    var scale = this.g.zoom.scale();
    // if ( d3.event.translate ) {
    //     this.g.translateX = TB.limitToRange( -d3.event.translate[0] + this.elWidth / 2 * scale, -Math.max(0, this.g.wrapperActiveWidth * scale - this.elWidth ), 0);
    //     this.g.translateY = TB.limitToRange( -d3.event.translate[1] + this.elHeight / 2 * scale, -Math.max(0, this.g.wrapperActiveHeight * scale - this.elHeight ), 0);
    // } else {
    // }

    this.g.translateX = TB.limitToRange( this.g.translateX + this.elWidth / 2 * scale, -Math.max( 0, this.g.wrapperActiveWidth * scale - this.elWidth ), 0 );
    this.g.translateY = TB.limitToRange( this.g.translateY + this.elHeight / 2 * scale, -Math.max( 0, this.g.wrapperActiveHeight * scale - this.elHeight ), 0 );

    var translateValues = [this.g.translateX, this.g.translateY];
    var values = translateValues.map( function( x ) { return TB.toPx( -Math.abs( x ) ); } ).join( ',' );
    var transform = 'scale( ' + scale + ' ) translate( ' + values + ' )';

    this._d3UpdateZoomValue();
    this.DOMsliderZoom.property( 'value', scale );
    this.DOMwrapper
      .style( 'transform', transform );

  },
  /**
   * Prepare global css for use
   * @return {String} generated css
   */
  _prepareGlobalCSS: function () {
    var css = '';

    for ( var selector in this.s.CSSJSON ) {
      var attributes = this.s.CSSJSON[ selector ];

      css += TB.JSON2CSS( selector, attributes );
    }

    return css;
  },
  /** Convert css array to string
   * @private
   * @return {String}
   */
  _stringifyCssRules: function() {
    var cssText = '';

    this.css.forEach( function( priorityLevel ) {
      priorityLevel.forEach( function( cssRule ) {
        var resultCss = TB.JSON2CSS( cssRule.selector, cssRule.cssjson );

        cssText += resultCss;
      } );
    } );

    return cssText;
  },

  /**
   * D3 helper - return datum value by path
   * @private
   * @param  {?(String|Array)} path property path
   * @return {*}      value
   */
  _returnDatum: function( path ) {
    if ( path ) {
      return function( d ) {
        return TB.get( d, path );
      };
    } else {
      return function( d ) {
        return d;
      };
    }
  },
  /**
   * @deprecated
   */
  updateElements: function() {
    alert( '"instance.updateElements" is now deprecated, please use "instance.updateItems"' );
    this.updateItems.apply( this, arguments );
  },
  /**
   * Refresh plugin data
   * @param  {Array} data list of objects to update
   */
  updateItems: function( data ) {
    ASSERT.ofTbType( data, 'array' );

    var currentObjHash = {};
    var lastUpdate = new Date();

    this.objList = this.objList;

    this._gResetMinMaxPositionedXY();

    for ( var i = 0, l = data.length; i < l; i++ ) {
      ASSERT.ofTbType( data[i], 'object' );
      ASSERT.hasPropertyOfTbTypes( data[ i ], 'id', 'string|number' );
      ASSERT.hasPropertyOfTbType( data[ i ], 'type', 'string' );
      ASSERT.hasPropertyOfTbType( data[ i ], 'attributes', 'object' );
      ASSERT( currentObjHash[ data[ i ].id ] === undefined, 'Expected different id\'s for each object when updating data' );
      ASSERT( TB.contains( Object.keys( this.types ), data[i].type ), 'Expected different id\'s for each object when updating data' );


      var obj;
      var attributeName;
      var rawObj = data[i];

      if ( this.objHash[rawObj.id] ) {
        obj = this.objHash[rawObj.id];
      } else {
        obj = {
          id: rawObj.id,
          type: null,
          statusClassNames: null,
          typeObj: this.types[rawObj.type],
          attributes: {},
          contents: {},
          x: null,
          y: null,
          xCalc: null,
          yCalc: null,
          xCalcTemp: null,
          yCalcTemp: null,
          lastUpdate: null,
          firstUpdate: lastUpdate,
          expiresIn: null,
          rotateDeg: null,
          rotateDegCalcTemp: null,
          timeouts: {},
        };

        this.objHash[rawObj.id] = obj;
        this.objList.push( obj );
      }

      obj.statusClassNames = 'tb-lg-item-content ' + obj.typeObj.className + ' ';
      obj.type = rawObj.type;
      obj.lastUpdate = lastUpdate;


      if ( !TB.isEmpty( rawObj.expiresIn ) ) {
        ASSERT.ofTbType( rawObj.expiresIn, 'number' );

        obj.expiresIn = rawObj.expiresIn;

        this._timeoutExpireObject( obj );
      } else {
        obj.expiresIn = null;
      }

      // Update rotateDeg only if it's not in edit mode
      if ( !this.g.editMode ) {
        // Check if `rotateDeg` is defined on raw object. `rotateDeg` are the degrees used to rotate each element clockwise
        if ( !TB.isEmpty( rawObj.rotateDeg ) ) {
          ASSERT.ofTbType( rawObj.rotateDeg, 'number' );

          obj.rotateDeg = rawObj.rotateDeg || obj.rotateDeg;
          obj.rotateDegCalcTemp = rawObj.rotateDeg;
        } else {
          obj.rotateDeg = 0;
          obj.rotateDegCalcTemp = obj.rotateDegCalcTemp || 0;
        }
      }


      for ( attributeName in rawObj.attributes ) {
        ASSERT.hasPropertyOfTbType( rawObj.attributes, attributeName, 'string' );
        ASSERT( TB.contains( this.types[obj.type].attributesNameList, attributeName ), 'Expected known "attribute" for type "' + obj.type + '" for each object while updating data' );
        ASSERT( TB.contains( this.types[obj.type].attributes[ attributeName ].stateList, rawObj.attributes[ attributeName ] ), 'Expected known "state" for attribute "' + attributeName + '", type "' + obj.type + '" for each object when updating data' );

        var statusName = rawObj.attributes[attributeName];

        obj.attributes[attributeName] = statusName || obj.attributes[attributeName];
      }


      for ( attributeName in obj.attributes ) {
        obj.statusClassNames += ' ' + obj.typeObj.attributes[attributeName].stateClassNames[obj.attributes[attributeName]];
      }


      for ( var contentName in rawObj.contents ) {
        ASSERT.ofTbType( contentName, 'string' );
        ASSERT.hasPropertyOfTbTypes( rawObj.contents, contentName, 'string|number' );
        ASSERT( TB.contains( this.types[obj.type].contentsNameList, contentName ), 'Expected known "content" for type "' + obj.type + '" for each object while updating data' );

        obj.contents[ contentName ] = rawObj.contents[ contentName ];
      }

      if ( this.g.isEnabled && ( obj.lastUpdate === obj.firstUpdate || !this.g.editMode ) ) {
        this._gUpdateItemCoordinates( rawObj, obj );
      }

      this._gUpdateMinMaxPositionedXY( obj.x, obj.y );

      currentObjHash[rawObj.id] = obj;
    }

    if ( this.g.isEnabled ) {
      this._gUpdateUnpositionedItemsCoordinates();
      this._d3UpdateWrapper();
      this._d3UpdateBackgroundGrid();
    }

    this._d3UpdateItems();

    if ( this.g.isEnabled && this.s.grid.autoscale && !this.g.editMode ) {
      if( !this.s.grid.autoscaleUnpositionedOnly ) {
        this._gAutoscale();
      } else if ( this.g.hadUnpositionedElements ) {
        this._gAutoscale();
      }
    }
  },
  /**
   * Emit event for listeners
   * @param  {String} eventName name of the dispatched event
   * @param  {*} data      event data
   */
  emit: function( eventName, data ) {
    var event = new CustomEvent( eventName, {
      detail: data,
      bubbles: false,
      cancable: false,
    } );

    this.dispatch( eventName, data );
    this.DOMwrapper.node()
      .dispatchEvent( event );
  },
  /**
   * Get item at given posion in given index table
   * @private
   * @param  {Number} x          x
   * @param  {Number} y          y
   * @param  {indexTable} indexTable index table to search in
   * @return {?Object}            found element at given position
   */
  _gGetItemAtIndex: function( x, y, indexTable ) {
    indexTable[y] = indexTable[y] || [];
    return indexTable[y][x] || null;
  },
  /**
   * Helper function converting degrees to radians
   * @param {Number} deg degrees
   * @return {Number} radians
   **/
  _deg2rad: function(deg) {
    return deg * (Math.PI / 180);
  },
  /**
   * Return array of possible adjacent items
   * @private
   * @param  {Number} x          x
   * @param  {Number} y          y
   * @param  {indexTable} indexTable index table to search in
   * @return {Array}            found elements adjavent to given position
   **/
  _getPossibleAdjacentItemsRelativeToIndex: function( x, y, indexTable) {
    var foundItems = [];
    var diag = Math.floor(Math.sqrt(Math.pow(this.g.itemWidth, 2) + Math.pow(this.g.itemHeight, 2)));
    var xStart = Math.max(0, x - diag);
    var xEnd = x + diag + this.g.itemWidth;
    var yStart = Math.max(0, y - diag);
    var yEnd = y + diag + this.g.itemHeight;

    for(var xTest = xStart; xTest <= xEnd; xTest++) {
      for(var yTest = yStart; yTest <= yEnd; yTest++) {
        if(indexTable[xTest] && indexTable[xTest][yTest] && yTest !== y && xTest !== x) {
          foundItems.push(indexTable[xTest][yTest]);
        }
      }
    }

    return foundItems;
  },
  /**
   * Remove item at given position in given index table
   * @private
   * @param  {Number} x          x
   * @param  {Number} y          y
   * @param  {indexTable} indexTable index table to search in
   * @return {Boolean}            result of delete operator
   */
  _gRemoveItemAtIndex: function( x, y, indexTable ) {
    indexTable[y] = indexTable[y] || [];
    return delete indexTable[y][x];
  },
  /**
   * Set item at given position in given index table
   * @private
   * @param  {Number} x          x
   * @param  {Number} y          x
   * @param  {Object} value      item at this position
   * @param  {indexTable} indexTable indexTable to set in
   * @return {Object}            positioned item
   */
  _gSetItemAtIndex: function( x, y, value, indexTable ) {
    indexTable[y] = indexTable[y] || [];
    indexTable[y][x] = value;
    return value;
  },
  toggleSnapMode: function() {
    if ( this.g.snapMode ) {
      this.disableSnapMode();
    } else {
      this.enableSnapMode();
    }
  },
  enableSnapMode: function() {
    this.g.snapMode = true;

    this.emit( 'tb.lg.toggleSnap', {
      instance: this,
      isSnapMode: true,
    } );

    this.emit( 'tb.lg.enableSnap', {
      instance: this,
    } );
  },
  disableSnapMode: function() {
    this.g.snapMode = false;

    this.emit( 'tb.lg.toggleSnap', {
      instance: this,
      isSnapMode: false,
    } );

    this.emit( 'tb.lg.disableSnap', {
      instance: this,
    } );
  },
  /**
   * Toggle edit mode of the grid
   * @private
   */
  toggleEditMode: function() {
    if ( this.g.editMode ) {
      this.disableEditMode();
    } else {
      this.enableEditMode();
    }
  },
  /**
   * Enable edit mode of the grid
   * @private
   */
  enableEditMode: function() {
    TRACE( 'Add drag behavior' );
    var self = this;

    this.g.editMode = true;

    this.emit( 'tb.lg.toggleEdit', {
      instance: this,
      isEditMode: true,
    } );

    this.emit( 'tb.lg.enableEdit', {
      instance: this,
    } );

    this.DOMitemsContainer
      .selectAll( 'div.tb-lg-item' )
      .on('click.rotateDeg', function() {
        if ( d3.event.defaultPrevented || self.isDragging ) return;

        var obj = self.objHash[ d3.select( this ).data()[0].id ];

        obj.rotateDegCalcTemp += self.s.grid.rotateDegStep;

        self._d3UpdateItems();
      })
      .call( this.g.D3dragItems );

    this.DOMel.classed( 'tb-lg-editing', true );

    if ( !this.disableMenu ) {
      this.DOMnavbar.style( 'display', 'initial' );
      this.DOMnavbar.classed( 'tb-lg-active', true );

      this.DOMbtnSave.attr( 'disabled', null );
      this.DOMbtnSnap.attr( 'disabled', null );
      this.DOMbtnEdit.text( 'Cancel' );
    }

    this.g.indexTableTemp = TB.merge( [], this.g.indexTableAll );

    for ( var i = 0, l = this.objList.length; i < l; i++ ) {
      this.objList[ i ].xCalcTemp = this.objList[ i ].xCalc;
      this.objList[ i ].yCalcTemp = this.objList[ i ].yCalc;
    }
  },
  /**
   * Disable edit mode of the grid
   * @private
   */
  disableEditMode: function() {
    TRACE( 'Remove the drag behavior' );
    this.g.editMode = false;

    this.emit( 'tb.lg.toggleEdit', {
      instance: this,
      isEditMode: false,
    } );

    this.emit( 'tb.lg.disableEdit', {
      instance: this,
    } );

    this.DOMitemsContainer
      .selectAll( 'div.tb-lg-item' )
      .on( '.drag', null )
      .on('click.rotateDeg', null);

    if ( !this.disableMenu ) {
      this.DOMbtnSave.attr( 'disabled', 'disabled' );
      this.DOMbtnEdit.text( 'Edit' );

      this.DOMnavbar.style( 'display', ( this.s.hideInactiveMenu ) ? 'none' : 'initial' );
      this.DOMnavbar.classed( 'tb-lg-active', false );
    }

    this.DOMel.classed( 'tb-lg-editing', false );

    this.g.indexTableTemp = null;

    for ( var i = 0, l = this.objList.length; i < l; i++ ) {
      delete this.objList[ i ].xCalcTemp;
      delete this.objList[ i ].yCalcTemp;
      delete this.objList[ i ].rotateDegCalcTemp;
    }

    this._d3UpdateItems();
  },
  /**
   * Programatically set size of items
   * @public
   */
  setItemsSize: function( height, width ) {
    if ( TB.isNumber( height ) ) {
      this.DOMsliderHeight[0][0].value = TB.limitToRange( height, this.s.grid.minItemHeight, this.s.grid.maxItemHeight );
    }

    if ( TB.isNumber( width ) ) {
      this.DOMsliderWidth[0][0].value = TB.limitToRange( width, this.s.grid.minItemWidth, this.s.grid.maxItemWidth );
    }

    this._gApplyResizeItems();
  },
  /**
   * Programatically set grid zoom
   * @public
   */
  setGridZoom: function( scale ) {
    this.g.zoom.scale( TB.limitToRange( scale, this.s.grid.minZoom, this.s.grid.maxZoom ) );
    this._gZoomCallback();
  },
  /**
   * Save grid coordinates
   * @private
   */
  save: function() {
    ASSERT.ofTbType( this.g.indexTableTemp, 'array' );

    var result = [];

    for ( var i = 0, l = this.objList.length; i < l; i++ ) {
      var obj = this.objList[ i ];
      var objCoords = {};

      obj.rotateDeg = ( TB.isEmpty(obj.rotateDegCalcTemp) ) ? obj.rotateDeg : obj.rotateDegCalcTemp;

      objCoords.id = obj.id;
      objCoords.rotateDeg = obj.rotateDeg;

      this._gRemoveItemAtIndex( obj.xCalc, obj.yCalc, this.g.indexTableAll );

      if ( obj.xCalcTemp === obj.xCalc && obj.yCalcTemp === obj.yCalc ) {
        // if ( TB.isDefined( obj.x ) && TB.isDefined( obj.x ) ) {
        objCoords.x = obj.x || obj.xCalc || obj.xCalcTemp;
        objCoords.y = obj.y || obj.yCalc || obj.yCalcTemp;

        // } else {
        //   objCoords.x = null;
        //   objCoords.y = null;
        // }
      } else {
        var swapObj = this._gGetItemAtIndex( obj.x, obj.y, this.g.indexTable );

        if ( swapObj === obj ) {
          this._gRemoveItemAtIndex( obj.x, obj.y, this.g.indexTable );
          this._gRemoveItemAtIndex( obj.x, obj.y, this.g.indexTableAll );
        }

        obj.x = obj.xCalcTemp;
        obj.y = obj.yCalcTemp;
        obj.xCalc = obj.xCalcTemp;
        obj.yCalc = obj.yCalcTemp;

        objCoords.x = obj.x;
        objCoords.y = obj.y;

        this._gSetItemAtIndex( obj.x, obj.y, obj, this.g.indexTable );
        this._gSetItemAtIndex( obj.x, obj.y, obj, this.g.indexTableAll );
      }

      result.push( objCoords );
    }


    this.emit( 'tb.lg.saveData', {
      instance: this,
      coordinates: result,
      settings: {
        itemHeight: +this.g.itemHeight,
        itemWidth: +this.g.itemWidth,
        elHeight: parseInt( this.DOMel.style( 'height' ), 10 ),
        zoom: this.g.zoom.scale(),
      },
    } );

    this._d3UpdateItems();
  },
  /**
   * Update items contents
   * @private
   * @param  {Array} objectsD3 array of d3 data
   */
  _d3UpdateItemContents: function( objectsD3 ) {
    return function( d, i ) {
      var objDOM = objectsD3[0][i];

      for ( var contentName in d.contents ) {
        var contentSettings = d.typeObj.contents[contentName];
        var contentDOM = objDOM.querySelector( contentSettings.selector );

        if ( contentSettings.attribute ) {
          contentDOM.setAttribute( contentSettings.attribute, d.contents[ contentName ] );
        } else {
          if ( contentSettings.propertyArr.length === 1 ) {
            contentDOM[ contentSettings.property ] = d.contents[ contentName ];
          } else {
            TB.set( contentDOM, contentSettings.propertyArr, d.contents[contentName] );
          }
        }
      }
    };
  },
  /**
   * Update items DOM
   * @private
   */
  _d3UpdateItems: function() {
    var self = this;
    var objectsD3 = this.DOMitemsContainer
      .selectAll( 'div.tb-lg-item' )
      .data( self.objList, this._returnDatum( 'id' ) );
    var exited = objectsD3.exit().remove();
    var entered = objectsD3.enter()
      .append( 'div' )
      .classed( 'tb-lg-item', true )
      .attr( 'data-tb-lg-id', function( d ) { return d.id; } )
      .append( 'div' )
      .classed( 'tb-lg-item-content', true )
      .html( this._returnDatum( 'typeObj.template' ) );
    var itemNavbar = entered
      .append( 'div' )
      .classed( 'tb-lg-navbar', true );


    objectsD3
      .select( '.tb-lg-item-content' )
      .attr( 'class', this._returnDatum( 'statusClassNames' ) )
      .each( this._d3UpdateItemContents( objectsD3 ) );

    if ( this.g.isEnabled ) {
      itemNavbar
        .append( 'button' )
        .classed( 'tb-lg-btn', true )
        .classed( 'tb-lg-btn-clear', true )
        .text( 'Clear' )
        .on( 'click', this._handlerOnClickBtnClear.bind( this ) );


      objectsD3
        .select( '.tb-lg-btn-clear' )
        .property( 'disabled', function( d ) { return TB.isEmpty( d.x ); } );


      objectsD3
        .style( 'width', TB.toPx( this.g.itemWidth ) )
        .style( 'height', TB.toPx( this.g.itemHeight ) );


      objectsD3
        .style( 'left', function( d ) {
          var x = ( TB.isEmpty( d.xCalcTemp ) ? d.xCalc : d.xCalcTemp );

          return TB.toPx( x  );
        } )
        .style( 'top', function( d ) {
          var y = ( TB.isEmpty( d.yCalcTemp ) ? d.yCalc : d.yCalcTemp );

          return TB.toPx( y );
        } );


        var t = new Date().getTime();

      objectsD3
        .style( 'transform-origin', 'center center' )
        .style( 'transform', function(d) {
          var rotateDeg = ( TB.isEmpty( d.rotateDegCalcTemp ) ? d.rotateDeg : d.rotateDegCalcTemp );
          return 'rotate(' + rotateDeg + 'deg)';
        } );


      if ( this.s.grid.itemAutoscale ) {
        objectsD3
          .each( function( d ) {
            if ( !d.typeObj.contentScaleSelector ) {
              return;
            }

            setTimeout( function() {
              var scaleFactor;
              var scaleFactorX = this.clientWidth / this.offsetWidth;
              var scaleFactorY = this.clientHeight / this.offsetHeight;
              var skip = true;

              if ( this.clientWidth < this.scrollWidth ) {
                skip = false;
                scaleFactorX = this.clientWidth / this.scrollWidth;
              }

              if ( this.clientHeight < this.scrollHeight ) {
                skip = false;
                scaleFactorY = this.clientHeight / this.scrollHeight;
              }

              scaleFactor = Math.min( scaleFactorX, scaleFactorY ) - 0.05;

              if ( skip ) {
                return;
              }

              var elements = this.querySelectorAll( d.typeObj.contentScaleSelector );

              d3.selectAll( elements )
                .style( 'transform', 'scale(' + scaleFactor + ')' )
                .style( 'transform-origin', 'top left' );
            }.bind( this ) );
          } );
      }
    }
  },
};



TB.Livegrid = Livegrid;
TB.classExtend( TB.Livegrid, TB.Dispatcher );

/**
 * D3 selection
 * @typedef {Array} D3selection
 */
/**
 * String that is valid CSS selector
 * @typedef {String} DOMSelector
 */
/**
 * Object that is instance of DOMElement
 * @typedef {Object} DOMElement
 */
/**
 * @typedef {Object} InitTypeObject
 * @property {String} template HTML template of the item
 * @property {Object.<String,InitContentObject>} contents contents replacement definitions
 * @property {Object.<String,InitAttributeSetting>} attributes attributes definitions
 */
/**
 * @typedef {Object} InitContentObject
 * @property {DOMSelector} selector selector used to find proper DOM element in item's template
 * @property {PropertyPath} property which property of DOM element to be applied with new content
 */
/**
 * @typedef {Object} InitAttributeSetting
 * @property {Integer} priority defines which attribute styles are stronger. If two attribute's states set different colors, the attribute with higher priority wins.
 * @property {Object.<String,InitStateSetting>} states states definitions
 */
/**
 * @typedef {Object} InitStateSetting
 * @property {Object.<DOMSelector,String>} cssjson
 */
/**
 * @typedef {String} CSSColor
 * @example
 *    rgb( 6,120,155 ); rgba( 6,120,155, 1 ); #131314; #333; royalblue
 */
/**
 * Two dimensional array containing the indexed items on the grid
 * @typedef {Array} indexTable
 * @example
 * var item = {x: 10, y: 20};
 * var indexTable = [ [] ];
 * indexTable[ y ] = indexTable[ y ] || [];
 * indexTable[ y ][ x ] = item; // Now indexTable[20][10] contains item positioned on this coordinates
 */
})( typeof window === "undefined" ? this : window );
