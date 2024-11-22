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
    //console.log( msgStr );
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

  argsArr.unshift( true );
  errMsgStr = makeMsg.apply( this, argsArr );
  errObj = new Error( errMsgStr );

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

    throwError( msgStr );

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
   * @alias ASSERT.hasPropertyOfTbType
   * @memberOf  module:xerrors
   * @param {Object}  value value to check
   * @param {String}  property property to check
   * @param {String} type type to check
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @see type is determined using {@link TB.typeof}
   * @return {Boolean}
   */
  assert.hasPropertyOfTbType = function( value, property, type ) {
    var isObject = TB.isObject( value );
    var tbTypeProperty = ( isObject ) ? TB.typeof( value[ property ] ) : 'undefined';

    return assertSugar( isObject && TB.typeof( value[ property ] ) === type, TB.toArray( arguments ).slice( 3 ), 'Value must have property "%s" of type "%s", but "%s" given for %s', property, type, tbTypeProperty, value );
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
  assert.hasPropertyOfTbTypes = function( value, property, types ) {
    var typesArr;
    var tbType;
    var tbTypeProperty;

    if ( TB.isString( types ) ) {
      typesArr = types.split( TB.CONFIG.TYPE_DELIMITER );
    } else if ( TB.isArray( type ) ) {
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
   * @alias ASSERT.ofTbType
   * @memberOf  module:xerrors
   * @param {Object}  value value to check
   * @param {String} types type to check
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @see type is determined using {@link TB.typeof}
   * @return {Boolean}
   */
  assert.ofTbType = function( value, type ) {
    var tbType = TB.typeof( value );

    return assertSugar( tbType === type, TB.toArray( arguments ).slice( 2 ), 'Value must be of type "%s", given "%s" for %s', type, tbType, value );
  };

  /**
   * Assert if value has own property of type
   * @alias ASSERT.ofTbTypes
   * @memberOf  module:xerrors
   * @param {Object}  value value to check
   * @param {String} types types to check
   * @param {...(String|*)} [msgPartials] message partials for the assert {@link module:xerrors~makeMsg}
   * @see type is determined using {@link TB.typeof}
   * @return {Boolean}
   */
  assert.ofTbTypes = function( value, types ) {
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

  return assert;
}

/**
 * Traces content
 * @todo this function must really send http request one day
 * @deprecated it's not implemented yet
 * @alias FLUSH
 * @memberOf module:xerrors
 * @return {object} promise
 */
var flush = function( ) {
  var data = {
    trace: traceData.join( '\r\n' ),
    browser: TB.Browser.getFullInfo( ),
  };

  // TODO send real http request
  return new Promise( TB.noop );
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

if ( TB.CONFIG.DEBUG_IN_GLOBAL_SCOPE ) {
  var globalDebugFunctionNames = ['ASSERT', 'ASSERT_PEER', 'ASSERT_USER', 'TRACE', 'THROW', 'THROW_PEER', 'THROW_USER', 'FLUSH', 'BENCHMARK_START', 'BENCHMARK_END'];

  for ( var i = 0, l = globalDebugFunctionNames.length; i < l; i++ ) {
    var debugFunctionName = globalDebugFunctionNames[ i ];

    window[ debugFunctionName ] = TB[ debugFunctionName ];
  }
}
