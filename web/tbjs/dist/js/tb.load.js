(function () {
    window.TB = window.TB || {};
    TB.request = undefined;
    TB.forms_submitted = {};
    TB.reqIds = {
        serial: {},
        only_last: {},
    };

    TB.REQ_SETTINGS = {
        MAX_RETRIES_COUNT: 15,
        REQ_TIMEOUT_MS: 15000,
        TIMEOUT_RETRIES_COUNT: 1
    };

    TB.REQ_RETRIES_COUNT = {};

    TB.retryRequest = function(req, xhr, retriesCount) {
        if(typeof retriesCount === 'undefined') {
            retriesCount = TB.REQ_SETTINGS.MAX_RETRIES_COUNT;
        }

        TB.REQ_RETRIES_COUNT[ req ] = TB.REQ_RETRIES_COUNT[ req ] || 0;

        if(TB.REQ_RETRIES_COUNT[ req ] >= retriesCount) {
            TB.REQ_RETRIES_COUNT[ req ] = 0;
            req = undefined;

            console.log("Req retris ", req, TB.REQ_RETRIES_COUNT[ req ]);
            return;
        }

        var rand = Math.floor(Math.random() * 4) + 1;
        console.log("Retry after ", rand, TB.REQ_RETRIES_COUNT[ req ]);
        setTimeout(function(){
                TB.REQ_RETRIES_COUNT[ req ]++;
                TB.request = $.ajax(req);
        }, 1000 * rand);

        return true;
    }

    /*
    tbArgs
    {
        url - request url
        method - POST/GET
        data - request body
        contSelector - HTML container
        callback - request Success callback
        alwaysCallback - request always callback
        loadingIndicatorSelector - CSS class or ID
    }

    */

    TB.loadUI = function(tbArgs) {
        console.log("TbLoadUI");
        TB.load(tbArgs, true);
    }

    TB.load = function(tbArgs, isUIReq) {

        var url = tbArgs.url;
        ASSERT(TB.isString(url), { msg: 'url is invalid', });

        var method = tbArgs.method || "GET";
        ASSERT(TB.isString(method) && method.length > 0, { msg: 'method is invalid', });

        var data = tbArgs.data;
        ASSERT(!TB.isDefined(data) || TB.isObject(data) || TB.isString(data), { msg: 'data is invalid', });

        var contSelector = tbArgs.contSelector;
        ASSERT(!TB.isDefined(contSelector) || TB.isString(contSelector), { msg: 'contSelector is invalid', });

        var reqId = tbArgs.reqId;
        ASSERT(!TB.isDefined(reqId) || TB.isString(reqId), { msg: 'reqId is invalid', });

        var loadingIndicatorSelector = tbArgs.loadingIndicatorSelector;
        ASSERT(!TB.isDefined(loadingIndicatorSelector) || TB.isString(loadingIndicatorSelector), { msg: 'loadingIndicatorSelector is invalid', });

        var overlaySelector = tbArgs.overlaySelector;
        ASSERT(!TB.isDefined(overlaySelector) || TB.isString(overlaySelector), { msg: 'overlaySelector is invalid' });

        var successCallback = tbArgs.successCallback || function() {};
        ASSERT(TB.isFunction(successCallback), { msg: 'successCallback is not a function', });

        var errorCallback = tbArgs.errorCallback || function() {};
        ASSERT(TB.isFunction(errorCallback), { msg: 'errorCallback is not a function', });

        var alwaysCallback = tbArgs.alwaysCallback || function() {};
        ASSERT(TB.isFunction(alwaysCallback), { msg: 'alwaysCallback is not a function', });

        var timeoutRetriesCount = TB.REQ_SETTINGS.TIMEOUT_RETRIES_COUNT;
        var errorShowTimeoutMs = TB.REQ_SETTINGS.REQ_TIMEOUT_MS;

        var reqType = "bg";
    
        if(TB.isDefined(tbArgs.reqType)) {
            reqType = tbArgs.reqType;
        }
       
        //Temp
        if(reqType == "ui") {
            isUIReq = true;
        }
        //Temp 

        //TODO - da se promeni
        /*
        if(TB.isDefined(reqId)) {
            if(TB.reqIds.hasOwnProperty(reqId)) {
                TRACE('reqId: ', reqId, ' is locked');
                return;
            } else {
                TB.reqIds[reqId] = {};
                TRACE('reqId: ', reqId, ' is in the cage');
            }
        }
        */
        ///////////
        
        isUIReq = isUIReq || false;

        if(isUIReq === true && TB.isDefined(loadingIndicatorSelector)) {

            var loadingIndicatorTimeout = setTimeout(function() {

                TRACE('loadingIndicatorTimeout');
                $(loadingIndicatorSelector).show();

                if(TB.isDefined(overlaySelector)) {
                    $(overlaySelector).show();
                }

            }, 600);

        }

        var hasCont = false;
        var cont = undefined;

        if(TB.isDefined(contSelector)) {
            cont = $(contSelector);
            hasCont = true;
        }

        if(isUIReq === true && hasCont === true) {
            var contInterval = setInterval(function() {
                if($(contSelector).length > 0) {
                    TRACE('container is ready');
                    clearInterval(contInterval);
                }
            }, 100);
        }

        if(typeof(loadingIndicatorSelector) !== 'undefined'
            && method !== 'GET') {
            $(loadingIndicatorSelector).show();
            
            if(TB.isDefined(overlaySelector)) {
                $(overlaySelector).show();
            }
        }

        function setErrorTimeout() {
            console.log("Error Timmss", errorShowTimeoutMs);

            var errorShowTimeout = setTimeout(function() {
                //var error_msg = "Cannot connect to the server. Please, try again! (P114)";
                //var error_msg = "Connection timeout. Please, try again! (P114)";
                //TRACE('errorShowTimeout', error_msg);

                //FLUSH('ERROR', error_msg);
                //if(TB.isDefined(reqId) && TB.reqIds.hasOwnProperty(reqId)) {
                //    delete TB.reqIds[reqId];
                //    TRACE('reqId: ', reqId, ' is free to go');
                //}

                console.log("errShowTimeout cc ", TB.request);

                if(isUIReq === true && TB.isDefined(loadingIndicatorSelector)) {
                    $(loadingIndicatorSelector).hide();
                    
                    if(TB.isDefined(overlaySelector)) {
                        $(overlaySelector).hide();
                    }
                }

                if(TB.isDefined(TB.request)) {
                    TB.request.abort(); //TODO - test
                }

                //errorCallback({msg: error_msg});

            }, errorShowTimeoutMs);

            return errorShowTimeout;
        }

        var errorShowTimeout = setErrorTimeout();
        //$.ajaxSetup({ cache: false });
        TB.request = $.ajax({
            url : url,
            method : method,
            async : true,
            data : data,
            success: function(data, textStatus, jqXHR) {

                clearInterval(contInterval);
                clearTimeout(errorShowTimeout);
                clearTimeout(loadingIndicatorTimeout);

                if(TB.isDefined(loadingIndicatorSelector)) {
                    $(loadingIndicatorSelector).hide();

                    if(TB.isDefined(overlaySelector)) {
                        $(overlaySelector).hide();
                    }
                }

                if(isUIReq === true && hasCont === true) {
                    contInterval = setInterval(function() {
                        if ($(contSelector).length > 0) {
                            clearInterval(contInterval);
                            var contentType = jqXHR.getResponseHeader('content-type');

                            ASSERT(TB.isString(contentType) && /^text\/html|application\/json/.test(contentType), { msg: 'contentType is invalid', });

                            if(/^text\/html/.test(contentType)) {
                                $(contSelector).html(data);
                                successCallback({
                                    data: data,
                                    textStatus: textStatus,
                                    xhr: jqXHR
                                });
                            } else if (/^application\/json/.test(contentType)) {
                                if(TB.isDefined(data.status) &&
                                    TB.isDefined(data.status.status)) {

                                    if(data.status.status == 'ok') {
                                        successCallback({
                                            data: data,
                                            textStatus: textStatus,
                                            xhr: jqXHR
                                        });
                                    } else {
                                        errorCallback({
                                            msg: data.status.msg,
                                            code: data.status.code,
                                            xhr: jqXHR
                                        });
                                    }

                                }
                            } else {
                                ASSERT(false, { msg: "Unsupported content type", code: "UNS100", });
                            }
                        }
                    }, 100);
                } else {
                    console.log("tb.load call success callback");
                    successCallback({data: data, textStatus: textStatus, xhr: jqXHR});
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                clearInterval(contInterval);
                clearTimeout(errorShowTimeout);

                if(jqXHR.statusText === 'abort') {
                    if(isUIReq == true) {
                        if(method === 'GET' && TB.retryRequest(this, jqXHR, timeoutRetriesCount) === true) {
                            errorShowTimeout = setErrorTimeout();
                            $(loadingIndicatorSelector).show();
       
                            return;
                        }

                        var error_msg = "Connection timeout. Please, try again! (P114)";
                        errorCallback({msg: error_msg});
                    }

                    return;
                }

                //console.log("Method req retry" , method);
                if(jqXHR.status == 302 && method === 'GET') {
                    if(TB.retryRequest(this, jqXHR) === true) {
                        return;
                    }
                }

                clearTimeout(loadingIndicatorTimeout);
                var statusCode = "P111";

                var statusMsg = "Please try again later! ("+statusCode+")";

                var ignoreUnsent = false;

                if(jqXHR.readyState == 0) {
                    if (typeof navigator !== 'undefined' && navigator.onLine) {
                        ignoreUnsent = true;
                    } 

                    statusCode = "P120"; //UNSENT
                    statusMsg = "Please check your internet connection! ("+statusCode+")";
                } else if (jqXHR.readyState == 1) {
                    if (typeof navigator !== 'undefined' && navigator.onLine) {
                        ignoreUnsent = true;
                    } 

                    statusCode = "P121"; //OPENED
                    statusMsg = "Please check your internet connection! ("+statusCode+")";
                } else if (jqXHR.readyState == 2) {
                    statusCode = "P122"; //HEADERS_RECEIVED
                    statusMsg = "Please try again later! ("+statusCode+")";
                } else if (jqXHR.readyState == 3) {
                    statusCode = "P123"; //LOADING
                    statusMsg = "Please try again later! ("+statusCode+")";
                }

                //var statusMsg = "Cannot connect to the server. Please, try again! ("+statusCode+")";
                //var statusMsg = "Please check your internet connection! ("+statusCode+")";

                if(jqXHR.status == 413) {
                    statusMsg = jqXHR.statusText;
                }

                if( !ignoreUnsent ) {
                    // FLUSH('ERROR',  statusMsg);
                }

                if(isUIReq === true && hasCont === true) {
                    contInterval = setInterval(function() {
                        if ($(contSelector).length > 0) {
                            clearInterval(contInterval);

                            if(TB.isDefined(loadingIndicatorSelector)) {
                                $(loadingIndicatorSelector).hide();
                                
                                if(TB.isDefined(overlaySelector)) {
                                    $(overlaySelector).hide();
                                }
                            }

                        }
                    }, 100);
                }

                if ( !ignoreUnsent ) {
                  errorCallback({
                      msg: statusMsg,
                      xhr: jqXHR,
                      textStatus: textStatus,
                      errorThrown: errorThrown
                  });
                }
            }
        })
        .fail(function() {
            TRACE("Fail, AJAX Request FAILED, readyState ", TB.request && TB.request.readyState);
            // FLUSH();
        })
        .always(function(data, statusText, jqXHR) {

            if(jqXHR.readyState != 4) {
                FLUSH();
            }

            if(typeof alwaysCallback != 'undefined') {
                alwaysCallback();
            }

            TB.request = undefined;
        });

        return TB.request;
    };

})();
