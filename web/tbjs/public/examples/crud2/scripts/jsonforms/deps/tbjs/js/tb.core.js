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
})( typeof window === "undefined" ? this : window );
