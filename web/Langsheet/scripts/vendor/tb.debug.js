;
(function(TB) {
    'use strict';

    var traceData = [];
    var benchmarkData = {};
    var version = '0.3';
    var replaceString = '%s';
    var open = '[[ ';
    var close = ' ]]';
    var startedAt = (new Date()).getTime();


    var getType = function(item) {
        var type = typeof item;

        if (type instanceof Array) {
            type = 'array';
        } else if (type instanceof Function) {
            type = 'function';
        }

        return type;
    };

    var makeMessage = function(message) {
        var message = (typeof message == 'string' || typeof message == 'number') ? message : '';

        for (var i = 1; i < arguments.length; i++) {
            var item = arguments[i];
            var text = open;

            text += '(' + getType(item) + ') ';

            if (item === null) {
                text += 'null';
            } else if (typeof item == 'object') {
                try {
                    text += JSON.stringify(item);
                } catch(e) {
                    TB.DEBUG.TRACE('ERROR: %s', e.message);
                    text += '[error while parsing result]';
                }
            } else if (typeof item == 'undefined') {
                text += 'undefined';
            } else if (item instanceof Function) {
                text += item.toString();
            } else if (item.toString && item.toString instanceof Function) {
                if (item instanceof Error) {
                    text += '\n\r';
                    text += item.message;
                    text += '\n\r';
                    text += item.stack;
                } else if (item instanceof Array) {
                    text += '[';
                    text += item.toString();
                    text += ']';
                } else {
                    text += item.toString();
                }
            } else if (!isNaN(item)) {
                text += item;
            } else if (item != item) {
                text += 'NaN';
            }

            text += close;

            text.replace(new RegExp('%s', 'g'), function(char) {
                return "&#" + String.prototype.charCodeAt(char) + ";";
            });

            message = message.replace(replaceString, text);
        }
        return message; 
    };

    var trace = function() {
        var message = makeMessage.apply(this, arguments);
        var now = new Date();
        var uptime = ((now.getTime() - startedAt) / 1000).toFixed(3);
        var logMessage = '[' + now.toJSON() + ']('+ uptime + 's) ' + message;


        if (TB.DEBUG.CONFIG.TRACE_EVENT_ENABLED) {
            dispatchCustomEvent(TB.DEBUG.CONFIG.TRACE_EVENT_NAME, {
                message: message
            });
        }

        while (TB.DEBUG.CONFIG.TRACE_LIMIT && traceData.length >= TB.DEBUG.CONFIG.TRACE_LIMIT) {
            traceData.shift();
        }

        if (TB.DEBUG.CONFIG.CONSOLE_ENABLED) {
            log(logMessage);
        }

        traceData.push(logMessage);
    };

    var assert = function(type, condition, messages) {
        if(condition) {
            messages[0] = 'ASSERTED(' + type + '): ' + messages[0];
            
            
            if (TB.DEBUG.CONFIG.TRACE_ASSERTS) {
                TB.DEBUG.TRACE.apply(this, messages);
            }
            
            
            return true;
        }
        
        messages[0] = 'ASSERT(' + type + '): ' + messages[0];
        
        var message = makeMessage.apply(this, messages);
        TB.DEBUG.TRACE(message);

        var data = die(type, message, true);

        if (TB.DEBUG.CONFIG.ASSERT_EVENT_ENABLED) {
            dispatchCustomEvent(TB.DEBUG.CONFIG.ASSERT_EVENT_NAME, {
                data: data
            });
        }
        
        return false;
    };

    var die = function(type, message) {
        var error = new Error('ASSERT(' + type + '): ' + (message || ''));
        var stack = error.stack || '';
        stack = error.stack.split('\n');
        stack.splice(1, 2);

        var data = {
            command: TB.DEBUG.CONFIG.FLUSH_COMMAND,
            message: error.message,
            error: stack,
            trace: traceData.join('\n'),
            browser: getBrowser()
        };

        error.data = data;

        if (TB.DEBUG.CONFIG.FLUSH_ENABLED) {
            flush(data);
        }

        if (TB.DEBUG.CONFIG.THROW_GLOBAL_ERROR) {
            throw error;
        }
        return data;
    };

    var getBrowser = function() {
        var browser = {};

        if (window.navigator) {
            browser.userAgent = navigator.userAgent;
            browser.platform = navigator.platform;
            browser.cookieEnable = navigator.cookieEnable;
            browser.language = navigator.language;

            if (TB.DEBUG.CONFIG.GET_LOCATION) {
                if (window.navigator.geolocation) {
                    window.navigator.geolocation.getCurrentPosition(function(result) {
                        browser.gelocation = result;
                    }, null, {
                        enableHighAccuracy: true,
                        maximumAge: 0,
                    });
                }
            }
        }

        return browser;
    };

    var flushRetriesCount = 0;
    var flush = function(data) {
        if(flushRetriesCount >= TB.DEBUG.CONFIG.FLUSH_RETRIES_MAX) {
            return;
        }

        if (TB.DEBUG.CONFIG.HTTP_SERVICE instanceof Function) {
            var request = TB.DEBUG.CONFIG.HTTP_SERVICE(TB.DEBUG.CONFIG.FLUSH_COMMAND, data);
            flushRetriesCount++;

            if(request && request.hasOwnProperty('then') && request.then instanceof Function) {
                request.then(function() {
                    flushRetriesCount = 0;
                });
            }
            return;
        }

        flushRetriesCount++;

        var xhr = new XMLHttpRequest();

        xhr.open('POST', TB.DEBUG.CONFIG.FLUSH_URL, true);
        xhr.onload = function(event) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    TB.DEBUG.TRACE('Debug info successfully flushed');
                    flushRetriesCount = 0;
                } else {
                    TB.DEBUG.TRACE('Flushing debug info failed with status ', xhr.statusText);
                }
            }
        };
        xhr.onerror = function(e) {
            TB.DEBUG.TRACE('Flushing debug info failed with status ', xhr.statusText);
        };
        xhr.send(JSON.stringify(data));
    };

    var log = function() {
        if (window.console && window.console instanceof Object) {
            if (window.console.debug == 'function') {
                window.console.debug.apply(window.console, arguments);
            } else if (typeof window.console.log == 'function') {
                window.console.log.apply(window.console, arguments);
            }
        }
    };

    var benchmarkStart = function(name) {
        name = name || '__DEFAULT__';

        benchmarkData[name] = {
            start: new Date(),
        };
        TB.DEBUG.TRACE('Benchmark {{ ' + name + ' }}');
    };

    var benchmarkEnd = function(name) {
        name = name || '__DEFAULT__';

        if (!benchmarkData.hasOwnProperty(name))
            return;

        benchmarkData[name].end = new Date();
        var period = benchmarkData[name].end - benchmarkData[name].start;

        TB.DEBUG.TRACE('Benchmark {{ ' + name + ' }} for {{ ' + period + ' }} (' + benchmarkData[name].start.toISOString() + '|' + benchmarkData[name].end.toISOString() + ')');
        delete benchmarkData[name];
    };

    var dispatchCustomEvent = function(eventName, data) {
        if (window.dispatchEvent && typeof CustomEvent == 'function') {
            window.dispatchEvent(new CustomEvent(eventName, data));
        }
    };


    TB.DEBUG = {
        CONFIG: {
            TRACE_LIMIT: 0,
            ASSERT_EVENT_NAME: 'ASSERT',
            TRACE_EVENT_NAME: 'TRACE',
            FLUSH_URL: '',
            FLUSH_COMMAND: 'ui_trace',
            THROW_GLOBAL_ERROR: true,
            TRACE_ASSERTS: true,
            FLUSH_ENABLED: true,
            ASSERT_EVENT_ENABLED: true,
            TRACE_EVENT_ENABLED: true,
            CONSOLE_ENABLED: true,
            GLOBAL_NAMESPACE: true,
            GET_LOCATION: false,
            HTTP_SERVICE: null,
            FLUSH_RETRIES_MAX: 3,
        },
        GET_VERSION: function() {
            return version;
        },
        GET_BROWSER: function() {
            return getBrowser();
        },
        TRACE: function(message) {
            trace.apply(this, arguments);
        },
        LOG: function() {
            log.apply(null, arguments);
        },
        ASSERT: function(condition, message) {
            assert(TB.Status.CONFIG.STATUSES.SYS_ERROR, condition, Array.prototype.slice.call(arguments, 1));
        },
        ASSERT_USER: function(condition, message) {
            assert(TB.Status.CONFIG.STATUSES.USER_ERROR, condition, Array.prototype.slice.call(arguments, 1));
        },
        ASSERT_PEER: function(condition, message) {
            assert(TB.Status.CONFIG.STATUSES.PEER_ERROR, condition, Array.prototype.slice.call(arguments, 1));
        },
        THROW: function(message) {
            die(TB.Status.CONFIG.STATUSES.SYS_ERROR, Array.prototype.slice.call(arguments, 1));
        },
        THROW_USER: function(message) {
            die(TB.Status.CONFIG.STATUSES.USER_ERROR, Array.prototype.slice.call(arguments, 1));
        },
        THROW_PEER: function(message) {
            die(TB.Status.CONFIG.STATUSES.PEER_ERROR, Array.prototype.slice.call(arguments, 1));
        },
        BENCHMARK_START: function(name) {
            benchmarkStart.apply(null, arguments);
        },
        BENCHMARK_END: function(name) {
            benchmarkEnd.apply(null, arguments);
        },
        FLUSH: function() {
            flush({
                trace: traceData.join('\n'),
                browser: getBrowser()
            });
        },
        CUSTOM_EVENT_SUPPORT: (function() {
            return window.dispatchEvent && typeof CustomEvent == 'function';
        })()
    };

    if (TB.DEBUG.CONFIG.GLOBAL_NAMESPACE) {
        for (var methodName in TB.DEBUG) {
            if (methodName != 'CONFIG' && methodName != 'GET_VERSION' && methodName != 'GET_BROWSER') {
                window[methodName] = TB.DEBUG[methodName];
            }
        }
    }
    
    TB.DEBUG.TRACE('INITIALIZED DEBUG WITH CONFIG %s', TB.DEBUG.CONFIG);
    TB.DEBUG.TRACE('BROWSER: %s', getBrowser());

    window.TB = TB;
})(window.TB || {});