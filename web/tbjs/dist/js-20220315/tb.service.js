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
    }, defaultValues, settings, settings.moreSettings || {});

    ASSERT.has(this._requestTypes, this.s.transportProtocol);

    this.id = 1;
    this.transactionId = 1;
    this.hasActiveRequest = false;
    this.reqType = this._requestTypes[this.s.transportProtocol];

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
        unpackResult: function(rawResult) {
          if (_.isString(rawResult)) {
            try {
              rawResult = JSON.parse(rawResult);
            } catch (error) {
               /*
					TODO: ask manol about those cases?
					TODO: ask manol about this case aswell!!!

					if the SENDER is ours
						if the remote client is ours, we need to show the error code as is
						if its remote client is not ours, use the below logic of mapping protocol to client
					ELSE
						The remote client, client_sys_error should not be ASSERT for our side!
              */
			
              THROW_SYS(undefined, "Unable To Connect To The Server!", "RERR", {
                isFromUnpackResult: true,
              });
            }
          }

          if (!_.isUndefined(rawResult['error'])) {
            TRACE('Error in API call: $RESULT$', { RESULT: rawResult, });
            throw new UnpackError(rawResult);

          }

          if (_.isUndefined(rawResult['result'])) {
            throw new Error('No result returned after API call: $RESULT$', { RESULT: rawResult, });
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
      ASSERT.isString('string');
      ASSERT.isObjectOrNil(settings);

      var self = this;
      var commandDef = this.s.commands[method];
      var reqSettings = _.merge({
        retry: true,
        retryAuto: false,
        modifyResp: [function(promise, req) {
            return promise
                .then(function(rawResult) {
                    var result = self.reqType.unpackResult(rawResult.data);
                    return result;
                })
                .catch(function(reqErr) {
                    if (reqErr.addParams && reqErr.addParams.isFromUnpackResult) {
                      throw reqErr;
                    }

		            var parsedErr = {
                        status: 'sys_error',
                        code: null,
                        reqErr: reqErr,
                        msg: null,
                    };

                    if(reqErr instanceof UnpackError) {
                        if(!reqErr.status) {
                            TB.ASSERT(0, TB.CONFIG.XERRORS_DEFAULT_MSG, "ERR", {
                                req_err: reqErr,
                            });
                        } else {
                            /*
                                TODO: ask manol about those cases?

                                if the SENDER is ours
                                    if the remote client is ours, we need to show the error code as is
                                    if its remote client is not ours, use the below logic of mapping protocol to client
                                ELSE
                                    The remote client, client_sys_error should not be ASSERT for our side!
                                    
                            */

                            if(reqErr.status.status === 'ui_error') {
                                req.cancelRetry();

                                TB.ASSERT_USER(0, reqErr.status.msg, reqErr.status.code, {
                                    req_err: reqErr,
                                    skipPrefixForCode: true,
                                });
                            } else if (reqErr.status.status === 'client_sys_error') {
                                req.cancelRetry();

                                TB.ASSERT(0, TB.CONFIG.XERRORS_DEFAULT_MSG, reqErr.status.code, {
                                    req_err: reqErr,
                                    skipPrefixForCode: true,
                                });
                            } else if (reqErr.status.status === 'session_error') {
                                req.cancelRetry();

                                TB.ASSERT_USER(0, reqErr.status.msg, reqErr.status.code, {
                                    req_err: reqErr,
                                    skipPrefixForCode: true,
                                });
                            } else if (reqErr.status.status === 'server_sys_error') {

                                // why is server_assert server_sys_error tho? :thinking_face:
                                if (reqErr.status.code.startsWith('I/')) {
                                  req.cancelRetry();
                                }

                                TB.THROW_SYS({}, "Temporary Problem! Please Try Again...", reqErr.status.code, {
                                    req_err: reqErr,
                                    isUIAppropriate: true,
                                    skipPrefixForCode: true,
                                });
                            } else {
                                req.cancelRetry();

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
                        } else if(reqErr.xhr.status && reqErr.xhr.status == 403) {
                          req.cancelRetry();

                          TB.ASSERT_USER(0, 'Permission Denied!', 'PERM_DENIED', {
                            reqErr: reqErr,
                          });
                        } else if(reqErr.xhr.status && reqErr.xhr.status == 401) {
                          req.cancelRetry();

                          TB.ASSERT_USER(0, 'Authentication Required!', 'AUTH_REQ', {
                            reqErr: reqErr,
                          });
                        } else if(reqErr.xhr.status && (reqErr.xhr.status == 502 || reqErr.xhr.status == 302)) {
                          TB.THROW_SYS({}, 'Connection Problem! Please Try Again...', 'T/REQ/BADGTW', {
                            reqErr: reqErr,
                            isUIAppropriate: true,
                          });
                        } else if(reqErr.xhr.status && reqErr.xhr.status == 500) {
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

                            parsedErr.msg = TB.CONFIG.XERRORS_DEFAULT_MSG;
                            parsedErr.code = reqErr.xhr.status;

                            req.cancelRetry();
                            TB.ASSERT(0, parsedErr.msg, parsedErr.code, {
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
                });
        }],
      }, this.s, commandDef, settings);

      var reqPayload = this.prepareParams(reqSettings.requestParams);
      var protocolPayload = this.prepareParams(reqSettings.payloadParams);

      protocolPayload = _.extend(protocolPayload, data);

      reqPayload[this.reqType.payloadParamName] = this.reqType.makePayload.call(this, method, protocolPayload);

      reqPayload[this.reqType.payloadParamName] = JSON.stringify(reqPayload[this.reqType.payloadParamName]);

      reqSettings.data = reqPayload;
      reqSettings.url = reqSettings.apiUrl;

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
