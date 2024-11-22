(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('lodash'), require('tb.xerrors'), require('tb.service'));
  } else if (typeof define === 'function' && define.amd) {
    define(['lodash', 'tb.xerrors', 'tb.service'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    global.TB = global.TB || {};
    global.TB.jf = global.TB.jf || {};
    global.TB.service_loader = factory(global._, global.TB, global.TB.RAService);
  }
})(this, function (_, TB, TbRAService) {
  'use strict';

  var queryParams = TB.parseQueryParams();
  var sp;
  var session;

  var commands_json = {};

  var isInitted = false;


  var tbCommonService = function (settings) {
    this.s = settings;
    var requestParamsObj = {};
    if (this.s.apiKey) {
        requestParamsObj.api_key = this.s.apiKey;
    }

    this.service = new TbRAService({
      transportProtocol: 'jsonrpc2',
      requireCommandDefinition: true,
      moreSettings: settings,

      commands: {
        load_commands: {
          httpMethod: 'get'      
        }
      },
      requestSettings: {
        apiUrl: this.s.apiUrl,
        httpMethod: 'POST',
        beforeSend: function (xhr) {
        },
        requestParams: _.assign(requestParamsObj, this.s.requestParams),
      }
    });
  }

  tbCommonService.prototype.init = function () {
    var self = this;

    if ( ! isInitted ) {
      isInitted = true;

      var commandsPromise = this.service.request('load_commands');
      commandsPromise.then(function(res) {
        var serverCommands = res.commands;

        // I can't use let, so i have to use explicit /function/ closure
        function ClosureForCommandCallback(command) {
          return function (params, requestParams) {
            if (requestParams) {
              if (requestParams.timeout == null) {
                requestParams.timeout = 3000;
              } else {
                // do nothing
              }
            } else {
              requestParams = {
                timeout: 3000,
              };
            }

            return self.service.request(command, params, requestParams);
          }
        }

        for (var command in serverCommands) {
          console.log("Initializing the prototype - ", command);
          tbCommonService.prototype[command] = ClosureForCommandCallback(command);
        
          console.log("Initializing the commands tb.service hash - ", command);
          self.service.s.commands[ command ] = serverCommands[ command ];

          commands_json[ command ] = serverCommands[ command ];
        }
      });

      return commandsPromise;
    } else {
      // I can't use let, so i have to use explicit /function/ closure
      function ClosureForCommandCallback(command) {
        return function (params, requestParams) {
					if (requestParams) {
						if (requestParams.timeout == null) {
							requestParams.timeout = 3000;
						} else {
							// do nothing
						}
					} else {
						requestParams = {
							timeout: 3000,
						};
					}

          return this.service.request(command, params, requestParams);
        }
      }

      for (var command in commands_json) {
        console.log("Initializing the prototype - ", command);
        tbCommonService.prototype[command] = ClosureForCommandCallback(command);
      
        console.log("Initializing the commands tb.service hash - ", command);
        this.service.s.commands[ command ] = commands_json[ command ];
      } 
    }
  }

  tbCommonService.prototype.send = function (command, ...params) {
    let fn;
    let re; 
    let promiseIn = new TB.Promise((res, rej) => {
      fn = res;
      re = rej;
    });

    let promise;
    if ( ! isInitted ) {
      promise = this.init();
    } else {
      promise = new TB.Promise((res, rej) => {
        res();
      });  
    }

    var promiseWait = promise;
    if (this.lastPromise) {
     promiseWait = this.lastPromise;
    }

    // we don't care about the promise resolve/reject, because we are just waiting for it to end, so we are serialized
    let inP = promiseWait.promise || promiseWait;
    
    inP.then(() => {
      if ( ! tbCommonService.prototype[command] ) {
        TB.ASSERT(tbCommonService.prototype[command] != undefined, "Unknown command - " + command);
      } 

      tbCommonService.prototype[command](...params)
      .then(resp => {
        fn(resp);
        this.lastPromise = null;
      })
      .catch(err => {
        re(err); 
        this.lastPromise = null;
      });
    })
    .catch(err => {
      re(err); 
      this.lastPromise = null;
    });
    
    inP.catch(err => {
      re(err);
      this.lastPromise = null;
    });

    this.lastPromise = promiseIn;

    return promiseIn;
  }

  TB.GLOBAL_API;
  if ( ! TB.API_URL ) {
    let qs = TB.parseQueryParams();
    if (qs.api_url) TB.API_URL = qs.api_url;
    if (qs.api_key) TB.API_KEY = qs.api_key;
  }

  if (TB.API_URL) {
    TB.GLOBAL_API = new tbCommonService({
      apiUrl: TB.API_URL,
      apiKey: TB.API_KEY,
    });

    var evt = new Event('tb-client-api-loaded');
    document.dispatchEvent(evt);
  } else {
    var res = setInterval(function() {
      if (TB.API_URL) {
        clearInterval(res);
        TB.GLOBAL_API = new tbCommonService({
          apiUrl: TB.API_URL,
          apiKey: TB.API_KEY,
        });

        var evt = new Event('tb-client-api-loaded');
        document.dispatchEvent(evt);
      }
    }, 100);
  }
  


  return tbCommonService;
});
