(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('lodash'), require('tb.xerrors'), require('tb.service-loader'));
  } else if (typeof define === 'function' && define.amd) {
    define(['lodash', 'tb.xerrors', 'tb.service-loader'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    global.TB = global.TB || {};
    global.TB.jf = global.TB.jf || {};
    global.TB.jf.api_wrapper = factory(global._, global.TB, global.TB.service_loader);
  }
})(this, function (_, TB, ServiceLoader) {
  'use strict';

  var queryParams = TB.parseQueryParams();
  var sp;
  var session;

  TRACE('For 7e1df', 'api-wrapper', 'start');

  var tbJfApiWrapper = function (settings) {
    this.s = settings;
  };
  
  var populateCommonCommandVariables = function (commandParams) {
    commandParams.sp = commandParams.sp || sp || 0;

    if (TB.jf && TB.jf.server_data) {
      commandParams.server_data = TB.jf.server_data;
    }

    if (TB.jf && TB.jf.form_title) {
      commandParams.form_title = TB.jf.form_title;
    }


    commandParams.random_number = commandParams.random_number || Math.random();

    return commandParams;
  }


  TRACE('For 7e1df', 'api-wrapper', 'prototype');

  tbJfApiWrapper.prototype = {
    formCrudListSearch: function (commandParams, libParams) {
      commandParams = commandParams || {};
      commandParams.form_title = commandParams.form_title || queryParams['form_title'] || this.s['form_title'];
      commandParams.table_name = commandParams.table_name || queryParams['table_name'] || this.s['table_name'];
      commandParams.col_name = commandParams.col_name || queryParams['col_name'] || this.s['col_name'];
      commandParams.form_name = commandParams.form_name || queryParams['form_name'] || this.s['form_name'] || queryParams['form'];
      
      commandParams = populateCommonCommandVariables( commandParams );

      commandParams.sp = "0";

      return TB.GLOBAL_API.send('crud_list_search', commandParams, libParams);
    },


    formLoad: function (commandParams, libParams) {
      commandParams = commandParams || {};
      commandParams.table_name = commandParams.table_name || queryParams['table_name'] || this.s['table_name'];
      commandParams.form_name = commandParams.form_name || queryParams['form_name'] || this.s['form_name'] || queryParams['form'];
      commandParams.record_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];
      commandParams.row_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];
      commandParams = populateCommonCommandVariables( commandParams );

      return TB.GLOBAL_API.send('jsonform_form_load', commandParams, libParams)
        .then(function (resp) { sp = resp.sp || null; return resp; });
    },
    formCrudEditLoad: function (commandParams, libParams) {
	  commandParams = commandParams || {};
      commandParams.table_name = commandParams.table_name || queryParams['table_name'] || this.s['table_name'];
      commandParams.form_name = commandParams.form_name || queryParams['form_name'] || this.s['form_name'] || queryParams['form'];
      commandParams.record_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'] || queryParams['clone_id'];
      commandParams.row_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'] || queryParams['clone_id'];
      commandParams.is_clone = queryParams['clone_id'] != undefined;
      commandParams.approval_update = queryParams.ta_crud_edit;
      commandParams.ta_crud_add = queryParams.ta_crud_add || this.s['ta_crud_add'];
      
      commandParams = populateCommonCommandVariables( commandParams );

      return TB.GLOBAL_API.send('jsonform_crud_edit_load', commandParams, libParams)
        .then(function (resp) { 
          sp = resp.sp || null; 
          return resp; 
        });
    },
    formCrudCreateLoad: function (commandParams, libParams) {
      commandParams.table_name = commandParams.table_name || queryParams['table_name'] || this.s['table_name'];
      commandParams.form_name = commandParams.form_name || queryParams['form_name'] || this.s['form_name'] || queryParams['form'];
      commandParams.record_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];
      commandParams.row_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];

      commandParams.ta_crud_add = queryParams.ta_crud_add || this.s['ta_crud_add'];
      commandParams.ta_crud_edit = queryParams.ta_crud_edit || this.s['ta_crud_edit'];
      commandParams = populateCommonCommandVariables( commandParams );

      return TB.GLOBAL_API.send('jsonform_crud_insert_load', commandParams, libParams)
        .then(function (resp) { sp = resp.sp || null; return resp; });
    },
    crudLoad: function (commandParams, libParams) {
      commandParams.table_name = commandParams.table_name || queryParams['table_name'] || this.s['table_name'];
      commandParams.form_name = commandParams.form_name || queryParams['form_name'] || this.s['form_name'] || queryParams['form'];
      commandParams.record_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];
      commandParams.row_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];
      commandParams = populateCommonCommandVariables( commandParams );

      return TB.GLOBAL_API.send('jsonform_crud_load', commandParams, libParams)
        .then(function (resp) { sp = resp.sp || null; return resp; });
    },


    formApprove: function (commandParams, libParams) {
      commandParams.table_name = commandParams.table_name || queryParams['table_name'] || this.s['table_name'];
      commandParams.form_name = commandParams.form_name || queryParams['form_name'] || this.s['form_name'] || queryParams['form'];
      commandParams.form_title = commandParams.form_title || queryParams['form_title'] || this.s['form_title'];
      commandParams.col_name = commandParams.col_name || queryParams['col_name'] || this.s['col_name'];
      commandParams.record_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];
      commandParams.row_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];
      commandParams = populateCommonCommandVariables( commandParams );

      return TB.GLOBAL_API.send('jsonform_approve_record', commandParams, libParams)
        .then(function (resp) { sp = resp.sp || null; return resp; });
    },
    formCrudApprove: function (commandParams, libParams) {
      commandParams.table_name = commandParams.table_name || queryParams['table_name'] || this.s['table_name'];
      commandParams.form_name = commandParams.form_name || queryParams['form_name'] || this.s['form_name'] || queryParams['form'];
      commandParams.form_title = commandParams.form_title || queryParams['form_title'] || this.s['form_title'];
      commandParams.col_name = commandParams.col_name || queryParams['col_name'] || this.s['col_name'];
      commandParams.record_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];
      commandParams.row_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];
      commandParams = populateCommonCommandVariables( commandParams );

      return TB.GLOBAL_API.send('jsonform_crud_approve_record', commandParams, libParams)
        .then(function (resp) { sp = resp.sp || null; return resp; });
    },
    formApproveSendCode: function (commandParams, libParams) {
      commandParams.table_name = commandParams.table_name || queryParams['table_name'] || this.s['table_name'];
      commandParams.form_name = commandParams.form_name || queryParams['form_name'] || this.s['form_name'] || queryParams['form'];
      commandParams.form_title = commandParams.form_title || queryParams['form_title'] || this.s['form_title'];
      commandParams.col_name = commandParams.col_name || queryParams['col_name'] || this.s['col_name'];
      commandParams.record_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];
      commandParams.row_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];
      commandParams.approval_create = queryParams.ta_crud_approve_create;
      commandParams.approval_update = queryParams.ta_crud_edit;
      commandParams = populateCommonCommandVariables( commandParams );

      return TB.GLOBAL_API.send('jsonform_approve_send_code', commandParams, libParams)
        .then(function (resp) { return resp; });
    },
    formLoadApprove: function (commandParams, libParams) {
      commandParams = commandParams || {};

      commandParams.table_name = commandParams.table_name || queryParams['table_name'] || this.s['table_name'];
      commandParams.form_name = commandParams.form_name || queryParams['form_name'] || this.s['form_name'] || queryParams['form'];
      commandParams.approval_update = queryParams.ta_crud_edit;
      commandParams.create_row_approve = true;
      commandParams.create_row_approve_id = null;
      commandParams = populateCommonCommandVariables( commandParams );
       
      return TB.GLOBAL_API.send('jsonform_approve_insert_load', commandParams, libParams)
        .then(function (resp) { sp = resp.sp || null; return resp; });
    },
    formApproveInsertSubmit: function (commandParams, libParams) {
      commandParams.table_name = commandParams.table_name || queryParams['table_name'] || this.s['table_name'];
      commandParams.form_name = commandParams.form_name || queryParams['form_name'] || this.s['form_name'] || queryParams['form'];
      commandParams.create_row_approve = true;
      commandParams.create_row_approve_id = null;
      commandParams = populateCommonCommandVariables( commandParams );
 
      return TB.GLOBAL_API.send('jsonform_approve_insert_submit', commandParams, libParams)
        .then(function (resp) { sp = resp.sp || null; return resp; });
    },
    formCrudDelete: function (commandParams, libParams) {
      commandParams = populateCommonCommandVariables( commandParams );
      return TB.GLOBAL_API.send('jsonforms_crud_delete', commandParams, libParams);
    },
    formCrudApprovalDelete: function (commandParams, libParams) {
      commandParams = populateCommonCommandVariables( commandParams );
      return TB.GLOBAL_API.send('jsonforms_crud_approval_delete', commandParams, libParams);
    },
    formCrudApprovalDeleteApproveReject: function (commandParams, libParams) {
      commandParams = populateCommonCommandVariables( commandParams );
      return TB.GLOBAL_API.send('jsonforms_crud_approval_delete_approve_reject', commandParams, libParams);
    },
    formSubmit: function (commandParams, files, libParams) {
      var timeout = 0;
      var realFiles = files.fileRequest;

      var requestType;
      if (files && Object.keys(realFiles).length > 0) {
        requestType = 'formdata';
      }

      commandParams = populateCommonCommandVariables( commandParams );
      commandParams = populateCommonCommandVariables( commandParams );

      commandParams.form_title = commandParams.form_title || queryParams['form_title'] || this.s['form_title'];
      commandParams.table_name = commandParams.table_name || queryParams['table_name'] || this.s['table_name'];
      commandParams.col_name = commandParams.col_name || queryParams['col_name'] || this.s['col_name'];
      commandParams.form_name = commandParams.form_name || queryParams['form_name'] || this.s['form_name'] || queryParams['form'];
      commandParams.record_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];
      commandParams.row_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];

      libParams = _.merge({
        requestSettings: {
          requestFiles: files,
          timeout: timeout,
          requestType: requestType,
          processData: requestType === undefined,
        }
      }, libParams);

      return TB.GLOBAL_API.send('jsonform_form_submit', commandParams, libParams)
      .then(function(resp) {
        if (commandParams.confirmation_required && ! commandParams.confirmation_required_approve) {
          sp = resp.sp || null;
        }

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

      commandParams = populateCommonCommandVariables( commandParams );

      commandParams.form_title = commandParams.form_title || queryParams['form_title'] || this.s['form_title'];
      commandParams.table_name = commandParams.table_name || queryParams['table_name'] || this.s['table_name'];
      commandParams.col_name = commandParams.col_name || queryParams['col_name'] || this.s['col_name'];
      commandParams.form_name = commandParams.form_name || queryParams['form_name'] || this.s['form_name'] || queryParams['form'];
      commandParams.record_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];
      commandParams.row_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];

      libParams = _.merge({
        requestSettings: {
          requestFiles: files,
          timeout: timeout,
          requestType: requestType,
          processData: requestType === undefined,
        }
      }, libParams);

      return TB.GLOBAL_API.send('jsonform_crud_insert_submit', commandParams, libParams)
      .then(function(resp) {
        // sp = resp.sp || null;
        return resp;
      });
    },
    tableUniqueColToID: function (commandParams, libParams) {
      commandParams.table_name = commandParams.table_name || queryParams['table_name'] || this.s['table_name'];
      commandParams = populateCommonCommandVariables( commandParams );

      return TB.GLOBAL_API.send('jsonform_crud_unique_col_to_id', commandParams, libParams)
        .then(function(resp) {
          return resp;
        });
    },
    tableCrudEditSubmit: function (commandParams, files, libParams) {
      var timeout = 0;
      var realFiles = files.fileRequest;

      var requestType;
      if (files && Object.keys(realFiles).length > 0) {
        requestType = 'formdata';
      }

      commandParams = populateCommonCommandVariables( commandParams );

      commandParams.form_title = commandParams.form_title || queryParams['form_title'] || this.s['form_title'];
      commandParams.table_name = commandParams.table_name || queryParams['table_name'] || this.s['table_name'];
      commandParams.col_name = commandParams.col_name || queryParams['col_name'] || this.s['col_name'];
      commandParams.form_name = commandParams.form_name || queryParams['form_name'] || this.s['form_name'] || queryParams['form'];
      commandParams.record_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];
      commandParams.row_id = commandParams.record_id || queryParams['record_id'] || this.s['record_id'] || queryParams['row_id'] || this.s['row_id'];

      libParams = _.merge({
        requestSettings: {
          requestFiles: files,
          timeout: timeout,
          requestType: requestType,
          processData: requestType === undefined,
        }
      }, libParams);

      return TB.GLOBAL_API.send('jsonform_crud_edit_submit', commandParams, libParams)
        .then(function(resp) {
          sp = resp.sp || null;
          return resp;
        });
    },
    searchForeignKey: function (commandParams, libParams) {
      commandParams = populateCommonCommandVariables( commandParams );
      return TB.GLOBAL_API.send('jsonform_fkey_search', commandParams.data, libParams);
    },
    addForeignEntry: function(commandParams, libParams) {
      commandParams = populateCommonCommandVariables( commandParams );
      return TB.GLOBAL_API.send('jsonform_foreign_entry_add', commandParams.data, libParams);
    },
    formSubmitForeign: function(commandParams, libParams) {
      commandParams = populateCommonCommandVariables( commandParams );
      return TB.GLOBAL_API.send('create_record', commandParams, libParams);
    },
    getSessionToken: function(commandParams, libParams) {
      commandParams = populateCommonCommandVariables( commandParams );
      return TB.GLOBAL_API.send('get_session', commandParams, libParams)
        .then(function(resp) {
          session = resp.session_token;

          return resp;
        });
    },
  };
  
  TRACE('For 7e1df', 'api-wrapper', 'return', tbJfApiWrapper);

  return tbJfApiWrapper;
});
