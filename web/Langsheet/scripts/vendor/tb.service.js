;
(function(TB) {
    'use strict';

    // IN IE 10/11 you first have to make fake GET request with CORS to make any POST later
    var isMadeFakeGetRequest = false;

    TB.TbService = function(options) {

        // Make using the "new" keyword unneccessary
        if (!(this instanceof TB.TbService)) {
            return new TB.TbService(options);
        }

        // Extend settings
        this.settings = $.extend({
            payloadParamName: 'payload_jsonrpc',
            payloadToJson: true,
            noId: false,
            ajaxUrl: '',
            requiredParams: {},
            requestParams: {},
            retryFakeGetRequest: 1,
            isIE: false,
        }, options);

        this.id = 1;
        this.transactionId = 1;
        this.hasActiveRequest = false;
    };

    TB.TbService.prototype = {
        _callCallbacks: function(callbacks, callbackArguments) {
            for (var i in callbacks) {
                callbacks[i].apply(null, callbackArguments);
            }
        },
        _generateTransactionParams: function(data) {
            var params = $.extend({}, data, {
                transaction_id: this.transactionId++,
                server_params: this.settings.requiredParams.server_params,
                session_token: this.settings.requiredParams.session_token,
            });

            for (var i in this.settings.requiredParams) {
                var paramValue = this.settings.requiredParams[i];

                params[i] = paramValue;
            }

            return params;
        },
        updateRequiredParams: function(newParams) {
            return jQuery.extend(this.settings.requiredParams, newParams);
        },
        requestJsonRpc: function(method, data, options) {
            TRACE('requestJsonRpc');
            var context = this;
            var timeServiceStart = new Date();
            var payload = {};
            var successCallbacks = [];
            var failCallbacks = [];
            var alwaysCallbacks = [];
            var ajaxSettings = $.extend({
                url: this.settings.ajaxUrl,
                dataType: 'json',
                type: 'POST',
                data: payload,
            }, options);
            var transactionData = this._generateTransactionParams(data);
            var promise = {
                getStatus: function() {
                    return tbTestStatus;
                },
                then: function(successCallback, failCallback, finallyCallback) {
                    if (typeof successCallback == 'function') {
                        successCallbacks.push(successCallback);
                    }
                    this.fail(failCallback);
                    this.always(finallyCallback);

                    return this;
                },
                fail: function(failCallback) {
                    if (typeof failCallback == 'function') {
                        failCallbacks.push(failCallback);
                    }

                    return this;
                },
                always: function(alwaysCallback) {
                    if (typeof alwaysCallback == 'function') {
                        alwaysCallbacks.push(alwaysCallback);
                    }

                    return this;
                },
                retry: function(newTransaction) {
                    if (newTransaction instanceof TB.Status) {
                        newTransaction = newTransaction.retry;
                    }

                    if (newTransaction) {
                        requestJsonRpc(generateTransactionParams(data));
                    } else {
                        requestJsonRpc(transactionData);
                    }

                    return this;
                },
                finally: function(finallyCallback) {
                    this.always.apply(this, arguments);

                    return this;
                },
                catch: function(finallyCallback) {
                    this.fail.apply(this, arguments);

                    return this;
                }
            };
            var tbTestStatus = new TB.Status(null, promise.retry);
            $(this).trigger('tb.service.startRequest');

            for (var i in this.settings.requestParams) {
                var paramValue = this.settings.requestParams[i];

                if (paramValue instanceof Object) {
                    paramValue = JSON.stringify(paramValue);
                }

                payload[i] = paramValue;
            }

            var requestJsonRpc;
            (requestJsonRpc = function(data) {
                var rpc = {
                    jsonrpc: '2.0',
                    id: (context.settings.noId) ? null : context.id++,
                    method: method,
                    params: data,
                };
                payload[context.settings.payloadParamName] = (context.settings.payloadToJson) ? JSON.stringify(rpc) : rpc;
                context.hasActiveRequest = true;


                TRACE('Request JSON-RPC request %s', rpc);

                if (context.settings.isIE && !isMadeFakeGetRequest) {
                    $.get(context.settings.ajaxUrl)
                        .then(function() {
                            isMadeFakeGetRequest = true;
                            requestJsonRpc(data);
                        }, function() {
                            if (context.transactionId <= context.settings.retryFakeGetRequest) {
                                requestJsonRpc();
                            } else {
                                THROW('Cannot connect to make fake GET request after retries');
                            }
                        });

                    return;
                }

                $.ajax(ajaxSettings)
                    .done(function(response, textStatus, jqXHR) {
                        try {
                            ASSERT_PEER(response, 'Empty response');
                            ASSERT_PEER(response.id == rpc.id, 'Wrong response id');
                            ASSERT_PEER(response.result || response.error, 'No response body');
                            ASSERT_PEER(response.jsonrpc == '2.0', 'Response rpc version does not match');
                            ASSERT_PEER((response.result instanceof Object && response.result.hasOwnProperty('status')) || (response.error instanceof Object && response.error.hasOwnProperty('data')), 'No response status');
                        } catch (e) {
                            tbTestStatus.updateStatus({
                                status: TB.Status.CONFIG.STATUSES.SYS_ERROR,
                                retry: true
                            }, promise.retry);
                            context._callCallbacks(failCallbacks, [response || null, tbTestStatus, jqXHR]);
                            return;
                        }

                        var responseStatus = (response.error) ? response.error.data : (response.result) ? response.result.status : '';
                        tbTestStatus.updateStatus(responseStatus);

                        if (tbTestStatus.success) {
                            context._callCallbacks(successCallbacks, [response.result, tbTestStatus, jqXHR]);
                        } else {
                            context._callCallbacks(failCallbacks, [response.error, tbTestStatus, jqXHR]);
                        }
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) {
                        if (textStatus == 'abort') {
                            TRACE('Request aborted');
                            return;
                        }

                        try {
                            ASSERT_PEER(jqXHR.status != 400, 'Bad request');
                            ASSERT_PEER(jqXHR.status, 'No-content-allow-origin');
                            ASSERT_PEER(textStatus == 'parsererror', 'Response is not json format');
                            ASSERT_PEER(jqXHR.status > 400 && jqXHR.status < 500 && jqXHR.status != 408, 'HTTP response in 400 range');
                        } catch (e) {
                            tbTestStatus.updateStatus({
                                status: TB.Status.CONFIG.STATUSES.TRANSPORT_ERROR,
                                retry: true
                            }, promise.retry);
                            context._callCallbacks(failCallbacks, [null, tbTestStatus, jqXHR]);
                            return;
                        }

                        'timeout';

                        if (textStatus != 'parsererror') {
                            try {
                                var responseJson = JSON.parse(jqXHR.responseText);

                                if (responseJson && typeof responseJson.error == 'object') {
                                    tbTestStatus.updateStatus(responseJson.error.status, promise.retry);
                                }
                            } catch (e) {}
                        }

                        tbTestStatus.updateStatus({
                            status: TB.Status.CONFIG.STATUSES.TRANSPORT_ERROR,
                            retry: true
                        }, promise.retry);

                        context._callCallbacks(failCallbacks, [responseJson || null, tbTestStatus, jqXHR]);
                    })
                    .always(function() {
                        var timeServiceEnd = new Date();
                        var timeService = timeServiceEnd - timeServiceStart;
                        TRACE('Service request finished in {{ ' + timeService + ' }} milliseconds');

                        context.hasActiveRequest = false;
                        context._callCallbacks(alwaysCallbacks, arguments);
                    });
            })(transactionData);

            return promise;
        }
    };

    window.TB = TB;
})(window.TB || {});
