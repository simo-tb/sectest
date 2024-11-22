(function(window, TB) {
  'use strict';

  TB.CONFIG = {};
  TB.CONFIG.ERR_PEER = 'peer_error';
  TB.CONFIG.ERR_USER = 'user_error';
  TB.CONFIG.ERR_SYS = 'sys_error';

  TB.CONFIG.DEBUG_IN_GLOBAL_SCOPE = true;
  TB.CONFIG.ASSERTS_DISABLED = !false;
  TB.CONFIG.ASSERTS_DEFAULT_MSG_DELIMITER = ' ';
  TB.CONFIG.TYPE_DELIMITER = '|';
  TB.CONFIG.TRACE_CONSOLE = true;
  TB.CONFIG.TRACE_ARGUMENTS_DELIMITER = ' ';
  TB.CONFIG.TRACE_OPEN_PLACEHOLDER_STR = '';
  TB.CONFIG.TRACE_CLOSE_PLACEHOLDER_STR = '';
  TB.CONFIG.TRACE_OPEN_TYPE_PLACEHOLDER_STR = '[[';
  TB.CONFIG.TRACE_CLOSE_TYPE_PLACEHOLDER_STR = ']]';




  TB.toArray = function(args) {
    return Array.prototype.slice.call( args, 0 );
  };

  TB.noop = function() {};

  TB.get = function(obj, path, defaultVal) {
    var pathArr = (typeof path === 'string') ? path.split('.') : path;

    return pathArr.reduce( function( prev, curr ) {
      return (prev !== undefined && prev !== defaultVal) ? prev[curr] : defaultVal;
    }, obj || this );
  };

  TB.set = function(obj, path, value) {
    var a = (typeof path === 'string') ? path.split('.') : path;
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

  TB.cloneDeep = function(obj) {
    return JSON.parse(JSON.stringify(obj));
  };

  TB.assign = function(obj1, obj2) {
    for(var key in obj2) {
      obj1[key] = obj2[key];
    }
    return obj1;
  };

  TB.merge = function(destination, source) {
    for (var property in source) {
      if (source[property] && source[property].constructor &&
        source[property].constructor === Object) {
        destination[property] = destination[property] || {};
        deepMerge(destination[property], source[property]);
      } else {
        destination[property] = source[property];
      }
    }
    return destination;
  };

  TB.contains = function(arr, item) {
    return arr.indexOf(item) >= 0;
  };

  TB.isBoolean = function(val) {
    return typeof val === 'boolean';
  }

  TB.isDefined = function(obj) {
    return typeof obj !== 'undefined';
  };

  TB.isObject = function(obj) {
    return obj === Object(obj);
  };

  TB.isString = function(str) {
    return typeof str === 'string';
  };

  TB.isArray = function(arr) {
    return (arr && typeof arr === 'object' && arr.constructor === Array);
  };

  TB.typeof = function(val) {
    switch(typeof val) {
      case 'object':
        if(val === null) {
          return 'null';
        }
        else if(TB.isArray(val)) {
          return 'array';
        } else {
          return 'object';
        }
        break;
      case 'number':
        if(val !== val) {
          return 'NaN';
        }

        if(!isFinite(val)) {
          return 'infinity';
        }

        return 'number';
        break;
      case 'string':
      case 'symbol':
      case 'undefined':
      case 'boolean':
      case 'function':
      default:
        return typeof val;
    }
  };


  function makeMsg() {
    if(arguments.length < 2) {
      return '';
    }

    var argsArr = TB.toArray(arguments);
    var typeOfScalar = (TB.isBoolean(argsArr[0])) ? argsArr.shift() : true;
    var baseStr = argsArr[0];
    var placeholdersCount = 0;

    if(typeof baseStr !== 'string') {
      if(typeof baseStr === 'number' && typeof baseStr.toString === 'function') {
        baseStr = baseStr.toString();
      } else {
        var argsArrLength = argsArr.length;
        baseStr = '';

        while(argsArrLength--) {
          baseStr += '%s ';
        }
      }
    }

    placeholdersCount = (baseStr.match(/%[sid]/g) || []).length;
    argsArr[0] = baseStr;

    for(var i = 1, l = argsArr.length; i < l; i++) {
      var item = argsArr[i];
      var str = '';
      var type = '';

      if (item === null) {
        type = 'null';
      } else if(item === undefined) {
        type = 'undefined';
      } else if(typeof item === 'number') {
        type = 'number';
        str += item;
      } else if(typeof item === 'string') {
        type = 'string';
        str += item;
      } else if(typeof item === 'function') {
        type = 'function';
        str += item.toString();;
      } else if(TB.isBoolean(item)) {
        type = 'boolean';
        str += item;
      } else {
        type = typeof item;

        if(typeof item == 'object') {
          if(TB.isArray(item)) {
            type = 'array';
          }
        }

        try {
          str += JSON.stringify(item);
        } catch(e) {
          str += 'error while stringifying object: ' + e.message;
        }
      }

      if(i > placeholdersCount) {
        argsArr[0] += TB.CONFIG.TRACE_ARGUMENTS_DELIMITER + '%s';
      }

      if(!typeOfScalar && (type === 'string' || type === 'number')) {
        argsArr[i] = TB.CONFIG.TRACE_OPEN_PLACEHOLDER_STR + str + TB.CONFIG.TRACE_CLOSE_PLACEHOLDER_STR;
      } else {
        argsArr[i] = TB.CONFIG.TRACE_OPEN_TYPE_PLACEHOLDER_STR + ' (' + type + ') ' + str + ' ' + TB.CONFIG.TRACE_CLOSE_TYPE_PLACEHOLDER_STR;
      }

    }

    var i = 0;
    var result = argsArr.shift()
      .replace(/%s/g, function() {
        return argsArr[i++];
      });

    return result;
  };

  function trace() {
    var msgStr = makeMsg.apply(this, arguments);

    if(TB.CONFIG.TRACE_CONSOLE) {
      console.log(msgStr);
    }

    return msgStr;
  };

  function throwError() {
    var argsArr = TB.toArray(arguments);
    var errMsgStr;
    var errObj;

    argsArr.unshift(true);
    errMsgStr = makeMsg.apply(this, argsArr)
    errObj = new Error(errMsgStr);

    throw errObj;

  };

  function throwErrorWrapper(type) {
    var errMsgStr = 'ERROR(' + type + ') ';

    return function() {
      var argsArr = TB.toArray(arguments);

      if(TB.typeof(argsArr[0]) === 'string') {
        argsArr[0] = errMsgStr + argsArr[0];
      } else {
        argsArr.unshift(errMsgStr);
      }

      return throwError.apply(this, argsArr);
    };
  };

  function assertWrapper(type) {
    var func;

    function assert(condition) {
      if(condition) {
        return true;
      }

      var msgStr = 'ASSERT(' + type + ') ';
      var argsArr = TB.toArray(arguments);
      argsArr[0] = true;

      msgStr += makeMsg.apply(this, argsArr);

      trace.call(this, [msgStr]);

      throwError(msgStr);

      return false;
    };

    function assertSugar(condition, parentArgsArr) {
      var argsArr = TB.toArray(arguments);
      argsArr.splice(0, 2, false);
      parentArgsArr.unshift(false);

      return assert(condition, makeMsg.apply(this, parentArgsArr) + TB.CONFIG.ASSERTS_DEFAULT_MSG_DELIMITER + makeMsg.apply(this, argsArr));
    }

    if(TB.CONFIG.ASSERTS_DISABLED) {
      // TODO keep noop clean
      func = TB.noop;
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

    assert.isDefined = function(value) {
      return assertSugar(TB.isDefined(value), TB.toArray(arguments).slice(1), 'Value must not be undefined for %s', value);
    };

    assert.isUndefined = function(value) {

      return assertSugar(!TB.isDefined(value), TB.toArray(arguments).slice(1), 'Value must be undefined, given "%s" for %s', typeof value, value);
    };

    assert.hasProperty = function(value, property) {
      return assertSugar(value && typeof value === 'object' && value.hasOwnProperty(property), TB.toArray(arguments).slice(2), 'Value must have property "%s" for %s', property, value);
    };

    assert.hasPropertyOfTbType = function(value, property, type) {
      var tbType = TB.typeof(value);
      var tbTypeProperty = (tbType === 'object') ? TB.typeof(value[ property ]) : 'undefined';

      return assertSugar(tbType === 'object' && tbTypeProperty === type, TB.toArray(arguments).slice(3), 'Value must have property "%s" of type "%s", but "%s" given for %s', property, type, tbTypeProperty, value);
    };

    assert.hasPropertyOfTbTypes = function(value, property, types) {
      var typesArr;
      var tbType;
      var tbTypeProperty;

      if (TB.isString(types)) {
        typesArr = types.split(TB.CONFIG.TYPE_DELIMITER);
      } else if (TB.isArray(type)) {
        typesArr = types;
      } else {
        assert(false, 'Failed in assert: expected types to be string or array, but "%s" given for %s', types, value);
      }

      tbType = TB.typeof(value);
      tbTypeProperty = (tbType === 'object') ? TB.typeof(value[ property ]) : 'undefined';

      return assertSugar(tbType === 'object' && TB.contains(typesArr, tbTypeProperty), TB.toArray(arguments).slice(3), 'Value must have property "%s" of any of types "%s", but "%s" given for %s', property, types, tbTypeProperty, value);
    };

    assert.ofTbType = function(value, type) {
      var tbType = TB.typeof(value);
      return assertSugar(tbType === type, TB.toArray(arguments).slice(2), 'Value must be of type "%s", given "%s" for %s', type, tbType, value);
    };

    assert.ofTbTypes = function(value, types) {
      var typesArr;
      var tbType;

      if (TB.isString(types)) {
        typesArr = types.split(TB.CONFIG.TYPE_DELIMITER);
      } else if (TB.isArray(type)) {
        typesArr = types;
      } else {
        assert(false, 'Failed in assert: expected types to be string or array, but "%s" given for %s', types, value);
      }
      tbType = TB.typeof(value);

      return assertSugar(TB.contains(typesArr, tbType), TB.toArray(arguments).slice(2), 'Value must be of any of types "%s", but "%s" given for %s', types, tbType, value);
    };

    return assert;
  };


  TB.TRACE = trace;
  TB.ASSERT = assertWrapper( TB.CONFIG.ERR_SYS );
  TB.ASSERT_PEER = assertWrapper( TB.CONFIG.ERR_PEER );
  TB.ASSERT_USER = assertWrapper( TB.CONFIG.ERR_USER );
  TB.THROW = throwErrorWrapper( TB.CONFIG.ERR_SYS );
  TB.THROW_PEER = throwErrorWrapper( TB.CONFIG.ERR_PEER );
  TB.THROW_USER = throwErrorWrapper( TB.CONFIG.ERR_USER );

  if(TB.CONFIG.DEBUG_IN_GLOBAL_SCOPE) {
    var globalDebugFunctionNames = ['ASSERT', 'ASSERT_PEER', 'ASSERT_USER', 'TRACE', 'THROW', 'THROW_PEER', 'THROW_USER'];

    for(var i = 0, l = globalDebugFunctionNames.length; i < l; i++) {
      var debugFunctionName = globalDebugFunctionNames[ i ];
      window[ debugFunctionName ] = TB[ debugFunctionName ];
    }
  }

  window.TB = TB;
})(window, window.TB || {});
