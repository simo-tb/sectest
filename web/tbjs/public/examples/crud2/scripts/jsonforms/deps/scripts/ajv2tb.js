(function(w){
  var USER_ERR_STATUS = 'user_error';
  var PEER_ERR_STATUS = 'peer_error';
  var ERR_CODES_BY_KEYWORD = {
    multipleOf: 1000,
    maximum: 1010,
    minimum: 1020,
    pattern: 1030,
    format: 1040,
    minLength: 1050,
    maxLength: 1060,
    nullValue: 1800,
    schemaError: 1900,
  };

  function Ajv2tb(ajv, s) {
    this.ajv = ajv;

    this.s = s || {};
    this.s.msgs = this.s.msgs || {};
    this.s.msgs.default = this.s.msgs.default || 'Invalid value';
    this.s.msgs.nullValue = this.s.msgs.nullValue || 'Missing value';
    this.s.msgs.schemaError = this.s.msgs.schemaError || 'Invalid value against schema';
  }

  Ajv2tb.prototype = Ajv2tb.prototype || {};

  Ajv2tb.prototype.validate = function(schema, data) {
    var result = this.ajv.validate(schema, data);

    if(result !== true) {
      var resultErrors = [];

      this.ajv.errors.forEach(function(ajvErr) {
        var err = {
          debug: {
            ajvErr: ajvErr,
          },
          wrongData: ajvErr.data,
          dataPath: ajvErr.dataPath,
        };
        var constraintMsgs = ajvErr.parentSchema.constraintMsgs;
        var prefix = ''; // TODO префикса трябва да дойде отнякъде

        if(typeof constraintMsgs !== 'object') {
          constraintMsgs = {
            default: (constraintMsgs !== undefined) ? constraintMsgs : this.s.msgs.default,
          };
        }
   
        constraintMsgs.nullValue = (constraintMsgs.nullValue !== undefined) ? constraintMsgs.nullValue : this.s.msgs.nullValue; 
        

        switch(ajvErr.keyword) {
          case 'multipleOf':
          case 'maximum':
          case 'minimum':
          case 'minLength':
          case 'maxLength':
          case 'pattern':
          case 'format':
            err.code = prefix + ERR_CODES_BY_KEYWORD[ajvErr.keyword];
            err.status = USER_ERR_STATUS;
            err.msg = constraintMsgs[ajvErr.keyword] || constraintMsgs.default;
            break;
          case 'type':
            if(ajvErr.data === null) {
              err.code = prefix + ERR_CODES_BY_KEYWORD.nullValue;
              err.status = USER_ERR_STATUS;
              err.msg = constraintMsgs.nullValue || constraintMsgs.default;
              break;
            }
          default: 
            err.code = prefix + ERR_CODES_BY_KEYWORD.schemaError;
            err.status = PEER_ERR_STATUS;
            err.msg = this.s.msgs.schemaError;
        }

        resultErrors.push(err);
      }.bind(this));

      return {
        validationErrors: resultErrors,
      };
    }

    return true;
  };

  w.Ajv2tb = Ajv2tb;
})(this);
