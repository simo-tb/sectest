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
    global.TB.jf.API = factory(global._, global.TB, global.TB.RAService);
  }
})(this, function (_, TB, TbRAService) {
  'use strict';

  var queryParams = TB.parseQueryParams();
  var sp;
  var session;

  TRACE('For 7e1df', 'start');

  var tbJfService = function (settings) {
    this.s = settings;
    var requestParamsObj = {};
    if (this.s.apiKey) {
        requestParamsObj.api_key = this.s.apiKey;
    }

    this.service = new TbRAService({
      apiUrl: this.s.apiUrl,
      transportProtocol: 'jsonrpc2',
      httpMethod: 'POST',
      requireCommandDefinition: true,
      moreSettings: settings,

      beforeSend: function (xhr) {
      },

      payloadParams: _.assign({
        session_token: function () {
          return TB.SESSION_TOKEN || queryParams['session_token'] || null;
        },
      }, this.s.payloadParams),
      requestParams: _.assign(requestParamsObj, this.s.requestParams),
      commands: {
        jsonform_crud_load: {
          httpMethod: 'get',
          payloadParams: {
            form_name: function () {
              return queryParams['form_name'] || settings['form_name'] || queryParams['form'];
            },
            record_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            row_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            random_number: function() {
              // every GET method should probably have this random_number shit?
              return Math.random();
            },
          }
        },

        jsonform_approve_insert_load: {
          httpMethod: 'get',
          payloadParams: {
            form_name: function () {
              return queryParams['form_name'] || settings['form_name'] || queryParams['form'];
            },
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            create_row_approve: function () {
              return true;
            },
            create_row_approve_id: function () {
              return null;
            },
            random_number: function() {
              // every GET method should probably have this random_number shit?
              return Math.random();
            },
          }
        },
        jsonform_approve_insert_submit: {
          httpMethod: 'post',
          payloadParams: {
            form_name: function () {
              return queryParams['form_name'] || settings['form_name'] || queryParams['form'];
            },
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            create_row_approve: function () {
              return true;
            },
            create_row_approve_id: function () {
              return null;
            },
            random_number: function() {
              // every GET method should probably have this random_number shit?
              return Math.random();
            },
            sp: function () { return settings['sp'] || sp || 0; },
          }
        },


        jsonform_crud_unique_col_to_id: {
          httpMethod: 'get',
          payloadParams: {
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
          }
        },
        
        jsonform_crud_get_sample_row: {
          httpMethod: 'get',
          payloadParams: {
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
          }
        },
        jsonform_crud_edit_load: {
          httpMethod: 'get',
          payloadParams: {
            form_name: function () {
              return queryParams['form_name'] || settings['form_name'] || queryParams['form'];
            },
            record_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'] || queryParams['clone_id'];
            },
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            row_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            ta_crud_edit: function() {
              return queryParams['ta_crud_edit'] || settings['ta_crud_edit'];
            },
            ta_crud_add: function() {
              return queryParams['ta_crud_add'] || settings['ta_crud_add'];
            },
            is_clone: function() {
                return queryParams['clone_id'] != undefined;
            },
            random_number: function() {
              // every GET method should probably have this random_number shit?
              return Math.random();
            },
          }
        },
        jsonform_crud_insert_load: {
          httpMethod: 'get',
          payloadParams: {
            form_name: function () {
              return queryParams['form_name'] || settings['form_name'] || queryParams['form'];
            },
            record_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            row_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            ta_crud_edit: function() {
              return queryParams['ta_crud_edit'] || settings['ta_crud_edit'];
            },
            ta_crud_add: function() {
              return queryParams['ta_crud_add'] || settings['ta_crud_add'];
            },
            random_number: function() {
              // every GET method should probably have this random_number shit?
              return Math.random();
            },
          }
        },
        jsonform_form_load: {
          httpMethod: 'get',
          payloadParams: {
            form_name: function () {
              return queryParams['form_name'] || settings['form_name'] || queryParams['form'];
            },
            record_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            row_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            random_number: function() {
              // every GET method should probably have this random_number shit?
              return Math.random();
            },
          }
        },

        jsonform_crud_insert_submit: {
          httpMethod: 'post',
          payloadParams: {
            table_name: function () {
              return settings['table_name'] || queryParams['table_name'];
            },
            form_title: function () {
              return queryParams['form_title'] || settings['form_title'];
            },
            col_name: function () {
              return queryParams['col_name'] || settings['col_name'];
            },
            form_name: function () {
              return settings['form_name'] || queryParams['form_name'] || queryParams['form'];
            },
            record_id: function () {
              if (settings['record_id'] == null) {
                return undefined;
              }
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            row_id: function () {
              if (settings['record_id'] == null) {
                return undefined;
              }
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            sp: function () { return settings['sp'] || sp || 0; }
          }
        },
        jsonform_crud_multiple_insert_submit: {
          httpMethod: 'post',
          payloadParams: {
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            form_title: function () {
                return queryParams['form_title'] || settings['form_title'];
            },
            col_name: function () {
              return queryParams['col_name'] || settings['col_name'];
            },
            form_name: function () {
              return queryParams['form_name'] || settings['form_name'] || queryParams['form'];
            },
            record_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            row_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            sp: function () { return sp || 0; }
          }
        },


        jsonform_crud_edit_submit: {
          httpMethod: 'post',
          payloadParams: {
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            form_title: function () {
              return queryParams['form_title'] || settings['form_title'];
            },
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            col_name: function () {
              return queryParams['col_name'] || settings['col_name'];
            },
            form_name: function () {
              return queryParams['form_name'] || settings['form_name'] || queryParams['form'];
            },
            record_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            row_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            sp: function () { return sp || 0; }
          }
        },
        jsonform_crud_multiple_update_submit: {
          httpMethod: 'post',
          payloadParams: {
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            sp: function () { return sp || 0; }
          }
        },
        crud_list_search: {
          httpMethod: 'get',
          payloadParams: {
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            form_title: function () {
              return queryParams['form_title'] || settings['form_title'];
            },
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            col_name: function () {
              return queryParams['col_name'] || settings['col_name'];
            },
            form_name: function () {
              return queryParams['form_name'] || settings['form_name'] || queryParams['form'];
            },
            session: function () {
              return queryParams['session'] || settings['session'] || session;
            },
            sp: function () { return sp || 0; },
            random_number: function() {
              // every GET method should probably have this random_number shit?
              return Math.random();
            },
          }
        },
        jsonform_form_submit: {
          httpMethod: 'post',
          payloadParams: {
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            form_title: function () {
                return queryParams['form_title'] || settings['form_title'];
            },
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            col_name: function () {
              return queryParams['col_name'] || settings['col_name'];
            },
            form_name: function () {
              return queryParams['form_name'] || settings['form_name'] || queryParams['form'];
            },
            record_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            row_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            sp: function () { return sp || 0; }
          }
        },

        jsonform_approve_record: {
          httpMethod: 'post',
          payloadParams: {
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            form_title: function () {
                return queryParams['form_title'] || settings['form_title'];
            },
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            col_name: function () {
              return queryParams['col_name'] || settings['col_name'];
            },
            form_name: function () {
              return queryParams['form_name'] || settings['form_name'] || queryParams['form'];
            },
            record_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            row_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            sp: function () { return sp || 0; }
          }
        },

        jsonform_approve_send_code: {
          httpMethod: 'post',
          payloadParams: {
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            form_title: function () {
                return queryParams['form_title'] || settings['form_title'];
            },
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            col_name: function () {
              return queryParams['col_name'] || settings['col_name'];
            },
            form_name: function () {
              return queryParams['form_name'] || settings['form_name'] || queryParams['form'];
            },
            record_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            row_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            approval_create: function() {
              return queryParams.ta_crud_approve_create;
            },
            approval_update: function() {
              return queryParams.ta_crud_edit;
            },

            sp: function () { return sp || 0; }
          }
        },
        jsonform_crud_approve_record: {
          httpMethod: 'post',
          payloadParams: {
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            form_title: function () {
                return queryParams['form_title'] || settings['form_title'];
            },
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
            col_name: function () {
              return queryParams['col_name'] || settings['col_name'];
            },
            form_name: function () {
              return queryParams['form_name'] || settings['form_name'] || queryParams['form'];
            },
            record_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            row_id: function () {
              return queryParams['record_id'] || settings['record_id'] || queryParams['row_id'] || settings['row_id'];
            },
            sp: function () { return sp || 0; }
          }
        },


        crud_list: {
          httpMethod: 'get',
          payloadParams: {
            form_name: function () {
              return queryParams['form_name'] || queryParams['form'];
            },
            table_name: function () {
              return queryParams['table_name'] || settings['table_name'];
            },
          }
        },
        jsonform_fkey_search: {
          httpMethod: 'post',
          payloadParams: {
            session: function () {
              return queryParams['session'] || settings['session'] || session;
            },
          },
        },
        jsonforms_crud_delete: {
          httpMethod: 'post',
        },
        jsonforms_crud_approval_delete: {
          httpMethod: 'post',
        },
        jsonforms_crud_approval_delete_approve_reject: {
          httpMethod: 'post',
        },

        get_session: {
          httpMethod: 'get',
        },
      }
    });
  };

  TRACE('For 7e1df', 'prototype');

  tbJfService.prototype = {
    formLoadTiny: function (commandParams, libParams) {
      libParams = _.merge({
        requestSettings: { timeout: 0 }
      }, libParams);
      return this.service.request('jsonform_tiny_load', commandParams, libParams).then(function (resp) { sp = resp.sp || null; return resp; });
    },
    formLoad: function (commandParams, libParams) {

      if (TB.jf.server_data) {
        commandParams.server_data = TB.jf.server_data;
      }

      libParams = _.merge({
        requestSettings: { timeout: 10000 }
      }, libParams);
      return this.service.request('jsonform_form_load', commandParams, libParams).then(function (resp) { sp = resp.sp || null; return resp; });
    },
    formCrudEditLoad: function (commandParams, libParams) {
      libParams = _.merge({
        requestSettings: { timeout: 10000 }
      }, libParams);

      if (TB.jf.server_data) {
        commandParams.server_data = TB.jf.server_data;
      }

      return this.service.request('jsonform_crud_edit_load', commandParams, libParams)
        .then(function (resp) { 
          sp = resp.sp || null; 
          return resp; 
        });
    },
    formCrudCreateLoad: function (commandParams, libParams) {
      libParams = _.merge({
        requestSettings: { timeout: 10000 }
      }, libParams);
      return this.service.request('jsonform_crud_insert_load', commandParams, libParams).then(function (resp) { sp = resp.sp || null; return resp; });
    },
    crudLoad: function (commandParams, libParams) {

      if (TB.jf.server_data) {
        commandParams.server_data = TB.jf.server_data;
      }

      libParams = _.merge({
        requestSettings: { timeout: 0 }
      }, libParams);
      return this.service.request('jsonform_crud_load', commandParams, libParams).then(function (resp) { sp = resp.sp || null; return resp; });
    },


    formApprove: function (commandParams, libParams) {
      libParams = _.merge({
        requestSettings: { timeout: 0 }
      }, libParams);
      return this.service.request('jsonform_approve_record', commandParams, libParams).then(function (resp) { sp = resp.sp || null; return resp; });
    },
    formCrudApprove: function (commandParams, libParams) {
      libParams = _.merge({
        requestSettings: { timeout: 0 }
      }, libParams);
      return this.service.request('jsonform_crud_approve_record', commandParams, libParams).then(function (resp) { sp = resp.sp || null; return resp; });
    },
    formApproveSendCode: function (commandParams, libParams) {
      libParams = _.merge({
        requestSettings: { timeout: 0 }
      }, libParams);
      return this.service.request('jsonform_approve_send_code', commandParams, libParams).then(function (resp) { return resp; });
    },
    formLoadApprove: function (commandParams, libParams) {
      libParams = _.merge({
        requestSettings: { timeout: 0 }
      }, libParams);
      return this.service.request('jsonform_approve_insert_load', commandParams, libParams).then(function (resp) { sp = resp.sp || null; return resp; });
    },
    formApproveInsertSubmit: function (commandParams, libParams) {
      libParams = _.merge({
        requestSettings: { timeout: 0 }
      }, libParams);
      return this.service.request('jsonform_approve_insert_submit', commandParams, libParams).then(function (resp) { sp = resp.sp || null; return resp; });
    },


    formCrudListSearch: function (commandParams, libParams) {
      return this.service.request('crud_list_search', commandParams, libParams);
    },
    formCrudDelete: function (commandParams, libParams) {
      return this.service.request('jsonforms_crud_delete', commandParams, libParams);
    },
    formCrudApprovalDelete: function (commandParams, libParams) {
      return this.service.request('jsonforms_crud_approval_delete', commandParams, libParams);
    },
    formCrudApprovalDeleteApproveReject: function (commandParams, libParams) {
      return this.service.request('jsonforms_crud_approval_delete_approve_reject', commandParams, libParams);
    },


    formSubmit: function (commandParams, files, libParams) {
      var timeout = 0;
      var realFiles = files.fileRequest;

      var requestType;
      if (files && Object.keys(realFiles).length > 0) {
        requestType = 'formdata';
      }

      if (TB.jf.server_data) {
        commandParams.server_data = TB.jf.server_data;
      }

      libParams = _.merge({
        requestSettings: {
          requestFiles: files,
          timeout: timeout,
          requestType: requestType,
          processData: requestType === undefined,
        }
      }, libParams);

      return this.service.request('jsonform_form_submit', commandParams, libParams).then(function(resp) {
        sp = resp.sp || null;
        return resp;
      });
    },

    tableCrudInsertSubmit: function (commandParams, files, libParams) {
      var timeout = 0;
      var realFiles = files.fileRequest;

      var requestType;
      if (files && Object.keys(realFiles).length > 0) {
        requestType = 'formdata';
      }

      if (TB.jf.server_data) {
        commandParams.server_data = TB.jf.server_data;
      }

      libParams = _.merge({
        requestSettings: {
          requestFiles: files,
          timeout: timeout,
          requestType: requestType,
          processData: requestType === undefined,
        }
      }, libParams);

      return this.service.request('jsonform_crud_insert_submit', commandParams, libParams).then(function(resp) {
        // sp = resp.sp || null;
        return resp;
      });
    },
    tableCrudMultipleInsertSubmit: function (commandParams, files, libParams) {
      var timeout = 0;
      var realFiles = files.fileRequest;

      var requestType;
      if (files && Object.keys(realFiles).length > 0) {
        requestType = 'formdata';
      }

      libParams = _.merge({
        requestSettings: {
          requestFiles: files,
          timeout: timeout,
          requestType: requestType,
          processData: requestType === undefined,
        }
      }, libParams);

      return this.service.request('jsonform_crud_multiple_insert_submit', commandParams, libParams).then(function(resp) {
        sp = resp.sp || null;
        return resp;
      });
    },
    tableCrudGetSampleRow: function (libParams) {
      libParams = _.merge({
        requestSettings: { timeout: 0 }
      }, libParams);
      return this.service.request('jsonform_crud_get_sample_row', {}, libParams);
    },
    tableUniqueColToID: function (commandParams, libParams) {
      return this.service.request('jsonform_crud_unique_col_to_id', commandParams, libParams).then(function(resp) {
        return resp;
      });
    },
    tableCrudEditSubmit: function (value, files) {
      var timeout = 0;
      var realFiles = files.fileRequest;

      var requestType;
      if (files && Object.keys(realFiles).length > 0) {
        requestType = 'formdata';
      }

      if (TB.jf && TB.jf.server_data) {
        value.server_data = TB.jf.server_data;
      }

      return this.service.request('jsonform_crud_edit_submit', value, {
        requestFiles: files,
        timeout: timeout,
        requestType: requestType,
        processData: requestType === undefined,
      }).then(function(resp) {
        sp = resp.sp || null;
        return resp;
      });
    },
    tableCrudMultipleUpdateSubmit: function (value, files) {
      var timeout = 0;
      var realFiles = files.fileRequest;

      var requestType;
      if (files && Object.keys(realFiles).length > 0) {
        requestType = 'formdata';
      }

      return this.service.request('jsonform_crud_multiple_update_submit', value, {
        requestFiles: files,
        timeout: timeout,
        requestType: requestType,
        processData: requestType === undefined,
      }).then(function(resp) {
        sp = resp.sp || null;
        return resp;
      });
    },
    searchForeignKey: function (commandParams, libParams) {
      return this.service.request('jsonform_fkey_search', commandParams.data, { timeout: 0 });
    },
    addForeignEntry: function(commandParams, libParams) {
      return this.service.request('jsonform_foreign_entry_add', commandParams.data, { timeout: 0 });
    },
    formSubmitForeign: function(commandParams, libParams) {
      return this.service.request('create_record', commandParams, { timeout: 0 }); // { record: params:params.data } );
    },
    getSessionToken: function(commandParams, libParams) {
      return this.service.request('get_session', commandParams)
        .then(function(resp) {
          session = resp.session_token;

          return resp;
        });

    },

  };

  TRACE('For 7e1df', 'api', 'return', tbJfService);

  return tbJfService;
});
