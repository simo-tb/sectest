;(function(window){
'use strict';
var TB = window.TB || {};
window.TB = TB;
/**
 * asd
 * @constructor
 * @memberOf TB
 * @param {Object} settings settings
 */
function Service(settings) {
  if (!(this instanceof TB.RAService)) {
    return new TB.RAService(settings);
  }

  /**
   *
   * @property [useTransportProtocolId=true] use id's in transport protocol or null (e.g. jsonrpc2 id property)
   */
  var defaultValues = {
    apiUrl: '',
    useTransportProtocolId: true,
    requestParams: null,
    payloadParams: null,

    retryMax: Infinity,
    retryAuto: true,
    retryInterval: 1000,
    retryIncremental: true,

    transportProtocol: 'jsonrpc2',

    commands: {
      ui_error: {
        httpMethod: 'post'
      }
    },
  };

  /**
   * Type of request (e.g. jsonrpc2, tbjson)
   * @type {Object}
   */
  this.reqType = null;


  // Extend settings
  this.s = _.merge({
  }, defaultValues, settings);

  ASSERT.hasProperty(this._requestTypes, this.s.transportProtocol);

  this.id = 1;
  this.transactionId = 1;
  this.hasActiveRequest = false;
  this.reqType = this._requestTypes[this.s.transportProtocol];
}

/** @lends TB.Service.prototype */
Service.prototype = {
  _requestId: 0,
  _requestTypes: {
    jsonrpc2: {
      payloadParamName: 'payload_jsonrpc',
      makePayload: function(method, data) {
        return {
          jsonrpc: '2.0',
          id: this.getNextRequestId(),
          method: method,
          params: data,
        };
      },
      unpackResult: function(rawResult) {
        if (!_.isUndefined(rawResult['error'])) {
          TRACE('Error in API call: %s', rawResult);
          throw new UnpackError(rawResult);

        }

        if (_.isUndefined(rawResult['result'])) {
          THROW('No result returned after API call: %s', rawResult);
        }

        return rawResult['result'];
      },
    },
  },
  /**
   * Increments and returns request id
   * @return {Number} old request id
   */
  getNextRequestId: function() {
    this._requestId += 1;

    return (this.s.useTransportProtocolId)
      ? this._requestId
      : null;
  },
  incrementTransactionId: function() {
    this.transactionId += 1;

    return this.transactionId;
  },
  request: function(method, data, settings) {
    ASSERT.ofTbType(method, 'string');
    ASSERT.ofTbType(settings, 'undefined|null|object');

    var self = this;
    var commandDef = this.s.commands[method];
    var reqSettings = _.merge({}, this.s, commandDef, settings);
    var reqPayload = this.prepareParams(reqSettings.requestParams);
    var protocolPayload = this.prepareParams(reqSettings.payloadParams);

    protocolPayload = _.extend(protocolPayload, data);

    reqPayload[this.reqType.payloadParamName] = this.reqType.makePayload.call(this, method, protocolPayload);

    try {
      reqPayload[this.reqType.payloadParamName] = JSON.stringify(reqPayload[this.reqType.payloadParamName]);
    } catch (e) {
      THROW(e);
    }

    reqSettings.data = reqPayload;
    reqSettings.url = reqSettings.apiUrl;


    var req = new TB.Request(reqSettings);

    req.retry = function() {
      return req;
    };

    function retry(otherArgs, retryInterval, maxRetries, resolve, reject) {
      if (!reject && !resolve) {
        var promise = new Promise(function(resolve, reject) {
          resolve = resolver;
          reject = rejector;
        });
      }


      if (success) {
        promise.resolve(result);
      } else if (maxRetries > 0) {
        // Try again if we haven't reached maxRetries yet
        setTimeout(function() {
          retry(otherArgs, retryInterval, maxRetries - 1, promise);
        }, retryInterval);
      } else {
        promise.reject(error);
      }
    }

    var resolvePromise;
    var rejectPromise;
    var promise = new Promise(function(resolve, reject) {
      resolvePromise = resolve;
      rejectPromise = reject;
    });


    req.promise
      .then(function(rawResult) {
        var result = self.reqType.unpackResult(rawResult.data);

        resolvePromise.call(promise, result);
      })
      .catch(function(reqErr) {
        var parsedErr = {
          status: 'sys_error',
          code: null,
          reqErr: reqErr,
          msg: null,
        };

        if(reqErr instanceof UnpackError) {
          if(!reqErr.status) {
            parsedErr.msg = 'Unknown error';
          } else {
            if(reqErr.status.status === 'ui_error') {
              parsedErr.status = 'ui_error';
            } else if (reqErr.status.status === 'client_sys_error') {
              parsedErr.status = 'peer_error';
            } else if (reqErr.status.status !== 'sys_error') {
              parsedErr.msg = 'Unknown error';
            }

            parsedErr.code = reqErr.status.code;
            parsedErr.msg = reqErr.status.msg;
          }

        } else {
          if(reqErr.reason === 'abort') {
            parsedErr.status = 'transport_error';
            parsedErr.msg = 'abort';
          } else if(reqErr.reason === 'timeout') {
            parsedErr.status = 'transport_error';
            parsedErr.msg = 'timeout';
          } else if(reqErr.reason) {
            parsedErr.msg = 'Unknown error';
          } else if(reqErr.xhr && reqErr.xhr.responseText) {
            var resp = reqErr.xhr.responseText;

            if(typeof resp === 'text') {
              parsedErr.msg = resp;
            } else {
              parsedErr.msg = 'Unknown error';
            }
          } else {
            parsedErr.msg = 'Unknown error';
          }
        }

        rejectPromise.apply(promise, [parsedErr]);
      });

    return promise;
  },
};

Service.prototype.prepareParams = function(params) {
  var result = {};

  if (_.isObject(params)) {
    for (var k in params) {
      result[k] = params[k];

      if (_.isFunction(result[k])) {
        result[k] = result[k]();
      }

      if (_.isUndefined(result[k])) {
        result[k] = null;
      }
    }
  }

  return result;
};

function UnpackError(resp) {
  this.resp = resp;
  this.data = resp.error.data;
  this.message = resp.error.message;
  this.code = resp.error.code;
  this.status = (resp.error.data && resp.error.data.status) ? resp.error.data.status : null;
}

TB.RAService = Service;
})( typeof window === "undefined" ? this : window );
