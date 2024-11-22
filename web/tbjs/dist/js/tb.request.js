/** LOADER **/
/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @desc request wrapper
 * @module Request
 * @memberOf TB
 */
;(function(global, factory) {
  if(typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('lodash'), require('tb.xerrors'));
  } else if (typeof define === 'function' && define.amd) {
    define(['lodash', 'tb.xerrors'], function() {
      return factory.apply(factory, arguments);
    });
  } else {
    global.TB = global.TB || {};
    global.TB.Request = factory(global._, global.TB);
  }
})(this, function(_, TB) {
  'use strict';

  let HTTP_LINE_DELIMITER = '\r\n';

  let websocketPool = [];
  const WEBSOCKET_COUNT = 5; 

  class TBWebsocket {

    constructor() {
    }

    get response() {
      return this.responseText;
    }

    get readyState() {
      return this._readyState;
    }

    set readyState(_state) {
      this._readyState = _state;
      this.onreadystatechange();
    }

    onreadystatechange() { }

    abort() {
      this.readyState = 0;
      this.status = 0;
      if (this.ws && this.ws.readyState <= 1) {
        this.ws.close();
      }
    }

    getResponseHeader(header) {
      return this.responseHeaders[header.toLowerCase()];
    }

    setRequestHeader(header, value) {
      this.requestHeaders[header.toLowerCase()] = value;
    }

    open(method, url, options = {}) {

      this.method = method;

      url = url.replace('.', window.location.pathname);
      // TODO
      // ASSERT.has(window, 'WebSocket', { code: 'TBJS/REQ/2010', msg: 'Browser does not support Websockets', } );

      let wsProtocol = window.location.protocol === 'http:' ? 'ws:' : 'wss:';

      // let wsUrl = `wss://tblib-test.tb-pro.com/${url}`;
      let wsUrl = `${wsProtocol}//${window.location.host}${url}`;

      let optionsSearch = this.getParamsFromObject(options);
      if (url.indexOf('?') === -1) {
        wsUrl += '?' + optionsSearch;
      } else {
        wsUrl += '&' + optionsSearch;
      }

      let eventSettings = {
        once: true
      };

      // return new TB.Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.addEventListener('open', (event) => {
        this.readyState = 1;
        websocketPool.push(this);
        this.openResolve();

        this.stopReject = this.sendReject;

      }, eventSettings);

      this.ws.addEventListener('error', (e) => {
        console.log('error', e);
        this.stopReject();
        this.stopReject = () => { }; // TODO: replace with lodash noop
        // clearTimeout(timeout);

      }, eventSettings);

      this.ws.addEventListener('close', (c) => {
        console.log('close', c.code, c.reason);
        this.stopReject();
        // clearTimeout(timeout)
      }, eventSettings);

      this.ws.addEventListener('message', async (event) => {

        let msg = await event.data.text();

        if (msg === 'WSG_BEG') {
          this.readyState = 2;
        } else if (msg === 'WSG_EOF') {
          // this.s.type = 'html';
          // this._successCallback(response.responseText);
          /*this.sendResolve(new Response(this.responseText, {
                    status: this.status,
                    statusText: '',
                    headers: this.responseHeaders
                }));
                */
          this.sendResolve({
            body: this.responseText,
            status: this.status,
            headers: this.responseHeaders
          })
          this.readyState = 4;
          websocketPool.push(this);
        } else {
          if (!this.status) {
            let statusLineDelimIndex = msg.indexOf(HTTP_LINE_DELIMITER);

            this.status = msg.slice(0, statusLineDelimIndex);
            let headersString = msg.slice(HTTP_LINE_DELIMITER.length + statusLineDelimIndex);

            this.responseHeaders = headersString.split(HTTP_LINE_DELIMITER).reduce((acc, cur) => {
              let [headerKey, headerVal] = cur.split(': ');
              acc[headerKey] = headerVal;
              return acc;
            }, {});

            this.readyState = 3;
          } else {
            this.responseText += msg;
          }
        }
      });

      // });

      return this.openPromise;
    }

    send(body = null, url = '', method = null) {

      this.requestHeaders['authorization'] = 'Basic ' + btoa(unescape(encodeURIComponent(window.TB.LOGIN + ':' + window.TB.PASSWD)));
      this.requestHeaders['referer'] = window.location.href;

      // this.requestPromise = new TB.Promise((resolve, reject) => {
      //     this.requestResolve = resolve;
      //     this.requestReject = reject;
      // });

      let endpoint = url.replace('./', window.location.pathname.slice(0, window.location.pathname.lastIndexOf('/') + 1));

      let message = this.prepareMessage({
        body,
        endpoint,
        method: method || this.method || 'GET',
        headers: this.requestHeaders
      });


      try{
        let i = 0;
        while (i < message.headers.length) {
          this.ws.send(message.headers.slice(i, i += 65535));
        }

        i = 0;
        while (message.body && (i < message.body.length || i < message.body.byteLength)) {
          this.ws.send(message.body.slice(i, i += 65535));
        }

        if (message.checksum) {
          this.ws.send(message.checksum);
        }
      }catch(e){
        console.log('caught', e);
      }

      return this.sendPromise;
    }

    /**
     * Returns the settings, parsed to the protocol of the WSG
     * @param {Object} settings - An object for wrapping the HTTP request parameters.
     * @param {string} settings.method - The HTTP method to use for the request.
     * @param {string} settings.endpoint - The Endpoint the request is sent to.
     * @param {Object} [settings.wsgParameters={}] - An object containing the web socket gateway overhead.
     * @param {Object} [settings.headers={}] - An object containing the headers of the request.
     * @param {Object} [settings.getParams={}] - An object containing the get parameters of the request.
     * @param {string} [settings.body={}] - Body of the request.
     * @returns {Uint8Array}
     */
    prepareMessage(settings) {

      ASSERT(settings, { msg: "Parameter must not be null." });
      // ASSERT(settings.method, "Method must not be null.");
      // ASSERT(settings.endpoint != null, "Endpoint must not be null.");

      // const HTTP_LINE_DELIMITER = '\r\n';

      let payload = `${settings.method} ${settings.endpoint}`;
      if (settings.getParams) {

        let getParamsStr = this.getParamsFromObject(settings.getParams);

        if (payload.includes('?')) {
          getParamsStr = '&' + getParamsStr;
        } else {
          getParamsStr = '?' + getParamsStr;
        }

        payload += getParamsStr;
      }

      payload += HTTP_LINE_DELIMITER;

      let bodySize = (new Blob([settings.body || ''])).size;

      settings.headers = _.merge(
        settings.headers, 
        {
          "wsg-content-length": bodySize,
          "wsg-do-checksum": String(Boolean(settings.doChecksum))
        }
      );

      for (const header in settings.headers) {
        const value = settings.headers[header];
        payload += `${header}: ${value}${HTTP_LINE_DELIMITER}`;
      }

      payload += HTTP_LINE_DELIMITER;

      let message = {
        headers: payload.length + HTTP_LINE_DELIMITER + payload,
        body: settings.body,
      };

      /*
        if (settings.doChecksum) {
            const te = new TextEncoder();
            let payloadEncoded = te.encode(payload);
            let tmp = new Uint8Array(payloadEncoded.byteLength + bodyEncoded.byteLength);
            tmp.set(new Uint8Array(payloadEncoded), 0);
            tmp.set(new Uint8Array(bodyEncoded), payloadEncoded.byteLength);

            let checksum = [...new Uint8Array(await crypto.subtle.digest('SHA-256', tmp))]
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');

            checksum += HTTP_LINE_DELIMITER;
            message.checksum = checksum;
        }
        */
      return message;
    }

    getParamsFromObject(getParamsObj) {

      ASSERT(getParamsObj, { msg: "Get params should not be null." });

      return Object.entries(getParamsObj).map(([key, value]) => {
        if (value && String(value).length > 0) {
          return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        }
        return encodeURIComponent(key);
      }).join('&');
    }
  }

  function initializeWebsocketPool(){
    for (let i = 0; i < WEBSOCKET_COUNT; i++) {
      let tbws = new TBWebsocket();
      tbws.open("GET", '/', {
        "ws_type":"command",
        "wsg_version": "tbwsg01"
      });
    }
  }

  function useWS(){
    return window.location.href.indexOf('tblib-test.tb-pro.com') !== -1 || window.location.port === '9876';
  }

  if (useWS()) {
    //if ( window.location.search.indexOf('wsg') !== -1 ) {
    initializeWebsocketPool();
  }

  ASSERT(typeof _ != 'undefined', { code: 'TBJS/REQ/1010', msg: "Missing lodash", });

  // this._errorCallback: is actually network error callback: timeout, abort, non-2\d\d HTTP status code 

  /** LOADER **/

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
      httpMethod: 'GET',
      timeout: 10000,
      retardTimeout: 800,
      retardCb: null,
      retry: true,
      retryAuto: true, // TODO global
      retryRepeats: 3,
      retryInterval: 100,
      requestType: 'urlencode',

      isUIRequest: true,
      overlaySelector: null,
      loadingAnimationSelector: null,
    }, settings);

    if (this.s.cb) {
      ASSERT( ! _.has(this.s, 'cb') || _.isFunction(this.s.cb), "Provided settings CB is not a function!");
    }

    /**
     * Timeout id
     * @name Request#timeout
     * @type {?Number}
     */
    this.timeout = null;

    /**
     * Timeout for requests which last too long
     * @name Request#timeout
     * @type {?Number}
     */
    this.retardTimeout = null;

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
      * overlaySelector for loading
      * @name Request#overlaySelector
      * @type {String, null}
    */
    this.overlaySelector = this.s.overlaySelector;

    /**
      * loadingAnimationSelector for loading
      * @name Request#loadingAnimationSelector
      * @type {String, null}
    */
    this.loadingAnimationSelector = this.s.loadingAnimationSelector;


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
    this.requestObj = null;


    /**
     * Numbers request retried
     * @type {Number}
     */
    this.commitedRetries = 0;

    if ( !_.isEmpty( this.s.data ) ) {
      if ( this.s.processData ) {
        this.data = TB.toQueryString( this.s.data );
      } else {
        this.data = this.s.data;
      }

      if ( this.httpMethod === 'GET' ) {
        this.url = TB.urlAppend( this.url, this.data );
        this.data = null;
      }
    }

    this.promise = new TB.Promise( function( resolve, reject ) {
      self._promiseResolve = resolve;
      self._promiseReject = reject;
    } );

    this.isRequested = false;

    this.then = function() {
        this.promise = this.promise.then.apply(this.promise, arguments);
        return this;
    };

    this.catch = function() {
        this.promise = this.promise.catch.apply(this.promise, arguments);
        return this;
    };
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
      // 'X-Requested-With': 'XMLHttpRequest',
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
      var self = this;

      TRACE('Starting request');

      this.isRequested = true;

      // If timeout, set timeout
      if ( _.isNumber( this.s.timeout ) && this.s.timeout > 0 ) {
        this.timeout = setTimeout( function( ) {
          self._timedOut = true;
          self.requestObj.abort();
          self.timeout = null;

          // adding 1s to the retry interval, because timeout :)
          self.currentRetryInterval += 1000;
        }, this.s.timeout + 10000 );
      }

      if ( _.isNumber( this.s.retardTimeout ) && this.s.retardTimeout > 0 ) {
        this.retardTimeout = setTimeout( function( ) {
            self._retarded = true;

            if ( _.isFunction( self.s.retardCb ) ) {
               self.s.retardCb();
            }
        }, self.s.retardTimeout);
      }

      if ( this.s.type === 'jsonp' ) {
          this.requestObj = this._makeRequestJSONP();
      } else if ( useWS() ) {
          this.requestObj = this._makeRequestWS();
      } else {
          this.requestObj = this._makeRequestXHR();
      }
    },


	_makeRequestWS: function() { // changing to async will require changes on makeRequest
		
        if (websocketPool.length === 0){
				let tbws = new TBWebsocket();
			 	tbws.open("GET", '/', {
					"ws_type": "command",
					"wsg_version": "tbwsg01"
			  	});	
            //tbws.onreadystatechange = ()=>{
               websocketPool.push(tbws);
            //   tbws.onreadystatechange = _.noop;
            //}
        }

        let ws = websocketPool.shift();
        this._setHeaders( ws );
        this._setCredentials( ws );

        ws.onreadystatechange = this._handlerReadystatechangeXHR.bind( this );

        /*
        if(_.isFunction(this.s.beforeSend)) {
           this.s.beforeSend(xhr);
        }
        */

       /* 		
        var sentData = null;
        //form contains files that should be appended to the request: must be sent via formData
        if(this.s.requestType === 'formdata'&& this.s.requestFiles) {
           var formData = new FormData();
           var jsonPointerToName = {};

           for (var key in this.s.requestFiles.fileRequest) {
              if(this.s.requestFiles.fileRequest.hasOwnProperty(key)) {
                 var file = this.s.requestFiles.fileRequest[key].file;
                 var fileName = this.s.requestFiles.fileRequest[key].name;
                 if (_.isArray(file)) {
                    for (var i = 0; i < file.length; i++) {
                       formData.append(key, file[i], fileName);
                    }
                 } else {
                    formData.append(key, file, fileName);
                 }
              }
           }

           for (var key in this.data) {
              formData.append(key, this.data[key]);
           }

           sentData = formData;
        } else {
           sentData = this.data;
        }
        */


        ws.send( this.data, this.url, this.httpMethod);
        this._showLoadingAnimation();

        return ws;
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
           }

           this._hideLoadingAnimation();

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
              this._errorCallback( this.requestObj, 'abort', {} )
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

        var sentData = null;
        //form contains files that should be appended to the request: must be sent via formData
        if(this.s.requestType === 'formdata'&& this.s.requestFiles) {
           var formData = new FormData();
           var jsonPointerToName = {};

           for (var key in this.s.requestFiles.fileRequest) {
              if(this.s.requestFiles.fileRequest.hasOwnProperty(key)) {
                 var file = this.s.requestFiles.fileRequest[key].file;
                 var fileName = this.s.requestFiles.fileRequest[key].name;
                 if (_.isArray(file)) {
                    for (var i = 0; i < file.length; i++) {
                       formData.append(key, file[i], fileName);
                    }
                 } else {
                    formData.append(key, file, fileName);
                 }
              }
           }

           for (var key in this.data) {
              formData.append(key, this.data[key]);
           }

           sentData = formData;
        } else {
           sentData = this.data;
        }

        xhr.send( sentData );
        this._showLoadingAnimation();

        return xhr;
     },

     /**
      * Gets XMLHtttpRequest object
      * @private
      * @return {Object} XHR object
      */
     _getXHR: function( ) {
        ASSERT.has(window, 'XMLHttpRequest', { code: 'TBJS/REQ/2010', msg: 'Browser does not support AJAX', } );

        var xhr = new XMLHttpRequest();

        if ( this.s.crossOrigin === true ) {
           ASSERT.has(xhr, 'withCredentials', { code: 'TBJS/REQ/2020', msg: 'Browser does not support cross-origin requests', } );
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
           this._hideLoadingAnimation();

           return this._errorCallback( this.requestObj, 'abort' );
        }

        if ( this._timedOut ) {
           if ( ! this._isOnline() ) {

              // infinite retry in the case of timeout + non-online
              this._request();

              return;
           } else {
              this._hideLoadingAnimation();
              this._errorCallback( this.requestObj, 'timeout' );

              return;
           }
        }

        if ( this.requestObj && this.requestObj.readyState === 4 ) {
           this.requestObj.onreadystatechange = _.noop;

           this._hideLoadingAnimation();

           if ( this._checkResponseStatus() ) {
              this._successCallback( this.requestObj.responseText );
           } else {
              this._errorCallback( this.requestObj );
           }
        }
     },
     /**
      * Check if response status is ok
      * @private
      * @return {Boolean} true if the request has finished successfully, whatever that means!
      */
     _checkResponseStatus: function() {
        var httpRe = /^http/;
        var protocolRe = /(^\w+):\/\//;

        var successStatus = /^(2\d\d)$/;

        var protocolMath = protocolRe.exec( this.url );
        var protocol = ( protocolMath && protocolMath[ 1 ] ) || window.location.protocol;

        // If http request
        if ( httpRe.test(protocol) ) {
           if (successStatus.test(this.requestObj.status)) {
              return true;
           }

           if (this.requestObj.status === 304) {
              return true;
           }

           return false;
        } else {
           return !!this.requestObj.response;
        }
     },

     _parseResponse: function (filteredResponse) {
        var type = this.s.type || this._getTypeFromResponseHeader( this.requestObj.getResponseHeader( 'Content-Type' ) );

        if ( filteredResponse ) {
           switch ( type ) {
              case 'json':
                 filteredResponse = JSON.parse( filteredResponse );
                 break;
              case 'js':
                 filteredResponse = eval( filteredResponse );
                 break;
              case 'html':
                 filteredResponse = filteredResponse;
                 break;
              case 'xml':
                 filteredResponse = this.requestObj.responseXML && this.requestObj.responseXML.parseError
                    && this.requestObj.responseXML.parseError.errorCode && this.requestObj.responseXML.parseError.reason ? null : this.requestObj.responseXML;
                 break;
              default:
                 THROW( 'Unknown expected response type' );
           }
        }

        return filteredResponse;
     },

    loadResponseInContainer: function(responseBody, containerSelector){
      document.querySelector(containerSelector).setHTML(responseBody);
    },

     /**
      * Callback when request is successfull
      * @private
      * @param {String} filteredResponse response text
      */
     _successCallback: function( filteredResponse ) {
        let parsedFilteredResponse;
        try {
           parsedFilteredResponse = this._parseResponse(filteredResponse);
        } catch (err) {
           return this._reqPromiseReject({
              reason: this.request,
              error: err,
           });
        }

        this._reqPromiseResolve( {
           data: parsedFilteredResponse,
        });

        // Ако дадена заявка е "fg", ако типа на отговора е "html" (content-type), и заявката е "успешна" (status_code: 200), да се попълни в контейнера (contSelector)
       if (this.s.fg && this.requestObj.getResponseHeader("content-type").startsWith('text/html')) {
        this.loadResponseInContainer(parsedFilteredResponse, this.s.contSelector);
       }

        this._completeCallback(parsedFilteredResponse);
     },
     _unknownError: function (response, reason, t) {
        this._reqPromiseReject({
           xhr: response,
           reason: reason,
           error: t,
        });
		
        this._completeCallback( response );
     },
     /**
      * Callback when request has an error
      * @private
      * @param  {Object} response failed response
      * @param  {String} reason      error message string
      * @param  {*} t        TODO
      */
     _errorCallback: function( response, reason, t ) {

        if ( ! response.response ) {
           this._unknownError(response, reason, t);
           return;
        }

        try {
           let parsedFilteredResponse = this._parseResponse(response.response);

           this._reqPromiseResolve( {
              data: parsedFilteredResponse,
           });
           this._completeCallback( response );

        } catch (err) {
           this._unknownError(response, reason, t);
        }
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

        if ( _.isFunction( this.s.complete ) ) {
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
        if ( !_.isNil( this.s.withCredentials ) && !_.isNil( xhr.withCredentials ) ) {
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
        // if ( !this.s.crossOrigin && !headers[ 'X-Requested-With' ] ) {
        //   headers[ 'X-Requested-With' ] = this._defaultHeaders[ 'X-Requested-With' ];
        // }

        if(this.s.requestType !== 'formdata') {
           headers[ 'Content-Type' ] = this.s.contentType || this._defaultHeaders[ 'contentType' ];
        }

        for ( var header in headers ) {
           // not all headers are created equal...
           if (header == 'Cookie') {
             // i think this will work only on same-origin requests
             document.cookie = headers[ header ];
           } else {
            xhr.setRequestHeader( header, headers[ header ] );
           }
        }
     },
     /**
      * Abort request
      */
     abort: function( ) {
        this._aborted = true;
        this.requestObj.abort();
        return this;
     },
     request: function() {
        this.currentRetryInterval = this.s.retryInterval;

        if(this.isRequested === true) {
           ASSERT(0, { msg: 'Already requested', });
        }
        return this._request();
     },
     _requestModifyResp: function() {
        if(this.s.modifyResp) {
           for(var i = 0, l = this.s.modifyResp.length; i < l; i++) {
              this._reqPromise = this.s.modifyResp[ i ](this._reqPromise, this);
           }
        }
     },
     _request: function() {
        var self = this;

        // revert the state of the request
        this._aborted = false;
        this._retarded = false;
        this._timedOut = false;
        
        if (this.retardTimeout != null) {
            clearTimeout(this.retardTimeout);
        }

        this._reqPromise = new TB.Promise( function( resolve, reject ) {
           self._reqPromiseResolve = resolve;
           self._reqPromiseReject = reject;
        } );

        this._requestModifyResp();
        this._makeRequest();

        this._reqPromise
           .then(function(result) {
              if (self.retardTimeout != null) {
                clearTimeout(self.retardTimeout);
              }

              self._promiseResolve(result);
           })
           .catch(function(reason) {
              TRACE("Request failed, reason: $REASON$", { REASON: reason, });

              if(self._isTemporaryError(reason) && self.s.retry === true && self.commitedRetries < self.s.retryRepeats && self.s.retryAuto) {
                 setTimeout(function() {
                    try {
                       self.retry();
                    } catch(e) {

                       // Disable callback on retry
                       // self.cb && self.cb(undefined, e);
                       // self._promiseReject(e);
                    }
                 }, self.currentRetryInterval);
              } else {
                 self.cb && self.cb(undefined, reason);
                 self._promiseReject(reason);
              }
           });

        return this.promise;
     },
     retry: function() {
        ASSERT(this.s.retry === true, { msg: 'Retrying request is not allowed', });
        ASSERT(this.commitedRetries < this.s.retryRepeats, { msg: 'Retried too much times', });

        TRACE("Retrying request in $INTERVAL$ for $TIMES$ times so far", { INTERVAL: this.s.retryInterval, TIMES: this.commitedRetries, });

        this.commitedRetries++;

        return this._request();
     },
     cancelRetry: function() {
        this.commitedRetries = this.s.retryRepeats;
     },
     _isOnline: function() {
        if (typeof navigator === 'undefined') {
           return true;
        }

        return navigator.onLine;
     },
     // implement
     _isTemporaryError: function(reason) {
        // ERR_NETWORK_CHANGED
        TRACE("Fail in the request, maybe retry? Reason: $REASON$", {
            REASON: reason,
        });
        // console.log(reason);
        console.log(this);

        return true;
     },

     _showLoadingAnimation: function() {
        if (this.loadingAnimationSelector) {
           document.querySelector(this.loadingAnimationSelector).style.display = 'block';

           if (this.overlaySelector) {
              document.querySelector(this.overlaySelector).style.display = 'block';
           }
        }
     },
     _hideLoadingAnimation: function() {
        if (this.loadingAnimationSelector) {
           document.querySelector(this.loadingAnimationSelector).style.display = 'none';

           if (this.overlaySelector) {
              document.querySelector(this.overlaySelector).style.display = 'none';
           }
        }
     },
  };

   TB.Request = Request;

   return Request;
});
