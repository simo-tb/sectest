/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @desc setting up all debug utilities for applications
 * @module xerrors
 * @memberOf TB
 */
(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('./tb.core'), require('lodash'));
  } else if (typeof define === 'function' && define.amd) {
    define(['tb.core', 'lodash'], function() {
      return factory.apply(factory, arguments);
    });
  } else {
    root.TB = root.TB || {};
    root.TB = factory(root.TB, _);
  }
})(this, function(TB, _) {
  'use strict';

  if(TB.CONFIG.HAS_WINDOW && TB.XErrors) {
    return TB;
  }

  Error.stackTraceLimit = 100;

  var traceData = [];
  var AUDIT_LEVEL_ERROR = 'error';
  var AUDIT_LEVEL_NOTICE = 'notice';

  var ERROR_TYPE_TO_AUDIT_LEVEL = {
    [TB.CONFIG.ERR_CONFIG]: TB.CONFIG.AUDIT_LEVEL_ERR,
    [TB.CONFIG.ERR_USER]: TB.CONFIG.AUDIT_LEVEL_INFO,
    [TB.CONFIG.ERR_PEER]: TB.CONFIG.AUDIT_LEVEL_WARN,
    [TB.CONFIG.ERR_ASSERT_PEER]: TB.CONFIG.AUDIT_LEVEL_ERR,

    [TB.CONFIG.ERR_APP]: TB.CONFIG.AUDIT_LEVEL_ERR,

    [TB.CONFIG.ERR_SYS]: TB.CONFIG.AUDIT_LEVEL_ERR,
    [TB.CONFIG.ERR_OPEN_CONN]: TB.CONFIG.AUDIT_LEVEL_ERR,
    [TB.CONFIG.ERR_OPEN_CONN]: TB.CONFIG.AUDIT_LEVEL_ERR,
    [TB.CONFIG.ERR_IO_CONN]: TB.CONFIG.AUDIT_LEVEL_ERR,
    [TB.CONFIG.ERR_UNKNOWN]: TB.CONFIG.AUDIT_LEVEL_ERR,
  };

  var ERROR_TYPE_TO_MONITORING_PREFIX = {
    [TB.CONFIG.ERR_CONFIG]: TB.CONFIG.ERR_CONFIG_PREFIX,
    [TB.CONFIG.ERR_USER]: TB.CONFIG.ERR_USER_PREFIX,
    [TB.CONFIG.ERR_PEER]: TB.CONFIG.ERR_PEER_PREFIX,
    [TB.CONFIG.ERR_ASSERT_PEER]: TB.CONFIG.ERR_ASSERT_PEER_PREFIX,

    [TB.CONFIG.ERR_APP]: TB.CONFIG.ERR_APP_PREFIX,

    [TB.CONFIG.ERR_SYS]: TB.CONFIG.ERR_SYS_PREFIX,
    [TB.CONFIG.ERR_OPEN_CONN]: TB.CONFIG.ERR_OPEN_CONN_PREFIX,
    [TB.CONFIG.ERR_OPEN_CONN]: TB.CONFIG.ERR_OPEN_CONN_PREFIX,
    [TB.CONFIG.ERR_IO_CONN]: TB.CONFIG.ERR_IO_CONN_PREFIX,
    [TB.CONFIG.ERR_UNKNOWN]: TB.CONFIG.ERR_UNKNOWN_PREFIX,
  };

  var classnameToPrefix = {};
  classnameToPrefix[TB.CONFIG.ERR_USER] = 'U';
  classnameToPrefix[TB.CONFIG.ERR_CONFIG] = 'U';
  classnameToPrefix[TB.CONFIG.ERR_PEER] = 'RT';
  classnameToPrefix[TB.CONFIG.ERR_ASSERT_PEER] = 'RF';
  classnameToPrefix[TB.CONFIG.ERR_APP] = 'I';
  classnameToPrefix[TB.CONFIG.ERR_UNKNOWN] = 'I';
  classnameToPrefix[TB.CONFIG.ERR_SYS] = 'T';
  classnameToPrefix[TB.CONFIG.ERR_OPEN_CONN] = 'T';
  classnameToPrefix[TB.CONFIG.ERR_IO_CONN] = 'T';


  function tbSerialize(data) {
    var seen = [];

    // https://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify
    // stringification of error objects IS TRICKY BUSINESSS!
    function replaceErrors(key, value) {
      if (value != null && typeof value == "object") {
        if (seen.indexOf(value) >= 0) {
          return;
        }

        seen.push(value);
      }


      if (value instanceof Error) {
        var error = {};

        Object.getOwnPropertyNames(value).forEach(function (innerKey) {
          error[innerKey] = value[innerKey];
        });

        if (value.name) {
          error.name = value.name
        }

        return error;
      }

      if (TB.CONFIG.HAS_WINDOW && value instanceof Event) {
        // event, aswell as Error, had some bullshit number of properties that are ignored!
        var e = {};

        for (var innerKey in value) {
          e[innerKey] = value[innerKey];
        }

        if (value.name) {
          e[name] = value.name
        }

        return e;
      }

      return value;
    }

    var res = JSON.stringify(data, replaceErrors);

    return res;
  }

  var generateChecksum = function (str) {
    var hash = 0, i, chr;
    for (i = 0; i < str.length; i++) {
      chr   = str.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }

	if (hash < 0) {
		hash = -hash;
    }

    return String(hash);
  }

  var windowAlert = function(msg) {
    if(TB.CONFIG.HAS_WINDOW) {
      window.alert(msg);
    }
  }

  /**
   * Very complicated to explain, please see the source
   * @todo refactor this hell
   * @param {...*} msgPartials message partials
   * @return {String} String
   */

  var TbCustomError = (function() {
    function TbCustomError(message, tbData) {
      var error = Error.call(this, message);
      var isHandled = false;
      var isProcessed = false;

      tbData = tbData || {};

      this.origMsg = tbData.origMsg;
      this.message = error.message;
      this.msg = tbData.msg;
      this.code = tbData.code;
      this.stack = error.stack;
      this.tbData = tbData;
      this.level_id = this.tbData.level;

      var prefix = tbData.monitoring_prefix;


      if (prefix === TB.CONFIG.ERR_USER_PREFIX) {
        this.type_id = TB.CONFIG.USER_ERROR_AUDIT_TYPE_ID;
      } else if (prefix === TB.CONFIG.ERR_PEER_PREFIX) {
        this.type_id = TB.CONFIG.PEER_ERROR_AUDIT_TYPE_ID;
      } else if (prefix === TB.CONFIG.ERR_ASSERT_PEER_PREFIX) {
        this.type_id = TB.CONFIG.ASSERT_PEER_AUDIT_TYPE_ID;
      } else if (prefix === TB.CONFIG.ERR_SYS_PREFIX) {
        this.type_id = TB.CONFIG.SYS_AUDIT_TYPE_ID;
      } else if (prefix === TB.CONFIG.ERR_APP_PREFIX) {
        this.type_id = TB.CONFIG.ASSERT_AUDIT_TYPE_ID;
      } else if (prefix === TB.CONFIG.ERR_CONFIG_PREFIX) {
        this.type_id = TB.CONFIG.CONFIG_AUDIT_TYPE_ID;
      } else if (prefix === TB.CONFIG.ERR_OPEN_CONN_PREFIX || prefix === TB.CONFIG.ERR_IO_CONN_PREFIX) {
        this.type_id = TB.CONFIG.IO_AUDIT_TYPE_ID;
      } else {
        this.type_id = TB.CONFIG.ASSERT_AUDIT_TYPE_ID;
      }

      this.isHandled = function() {
        return isHandled;
      }

      this.setHandled = function() {
        return isHandled = true;
      }

      this.SetProcessed = function() {
        return this.setHandled();
      }

      this.Process = function(additionalParams){
        // make multiple $err->Process calls to not generate multiple audits and etc., but the SetProcessed + Process to actually audit the error!
        if (isProcessed) {
          return;
        }

        // what should we do in this place? Maybe use it like jf.page uses it and sends stuff to the server? It works...
        TRACE("Processed the error!");
      }

      return this;
    }

    TbCustomError.prototype = Object.create(Error.prototype);
    TbCustomError.prototype.constructor = TbCustomError;

    return TbCustomError;
  })();


  var ErrorClassCreator = function(errClassName) {
    var CustomError = function CustomError(message, tbData) {
        var baseErrorObj = TbCustomError || Error;
        var error = new baseErrorObj(message, tbData);
        error.name = errClassName;

        return error;
    }

    return CustomError;
  };

  var UserError = ErrorClassCreator(TB.CONFIG.ERR_USER);
  var PeerError = ErrorClassCreator(TB.CONFIG.ERR_PEER);
  var AssertPeerError = ErrorClassCreator(TB.CONFIG.ERR_ASSERT_PEER);
  var AppError = ErrorClassCreator(TB.CONFIG.ERR_APP);
  var SysError = ErrorClassCreator(TB.CONFIG.ERR_SYS);
  var ConfigError = ErrorClassCreator(TB.CONFIG.ERR_CONFIG); // AppErr SUPP2
  var OpenConnError = ErrorClassCreator(TB.CONFIG.ERR_OPEN_CONN); // SysErr
  var UnknownError = ErrorClassCreator(TB.CONFIG.ERR_UNKNOWN);

  var errorMap = {};
  errorMap[TB.CONFIG.ERR_USER] = UserError;
  errorMap[TB.CONFIG.ERR_ASSERT_PEER] = AssertPeerError;
  errorMap[TB.CONFIG.ERR_PEER] = PeerError;
  errorMap[TB.CONFIG.ERR_UNKNOWN] = UnknownError;
  errorMap[TB.CONFIG.ERR_APP] = AppError;
  errorMap[TB.CONFIG.ERR_SYS] = SysError;
  errorMap[TB.CONFIG.ERR_CONFIG] = ConfigError;
  errorMap[TB.CONFIG.ERR_OPEN_CONN] = OpenConnError;
  errorMap[TB.CONFIG.ERR_UNKNOWN] = UnknownError;
  errorMap[TB.CONFIG.ERR_IO_CONN] = OpenConnError;

  var lodashAssertionsDefinitions = [{
    methods: ['isArguments', 'isArray', 'isBoolean', 'isDate', 'isElement', 'isEmpty', 'isError', 'isFinite', 'isFunction', 'isInteger', 'isLength', 'isMap', 'isNaN', 'isNative', 'isNil', 'isNull', 'isNumber', 'isObject', 'isObjectLike', 'isPlainObject', 'isRegExp', 'isSafeInteger', 'isSet', 'isString', 'isUndefined', 'isTypedArray', 'isWeakMap', 'isWeakSet'],
    numArgs: 1,
    orNil: true,
    todoUpdate: ['isArrayBuffer', 'isArrayLike', 'isArrayLikeObject', 'isBuffer']
  }, {
    methods: ['isEqual', 'isMatch', 'has', ],
    numArgs: 2,
  }, {
    methods: ['isEqualWith', 'isMatchWith', ],
    numArgs: 3,
  }];

  var lodashExecCondition = function(lodashMethodName, argumentsArr, isNil) {
    if(isNil) {
      return _.isNil.call(_, argumentsArr[0]) ||  _[lodashMethodName].apply(_, argumentsArr);
    } else {
      return _[lodashMethodName].apply(_, argumentsArr);
    }
  }

  var lodashAssertFunc = function(assert, lodashMethodName, lodashAssertionDefinition, isNil) {
    var minArguments = lodashAssertionDefinition.numArgs;
    var maxArguments = lodashAssertionDefinition.numArgs + 1;
    return function() {
      TB.ASSERT(arguments.length >= minArguments && arguments.length <= maxArguments, {
        code: 'TBJS/XERR/1010',
        msg: 'Incorrect use of tb.xerrors ASSERT with lodashMethodName `' + lodashMethodName + '`. Expected `' + minArguments + '` or `' + maxArguments + '`, but `' + arguments.length + '` found',
      });

      if(arguments.length === minArguments) {
        assert(lodashExecCondition(lodashMethodName, arguments, isNil));
      } else {
        var assertArgument = arguments[maxArguments - 1];
        delete arguments[maxArguments - 1];

        return assert.call(this, lodashExecCondition(lodashMethodName, arguments, isNil), assertArgument);
      }
    };
  };

  function XErrors(s) {
    this.s = _.defaults({
      prefix: 'TB/Global: ',
      openPlaceholderStr: TB.CONFIG.TRACE_OPEN_PLACEHOLDER_STR,
      closePlaceholderStr: TB.CONFIG.TRACE_CLOSE_PLACEHOLDER_STR,
      openTypePlaceholderStr: TB.CONFIG.TRACE_OPEN_TYPE_PLACEHOLDER_STR,
      closeTypePlaceholderStr: TB.CONFIG.TRACE_CLOSE_TYPE_PLACEHOLDER_STR,
      recursiveObjectMsg: TB.CONFIG.TRACE_RECURSIVE_OBJECT_MSG,
      logConsole: TB.CONFIG.XERRORS_LOG_CONSOLE,
      logLocalStorage: TB.CONFIG.XERRORS_LOG_LOCALSTORAGE,
      logLocalStorageKey: TB.CONFIG.XERRORS_LOG_LOCALSTORAGE_KEY,
      maxTraceLines: TB.CONFIG.MAX_TRACE_LINES,
      maxTraceLineLength: TB.CONFIG.MAX_TRACE_LINE_LENGTH,
      defaultBenchmarkName: TB.CONFIG.DEFAULT_BENCHMARK_NAME,
      assertsDisabled: TB.CONFIG.ASSERTS_DISABLED,
      defaultMsg: TB.CONFIG.XERRORS_DEFAULT_MSG,
    }, s);

    var HARD_MAX_TRACE_LINES = 10000;
    var HARD_MAX_TRACE_LINE_LENGTH = 1000;

    if ( _.isNumber(this.s.maxTraceLines) && this.s.maxTraceLines > HARD_MAX_TRACE_LINES) {
        this.s.maxTraceLines = HARD_MAX_TRACE_LINES;
    }

    if ( !_.isNumber(this.s.maxTraceLineLength) || this.s.maxTraceLineLength > HARD_MAX_TRACE_LINES) {
        this.s.maxTraceLineLength = HARD_MAX_TRACE_LINES;
    }

    this.remoteAuditConnectorTimeout = null;
    this.benchmarkData = {};


    this.ASSERT =           this.assertWrapper(TB.CONFIG.ERR_APP);
    this.ASSERT_USER =      this.assertWrapper(TB.CONFIG.ERR_USER);
    this.ASSERT_PEER =      this.assertWrapper(TB.CONFIG.ERR_ASSERT_PEER);
    this.ASSERT_CONFIG =    this.assertWrapper(TB.CONFIG.ERR_CONFIG);
    this.ASSERT_CONN =      this.assertWrapper(TB.CONFIG.ERR_IO_CONN);
    this.ASSERT_OPEN_CONN = this.assertWrapper(TB.CONFIG.ERR_OPEN_CONN);

    this.THROW_SYS =        this.throwErrorWrapper(TB.CONFIG.ERR_SYS);
    this.THROW_USER =       this.throwErrorWrapper(TB.CONFIG.ERR_USER);
    this.THROW_PEER =       this.throwErrorWrapper(TB.CONFIG.ERR_PEER);
    this.THROW_CONFIG =     this.throwErrorWrapper(TB.CONFIG.ERR_CONFIG);
    this.THROW_CONN =       this.throwErrorWrapper(TB.CONFIG.ERR_IO_CONN);
    this.THROW_OPEN_CONN =  this.throwErrorWrapper(TB.CONFIG.ERR_OPEN_CONN);

    var trace5 = this.traceGenerator(5);
    this.TRACE = trace5.bind(this);
    this.TRACE5 = trace5.bind(this);

    var trace4 = this.traceGenerator(4);
    this.TRACE4 = trace4.bind(this);

    var trace3 = this.traceGenerator(3);
    this.TRACE3 = trace3.bind(this);

    var trace2 = this.traceGenerator(2);
    this.TRACE2 = trace2.bind(this);

    var trace1 = this.traceGenerator(1);
    this.TRACE1 = trace1.bind(this);
  }

  var p = {};

  XErrors.prototype = p;
  p.traceGenerator = function traceGenerator(logLevel) {
    return function a(...args) {
      //console.log(...args); NOTE: @velislav: THIS IS USELESS -> Leads to multiple traces in console.

      var msgStr = this.prepareMsg(args[0], args[1], true);
      return this.traceReadyMsg(msgStr);
    }

  }


  p.prepareMsg = function prepareMsg(msg, msgParams, addType) {
    var stringifiedParams = {};

    var MAX_OBJECT_PROPS_LIMIT = 100;

    if(typeof msgParams === 'string') {
        return msg + ' ' + msgParams;
    }

    if(typeof msgParams === 'number') {
        return msg + ' ' + msgParams;
    }

    if(msgParams && typeof msgParams === 'object' && Object.keys(msgParams).length > MAX_OBJECT_PROPS_LIMIT) {
        return msg + ' [OBJECT TOO BIG TO BE TRACED] ';
    }

    for(var msgParamName in msgParams) {
      var msgParam = msgParams[msgParamName];

      stringifiedParams[msgParamName] = '';

      if(addType) {
        stringifiedParams[msgParamName] += this.s.openPlaceholderStr + this.s.openTypePlaceholderStr + this.guessType(msgParam) + this.s.closeTypePlaceholderStr;
      }

      try {
        stringifiedParams[msgParamName] += tbSerialize(msgParam);
      } catch(e) {
        stringifiedParams[msgParamName] += this.s.recursiveObjectMsg;
      }

      if(addType) {
        stringifiedParams[msgParamName] += this.s.closePlaceholderStr;
      }
    }

    return TB.simpleTmpl(msg, stringifiedParams)
  };

  p.guessType = function guessType(value) {
    if(_.isArray(value)) {
      return 'array';
    }

    if(_.isNull(value)) {
      return 'null';
    }

    if(_.isNaN(value)) {
      return 'NaN';
    }

    return typeof value;
  };

  p.traceReadyMsg = function traceReadyMsg(msgStr) {
    if(TB.CONFIG.HAS_WINDOW) {
      if ( this.s.logConsole && window.console && window.console.error ) {
        console.log( msgStr || '' );
      }

      if ( this.s.logLocalStorage && window !== undefined && window.localStorage ) {
        var logSoFar = window.localStorage.getItem( this.s.logLocalStorageKey ) || '';
        var log = logSoFar + msgStr;

        window.localStorage.setItem( this.s.logLocalStorageKey, log );
      }
    }

    if ( !_.isNumber( this.s.maxTraceLines ) || traceData.length >= this.s.maxTraceLines ) {
      traceData.shift( );
    }

    try {
        msgStr = msgStr.toString();
    } catch(e) {
        msgStr = '';
    }

    if ( msgStr.length > this.s.maxTraceLineLength ) {
        var half = Math.max(Math.floor(this.s.maxTraceLineLength / 2) - 5, 4);
        var newStr = '!!!Message too long!!! ';

        newStr += msgStr.substr(0, half);
        newStr += ' [...] ';
        newStr += msgStr.substr(-half);

        msgStr = newStr;
    }

    traceData.push( msgStr );

    return msgStr;
  };

  /**
   * Traces content
   * @alias TRACE
   * @memberOf module:xerrors
   * @todo optimize appending to localStorage by cashing current messages
   * @return {String} traced msg
   */
  p.trace = function trace(msg, msgParams) {

    if (TB.CONFIG.HAS_WINDOW) {
      var msgStr = this.prepareMsg(msg, msgParams, true);
      return this.traceReadyMsg(msgStr);
    } else {
      var currentTime = new Date().toISOString();
      var data = [currentTime, ...arguments];

      console.log(data.join(' '));
    }
  }
















  /**
   * Starts a code benchmark
   * @alias BENCHMARK_START
   * @memberOf module:xerrors
   * @param  {String} [name] name of the benchmark; if not provided will be used the value of this.s.defaultBenchmarkName
   */
  p.benchmarkStart = function benchmarkStart( name ) {
    name = name || this.s.defaultBenchmarkName;

    this.benchmarkData[ name ] = {
      start: new Date( ),
    };
    console.time( name );
    trace( 'Benchmark start $NAME$ at $TIME$', {
      NAME: name,
      TIME: this.benchmarkData[ name ].start,
    } );
  };
  /**
   * Starts a code benchmark
   * @alias BENCHMARK_END
   * @memberOf module:xerrors
   * @param  {String} [name] name of the benchmark; if not provided will be used the value of this.s.defaultBenchmarkName
   */
  p.benchmarkEnd = function benchmarkEnd( name ) {
    name = name || this.s.defaultBenchmarkName;

    if ( !this.benchmarkData.hasOwnProperty( name ) ) {
      return;
    }

    this.benchmarkData[ name ].end = new Date( );
    var period = this.benchmarkData[ name ].end - this.benchmarkData[ name ].start;

    console.timeEnd( name );
    trace( 'Benchmark end $NAME$ for $PERIOD$ ($START$ | $END$)', {
      NAME: name,
      START: this.benchmarkData[ name ].start,
      END: this.benchmarkData[ name ].start,
      PERIOD: period,
    } );
    delete this.benchmarkData[ name ];
  };

  p.getLog = function getLog() {
    return traceData;
  }

  p.throwErrorWrapper = function throwErrorWrapper( type ) {
    var self = this;

    return function( props, msg, code, addParams ) {
      if(type === TB.CONFIG.ERR_USER) {
          TB.ASSERT(!_.isNil(props.code));
          TB.ASSERT(!_.isNil(props.msg));
      } else {
        props = props || {};
      }

      var inMsg = props.msg;
      if (msg) {
        inMsg = msg;
      }

      var inCode = props.code;
      if (code) {
        inCode = code;
      }

      var error = self.createError({
        throw: true,
        type: type,
        code: inCode,
        msg: inMsg,
        msgParams: props.msgParams,
        debug: props.debug,
        addParams: addParams,
        depth: 4,
      });

      self.errorHandler(error);

      throw error;
    };
  }

  p.assertWrapper = function assertWrapper( type ) {
    var self = this;
    /**
     * @alias ASSERT
     * @memberOf module:xerrors
     * @param {(Boolean|*)} condition condition to check of trueable

     * @return {Boolean}
     */
    function assert( condition, msg, code, addParams ) {
      if ( self.s.assertsDisabled && 0 ) return true;

      if (type !== TB.CONFIG.ERR_APP) {
          if (typeof msg === 'object' && msg !== null) {
            // parse the object?
            code = msg.code;
            msg = msg.msg;
          }

          if(type === TB.CONFIG.ERR_USER) {
              TB.ASSERT(!_.isNil(code));
              TB.ASSERT(!_.isNil(msg));
          }
      }

      if ( condition ) {
        return true;
      }

      if (type === TB.CONFIG.ERR_APP) {
        // createError will do it
        msg = undefined;
        code = undefined;
        addParams = undefined;
      }

      var error = self.createError({
        assert: true,
        type: type,
        code: code,
        msg: msg,
        addParams: addParams,
        debug: arguments,
        depth: 4,
      });

      self.errorHandler(error);

      if (TB.CONFIG.HAS_WINDOW) {
        TRACE("Throwing the error....");
      } else {
       plv8.elog(NOTICE, "DATA: ", JSON.stringify(error));
      }
      throw error;
    }

    var allShortcutAssertsMethods = ['isNotNil', 'isNotEmpty',];

    for(var i = 0, l = lodashAssertionsDefinitions.length; i < l; i++) {
      var lodashAssertionDefinition = lodashAssertionsDefinitions[i];

      for(var k = 0, l = lodashAssertionDefinition.methods.length; k < l; k++) {
        var lodashMethodName = lodashAssertionDefinition.methods[k];

        allShortcutAssertsMethods.push(lodashMethodName);

        if(typeof _[lodashMethodName] !== 'function') {
          var err = new AppError('Unknown lodash method: ' + lodashMethodName);
          throw err;
        }

        assert[lodashMethodName] = lodashAssertFunc(assert, lodashMethodName, lodashAssertionDefinition, false);

        if(lodashAssertionDefinition.orNil) {
          assert[lodashMethodName + 'OrNil'] = lodashAssertFunc(assert, lodashMethodName, lodashAssertionDefinition, true);
        }
      }
    }

    assert.isNotNil = function(value, errData) {
      return assert(!_.isNil(value), errData);
    };

    assert.isNotEmpty = function(value, errData) {
      return assert(!_.isEmpty(value), errData);
    }

    if(TB.CONFIG.ASSERTS_DISABLED && 0) {
      for(var i = 0, l = allShortcutAssertsMethods.length; i < l; i++) {
        assert[ allShortcutAssertsMethods[i] ] = _.noop;
      }
    }

    return assert;
  };

  p.simplifyStack = function simplifyStack(err, level) {
    var stackArr = err.stack.split('\n');

    stackArr.splice(1, level || 0);

    return stackArr.join('\n');
  };

  function getLineFileAndColFromStack(stack) {
    if (stack == undefined) {
      return undefined;
    }

    var stackArray = stack.split("\n");
    var line = stackArray[1];
    var re = /.*?\((.*)\)/;
    var match = re.exec( line );

    var correctLine;
    if (match === null) {
      // line is already in the correct format (<file.js>:<line>:<col>) - with and without the parentheses
      correctLine = line;
    } else {
      correctLine = match[1];
    }

    if (correctLine == undefined) {
      TB.ASSERT(0, "Unknown Stack Trace???", stack, "unable to parse sensible error from it!");
    }

    var matchArray = TB.rsplit(correctLine, ":", 2);

    return {
      filename: matchArray[0],
      filenameUI: matchArray[0].split('?')[0],
      lineno: matchArray[1],
      colno: matchArray[2],
    }
  }



  p.createError = function createError( errData ) {
    var code = errData.code || TB.CONFIG.XERRORS_DEFAULT_CODE;
    if (code !== undefined && typeof code !== 'string') {
        code = code.toString();
    }

    TB.ASSERT(ERROR_TYPE_TO_AUDIT_LEVEL[errData.type], "Unknown Error Type or level: ", errData.type, ERROR_TYPE_TO_AUDIT_LEVEL);
    errData.level = ERROR_TYPE_TO_AUDIT_LEVEL[errData.type];
    errData.monitoring_prefix = ERROR_TYPE_TO_MONITORING_PREFIX[errData.type];

    errData.addParams = errData.addParams || {};

    if ( ! errData.addParams.skipPrefixForCode ) {
      // if it doesnt begin, prefix: this is the case of an ASSERT_USER in the RemoteAPI tb.service.js, maybe the fix should be there, but maybe not - no reason for multiple SAME prefixes...
      code = classnameToPrefix[errData.type] + '/' + code;
    }

    var isUI = errData.type === TB.CONFIG.ERR_USER;
    errData.addParams = errData.addParams || {};
    if (errData.addParams.isUIAppropriate === undefined) {
      errData.addParams.isUIAppropriate = false;
    }

    var msg;

    if(errData.msg) {
      msg = this.prepareMsg(errData.msg, errData.msgParams, !isUI);
    } else if (errData.defaultMsg) {
      msg = this.prepareMsg(errData.defaultMsg, errData.defaultMsgParams, !isUI);
    } else {
      msg = this.s.defaultMsg;
    }


    if (errData.err) {
      errData.origMsg = errData.err.origMsg || msg;
    } else {
      errData.origMsg = msg;
    }

    var UIFrontParams = [
      TB.CONFIG.ERR_USER,
      TB.CONFIG.ERR_PEER,
    ];
    if (UIFrontParams.indexOf(errData.type) == -1 && ! errData.addParams.isUIAppropriate) {
      msg = this.s.defaultMsg;
    }

    msg = msg || this.s.defaultMsg;

    errData.msg = msg;
    errData.code = code;



    var msgWithCode = '[' + code + '] ' + msg;
    var err = new errorMap[errData.type]( msgWithCode, errData );

    var stackSimple = this.simplifyStack(err, errData.depth || 0);

    err.addParams = errData.addParams;
    if (errData.hasStack === false) {
      err.stack = undefined;
    } else {
      err.stack = stackSimple;
    }

    var stack = stackSimple;
    var stackArray = stack.split("\n");

    var line = stackArray[1];
    var re = /.*?\((.*)\)/;
    var match = re.exec( line );
    if (match === null) {
      match = line;
    } else {
      match = match[1]
    }
    var matchArray = TB.rsplit(match, ":", 2);

    if (errData.hasStack !== false) {

      // there is a change for normalizeError to be called from the global handlers
      // and they WILL override our current line/col/filename etc. etc
      // So we must first get the line/col/filename from the errData /input data/, instead of trying to guess it ourselves /from the stack/
      // although we need it for some debug information

      err.filename = _.get(errData, 'filename') || matchArray[0];
      err.filenameUI = err.filename.split('?')[0];
      err.lineno = _.get(errData, 'lineno') || matchArray[1];
      err.colno = _.get(errData, 'colno') ||  matchArray[2];
      err.stack = _.get(errData, 'stack') || _.get(errData, 'err.stack') || err.stack;

      if (_.get(errData, 'err.stack')) {
        // add some more debug data
        err.rethrow_stack = stackSimple;
        err.rethrow_filename = matchArray[0];
        err.rethrow_lineno = matchArray[1];
        err.rethrow_colno = matchArray[2];
      }

      err.level = errData.level || AUDIT_LEVEL_ERROR;
    }

    //var filenameUILastTwoSlashes = TB.rsplit(matchArray[0], "/", 3);
    //filenameUILastTwoSlashes.shift();
    //filenameUILastTwoSlashes = filenameUILastTwoSlashes.join('/');
    //var filenameUILastTwoSlashesWithoutExtension = TB.rsplit(filenameUILastTwoSlashes, '.', 1);
    //var filenameUI = filenameUILastTwoSlashesWithoutExtension[0];
    //err.filenameUI = filenameUI;

    // the msgWithCode param only changes err.message.
    // the errData.code param only changes err.code.
	if (errData.type === TB.CONFIG.ERR_APP) {
      var checksum = generateChecksum(err.filenameUI + ":" + err.lineno + ":" + err.colno);
      err.code = classnameToPrefix[errData.type] + '/' + checksum;

      msgWithCode = '[' + err.code + '] ' + msg;
      err.message = msgWithCode;
    }


    return err;
  }

  p.remoteAuditConnector = function(flushData) {
    if(!TB.CONFIG.HAS_WINDOW) {
      return;
    }

    var errData = '{}';
    flushData = flushData || {};

    if (flushData.filename) {
      // all is fine, already set up!
    } else {
      flushData.filename = 'TO BE IMPLEMENTED';
      flushData.lineno = -1;
      flushData.colno = -1;
    }


    flushData.timestamp = new Date().toISOString();
    flushData.currentURL = window.location.href;
    flushData.refferer   = document.referrer;

    //messageParams come from the developer, so they CAN be bad!
    var badMessageParams = false;

    try {
        errData = tbSerialize(flushData);
    } catch(e) {
        try {
            delete flushData.tbData.msgParams;
            errData = JSON.stringify(flushData);
            badMessageParams = true;
        } catch(e) {
            errData = JSON.stringify({
                '__UNABLE_TO_ENCODE_ERR__': true,
                'msg': "[UNABLE TO ENCODE TO JSON]",
            });
        }
    }

    var self = this;
    var promise = new Promise(TB.noop);
    var data = {
      cgi: 'cgi',
      api_key: TB.API_KEY,
      err_data: errData,
      stack_trace: flushData.stack || (new Error()).stack,
      trace: traceData.join( '\r\n' ),
      command: 'ui_trace',
      bad_message_params: badMessageParams,
      terminal_descr: TB.CONFIG.INTERFACE_NAME,
    };

    clearTimeout(this.remoteAuditConnectorTimeout);
    var queryParams = TB.parseQueryParams();

    if(TB.Request) {
      var reqSettings = {
        httpMethod: 'POST',
        url: TB.CONFIG.API_URL || TB.API_URL || queryParams['api_url'],
        data: data
      };

      promise = new TB.Request(reqSettings).request();
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

        xhr.open('GET', TB.API_URL || '', true);
        xhr.onload = function(event) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    self.trace('Debug info successfully sent');
                    resolve();
                } else {
                    self.trace('Sending debug info failed with status $STATUS_TEXT$', {
                       STATUS_TEXT: xhr.statusText,
                    });
                    reject();
                }
            }
        };
        xhr.onerror = function(e) {
            self.trace('Sending debug info failed with status $STATUS_TEXT$', {
              STATUS_TEXT: xhr.statusText,
            });
        };

        xhr.send(formData);
      });
    }

    promise
      .then(function() {
        clearTimeout(self.remoteAuditConnectorTimeout);
      })
      .catch(function() {
        self.remoteAuditConnectorTimeout = setTimeout(function() {
          self.remoteAuditConnector(flushData);
        }, TB.CONFIG.XHR_RETRY_MS + Math.random() * TB.CONFIG.XHR_RETRY_MS);
      });

    return promise;
  };

  p.normalizeError = function normalizeError(origError) {
    // TODO @suricactus - what is this? Where is it used, what was the purpose of this?
    // var errContext = {
    //   navigator: (typeof navigator !== 'undefined') ? navigator.userAgent : null,
    // };
    var error;

    if(origError !== null && origError !== undefined) {
      if(origError instanceof TbCustomError) {
        error = origError;
      } else if (typeof origError === 'object' && origError !== null) {
         error = this.createError({
          type: TB.CONFIG.ERR_APP,
          code: TB.CONFIG.XERRORS_DEFAULT_CODE,
          err: origError,
          msg: origError.message,
          depth: 4,
          filename: origError.filename,
          lineno: origError.lineno,
          colno: origError.colno
        });
      } else {
        error = this.createError({
          type: TB.CONFIG.ERR_APP,
          code: TB.CONFIG.XERRORS_DEFAULT_CODE,
          err: origError,
          msg: origError,
          depth: 4,
          filename: origError.filename,
          lineno: origError.lineno,
          colno: origError.colno
        });
      }
    } else {
      error = this.createError({
        type: TB.CONFIG.ERR_APP,
        code: TB.CONFIG.XERRORS_DEFAULT_CODE,
        msg: TB.CONFIG.XERRORS_DEFAULT_MSG,
        data: event,
        depth: 5,
      });
    }

    error.timestamp = new Date().toISOString();

    if(! ( false
        || origError instanceof EvalError
        || origError instanceof RangeError
        || origError instanceof ReferenceError
        || origError instanceof SyntaxError
        || origError instanceof TypeError
        || origError instanceof URIError
        || origError instanceof TbCustomError
      )
    ) {
      error.isErrorTypeRecognized = true;
    }

    return error;
  };

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
  p.remoteAudit = function remoteAudit( level, msg, data ) {
    var data = {
      level: level || AUDIT_LEVEL_NOTICE,
      msg: msg || '',
      data: data,
      browser: TB.Browser && TB.Browser.getFullInfo( ),
      type_id: TB.CONFIG.SERVICE_AUDIT_TYPE_ID,
    };

    return TB.CONFIG.XERRORS_HOOK_REMOTE_AUDIT(data);
  };

  p.flush = function flush( level, msg, data ) {
    var err =  new Error();
    windowAlert('You are using flush(), but must be replaced by remoteAudit() near: ' + this.simplifyStack(err, 1))
    return remoteAudit(level, msg, data);
  }

  p.errorHandler = function errorHandler(tbError) {
    TB.LAST_ERROR = tbError;

    if(tbError.isHandled()) return tbError;

    tbError.setHandled(true);

    this.traceReadyMsg(tbSerialize(tbError));

    TB.CONFIG.XERRORS_HOOK_REMOTE_AUDIT(tbError);

    // TODO assert it is a function
    TB.CONFIG.XERRORS_HOOK_ERROR_HANDLER_UI(tbError);
    tbError.isUIHandled = true;


    if(tbError instanceof AppError || tbError instanceof PeerError ) {
      throw tbError;
    }

    return tbError;
  };

  p.errorHandlerUi = function errorHandlerUi(err) {
    if (err.isUIHandled) {
      return;
    }

    if ( ! TB.CONFIG.HAS_WINDOW ) {
      return;
    }

    var errDetails;
    if (_.get(err, 'addParams.reqErr.details')) {
      errDetails = err.addParams.reqErr.details;
    } else if (_.get(err, 'addParams.req_err.details')) {
      errDetails = err.addParams.req_err.details;
    }

    if (err.name === TB.CONFIG.ERR_USER) {
      TB.createNotification(err.msg + ' [' + err.code + ']', 'Operation failed!', 'warning', errDetails);
    } else {
      TB.createNotification('Operation Failed', err.msg + ' [' + err.code + ']', 'error', errDetails);
    }
  };

  if(TB.CONFIG.HAS_WINDOW) {
    var globalErrorHandling = function(errorEvent) {
      //alert("tb xerrors catch error");
      //console.log("Tzzz23", errorEvent);
      if (errorEvent.message === 'Script error.') {
        return false;
      }

      var filename = errorEvent.filename;
      if ( TB.CONFIG.WHITELISTED_ERROR_SOURCES.length !== 0 && filename !== '' && filename !== undefined ) {
        var domainName = TB.getDomain( filename );

        if ( TB.CONFIG.WHITELISTED_ERROR_SOURCES.indexOf( domainName ) == -1 ) {
          return false;
        }
      }

      TRACE("We got this data in the handlers: $$errorEventReason$$ $$errorEventErr", {
        errorEventReason: errorEvent.reason,
        errorEventErr: errorEvent.err,
        errorEvent: tbSerialize(errorEvent),
      });

      var origError;
      if (errorEvent.error && typeof errorEvent.error === 'object') {
        if (!errorEvent.error.lineno && errorEvent.lineno) {
          errorEvent.error.lineno = errorEvent.lineno;
        }
        if (!errorEvent.error.filename && errorEvent.filename) {
          errorEvent.error.filename = errorEvent.filename;
        }
        if (!errorEvent.error.colno && errorEvent.colno) {
          errorEvent.error.colno = errorEvent.colno;
        }

        origError = globalXerr.normalizeError(errorEvent.error);
      } else if (errorEvent.message) {
        origError = globalXerr.normalizeError({
          message: errorEvent.message,
          filename: errorEvent.filename,
          lineno: errorEvent.lineno,
          colno: errorEvent.colno,
          isCors: errorEvent.message === 'Script error.',
        });

      } else if (errorEvent.type && errorEvent.type === 'unhandledrejection') {
        // this case is throw new Error on a promise, all we have is a stack trace and message!
        var stack = _.get(errorEvent, 'reason.stack');
        var parsedStack = getLineFileAndColFromStack(stack);
        if (parsedStack) {
          origError = globalXerr.normalizeError({
            message: errorEvent.reason.message,
            filename: parsedStack.filename,
            lineno: parsedStack.lineno,
            colno: parsedStack.colno,
            stack: stack,
            isCors: errorEvent.reason.message === 'Script error.',
          });
        } else {
          // no idea, unhandled to the max!
          origError = globalXerr.normalizeError(errorEvent);
        }
      } else {
        origError = globalXerr.normalizeError();
      }

      // should be above but this will duplicate all the logic about finding the filename!
      var regexIsExtensionError = /^(.*)extension:\/\//;
      if (origError.filename && origError.filename.match(regexIsExtensionError)) {
        return;
      }

      globalXerr.errorHandler(origError);

      errorEvent.error2 = TB.LAST_ERROR;
      errorEvent.tbError = TB.LAST_ERROR;
    }

    window.addEventListener('error', globalErrorHandling);
    window.onunhandledrejection = globalErrorHandling;

  }

  var globalXerr = new XErrors();

  TB.TRACE1 = globalXerr.TRACE1;
  TB.TRACE2 = globalXerr.TRACE2;
  TB.TRACE3 = globalXerr.TRACE3;
  TB.TRACE4 = globalXerr.TRACE4;
  TB.TRACE5 = globalXerr.TRACE5;
  TB.TRACE = globalXerr.TRACE;

  TB.ASSERT = globalXerr.ASSERT;
  TB.ASSERT_PEER = globalXerr.ASSERT_PEER;
  TB.ASSERT_USER = globalXerr.ASSERT_USER;
  TB.ASSERT_CONFIG = globalXerr.ASSERT_CONFIG;
  TB.ASSERT_CONN = globalXerr.ASSERT_CONN;
  TB.ASSERT_OPEN_CONN = globalXerr.ASSERT_OPEN_CONN;

  TB.THROW_SYS = globalXerr.THROW_SYS;
  TB.THROW_PEER = globalXerr.THROW_PEER;
  TB.THROW_USER = globalXerr.THROW_USER;
  TB.THROW_CONFIG = globalXerr.THROW_CONFIG;
  TB.THROW_CONN = globalXerr.THROW_CONN;
  TB.THROW_OPEN_CONN = globalXerr.THROW_OPEN_CONN;


  TB.GET_LOG = globalXerr.getLog.bind(globalXerr);
  TB.FLUSH = globalXerr.remoteAudit.bind(globalXerr);
  TB.BENCHMARK_START = globalXerr.benchmarkStart.bind(globalXerr);
  TB.BENCHMARK_END = globalXerr.benchmarkEnd.bind(globalXerr);
  TB.CREATE_ERROR = globalXerr.createError.bind(globalXerr);
  TB.NORMALIZE_ERROR = globalXerr.normalizeError.bind(globalXerr);
  TB.ERROR_HANDLER = globalXerr.errorHandler.bind(globalXerr);
  TB.SERIALIZE = tbSerialize;

  TB.CONFIG = TB.CONFIG || {};
  TB.CONFIG.XERRORS_HOOK_REMOTE_AUDIT = TB.CONFIG.XERRORS_HOOK_REMOTE_AUDIT || globalXerr.remoteAuditConnector.bind(globalXerr);
  TB.CONFIG.XERRORS_HOOK_ERROR_HANDLER_UI = TB.CONFIG.XERRORS_HOOK_ERROR_HANDLER_UI || globalXerr.errorHandlerUi.bind(globalXerr);
  TB.CONFIG.XERRORS_DEFAULT_ERROR_HANDLER_UI = globalXerr.errorHandlerUi.bind(globalXerr);

  TB.XErrors = XErrors;
  TB.TbCustomError = TbCustomError;


  // Always export all the variables:
  var globalDebugFunctionNames = [
      'ASSERT', 'ASSERT_PEER', 'ASSERT_USER', 'ASSERT_CONFIG', 'ASSERT_CONN', 'ASSERT_OPEN_CONN',
      'THROW_SYS', 'THROW_PEER', 'THROW_USER', 'THROW_CONFIG', 'THROW_CONN', 'THROW_OPEN_CONN',
      'FLUSH', 'BENCHMARK_START', 'BENCHMARK_END',
      'NORMALIZE_ERROR',
      'TRACE', 'TRACE1', 'TRACE2', 'TRACE3', 'TRACE4', 'TRACE5',
  ];



  for ( var i = 0, l = globalDebugFunctionNames.length; i < l; i++ ) {
    var debugFunctionName = globalDebugFunctionNames[ i ];

    if (TB.CONFIG.HAS_WINDOW) {
      window[ debugFunctionName ] = TB[ debugFunctionName ];
    }
  }


  return TB;
});
