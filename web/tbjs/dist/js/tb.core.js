/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @desc Telebid's js heart
 * @module TB
 * @memberOf TB
 */
(function(root, factory) {
  root.TB = root.TB || {};

  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(root.TB, require('lodash'));
  } else if (typeof define === 'function' && define.amd) {
    define(['lodash'], function() {
      return (root.TB = factory(root.TB, root._));
    });
  } else {
    root.TB = factory(root.TB, root._);
  }
})(this, function(TB, _) {
  'use strict';

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

  TB.CONFIG.WHITELISTED_ERROR_SOURCES = [];

  TB.CONFIG.ERR_PEER = 'TbPeerError';
  TB.CONFIG.ERR_PEER_PREFIX = 'PEER_ERROR';
  TB.CONFIG.PEER_ERROR_AUDIT_TYPE_ID = 2;
  TB.CONFIG.AUDIT_LEVEL_WARN = 4;

  TB.CONFIG.ERR_ASSERT_PEER = 'TbAssertPeerError';
  TB.CONFIG.ERR_ASSERT_PEER_PREFIX = 'ASSERT_PEER_FAILED';
  TB.CONFIG.ASSERT_PEER_AUDIT_TYPE_ID = 60;
  TB.CONFIG.AUDIT_LEVEL_ERR = 3;

  TB.CONFIG.ERR_USER = 'TbUserError';
  TB.CONFIG.ERR_USER_PREFIX = 'USER_ERROR';
  TB.CONFIG.USER_ERROR_AUDIT_TYPE_ID = 50;
  TB.CONFIG.AUDIT_LEVEL_INFO = 6;

  TB.CONFIG.ERR_SYS = 'TbSysError';
  TB.CONFIG.ERR_SYS_PREFIX = 'TEMP_APP_ERROR';
  TB.CONFIG.SYS_AUDIT_TYPE_ID = 80;
  TB.CONFIG.AUDIT_LEVEL_ERR = 3;

  TB.CONFIG.ERR_APP = 'TbAppError';
  TB.CONFIG.ERR_APP_PREFIX = 'ASSERT_FAILED';
  TB.CONFIG.ASSERT_AUDIT_TYPE_ID = 1;
  TB.CONFIG.AUDIT_LEVEL_ERR = 3;

  TB.CONFIG.ERR_CONFIG = 'TbConfigError';
  TB.CONFIG.ERR_CONFIG_PREFIX = 'CONF_ERROR';
  TB.CONFIG.CONFIG_AUDIT_TYPE_ID = 4;
  TB.CONFIG.AUDIT_LEVEL_ERR = 3;

  TB.CONFIG.ERR_OPEN_CONN = 'TbOpenConnError';
  TB.CONFIG.ERR_OPEN_CONN_PREFIX = 'CONN_OPEN_ERROR';
  TB.CONFIG.IO_AUDIT_TYPE_ID = 70;
  TB.CONFIG.AUDIT_LEVEL_ERR = 3;

  TB.CONFIG.ERR_IO_CONN = 'TbConnIOError';
  TB.CONFIG.ERR_IO_CONN_PREFIX = 'CONN_IO_ERROR';
  TB.CONFIG.IO_AUDIT_TYPE_ID = 70;
  TB.CONFIG.AUDIT_LEVEL_ERR = 3;

  TB.CONFIG.ERR_UNKNOWN = 'TbUnknownError';
  TB.CONFIG.ERR_UNKNOWN_PREFIX = 'TEMP_APP_ERROR';
  TB.CONFIG.SYS_AUDIT_TYPE_ID = 80;
  TB.CONFIG.AUDIT_LEVEL_ERR = 3;

  TB.CONFIG.KEEP_ORIGINAL_MSGS = false;
  TB.CONFIG.SERVICE_AUDIT_TYPE_ID = 3;

  TB.CONFIG.DEBUG_IN_GLOBAL_SCOPE = true;
  TB.CONFIG.ASSERTS_DISABLED = false;
  TB.CONFIG.ASSERTS_DEFAULT_MSG_DELIMITER = ' ';
  TB.CONFIG.TYPE_DELIMITER = '|';
  TB.CONFIG.TRACE_ARGUMENTS_DELIMITER = ' ';
  TB.CONFIG.TRACE_OPEN_PLACEHOLDER_STR = '';
  TB.CONFIG.TRACE_CLOSE_PLACEHOLDER_STR = '';
  TB.CONFIG.TRACE_OPEN_PLACEHOLDER_STR = '[[ ';
  TB.CONFIG.TRACE_CLOSE_PLACEHOLDER_STR = ' ]]';
  TB.CONFIG.TRACE_OPEN_TYPE_PLACEHOLDER_STR = '(';
  TB.CONFIG.TRACE_CLOSE_TYPE_PLACEHOLDER_STR = ')';
  TB.CONFIG.EMPTY_DATE = '';
  TB.CONFIG.XHR_RETRY_MS = 5000;
  TB.CONFIG.ENV = 'dev';
  TB.CONFIG.HAS_WINDOW = typeof window !== 'undefined';
  TB.CONFIG.MAX_TRACE_LINES = 1000;
  TB.CONFIG.MAX_TRACE_LINE_LENGTH = 10000;
  TB.CONFIG.INTERFACE_NAME = '';

  TB.CONFIG.XERRORS_LOG_CONSOLE =
    typeof TB.CONFIG.XERRORS_LOG_CONSOLE !== 'undefined'
      ? TB.CONFIG.XERRORS_LOG_CONSOLE
      : true;
  TB.CONFIG.XERRORS_LOG_LOCALSTORAGE =
    typeof TB.CONFIG.XERRORS_LOG_LOCALSTORAGE !== 'undefined'
      ? TB.CONFIG.XERRORS_LOG_LOCALSTORAGE
      : false;
  TB.CONFIG.XERRORS_LOG_LOCALSTORAGE_NAME = '__TB_XERRORS__';
  TB.CONFIG.XERRORS_DEFAULT_CODE = '0000';
  TB.CONFIG.XERRORS_DEFAULT_MSG = 'Application error!';

  TB.CONFIG.RETRY_TIMES = 10;
  TB.CONFIG.RETRY_INTERVAL = 1000;

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
    };
  })();

  TB.isPositiveInteger = function isPositiveInteger(x) {
    // http://stackoverflow.com/a/1019526/11236
    return /^\d+$/.test(x);
  };

  TB.isCompatibleVersion = function isCompatibleVersion(ver1, ver2) {
    var ver1parts = ver1.split('.');
    var ver2parts = ver2.split('.');

    function validateParts(parts) {
      for (var i = 0; i < parts.length; ++i) {
        if (!TB.isPositiveInteger(parts[i])) {
          return false;
        }
      }
      return true;
    }

    if (!validateParts(ver1parts) || !validateParts(ver2parts)) {
      return false;
    }

    if (ver1parts.length != ver2parts.length) {
      return false;
    }

    if (ver1parts[0] > ver2parts[0]) {
      return false;
    }

    for (var i = 1; i < ver1parts.length; ++i) {
      if (ver2parts.length === i) {
        return true;
      }

      if (ver1parts[i] >= ver2parts[i]) {
        continue;
      }

      return false;
    }

    if (ver1parts.length != ver2parts.length) {
      return false;
    }
  };

  /**
   * If object has length property
   * @param {*} obj object to check
   * @return {Boolean} true if has property length
   */
  TB.isArrayLike = function(obj) {
    var length = TB.isString(obj) ? obj.length : TB.get(obj, 'length');

    if (Number.MAX_SAFE_INTEGER > 0) {
      return (
        typeof length === 'number' &&
        length >= 0 &&
        length <= Number.MAX_SAFE_INTEGER
      );
    } else {
      return typeof length === 'number' && length >= 0;
    }
  };

  /**
   * Convert to array
   * @param  {*} obj iteratable object
   * @return {Array}
   */
  TB.toArray = function(obj) {
    if (TB.isUndefined(obj)) {
      return [];
    }
    if (TB.isArray(obj)) {
      return Array.prototype.slice.call(obj, 0);
    }

    if (TB.isArrayLike(obj)) {
      return TB.map(obj, function(value) {
        return value;
      });
    }
    return TB.values(obj);
  };

  /**
   * Map over object
   * @param  {Object} obj      object to map
   * @param  {Function} iteratee function to fire
   * @param  {*} [context]  context for iteratee function
   * @return {Array}          results
   */
  TB.map = function(obj, iteratee, context) {
    var keys = !TB.isArrayLike(obj) && Object.keys(obj);
    var length = (keys || obj).length;
    var results = Array(length);

    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;

      results[index] = iteratee.bind(context || this)(
        obj[currentKey],
        currentKey,
        obj
      );
    }
    return results;
  };

  /**
   * Convert object to array of it's property values
   * @param {Object} obj object
   * @return {Array} list of property values
   */
  TB.values = function(obj) {
    var keys = Object.keys(obj);
    var result = [];

    for (var i = 0; i < keys.length; i++) {
      var val = obj[keys[i]];

      result.push(val);
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
  TB.toPx = function(value) {
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
  TB.get = function(obj, path, defaultValue) {
    var pathArr = typeof path === 'string' ? path.split('.') : path;

    return pathArr.reduce(function(prev, curr) {
      return prev && prev[curr] !== undefined ? prev[curr] : defaultValue;
    }, obj);
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
  TB.set = function(obj, path, value) {
    var a = typeof path === 'string' ? path.split('.') : path;
    var o = obj;

    for (var i = 0; i < a.length - 1; i++) {
      var n = a[i];

      if (n in o) {
        o = o[n];
      } else {
        o[n] = {};
        o = o[n];
      }
    }
    o[a[a.length - 1]] = value;

    return value;
  };

  /**
   * Clone function
   * @param  {Function} fn function to clone
   * @return {Function}      cloned function
   */
  TB.cloneFunction = function(fn) {
    var temp = function temporary() {
      return fn.apply(this, arguments);
    };

    for (var key in fn) {
      if (fn.hasOwnProperty(key)) {
        temp[key] = fn[key];
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
  TB.assign = function(obj1, obj2) {
    for (var key in obj2) {
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
  TB.merge = function(destination, source) {
    for (var property in source) {
      if (
        source[property] &&
        source[property].constructor &&
        source[property].constructor === Object
      ) {
        destination[property] = destination[property] || {};
        TB.merge(destination[property], source[property]);
      } else if (
        source[property] &&
        source[property].constructor &&
        source[property].constructor === Array
      ) {
        destination[property] = destination[property] || [];
        TB.merge(destination[property], source[property]);
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
  TB.isBetween = function(value, down, up, inclusive) {
    return inclusive
      ? value >= down && value <= up
      : value > down && value < up;
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
  TB.limitToRange = function(value, down, up) {
    if (value > up) {
      return up;
    } else if (value < down) {
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
  TB.contains = function(arr, item) {
    return arr.indexOf(item) >= 0;
  };

  /**
   * Checks if value is a boolean
   * @param  {*}  value value to check
   * @return {Boolean}       true if value is a boolean
   */
  TB.isBoolean = function(value) {
    return typeof value === 'boolean';
  };

  /**
   * Checks if value is a number
   * @param  {*}  value value to check
   * @return {Boolean}       true if value is a number
   */
  TB.isNumber = function(value) {
    return typeof value === 'number' || value instanceof Number;
  };

  /**
   * Checks if value is defined
   * @param  {*}  value         value to check
   * @param  {Boolean}  nullIsDefined treat null as defined value
   * @return {Boolean}               true if value is defined
   */
  TB.isDefined = function(value, nullIsDefined) {
    return nullIsDefined
      ? typeof value !== 'undefined'
      : typeof value !== 'undefined' && value !== null;
  };

  /**
   * Checks if value is not defined
   * @param  {*}  value         value to check
   * @param  {Boolean}  nullIsDefined treat null as defined value
   * @return {Boolean}               true if value is not defined
   */
  TB.isUndefined = function(value, nullIsDefined) {
    return !TB.isDefined(value, nullIsDefined);
  };

  /**
   * Checks if value is object
   * @param  {*}  value value to check
   * @return {Boolean}       true if value is an object
   */
  TB.isObject = function(value) {
    return value === Object(value);
  };

  /**
   * Checks if value is a sting
   * @param  {*}  value value to check
   * @return {Boolean} true if value is a string
   */
  TB.isString = function(value) {
    return typeof value === 'string';
  };

  /**
   * Checks if value is a function
   * @param  {*}  value value to check
   * @return {Boolean}       true if values is a function
   */
  TB.isFunction = function(value) {
    return typeof value === 'function';
  };
  /**
   * Checks if object is a date
   * @param  {*}  date value to check
   * @return {Boolean}      true if value is instance of Date
   */
  TB.isDate = function(value) {
    return value && typeof value === 'object' && value.constructor === Date;
  };

  /**
   * Checks if object is an array
   * @param  {*}  arr value to check
   * @return {Boolean} true if values is an array
   */
  TB.isArray = function(value) {
    return value && typeof value === 'object' && value.constructor === Array;
  };

  /**
   * Checks if value is empty
   * @param  {*}  value value to check
   * @return {Boolean}       true if value is NaN,
   * infinity, null, undefined, empty string, empty array, empty object
   */
  TB.isEmpty = function(value) {
    switch (TB.typeof(value)) {
      case 'NaN':
      case 'infinity':
      case 'null':
      case 'undefined':
        return true;
      case 'string':
        return value === '';
      case 'array':
        return value.length <= 0;
      case 'object':
        return Object.keys(value).length <= 0;
      default:
        return false;
    }
  };
  /**
   * Custom typeof
   * @param  {*} val value to check type
   * @return {String}     any of types object, array, null, NaN, infinity, number, string, symbol, undefined, boolean, function
   */
  TB.typeof = function(val) {
    switch (typeof val) {
      case 'object':
        if (val === null) {
          return 'null';
        } else if (_.isArray(val)) {
          return 'array';
        } else {
          return 'object';
        }
      case 'number':
        if (val !== val) {
          return 'NaN';
        }

        if (!isFinite(val)) {
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
  TB.applyCssRules = function(idSelector, cssText, destinationDocument) {
    var destination = destinationDocument || window.document;
    var style = destination.getElementById(idSelector);

    if (!style) {
      var container = destination;

      style = window.document.createElement('style');
      style.id = idSelector;
      style.type = 'text/css';

      if (destination instanceof Document) {
        container = destination.head;
      }

      container.appendChild(style);
    }

    style.textContent = cssText;
  };

  /**
   * Converts selector and jsonCss object to CSS style definition
   * @param {DOMSelector} selector selector string
   * @param {Object<String, String>} jsonCss  object where keys are css properties and values are css values
   * @return {String} generated css style definition
   */
  TB.JSON2CSS = function(selector, jsonCss) {
    var resultCss = ' ';

    ASSERT.isString(selector);
    ASSERT.isPlainObject(jsonCss);

    resultCss += selector;
    resultCss += ' { ';

    for (var cssProperty in jsonCss) {
      ASSERT(
        _.isString(jsonCss[cssProperty]) || _.isNumber(jsonCss[cssProperty])
      );

      resultCss += TB.camelCaseToDashes(cssProperty);
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
  TB.camelCaseToDashes = function(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  };

  /**
   * Convert underscored words to dashed string
   * @param  {String} str underscored string
   * @return {String}        dashed string
   */
  TB.underscoreToDash = function(str) {
    return str.replace('_', '-');
  };

  /**
   * Extends class with another one
   * @param  {Object} extendedClass  extended class
   * @param  {Object} extensionClass class to extend with
   * @return {Object}                extended class (NOTE: extendedClass argument is passed by reference, so it's already extended and it's === with return value)
   */
  TB.classExtend = function(extendedClass, extensionClass) {
    extendedClass.prototype = TB.merge(
      Object.create(extensionClass.prototype),
      extendedClass.prototype
    );
    extendedClass.prototype.constructor = extendedClass;
    return extendedClass;
  };

  /**
   * Append query string to url
   * @param  {String} url         url
   * @param  {String} queryString query string to append
   * @return {String}             resulted url
   */
  TB.urlAppend = function(url, queryString) {
    return (
      url +
      (/\?/.test(url) ? '&' : '?') +
      (TB.isEmpty(queryString) ? '' : queryString)
    );
  };

  /**
   * Convert ISO like date to ISO date
   * @param  {String} date iso like string
   * @return {String}      iso date
   */
  TB.normalizeDate = function(date) {
    if (!(date instanceof Date) && TB.isEmpty(date)) {
      return '';
    }

    if (date instanceof String || typeof date === 'string') {
      date = date.replace(/(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/, '$1T$2');
      date = new Date(date);
    }

    return date;
  };
  /*
  function importKey(key){
    return window.crypto.subtle.importKey(
      "raw",
      Uint8Array.from(key.split('').map(e=>e.charCodeAt(0))),
      {name:"AES-CTR", length: key.length * 4},
      true,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Encrypts data using symetric key
   * @param {String key key to be used for encryption
   * @param {String} data data to encrypt
   * @return {String} encrypted data
   *
  TB.encrypt = async function(key, data, params){
    TB.ASSERT(window.crypto, 'Crypto API not found', window);
    TB.ASSERT(window.crypto.subtle, 'Crypto Subtle API not found', window);
    TB.ASSERT(key, 'Key not supplied.', key);
    var rawData = data;
    if (params && params['inputType'] === 'string'){
      var te = new TextEncoder("utf-8");
      rawData = te.encode(data);
    }
    var encrypted = await window.crypto.subtle.encrypt(
      {
        name: "AES-CTR", 
        counter: new Uint8Array(16), 
        length: 16*8
      },
      await importKey(key),
      rawData
    );

    if (params && params['outputType'] === 'hex'){
      return Array.prototype.map.call(new Uint8Array(encrypted), x=>(('00'+x.toString(16)).slice(-2))).join('');
    }

    return encrypted;
  }
  */

  /**
   * Decrypts data using symetric key
   * @param {String key key to be used for decryption
   * @param {String} data data to decrypt
   * @return {String} decrypted data
   *
  TB.decrypt = async function(key, data, params){
    TB.ASSERT(window.crypto, 'Crypto API not found', window);
    TB.ASSERT(window.crypto.subtle, 'Crypto Subtle API not found', window);
    TB.ASSERT(key, 'Key not supplied.', key);
    var encryptedData = data;
    if (params && params['inputType'] === 'hex'){
      const bytes = [];
      for (let i = 0; i < hex.length; i+=2) {
        bytes.push(Number.parseInt(hex.slice(i,i+2), 16));
      }
      encryptedData = new Uint8Array(bytes);
    }
    var decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-CTR", 
        counter: new Uint8Array(16), 
        length: 16*8
      },
      await importKey(key),
      encryptedData
    );
    if (params && params['outputType'] === 'string'){
      var td = new TextDecoder("utf-8");
      return td.decrypt(decrypted);
    }
    return decrypted;
  }
  */

  /**
   * Parse query params
   * @param  {String} inputQuery query to be parsed, may start with "?" or "#"
   * @return {Object}            parsed query with keys of parameter names and their values
   */
  TB.parseQueryParams = function(inputQuery) {
    var search = /([^&;=]+)=?([^&;]*)/g;
    var decode = function(s) {
      return decodeURIComponent(s.replace(/\+/g, ' '));
    };
    var queryString = inputQuery || window.location.search;

    var query = queryString.replace(/^(\?*)/, '');
    query = query.replace(/^(\#*)/, '');

    var urlParams = {};
    var match;

    while ((match = search.exec(query))) {
      var key = decode(match[1]);
      var val = decode(match[2]);

      if (urlParams[key] instanceof Array) {
        urlParams[key].push(val);
      } else if (urlParams[key] !== undefined) {
        urlParams[key] = [urlParams[key], val];
      } else {
        urlParams[key] = val;
      }
    }

    return urlParams;
  };

  /**
   * Turns js hash to properly escaped query params
   * @params {Object}
   * @return {String}
   */
  TB.toQueryString = function(params) {
    if (_.isString(params) || _.isEmpty(params)) {
      return params;
    }

    var queryArr = [];
    var add = function(key, value) {
      // If value is a function, invoke it and return its value
      value = _.isFunction(value) ? value() : value === null ? '' : value;

      if(value === undefined) return;

      queryArr[queryArr.length] =
        encodeURIComponent(key) + '=' + encodeURIComponent(value);
    };

    // If an array was passed in, assume that it is an array of form elements.
    if (_.isArray(params)) {
      for (var i = 0; params && i < params.length; i++) {
        add(params[i]['name'], params[i]['value']);
      }
    } else {
      // If traditional, encode the "old" way ( the way 1.3.2 or older
      // did it ), otherwise encode params recursively.
      for (var prefix in params) {
        if (params.hasOwnProperty(prefix)) {
          TB.buildParams(prefix, params[prefix], add);
        }
      }
    }

    // spaces should be + according to spec
    return queryArr.join('&').replace(/%20/g, '+');
  };
  /**
   * Build query params
   * @todo refactor this
   * @private
   * @param  {String} prefix TODO
   * @param  {Object} obj    TODO
   * @param  {Function} add    add callback
   */
  TB.buildParams = function(prefix, obj, add) {
    var rbracket = /\[ \ ]$/;

    if (_.isArray(obj)) {
      // Serialize array item.
      for (var i = 0, l = obj.length; obj && i < l; i++) {
        var value = obj[i];

        if (rbracket.test(prefix)) {
          // Treat each array item as a scalar.
          add(prefix, value);
        } else {
          TB.buildParams(
            prefix + '[ ' + (typeof value === 'object' ? i : '') + ' ]',
            value,
            add
          );
        }
      }
    } else if (obj && obj.toString() === '[ object Object ]') {
      // Serialize object item.
      for (var name in obj) {
        TB.buildParams(prefix + '[ ' + name + ' ]', obj[name], add);
      }
    } else {
      // Serialize scalar item.
      add(prefix, obj);
    }
  };
  /**
   * Returns a function, that, as long as it continues to be invoked, will not
   * be triggered. The function will be called after it stops being called for
   * N milliseconds. If `immediate` is passed, trigger the function on the
   * leading edge, instead of the trailing.
   * @param  {Function} func      [description]
   * @param  {Integer} wait      [description]
   * @param  {Boolean} immediate [description]
   * @return {Void}           [description]
   */
  TB.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this,
        args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  /**
   * Replaces placeholders with given values. Placeholders format is $placeholder_name$. Placeholders are case-sensitive!
   * @param  {String} msgTmpl      Template string
   * @param  {Object} placeholders Values to be interpolated
   * @return {String}              Interpolated string
   */
  TB.simpleTmpl = function(msgTmpl, placeholders) {
    if (!placeholders) {
      return msgTmpl;
    }

    for (var key in placeholders) {
      var searchFor = '$' + key + '$';
      msgTmpl = msgTmpl.replace(searchFor, placeholders[key]);
    }

    return msgTmpl;
  };

  /**
   * Generic function used to enforce HTTP logout. Actually uses a little hach and sends wrong credention to force 401 from server.
   */
  var isLogoutRunning = false;
  const LOGOUT_COMMAND = 'logout';
  TB.HTTPLogout = function(authapi_apikey) {
    if (isLogoutRunning) {
      return;
    }

    var exitReq = new XMLHttpRequest();

    let pathNameSplit = window.location.pathname.split('/');
    let backoffice_apikey = pathNameSplit[1];
    let session_token = pathNameSplit[2];

	  ASSERT(authapi_apikey != null);
	  ASSERT(session_token != null);
	  ASSERT(backoffice_apikey != null);

	  var qsDs = {
		  command: LOGOUT_COMMAND,
		  sess_token: session_token,
	  	cgi: 1,
	  };

	  var query_data = '';

	  for (var param in qsDs) {
		  var encodedParam = encodeURIComponent(qsDs[param]);
	  	query_data += `${param}=${encodedParam}&`;
	  }

    var requestUrl = `/${backoffice_apikey}/authentication-api/${authapi_apikey}?${query_data}`;

    exitReq.open('GET', requestUrl, true);
    exitReq.onreadystatechange = function() {
		if (exitReq.readyState == 4) {
			if (exitReq.status == 200) {
				let res = JSON.parse(exitReq.responseText);
				ASSERT(res.result.location != null);

				window.location = res.result.location;
			} else {
		  	TB.THROW_USER({msg: 'Error while log out', code: 'TBCJS/900'});
			}
		}
	};

    isLogoutRunning = true;
    exitReq.send();
  };

  TB.HTTPLogoutNew = function(authapi_apikey) {
    if (isLogoutRunning) {
      return;
    }

    var exitReq = new XMLHttpRequest();

    let pathNameSplit = window.location.pathname.split('/');
    let backoffice_apikey = pathNameSplit[1];
    let session_token = pathNameSplit[2];

	  ASSERT(authapi_apikey != null);
	  ASSERT(session_token != null);
	  ASSERT(backoffice_apikey != null);

	  var qsDs = {
		  command: LOGOUT_COMMAND,
          cgi: 1,
	  };

	  var query_data = '';

	  for (var param in qsDs) {
		  var encodedParam = encodeURIComponent(qsDs[param]);
	  	query_data += `${param}=${encodedParam}&`;
	  }

    var requestUrl = `/${backoffice_apikey}/authentication-api/${authapi_apikey}?${query_data}`;

    exitReq.open('GET', requestUrl, true);
    exitReq.onreadystatechange = function() {
		if (exitReq.readyState == 4) {
			let res = JSON.parse(exitReq.responseText);
			if (exitReq.status == 200) {
				ASSERT(res.result.location != null);

				window.location = res.result.location;
			} else {
				TB.RAServiceParseBaseProtocolExceptionAndThrow(null, new TB.RAServiceUnpackError(res));
			}
		}
	};

    isLogoutRunning = true;
    exitReq.send();
  };


  /**
   * Generates random color, supports seed
   * @param  {String} seed seed to generate color from, anytime you provide the same seed, you get the same color
   * @return {String}      HEX color
   */
  TB.generateColor = function(seed) {
    seed = seed !== undefined ? seed : Math.random();
    seed = seed.toString();

    var hash = 0;

    for (var i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    var color = Math.floor(Math.abs(Math.sin(seed) * 16777215) % 16777215);

    color = color.toString(16);
    // pad any colors shorter than 6 characters with leading 0s
    while (color.length < 6) {
      color = '0' + color;
    }

    return color;
  };

  TB.getCookie = function(cookies, cookieName) {
    var cookie = ('; ' + cookies).split('; '+ cookieName + '=').pop().split(';').shift();

    return cookie;
  }

  TB.rsplit = function( str, sep, maxsplit ) {
    var split = str.split(sep);
    if (split.length <= maxsplit ) {
      return split;
    }
    return maxsplit ? [ split.slice(0, -maxsplit).join(sep) ].concat(split.slice(-maxsplit)) : split;
  }


  // https://stackoverflow.com/questions/11401897/get-the-current-domain-name-with-javascript-not-the-path-etc
  TB.getDomain = function getDomain(url) {
    url = url.replace(/(https?:\/\/)?(www.)?/i, '');
    if (url.indexOf('/') !== -1) {
        url = url.split('/')[0];
    }

    return url;
  }


  var notifySettings = {
    addclass: 'translucent',
    icon: 'fa fa-exclamation-triangle',
    buttons: { sticker: false, },
    hide: false,
    styling: 'bootstrap3',
    delay: 4000
  };

  /*
    errDetails format:
      {system_version} => string
      {checksum} => string
      {event_id} => string
      {prefixed_code} => string
  */
  var createNotification = function createNotification(title, text, type, errDetails) {
    if ( ! window.PNotify ) {
      return;
    }

	if (TB.isModalShown) {
	  PNotify.removeAll();
	}

	errDetails = errDetails || {};
    if (errDetails.checksum) {
        text += `
          <span id="alert-show-details" style="cursor: pointer; ${ errDetails.checksum ? '' : 'display: none;' }">Show Details</span>
          <span id="alert-details" style="display: none;">
            Diagnostics: <span id="tb-error-diagnostics">${errDetails.diag || '-'}</span>
            Audit Code: <span id="tb-error-audit-code">${errDetails.prefixed_code}</span>
            Error Checksum: <span id="tb-error-checksum">${errDetails.checksum}</span>
            Timestamp: <span id="tb-error-timestamp">${errDetails.timestamp}</span>
            System Version: <span id="tb-error-server-system-version">${errDetails.system_version}</span></span>`;
    }
 
    var notify = new PNotify(_.merge(
      {
        title: title,
        text: text,
        type: type,
      }, notifySettings)
    );

    TB.isModalShown = true;

    setTimeout(() => {
      if ($('#alert-show-details').length > 0) {
        if (errDetails.checksum) {
          $('#alert-show-details').show();
        }
      }
    }, 300);

    return notify;
  }

  TB.createNotification = createNotification;

  TB.loadJSFile = function(src) {
/*

    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
*/


    let promise = new Promise((resolve, reject) => {
      require([src], (...modules) => {
        resolve(modules);
      });
    });

    // head.appendChild(script);

    return promise;
  }

  return TB;
});
