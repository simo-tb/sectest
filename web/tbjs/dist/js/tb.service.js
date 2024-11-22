//** LOADER **/
/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @desc RemoteAPI wrapper
 * @module RAservice
 * @memberOf TB
 */
;(function(global, factory) {
  if(typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('lodash'), require('tb.xerrors'), require('tb.request'), require('tb.dispatcher'));
  } else if (typeof define === 'function' && define.amd) {
    define(['lodash', 'tb.xerrors', 'tb.request', 'tb.dispatcher'], function() {
      return factory.apply(factory, arguments);
    });
  } else {
    global.TB = global.TB || {};
    global.TB.RAService = factory(global._, global.TB, global.TB.Request, global.TB.Dispatcher);
  }
})(this, function(_, TB, Request, Dispatcher) {
  'use strict';
  
  function parseBaseProtocolExceptionAndThrow(req, reqErr) {
    let responseText = _.get(reqErr, 'xhr.responseText');
    if (responseText) {
      TRACE("RESPONSE_TEXT: " + responseText);
    }

    if(reqErr instanceof UnpackError) {
      if(!reqErr.status) {
        TB.ASSERT(0, TB.CONFIG.XERRORS_DEFAULT_MSG, "ERR", {
          req_err: reqErr,
        });
      } else {
        if(reqErr.status.status === 'ui_error') {
          req && req.cancelRetry();
          
          TB.ASSERT_USER(0, reqErr.status.msg, reqErr.status.code, {
            req_err: reqErr,
            skipPrefixForCode: true,
          });
        } else if (reqErr.status.status === 'client_sys_error') {
          req && req.cancelRetry();

          TB.ASSERT(0, TB.CONFIG.XERRORS_DEFAULT_MSG, reqErr.status.code, {
            req_err: reqErr,
            skipPrefixForCode: true,
          });
        } else if (reqErr.status.status === 'session_error') {
          req && req.cancelRetry();

          TB.ASSERT_USER(0, reqErr.status.msg, reqErr.status.code, {
            req_err: reqErr,
            skipPrefixForCode: true,
          });
        } else if (reqErr.status.status === 'server_sys_error') {
          // why is server_assert server_sys_error tho? :thinking_face:
		  if (reqErr.status.code.startsWith('I/') || reqErr.status.code.startsWith('C/')) {
            req && req.cancelRetry();
          }

          TB.THROW_SYS({}, "Temporary Problem! Please Try Again...", reqErr.status.code, {
            req_err: reqErr,
            isUIAppropriate: true,
            skipPrefixForCode: true,
          });
        } else {
          req && req.cancelRetry();

          TB.ASSERT(0, TB.CONFIG.XERRORS_DEFAULT_MSG, "ERRSTATUS", {
            req_err: reqErr,
          });
        }
      }
    } else {
      if(reqErr.reason === 'abort') {
        TB.ASSERT_USER(0, 'Request Aborted', 'REQ/A', {
          inner_type: 'transport_error',
          reqErr: reqErr
        });
      } else if(reqErr.xhr && reqErr.xhr.status && reqErr.xhr.status == 504) {
        TB.THROW_SYS({}, 'Timeout Reached! Retrying...', 'REQ/GTW', {
          reqErr: reqErr,
          isUIAppropriate: true,
        });
      } else if(reqErr.xhr && reqErr.xhr.status && reqErr.xhr.status == 403) {
        req && req.cancelRetry();

        TB.ASSERT_USER(0, 'Permission Denied!', 'PERM_DENIED', {
          reqErr: reqErr,
        });
      } else if(reqErr.xhr && reqErr.xhr.status && reqErr.xhr.status == 401) {
        req && req.cancelRetry();

        TB.ASSERT_USER(0, 'Authentication Required!', 'AUTH_REQ', {
          reqErr: reqErr,
        });
      } else if(reqErr.xhr && reqErr.xhr.status && (reqErr.xhr.status == 502 || reqErr.xhr.status == 302)) {
        TB.THROW_SYS({}, 'Connection Problem! Please Try Again...', 'T/REQ/BADGTW', {
          reqErr: reqErr,
          isUIAppropriate: true,
        });
      } else if(reqErr.xhr && reqErr.xhr.status && (reqErr.xhr.status == 500 || reqErr.xhr.status == 540 || reqErr.xhr.status == 542)) {
        TB.THROW_SYS({}, 'Temporary Problem! Please Try Again...', 'T/RSTRT', {
          reqErr: reqErr,
          isUIAppropriate: true,
        });
      } else if(reqErr.reason === 'timeout') {
        TB.THROW_SYS({}, 'Timeout Reached! Retrying...', 'REQ/T', {
          reqErr: reqErr,
          isUIAppropriate: true,
        });
      } else if(reqErr.xhr && reqErr.xhr.responseText) {
        // the average case - some error from the server, via status code
        var resp = reqErr.xhr.responseText;

        req && req.cancelRetry();
        TB.ASSERT(0, TB.CONFIG.XERRORS_DEFAULT_MSG, reqErr.xhr.status, {
          reqErr: reqErr
        });
      } else if(reqErr.xhr && reqErr.xhr.status === 0) {
        TB.THROW_SYS({}, 'Connection Problem! Please Try Again...', 'REQ/C', {
          reqErr: reqErr,
          isUIAppropriate: true
        });
      } else {
        TB.ASSERT(0, TB.CONFIG.XERRORS_DEFAULT_MSG, 'ERRUSTATUS', {
          reqErr: reqErr
        });
      }
    }

    TB.ASSERT(0, TB.CONFIG.XERRORS_DEFAULT_MSG, 'ERR_SERV', {
      reqErr: reqErr
    });
  }


  if (_.isNil(Dispatcher)) {
      alert('Please load tb.dispatcher.js');
  }

  /**
   * asd
   * @constructor
   * @memberOf TB
   * @param {Object} settings settings
   */
  function Service(settings) {
    if (!(this instanceof Service)) {
      return new TB.RAService(settings);
    }



    /**
     *
     * @property [useTransportProtocolId=true] use id's in transport protocol or null (e.g. jsonrpc2 id property)
     */
    var defaultValues = {
      useTransportProtocolId: true,

      requestSettings: {
        apiUrl: '',

        requestParams: null,
        payloadParams: null,

        retryMax: Infinity,
        retryAuto: true,
        retryInterval: 1000,
        retryIncremental: true,
      },

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
    this.respType = null;

    settings.requestSettings = settings;

    // Extend settings
    this.s = _.merge({
    }, defaultValues, settings, {requestSettings: (settings.moreSettings || {}) } );
    this.s.responseFormat = this.s.responseFormat || this.s.transportProtocol;

    ASSERT.has(this._requestTypes, this.s.transportProtocol);
    ASSERT.has(this._responseTypes, this.s.responseFormat);

    this.id = 1;
    this.transactionId = 1;
    this.hasActiveRequest = false;
    this.reqType = this._requestTypes[this.s.transportProtocol];
    this.respType = this._responseTypes[this.s.responseFormat];

    Dispatcher.call( this );
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
      }
    },
    _responseTypes: {
      jsonrpc2: {
        unpackResult: function(rawResult) {
          if (_.isString(rawResult)) {
            try {
              rawResult = JSON.parse(rawResult);
            } catch (error) {
              THROW_SYS(undefined, "Unable To Connect To The Server!", "RERR", {
                isFromUnpackResult: true,
                isUIAppropriate: true,
              });
            }
          }

          if (rawResult.error) {
            TRACE('Error in API call: $RESULT$', { RESULT: rawResult, });
            throw new UnpackError(rawResult);
          }

          if ( ! rawResult.result ) {
            throw new Error('No result returned after API call: $RESULT$', { RESULT: rawResult, });
          }

          return rawResult.result;
        },
      },
      html: {
        unpackResult: function(rawResult) {
          return rawResult;
        }
      },
    },
    /**
     * Increments and returns request id
     * @return {Number} old request id
     */
    getNextRequestId: function() {
      if (this.s.useTransportProtocolId) {
        return ++this._requestId;
      } else {
        return null;
      }
    },
    incrementTransactionId: function() {
      return ++this.transactionId;
    },
    request: function(method, data, settings) {
      ASSERT.isObjectOrNil(settings);

      if (settings && settings.cb) {
        this.cb = settings.cb;
        // delete settings.cb;
      }

      var self = this;
      let unpackMethod = self.respType.unpackResult;
      var commandDef = this.s.commands[method];
      var reqSettings = {
        retry: true,
        retryAuto: false,
        modifyResp: [function(promise, req) {
          return promise
            .then(function(rawResult) {
              var result = unpackMethod(rawResult.data);
              if (self.cb) {
                self.cb(result);
              }

              return result;
            })
            .catch(function(reqErr) {
              if (reqErr.addParams && reqErr.addParams.isFromUnpackResult) {
                throw reqErr;
              }

              parseBaseProtocolExceptionAndThrow(req, reqErr);
            })
            .catch(function(reqErr2) {
              self.cb && self.cb(undefined, reqErr2);
              throw(reqErr2);
            });
        }],
      };
      let version = this.s.version || _.get(settings, '.version') ||  1;
      if (version === 2){
        reqSettings = _.merge(reqSettings, this.s.requestSettings, commandDef, settings.requestSettings);
      }else {
        reqSettings = _.merge(reqSettings, this.s, this.s && this.s.requestSettings, commandDef, settings, settings && settings.requestSettings);
        if ( ! _.get(reqSettings.requestParams, 'apiKey') ) {
          let apiKey = _.get(reqSettings.requestSettings, 'apiKey');
          if (reqSettings.requestParams) {
            reqSettings.requestParams.api_key = apiKey;
          } else {
            reqSettings.requestParams = {
              api_key: apiKey,
            };
          }
        }
      }

      var reqPayload = this.prepareParams(reqSettings.requestParams);
      var protocolPayload = this.prepareParams(reqSettings.payloadParams);

      protocolPayload = _.extend(protocolPayload, data);

      reqPayload[this.reqType.payloadParamName] = this.reqType.makePayload.call(this, method, protocolPayload);

      reqPayload[this.reqType.payloadParamName] = JSON.stringify(reqPayload[this.reqType.payloadParamName]);

      reqSettings.data = reqPayload;
      reqSettings.url = reqSettings.apiUrl;
      if (reqSettings.responseFormat) {
        unpackMethod = this._responseTypes[ reqSettings.responseFormat ].unpackResult;
      }


      var req = new Request(reqSettings);

      self.dispatch('ajaxStart', {
          req: req
      });

      req.then(function(resp) {
        self.dispatch('ajaxStop', {
            req: req
        });
        return resp;
      });

      req.request();

      return req;
    },
  };

  Service.prototype.prepareParams = function(params) {
    var result = {};

    if (_.isObject(params)) {
      for (var k in params) {
        result[k] = params[k];

        if (_.isFunction(result[k])) {
          // TODO: would be nice to pass the other values in _.merge
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
    // this.details = (resp.error.data && resp.error.data.details) ? resp.error.data.details : null;
    this.details = _.get(resp, 'error.data.details');

    if(this.details && this.details.validation_errors) {
      var validationErrors = this.details.validation_errors;

	   /*
			TODO: ask manol about those cases?
			TODO: ask manol about this case aswell!!!
			TODO: ask manol about this case aswell2!!!

			if the SENDER is ours
				if the remote client is ours, we need to show the error code as is
				if its remote client is not ours, use the below logic of mapping protocol to client
			ELSE
				The remote client, client_sys_error should not be ASSERT for our side!
	  */
      ASSERT.isArray(validationErrors);

      validationErrors = validationErrors.map(function(d) {
        return {
          dataPath: d.dataPath || d.data_path,
          msg: d.msg,
        };
      });

      this.validationErrors = validationErrors;
    }
  }

  TB.RAService = Service;

  TB.classExtend( Service, Dispatcher );
  return Service;
});
