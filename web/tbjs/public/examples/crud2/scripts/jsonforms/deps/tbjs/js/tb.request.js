;(function(window){
'use strict';
var TB = window.TB || {};
window.TB = TB;
var DOMhead = document.getElementsByTagName( 'head' )[0];

/**
 * Request class
 * @constructor
 * @memberOf TB
 * @param {Object} settings instance settings
 * @param {Object} settings.url remote url
 * @param {?Function} settings.before complete callback
 * @param {?Function} settings.complete complete callback
 * @param {?Function} settings.progress progress callback
 */
function Request( settings ) {
  if ( !( this instanceof Request ) ) {
    return new Request( settings );
  }

  var self = this;


  /**
   * Settings holder
   * @name Request#s
   * @type {Object}
   */
  this.s = _.extend({
    data: null,
    processData: true,
    httpMethod: 'GET'
  }, settings);

  /**
   * Timeout id
   * @name Request#timeout
   * @type {?Number}
   */
  this.timeout = null;

  /**
   * HTTP method
   * @name Request#httpMethod
   * @type {String}
   */
  this.httpMethod = ( this.s.httpMethod || 'GET' ).toUpperCase( );

  /**
   * Service URL
   * @name Request#url
   * @type {String}
   */
  this.url = this.s.url || '';

  /**
   * Data to send to the server
   * @name Request#data
   * @type {*}
   */
  this.data = null;

  /**
   * Request object
   * @type {Object}
   */
  this.request = null;


  if ( !TB.isEmpty( this.s.data ) ) {
    if ( this.s.processData ) {
      this.data = this._toQueryString( this.s.data );
    } else {
      this.data = this.s.data;
    }

    if ( this.httpMethod === 'GET' ) {
      this.url = TB.urlAppend( this.url, this.data );
      this.data = null;
    }
  }


  // If timeout, set timeout
  if ( TB.isNumber( this.s.timeout ) && this.s.timeout > 0 ) {
    this.timeout = setTimeout( function( ) {
      self._timedOut = true;
      self.request.abort( );
    }, this.s.timeout );
  }


  this.promise = new Promise( function( resolve, reject ) {
    self._promiseResolve = resolve;
    self._promiseReject = reject;
  } );


  this.request = this._makeRequest();
}

/** @lends TB.Request.prototype */
Request.prototype = {
  /**
   * Default request headers
   * @private
   * @type {Object}
   */
  _defaultHeaders: {
    contentType: 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
    accept: {
      '*': 'text/javascript, text/html, application/xml, text/xml, */*',
      xml: 'application/xml, text/xml',
      html: 'text/html',
      text: 'text/plain',
      json: 'application/json, text/javascript',
      js: 'application/javascript, text/javascript',
    },
  },
  /**
   * getRequest
   * @private
   * @return {Object} XHR object
   */
  _makeRequest: function( ) {
    if ( this.s.type === 'jsonp' ) {
      return this._makeRequestJSONP();
    } else {
      return this._makeRequestXHR();
    }
  },
  /**
   * Make request with JSONP
   * @private
   * @return {Object} abortable
   */
  _makeRequestJSONP: function( ) {
    var cbQueryParamName = this.s[ 'jsonpCallback' ] || 'callback';
    var cbQueryParamValue = this.s[ 'jsonpCallbackName' ];
    var scriptEl = document.createElement( 'script' );
    var isLoaded = false;
    var responseData;

    this.url = TB.urlAppend( this.url, this.data );
    this.url = TB.urlAppend( this.url, cbQueryParamName + '=' + cbQueryParamValue );

    window[ cbQueryParamValue ] = function( data ) {
      responseData = data;
    };

    scriptEl.type = 'text/javascript';
    scriptEl.src = this.url;
    scriptEl.async = true;


    scriptEl.onload = scriptEl.onreadystatechange = function() {
      if ( ( scriptEl.readyState && scriptEl.readyState !== 'complete' && scriptEl.readyState !== 'isLoaded' ) || isLoaded ) {
        return false;
      }

      scriptEl.onload = null;
      scriptEl.onreadystatechange = null;

      if ( scriptEl.onclick ) {
        scriptEl.onclick();
      }

      // Call the user callback with the last value stored and clean up values and scripts.
      this._successCallback( responseData );
      responseData = undefined;
      DOMhead.removeChild( scriptEl );
      isLoaded = true;
    };

    DOMhead.appendChild( scriptEl );

    return {
      abort: function() {
        scriptEl.onload = scriptEl.onreadystatechange = null;
        this._errorCallback( this.request, 'abort', {} )
        responseData = undefined;
        DOMhead.removeChild( scriptEl );
        isLoaded = true;
      },
    };
  },
  /**
   * Make request with XHR
   * @private
   * @return {Object}      XHR object
   */
  _makeRequestXHR: function() {
    var xhr = this._getXHR( this.s );

    xhr.open( this.httpMethod, this.url, !( this.s.async ) );

    this._setHeaders( xhr );
    this._setCredentials( xhr );

    xhr.onreadystatechange = this._handlerReadystatechangeXHR.bind( this );


    if(_.isFunction(this.s.beforeSend)) {
      this.s.beforeSend(xhr);
    }


    xhr.send( this.data );

    return xhr;
  },

  /**

   * Gets XMLHtttpRequest object
   * @private
   console.log(headers)
   * @return {Object} XHR object
   */
  _getXHR: function( ) {
    ASSERT.hasProperty( window, 'XMLHttpRequest', 'Browser does not support AJAX' );

    var xhr = new XMLHttpRequest( );

    if ( this.s.crossOrigin === true ) {
      ASSERT.hasProperty( xhr, 'withCredentials', 'Browser does not support cross-origin requests' );
    }

    return xhr;
  },

  /**
   * Handler onreadystatechange
   * @private
   */
  _handlerReadystatechangeXHR: function( ) {
    // use _aborted to mitigate against IE err c00c023f
    // ( can't read props on aborted request objects )
    if ( this._aborted ) {
      return this._errorCallback( this.request, 'abort' );
    }

    if ( this._timedOut ) {
      return this._errorCallback( this.request, 'timeout' );
    }

    if ( this.request && this.request.readyState === 4 ) {
      this.request.onreadystatechange = TB.noop;

      if ( this._checkResponseStatus() ) {
        this._successCallback( this.request.responseText );
      } else {
        this._errorCallback( this.request );
      }
    }
  },
  /**
   * Check if response status is ok
   * @private
   * @return {Boolean} true if http(s) status is 2xx
   */
  _checkResponseStatus: function() {
    var httpRe = /^http/;
    var protocolRe = /(^\w+):\/\//;
    var successStatus = /^(2\d\d)$/;
    var protocolMath = protocolRe.exec( this.url );
    var protocol = ( protocolMath && protocolMath[ 1 ] ) || window.location.protocol;

    // If http request
    if ( httpRe.test( protocol ) ) {
      return successStatus.test( this.request.status );
    } else {
      return !!this.request.response;
    }
  },
  /**
   * Callback when request is successfull
   * @private
   * @param {String} filteredResponse response text
   */
  _successCallback: function( filteredResponse ) {
    var type = this.s.type || this._getTypeFromResponseHeader( this.request.getResponseHeader( 'Content-Type' ) );

    if ( filteredResponse ) {
      switch ( type ) {
      case 'json':
        try {
          filteredResponse = JSON.parse( filteredResponse );
        } catch ( err ) {
          return this.reject( {
            reason: this.request,
            error: err,
          } );
        }
        break;
      case 'js':
        filteredResponse = eval( filteredResponse );
        break;
      case 'html':
        filteredResponse = filteredResponse;
        break;
      case 'xml':
        filteredResponse = this.request.responseXML && this.request.responseXML.parseError // IE trololo
        && this.request.responseXML.parseError.errorCode && this.request.responseXML.parseError.reason ? null : this.request.responseXML;
        break;
      default:
        THROW( 'Unknown type' );
      }
    }

    this._promiseResolve( {
      data: filteredResponse,
    } );


    this._completeCallback( filteredResponse );
  },
  /**
   * Callback when request has an error
   * @private
   * @param  {Object} response failed response
   * @param  {String} reason      error message string
   * @param  {*} t        TODO
   */
  _errorCallback: function( response, reason, t ) {
    this._promiseReject( {
      xhr: response,
      reason: reason,
      error: t,
    } );
    this._completeCallback( response );
  },
  /**
   * Callback to complete when request either failed or succeed
   * @private
   * @param  {Object} resp response
   */
  _completeCallback: function( resp ) {
    if ( this.s.timeout ) {
      clearTimeout( this.timeout );
    }

    this.timeout = null;

    if ( TB.isFunction( this.s.complete ) ) {
      this.s.complete( resp );
    }
  },
  /**
   * Get type by response headers
   * @private
   * @param  {String} header value of "Content-Type" header
   * @return {String}
   */
  _getTypeFromResponseHeader: function( header ) {
    // json, javascript, text/plain, text/html, xml
    if ( header === null ) { return undefined; } //In case of no content-type.
    if ( header.match( 'json' ) ) { return 'json'; }
    if ( header.match( 'javascript' ) ) { return 'js'; }
    if ( header.match( 'text' ) ) { return 'html'; }
    if ( header.match( 'xml' ) ) { return 'xml'; }
  },
  /**
   * Set credentials if needed
   * @param {Object} xhr XHR object
   */
  _setCredentials: function( xhr ) {
    if ( TB.isDefined( this.s.withCredentials ) && TB.isDefined( xhr.withCredentials ) ) {
      xhr.withCredentials = !!this.s.withCredentials;
    }
  },
  /**
   * Set header to XHR object
   * @private
   * @param {Object} xhr XHR object
   */
  _setHeaders: function( xhr ) {
    var headers = this.s.headers || {};

    headers[ 'Accept' ] = headers[ 'Accept' ] || this._defaultHeaders[ 'accept' ][ this.s.type ] || this._defaultHeaders[ 'accept' ][ '*' ];


    // if passed data is instance of FormData then make form request
    var isAFormData = typeof FormData === 'function' && ( this.s.data instanceof FormData );

    // breaks cross-origin requests with legacy browsers
    if ( !this.s.crossOrigin && !headers[ 'X-Requested-With' ] ) {
      headers[ 'X-Requested-With' ] = this._defaultHeaders[ 'X-Requested-With' ];
    }

    if ( !headers[ 'Content-Type' ] && !isAFormData ) {
      headers[ 'Content-Type' ] = this.s.contentType || this._defaultHeaders[ 'contentType' ];
    }


    for ( var header in headers ) {
      xhr.setRequestHeader( header, headers[ header ] );
    }
  },
  /**
   * Convert data to query string
   * @todo refactor this
   * @private
   * @param  {(Object|Array)} requestData data to convert to
   * @return {String}
   */
  _toQueryString: function( requestData ) {
    if ( TB.isString( requestData ) || TB.isEmpty( requestData ) ) {
      return requestData;
    }

    var queryArr = [];
    var add = function( key, value ) {
      // If value is a function, invoke it and return its value
      value = ( TB.isFunction( value ) )
        ? value()
        : ( ( value === null ) ? '' : value );
      queryArr[ queryArr.length ] = encodeURIComponent( key ) + '=' + encodeURIComponent( value );
    };

    // If an array was passed in, assume that it is an array of form elements.
    if ( TB.isArray( requestData ) ) {
      for ( var i = 0; requestData && i < requestData.length; i++ ) {
        add( requestData[ i ][ 'name' ], requestData[ i ][ 'value' ] );
      }
    } else {
      // If traditional, encode the "old" way ( the way 1.3.2 or older
      // did it ), otherwise encode params recursively.
      for ( var prefix in requestData ) {
        if ( requestData.hasOwnProperty( prefix ) ) {
          this._buildParams( prefix, requestData[ prefix ], add );
        }
      }
    }

    // spaces should be + according to spec
    return queryArr.join( '&' ).replace( /%20/g, '+' );
  },
  /**
   * Build query params
   * @todo refactor this
   * @private
   * @param  {String} prefix TODO
   * @param  {Object} obj    TODO
   * @param  {Function} add    add callback
   */
  _buildParams: function( prefix, obj, add ) {
    var rbracket = /\[ \ ]$/;

    if ( TB.isArray( obj ) ) {
      // Serialize array item.
      for ( var i = 0, l = obj.length; obj && i < l; i++ ) {
        var value = obj[ i ];

        if ( rbracket.test( prefix ) ) {
          // Treat each array item as a scalar.
          add( prefix, value );
        } else {
          this._buildParams( prefix + '[ ' + ( typeof value === 'object' ? i : '' ) + ' ]', value, add );
        }
      }
    } else if ( obj && obj.toString( ) === '[ object Object ]' ) {
      // Serialize object item.
      for ( var name in obj ) {
        this._buildParams( prefix + '[ ' + name + ' ]', obj[ name ], add );
      }

    } else {
      // Serialize scalar item.
      add( prefix, obj );
    }
  },
  /**
   * Abort request
   */
  abort: function( ) {
    this._aborted = true;
    this.request.abort( );
  },
};


TB.Request = Request;
})( typeof window === "undefined" ? this : window );
