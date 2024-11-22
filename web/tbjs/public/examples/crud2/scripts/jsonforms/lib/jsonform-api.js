(function() {
  var queryParams = TB.parseQueryParams();

  TB = TB || {};
  TB.JSONForm = {};

  TB.JSONForm.API = function(settings) {
    this.s = settings;

    this.service = new TB.RAService({
      apiUrl: this.s.apiUrl,
      transportProtocol: 'jsonrpc2',
      httpMethod: 'POST',
      requireCommandDefinition: true,

      beforeSend: function(xhr) {
        // console.log(xhr)
      },

      payloadParams: {
        server_params: this.s.serverParams,
        session_token: null,
      },
      requestParams: {
        server_params: this.s.serverParams,
        api_key: this.s.apiKey,
      },
      commands: {
        jsonform_form_load: {
          httpMethod: 'get',
          payloadParams: {
            form_name: function() {
              return queryParams['form_name'];
            },
            table_name: function() {
              return queryParams['table_name'];
            },
            col_name: function() {
              return queryParams['col_name'];
            },
            row_id: function() {
              return queryParams['row_id'];
            },
          },
        },
        jsonform_form_submit: {
          httpMethod: 'post',
          payloadParams: {
            form_name: function() {
              return queryParams['form_name'];
            },
            table_name: function() {
              return queryParams['table_name'];
            },
            col_name: function() {
              return queryParams['col_name'];
            },
            row_id: function() {
              return queryParams['row_id'];
            },
          },
        },
        crud_list: {
          httpMethod: 'get',
          payloadParams: {
            form_name: function() {
              return queryParams['form_name'];
            },
            table_name: function() {
              return queryParams['table_name'];
            },
          },
        },
        crud_meta: {
          httpMethod: 'get',
          payloadParams: {
            
          },
        },
        jsonform_fkey_search: {
          httpMethod: 'get'
        },
      }
    });
  };

  TB.JSONForm.API.prototype = {
    getSchemaJSON: function() {},
    getFormJSON: function() {},
    getContentJSON: function() {},
    formLoad: function() {
      return this.service.request('jsonform_form_load');
    },
    formSubmit: function(value) {
      return this.service.request('jsonform_form_submit', {
        content: value,
      });
    },
  };
})();
