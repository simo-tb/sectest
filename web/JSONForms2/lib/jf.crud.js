(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('jquery'), require('tb.xerrors'), require('jf.api-wrapper'), require('jf.utils'), require('jf.ui'), require('tbjson.ajv2tb'), require('selectize'));
  } else if (typeof define === 'function' && define.amd) {
    define(['jquery', 'tb.xerrors', 'jf.api-wrapper', 'jf.utils', 'jf.ui', 'tbjson.ajv2tb', 'selectize'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    factory(global.jQuery, global.TB, global.TB.test.api_wrapper, global.TB.jf.utils, global.TB.jf.ui, global.TB.tbjson.ajv2tb, undefined);
  }
})(this, function ($, TB, JfApi, jfUtils, jfUI, tbjsonAjv2Tb, selectize) {
  // is selectize needed, or does it always export? questions questions...

  TRACE("BEGIN_JF_CRUD: TIME_TAKEN: ", Date.now() - window.ACTUAL_BEGIN_TIME);
  var crudCustomizationInProgress = false;
  var loadedPreference;
  var currentPreference;

  var CAN_EDIT_PREFERENCE = true;
  var CAN_EDIT_GLOBAL;
  var API_RESPONSE;
  var LOADED_USER_PREFERENCE;
  var LOADED_GLOBAL_PREFERENCE;

  var changedPreferencePaths = {};

  var autosaveKey;

  // Needed for back button, so it will re-render the JS state
  $(window).on("popstate", function (e) {
    location.reload();
  });



  // jfcrud should support url params and bookmarkings/stuff like that!
  var jfCrudEnabled = false;
  TB.isModalShown = false;
  var ALREADY_APPROVED_CODE = 'U/TBJF1200';
  var WRONG_CODE_CODE = 'U/TBJF1100';

  var $modalApprovalSubmit = $(`
    <div id = "tb-jf-prefix-' + 500 + '" style="display: none;" class="modal fade bd-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Submit Approval Request</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p>Submit To: </p>
            <p><select id="tb-jfp-pending-submit-to"></select></p>
            <input type="hidden" id="record_id" />
            <input type="hidden" id="table_name" />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" id="tb-jfp-pending-submit">Submit For Approval</button>
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div<
    </div>
  `);
  $( 'body' ).append( $modalApprovalSubmit );

  var $modalWithPendingDifferenceData = $(`
    <div id = "tb-jf-prefix-' + 500 + '" style="display: none;" class=" modal fade bd-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Approval Request</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p>Date Submitted: <span id="tb-jfp-pending-date"></span></p>
            <p>Submitted By: <span id="tb-jfp-pending-user"></span></p>
            <p>Code Sent To: <span id="tb-jfp-pending-code-received"></span></p>
            <p style="display: none;">Code: <span id="tb-jfp-pending-code"></span></p>
            <div id="tb-jfp-pending-diff" class="word-break-break-all"></div>
          </div>
          <div class="modal-footer">
            <p class="" id="tb-jfp-pending-error" style="display: none; text-align: left; color: #d94558;" >Error: </p>
            <input class="" style="width: 200px; padding: 5px 4px;" type="number" placeholder = "Please write the code here ..." id="tb-jfp-pending-data-code-submit" />
            <button type="button" class="btn btn-primary" id="tb-jfp-pending-data-submit">Approve & Delete</button>
            <button type="button" class="btn btn-primary" id="tb-jfp-pending-data-send-code">Send Code</button>
            <button type="button" class="btn btn-danger" id="tb-jfp-pending-data-reject">Reject</button>
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div<
    </div>
  `);
  $( 'body' ).append( $modalWithPendingDifferenceData );

  let compactFilterRowTmpl = `
    <tr class="tb-jf2-crud-compact-filters-row" data-jf-crud-filter-container>
      <td style="vertical-align: middle">
        <div data-id="tb-jf2-crud-compact-filters-label" class="tb-jf2-crud-compact-filters-label"></div>
      </td>


      <td style="vertical-align: top">
        <div class="tb-jf2-crud-compact-filters-operation"></div>
      </td>

      <td style="vertical-align: top" tb-jf2-crud-compact-filters-value-input-container>
      </td>
      <td style="vertical-align: top; display: none;">
        <button class="tb-jf2-crud-compact-filters-remove-condition btn btn-sm btn-danger fa fa-times"> </button>
      </td>
    </tr>
  `;
  let compactAddButtonTmpl = `
    <tr style="display: none;">
      <td "colspan"="4">
        <button class="tb-jf2-crud-compact-filters-add-condition">Add condition</button>
      </td>
    </tr>

  `;

  var $compactFilter = $(`
    <div class="tb-jf2-crud-fast-search" style="padding: 5px; border:1px solid #ddd">
      <table style="width: 100%; max-width: 600px; margin-bottom: 6px" data-id="compact-filters-table">
      </table>

      <a style="width: 100%; max-width: 600px; margin-bottom: 6px;text-align:center;display: inline-block" href="#" id="tb-jf-crud-compact-filters-show-more-button"> ▾ Show more ▾ </a>
      <br>

      <label style="display: none;"><input type="checkbox" id="tb-jf2-crud-compact-filters-checkbox-auto-open"/> auto open </label>
      <label style="display: none;"><input type="checkbox" id="tb-jf2-crud-compact-filters-checkbox-preserve-filters"/> preserve filters </label>


      <div style="width: 100%; max-width: 600px; height: 34px">
        <a class="btn btn-sm btn-success fa fa-plus tb-jf2-crud-insert-button" style="float: left; display: none; line-height: 18px;" data-id="insert-fast-search"></a> 


        <button class="btn btn-primary tb-jf-crud-compact-filters-filter-button" style="line-height: 18px; float: right"><i class="fa fa-filter"></i> Filter</button>
        <button class="btn btn-success tb-jf-crud-show-first-ten-rows" style="line-height: 18px; float: right">Show rows</button>
      </div>

      <div style="display: none;">
        <select id="tb-jf-crud-compact-filters-select-record"></select>
        <div style="white-space:nowrap;display:inline-block;" class="jf-crud-btn-group">
          <a title="Edit" id="tb-jf-crud-edit-button" class="btn btn-sm btn-default fa fa-pencil" disabled></a>
          <a title="Show" id="tb-jf-crud-show-button" class="btn btn-sm btn-default fa fa-eye" disabled></a>
          <a title="Clone" id="tb-jf-crud-clone-button"class="btn btn-sm btn-default fa fa-clone" disabled></a>
        </div>
      </div>
    </div>
  `);



  var $approvers = $('#tb-jfp-pending-submit-to');

  let APIResultGlobal;
  $(document).on('click', '[data-id="tb-jfp-btn-pending-diff"]', function(e) {
    e.preventDefault();

    var $pendingDiffCode = $('#tb-jfp-pending-diff');
    var $pendingDate = $('#tb-jfp-pending-date');
    var $pendingUser = $('#tb-jfp-pending-user');
    var $pendingCodeReceivedBy = $('#tb-jfp-pending-code-received');

    let $this = $(this);
    var url = $this.attr('href');
    var dataHash = TB.parseQueryParams(url);

    var tableName = dataHash.table_name;
    var recordId = dataHash.record_id;

    let approvalData = APIResultGlobal.approval_information.DELETE[ recordId ];

    $modalApprovalSubmit.find('#record_id').val(recordId);
    $modalApprovalSubmit.find('#table_name').val(tableName);

    $pendingDiffCode.html('N/A');
    $pendingDate.text(approvalData.jf_approval_timestamp);
    $pendingUser.text(approvalData.jf_approval_user);
    $pendingCodeReceivedBy.text(approvalData.jf_approval_pending_data.sent_to_mails);

    if (approvalData.has_code) {
      $('#tb-jfp-pending-code').parent().show();
      $('#tb-jfp-pending-code').text(approvalData.has_code);
    }

    $('#tb-jfp-pending-data-submit').click({
      approval: true,
      approvalDelete: true,
    }, approvalClick);

    $('#tb-jfp-pending-data-reject').click({
      approval: false,
      approvalDelete: true,
    }, approvalClick);

    $modalWithPendingDifferenceData.modal('show');
    $modalWithPendingDifferenceData.show();
  });

  $(document).on('click', '[data-jf2-crud-compact-filters-shower-button]', function() {
    $('[data-jf2-crud-compact-filters]').show();
    $('[data-jf2-crud-compact-filters-shower]').hide();

    if ($('.tb-jf2-crud-insert-button:visible').length == 2) {
      $('[data-id="insert-fast-search"]').hide();
    }
  });
    

  function approvalClick( e ) {
    var code = $('#tb-jfp-pending-data-code-submit').val();
    var recordId = $('#record_id').val();
    var tableName = $('#table_name').val();
    var data = e.data;

    showLoading();

    // jsonforms_crud_approval_delete_approve
    api.formCrudApprovalDeleteApproveReject({ approval_code: code, approval: data.approval, approvalDelete: data.approvalDelete, record_id: recordId, table_name: tableName, approval_checksum: "", approval_delete: true, })
    .then(
      function (resp) {
        $('#tb-jfp-pending-error').text('');
        $('#tb-jfp-pending-error').hide();

        $modalWithPendingDifferenceData.modal('hide');
        $modalWithPendingDifferenceData.hide();

        hideLoading();
        if (data.approval) {
          location.reload();
        } else {
          TB.createNotification('Pending Request Rejected!', 'Pending Request Rejected!', 'warning');
          $(`[data-record-id="${recordId}"][data-id="tb-jfp-btn-pending-diff"]`).hide();
        }

        autosaveKey = resp['login'];

        /*
        $form[0].dispatchEvent(new Event('tb_jfp_saving_finish', { bubbles: true }));
        if ( data.approval ) {
          $form[0].dispatchEvent(new Event('tb_jfp_approval_submitted', { bubbles: true }));
        } else {
          $form[0].dispatchEvent(new Event('tb_jfp_rejected', { bubbles: true }));
        }
        */
      },
      function (err) {
        hideLoading();

        if ( err.code === WRONG_CODE_CODE ) {
          $('#tb-jfp-pending-error').text( err.msg );
          $('#tb-jfp-pending-error').show();
        } else if ( err.code === ALREADY_APPROVED_CODE ) {
          $modalWithPendingDifferenceData.modal('hide');
          $modalWithPendingDifferenceData.hide();
          hidePendingInformation();
          $('#tb-jfp-pending-error').text( err.msg );
          $('#tb-jfp-pending-error').show();
        } else {
          approveError = true;

          $('#tb-jfp-pending-error').text(err.msg);
          $('#tb-jfp-pending-error').hide();
        }
      }
    );
  }

  function populateCanApprove(approvers) {
    $approvers.html('');

    $approvers.append($('<option value="">All</option>'));

    for (var i = 0; i < approvers.length; i++) {
      $approvers.append($(`<option value="${approvers[i].id}">${approvers[i].title}</option>`));
    }
  }

  let showLoadingSetTimeout;
  let slowRequestms = 300;

  var showLoading = function showLoading() {
    showLoadingSetTimeout = setTimeout(() => {
        if ($('#load-modal').length > 0) {
          // TinyApp modal
          $('#load-modal').modal('show');
        } else if ($('#load-modal-jf').length > 0) {
          // JF2 modal (copy of TinyApp)
          $('#load-modal-jf').modal('show');
        } else {
          ASSERT(0, "No loading modal found, please debug!");
        }
   
    }, slowRequestms);
  }

  var hideLoading = function hideLoading() {
    clearTimeout(showLoadingSetTimeout);
    if ($('#load-modal').length > 0) {
      $('#load-modal').modal('hide');
    } else if ($('#load-modal-jf').length > 0) {
      // JF2 modal (copy of TinyApp)
      $('#load-modal-jf').modal('hide');
    } else {
      ASSERT(0, "No loading modal found, please debug!");
    }
  }

  var crudState = {
    is_searching: false,
    is_page_changed: false,
    is_first_search: true,
    is_deleting: {},
    IsHandleFilterColChangeCalled: false,
  };

  var notifySettings = {
    addclass: 'translucent',
    icon: 'fa fa-exclamation-triangle',
    buttons: { sticker: false, },
    hide: false,
    styling: 'bootstrap3'
  };
  var FA_CLASS_DEFAULT_SORT = ' fa ';
  var FA_CLASS_UP_SORT = ' fa fa-sort-up ';
  var FA_CLASS_DOWN_SORT = ' fa fa-sort-down ';
  var ORDER_VALUE_TO_CLASS = {
    0: FA_CLASS_UP_SORT,
    1: FA_CLASS_DOWN_SORT,
    2: FA_CLASS_DEFAULT_SORT,
  };
  var REMOVE_VALUE_FROM_CLASS = {
    0: FA_CLASS_DEFAULT_SORT,
    1: FA_CLASS_UP_SORT,
    2: FA_CLASS_DOWN_SORT,
  };

  var queryParams = TB.parseQueryParams();
  if (_.isArray(queryParams['p0'])) {
    queryParams['p0'] = queryParams['p0'][0];
  }

  var tableName = queryParams.table_name;
  var currentFiltersOrder = [];

  function GetFastSearchValue(form) {
    if (crudState.isFastSearch != null) {
      return crudState.isFastSearch;
    }

    if (queryParams && queryParams['p0'] && queryParams['p0'] == "accounts_dbforms_list_accounts") {
      crudState.isFastSearch = false;
      return crudState.isFastSearch;
    }

    if (queryParams && queryParams['isFastSearch']) {
      crudState.isFastSearch = true;
      return crudState.isFastSearch;
    }

    if (form != null &&
      (form.contains_contact_data || form.contains_personal_data)
    ) {
      crudState.isFastSearch = true;
      return crudState.isFastSearch;
    }

    crudState.isFastSearch = false;
    return crudState.isFastSearch;
  }

  function parseFLInitParams (queryParams) {
    var retObj = undefined;

    var FLregex = new RegExp('^fl_filt_' + queryParams.table_name + '_(.*?)(__op)?$');

    for (var [key, value] of Object.entries(queryParams)) {
      var match = key.match(FLregex);
      if (match) {
        retObj = retObj || {
          filter_data: {
            filters: {},
            page_number: 1,
            orders: {},
          },
        };

        var columnName = match[1];
        retObj.filter_data.filters[columnName] = retObj.filter_data.filters[columnName] || {};

        var isOperator = (match[2] !== undefined);
        if (isOperator) {
          retObj.filter_data.filters[columnName].op = value;
        } else {
          retObj.filter_data.filters[columnName].val = value;
        }

      }
    }

    return retObj;
  }

  function PermissionToUI(APIResult) {
    APIResultGlobal = APIResult;

    if (APIResult.permissions.insert) {
      $('#tb-jf-mie-import-multiple-button').show();
    }

    if (APIResult.permissions.update) {
      $('#tb-jf-mie-update-multiple-button').show();
    } 

    if (false
      || APIResult.permissions.update
      || (APIResult.permissions.has_approval_enabled && APIResult.permissions.approval_update)
    ) {
      $('.btn.tb-jf-crud-compact-filters-auto-open-button').show();
    }

    if (APIResult.permissions.insert) {
      $('.tb-jf2-crud-insert-button').show();
    }

    if (APIResult.permissions.read) {
      $('.tb-jf2-crud-show-button').show();
    }

    if (APIResult.permissions.read && APIResult.permissions.insert) {
      $('.tb-jf2-crud-clone-button').show();
    }

    if (false
      || APIResult.permissions.update
      || (APIResult.permissions.has_approval_enabled && APIResult.permissions.approval_update)
    ) { 
      $('.tb-jf2-crud-update-button').show();
    }

    if (APIResult.permissions.delete) {
      if (APIResult.permissions.has_approval_enabled && APIResult.permissions.approval_update) {
        $('.tb-jf2-crud-approval-delete-button-init').show();
      } else {
        $('.tb-jf2-crud-delete-button').show();
      }
    }

    if (APIResult.approval_information && APIResult.approval_information.CREATE && Object.keys(APIResult.approval_information.CREATE).length > 0) {
      $('.tb-jf2-crud-insert-approval-button').show();
    }

    if (APIResult.pending && APIResult.pending.meta && APIResult.pending.meta.can_approve) {
      populateCanApprove(APIResult.pending.meta.can_approve);
    }

    if (true) {
      $('.tb-jf2-crud-report-button').show();
    }

    if (APIResult.approval_information && APIResult.approval_information.DELETE) {
      for (const [recordId, row] of Object.entries(APIResult.approval_information.DELETE)) {
        $(`[data-id="tb-jfp-btn-pending-diff"][data-record-id="${recordId}"]`).show();
      }
    }

    if (true
      && APIResult.permissions.has_approval_enabled
      && ! APIResult.permissions.approval_update
      && APIResult.permissions.delete
    ) {
      $('#tb-jfp-pending-data-send-code').show();
      $('#tb-jfp-pending-data-code-submit').hide();
    } else {
      $('#tb-jfp-pending-data-send-code').hide();
    }
  }

  var orderedKeys = [];
  var keysMeta = {};
  var currentPageNumber = 1;
  var isFilterDynamic = false;

  var api;
  var $table;
  var $tableHead;
  var $tableBody;
  var $compactFilters;

  let compactFitlerColGroup = `<colgroup></colgroup>`;
  var dataSelectBox = {
    bool: [
      { value: '', title: '' },
      { value: '1', title: 'yes' },
      { value: '0', title: 'no' },
    ],
    numeric: [
      { value: '==', title: '=' },
      { value: '<=', title: 'Less than' },
      { value: '>=', title: 'Greater than' },
      { value: 'between', title: 'Start//End' },
    ],
    string: [
      { value: '~', title: 'Search' },
      { value: '=', title: '=' },
      { value: 'beg', title: 'Starts' },
      { value: 'end', title: 'Ends' },
    ],
  };

  let fromProcessing = false;
  function approvalSendCode(e) {
    let $this = $(this);

    var recordId = $('#record_id').val();
    var tableName = $('#table_name').val();

    let approvalPromise = api.formApproveSendCode({
      record_id: recordId,
      approval_delete: true,
    });

    approvalPromise.then(
      function (resp) {
        fromProcessing = true;

        $('#tb-jfp-pending-error').text('');
        $('#tb-jfp-pending-error').hide();

        $modalWithPendingDifferenceData.modal('hide');
        $modalWithPendingDifferenceData.hide();

        TB.createNotification('Operation Successful', 'Code Successfully Sent', 'success');
      },
    )
      .catch(function (err) {
        if (fromProcessing) {
          ASSERT(0, err);
        }
      });
  }


  $('#tb-jfp-pending-data-send-code').click(approvalSendCode);

  function populateTableBody(content, meta, { openFirstRow, populateSelect  } = {}) {
    $('.tb-jf-crud-show-first-ten-rows').remove();

    if (openFirstRow) {
      var tinyAppParams = 'view=' + queryParams['p0'] + ';';
      var url = 'app?record_id=' + content[0][meta.primary_key_column] +
        ';form_title=' + encodeURIComponent(meta.table_name + ' > "' + content[0][ meta.ui_column ] + '"') + 
        ';table_name=' + tableName +
        ';ta_crud_jf2=1;ta_crud_edit=1' +
        (queryParams['submit_ui_action'] ? '&submit_ui_action=' + queryParams['submit_ui_action'] : '') +
        (queryParams['form_name'] ? ';form_name=' + queryParams['form_name'] : '') +
        ';' + tinyAppParams;

      window.location = url;
      return;
    }

    TB.ASSERT(meta.primary_key_column != undefined, "primary_key_column missing", "JFC/900", {
      meta_row: JSON.stringify(meta)
    });

    $tableBody.html('');

    content.forEach(function(row) {
      var $currentRow = $('<tr class="flshow-row-bgcol-1"></tr>');

      // the first col with the edit/show buttons
      var $firstMetaColumn = $('<div style="white-space:nowrap;" class="jf-crud-btn-group"></div>');

      var $firstMetaColumnEdit = $('<a title="Edit" class="btn btn-sm btn-default fa fa-pencil tb-jf2-crud-update-button" style="display: none; float: left;"></a>');
      $firstMetaColumnEdit.attr('data-jf-crud-row-id', row[meta.primary_key_column]);
      var tinyAppParams = 'view=' + queryParams['p0'] + ';';
      var url = 'app?record_id=' + row[meta.primary_key_column] +
        ';form_title=' + encodeURIComponent(meta.table_name + ' > "' + row[ meta.ui_column ] + '"') +
        ';table_name=' + tableName +
        (queryParams['submit_ui_action'] ? '&submit_ui_action=' + queryParams['submit_ui_action'] : '') +
        ';ta_crud_jf2=1;ta_crud_edit=1' +
        (queryParams['form_name'] ? ';form_name=' + queryParams['form_name'] : '') +
        ';' + tinyAppParams;

      if (openFirstRow) {
        window.location = url;
      }

      $firstMetaColumnEdit.attr('href', url);
      $firstMetaColumnEdit.appendTo($firstMetaColumn);

      var $firstMetaColumnShow = $('<a title="Show" class="btn btn-sm btn-default fa fa-eye tb-jf2-crud-show-button" style="display: none; float: left;"></a>');
      $firstMetaColumnShow.attr('data-jf-crud-row-id', row[meta.primary_key_column]);
      url = 'app?record_id=' + row[meta.primary_key_column] +
        ';form_title=' + encodeURIComponent(meta.table_name + ' > "' + row[ meta.ui_column ] + '"') +
        ';table_name=' + tableName +
        ';ta_crud_jf2=1;ta_crud_show=1' +
        (queryParams['submit_ui_action'] ? '&submit_ui_action=' + queryParams['submit_ui_action'] : '') +
        // ';ta_crud_jf2=1;ta_crud_edit=1;form_mode=preview' +
        (queryParams['form_name'] ? ';form_name=' + queryParams['form_name'] : '') +
        ';' + tinyAppParams;

      $firstMetaColumnShow.attr('href', url);
      $firstMetaColumnShow.appendTo($firstMetaColumn);

      var $firstMetaColumnClone = $('<a title="Clone" class="btn btn-sm btn-default fa fa-clone tb-jf2-crud-clone-button" style="display: none; float: left;"></a>');
      $firstMetaColumnClone.attr('data-jf-crud-row-id', row[meta.primary_key_column]);
      var tinyAppParams = 'view=' + queryParams['p0'] + ';';
      var url = 'app?clone_id=' + row[meta.primary_key_column] +
        ';form_title=' + encodeURIComponent(meta.table_name + ' > Copy of "' + row[ meta.ui_column ] + '"') +
        ';table_name=' + tableName +
        ';ta_crud_jf2=1;ta_crud_create=1;' +
        (queryParams['submit_ui_action'] ? '&submit_ui_action=' + queryParams['submit_ui_action'] : '') +
        (queryParams['form_name'] ? ';form_name=' + queryParams['form_name'] : '') +
        ';' + tinyAppParams;

      $firstMetaColumnClone.attr('href', url);
      $firstMetaColumnClone.appendTo($firstMetaColumn);

      var $td = $('<td class="text-center minwidth nowrap"></td>');
      $firstMetaColumn.appendTo($td);
      $td.appendTo($currentRow);

      orderedKeys.forEach(function(column) {
        var currentDatum = row[column];
        var columnMeta = keysMeta[ column ];
        if (_.get(meta, ['hidden_columns', column])) {
          return;
        }


        var $currentDatumEl = $('<td class="word-break-break-all"></td>');
        // TODO default based on type
        columnMeta.align = columnMeta.align || 'left';
        if (columnMeta.align === 'left') {
          $currentDatumEl.addClass('text-left vertical-align-top');
        } else if (columnMeta.align === 'right') {
          $currentDatumEl.addClass('text-right');
        } else {
          ASSERT(0, {msg: "Unknown Option For align property...", code: "JFC/100"});
        }

        if (columnMeta.whitespace) {
          if (columnMeta.whitespace === 'pre-wrap') {
            $currentDatumEl.css('white-space', 'pre-wrap');
          } else {
            ASSERT_USER(0, "Invalid params");
          }
        }

        if (currentDatum == null) {
          $currentDatumEl.text('');
        } else {
          if (columnMeta.schemaType == 'boolean') {
            $currentDatumEl.text(currentDatum ? 'YES' : 'NO');
          } else if (columnMeta.type === 'imagepreview') {
            var $imgEl = $('<img class="tb-jf2-crud-datum-image"/>');
            $imgEl.css('max-width', columnMeta.crudListImageMaxWidth);
            $imgEl.css('max-height', columnMeta.crudListImageMaxHeight);
            $imgEl.attr('src', (columnMeta.schemaElement.imageBasePath || '') + currentDatum);
            $currentDatumEl.append($imgEl);
          } else {
            $currentDatumEl.text(currentDatum);
          }
        }

        $currentDatumEl.appendTo($currentRow);
      });

      // now append the buttons, krappa
      if (meta.buttons) {
        // addButtons();
        console.log("There are buttons to be made");
        meta.buttons.forEach(function(button) {
          var $currentDatumEl = $('<td></td>');
          var $currentButton = $('<button></button>');

          var replacedButtonValue = button.value;

          var re = /\$(.*?)\$/g;
          var currMatch;
          while( currMatch = re.exec(button.value) ) {
            var columnName = currMatch[1];

            replacedButtonValue = replacedButtonValue.replace(new RegExp('\\$' + columnName + '\\$'), row[columnName] );
          }
          $currentButton.text(replacedButtonValue);

          // reuse, but set the global flag to 0
          re = /\$(.*?)\$/g;
          currMatch = '';
          var replacedAction = button.action;
          while( currMatch = re.exec(button.action) ) {
            var columnName = currMatch[1];

            replacedAction = replacedAction.replace(new RegExp('\\$' + columnName + '\\$'), row[columnName] );
          }
          $currentButton.attr('onclick', replacedAction);

          $currentDatumEl.append($currentButton);

          $currentRow.append($currentDatumEl);
        });
      }

      var $deleteButton = $('<td class="tb-jf-crud-right-controls jf-crud-btn-group" style="width: 0px;"></td>');
      $deleteButton.append('<a data-record-id="' + row[meta.primary_key_column] + '" href="table_name=' + tableName + '&record_id=' + row[meta.primary_key_column] + '" style="width: 35px; margin-right: 0px;display: none;" class="btn btn-sm btn-danger fa fa-trash-o tb-jf2-crud-delete-button"></a>');
      $deleteButton.append('<a data-record-id="' + row[meta.primary_key_column] + '" href="table_name=' + tableName + '&record_id=' + row[meta.primary_key_column] + '" style="width: 35px; margin-right: 0px;display: none;" class="btn btn-sm btn-danger fa fa-trash-o tb-jf2-crud-approval-delete-button-init"></a>');
      $deleteButton.append(`
        <a data-id="tb-jfp-btn-pending-diff" data-record-id=${row[meta.primary_key_column]} href="table_name=${tableName}&record_id=${row[meta.primary_key_column]}" class="btn btn-info btn-sm fa fa-eye" style="display: none; margin-right: 0px;" type="button"></a>`);

      $deleteButton.appendTo($currentRow);

      $currentRow.appendTo($tableBody);
    });

    currentPageNumber = meta.current_page;

    if ( meta.has_more_pages || meta.current_page > 1) {
      var tableNumberOfColumns = 1 + orderedKeys.length + 1;
      var $footerRow = $('<tr></tr>');
      var $footerMeta = $('<td colspan="' + tableNumberOfColumns + '"></td>');
      var $footerMetaList = $('<ul class="pager" style="width: 150px;"></ul>');

      var $footerMetaListItemPrev = $('<li class="previous" data-jf-crud-prev="true" style="width: 33%; display: inline-block; vertical-align: top;"></li>');
      if (meta.current_page > 1 && meta.has_page_nagivation) {
        $footerMetaListItemPrev.append('<a style="cursor: pointer;" ><</a>');
      }
      $footerMetaList.append($footerMetaListItemPrev);


      var $footerMetaListItemPageNumber = $('<li style="cursor: pointer; width: 33%; display: inline-block; vertical-align: top;"><a>' + meta.current_page + '</a></li>');
      $footerMetaList.append($footerMetaListItemPageNumber);

      var $footerMetaListItemNext = $('<li class="next" data-jf-crud-next="true" style="width: 33%; display: inline-block; vertical-align: top;"></li>');
      if (meta.has_more_pages && meta.has_page_nagivation) {
        $footerMetaListItemNext.append('<a style="cursor: pointer;">></a>');
      }
      $footerMetaList.append($footerMetaListItemNext);

      $footerMeta.append($footerMetaList);
      $footerRow.append($footerMeta);

      $tableBody.append($footerRow);
    }

    $('.tb-jf2-crud-compact-filters-column-select').change();

    $('.tb-jf2-crud-compact-filters-row td:nth-child(1)').each((_, el) => {
      $(el).find('.selectize-control').hide();
      if ($(el).find('.tb-jf2-crud-compact-filters-label').length == 0) {
        $(el).append($(`<div class="tb-jf2-crud-compact-filters-label">${$(el).find('option').text()}</div>`));
      }
    });

    PermissionToUI(meta);
    if ($('.tb-jf2-crud-insert-button:visible').length == 2) {
      $('[data-id="insert-fast-search"]').hide();
    }


    $(".table-responsive").floatingScroll("update");
  }

  function createCompactFilterRow(columnMeta, filterData) {

    let searchBox = createSearchBox(columnMeta, filterData);
    let inputBox = createInputFieldForFilter(columnMeta, filterData);

    let filterRow = $(compactFilterRowTmpl);
    filterRow.find('.selectize-control').remove();
    filterRow.find('[data-id="tb-jf2-crud-compact-filters-label"]').text( columnMeta.title );
    filterRow.find('[data-id="tb-jf2-crud-compact-filters-label"]').attr('data-col-id', columnMeta.key);

    filterRow.find('[tb-jf2-crud-compact-filters-value-input-container]').html( inputBox );
    filterRow.find('.tb-jf2-crud-compact-filters-operation').append( searchBox );

    return filterRow;
  }

  function createSearchBox(columnMeta, filterData) {
    let defaultSelectedValue = columnMeta.defaultOperator;
    let isBool = columnMeta.schemaType == 'boolean';

    let $selectBox = $(`<select data-jf-crud-filter-operator-select data-column="${ columnMeta.key }" data-jf-crud-filter-bool="${ isBool }" class="form-control input-sm" style="display: inline"></select>`);
    if (columnMeta.schemaType == 'boolean') {
      dataSelectBox.bool.forEach(function(el) {
        $selectBox.append('<option value="' + el.value + '"' + (el.value === defaultSelectedValue ? 'selected="selected"' : '') + '">'+ el.title +'</option>');
      });
      if (filterData.filters && filterData.filters[ columnMeta.key ]) {
        $selectBox.val( filterData.filters[ columnMeta.key ].op );
      }
    } else {
      if (
        columnMeta.schemaType == 'number' || columnMeta.schemaType == 'integer'
        || columnMeta.type == 'datepicker' || columnMeta.type == 'datetimepicker' || columnMeta.type == 'timepicker'
        || columnMeta.format == 'iso8601date' || columnMeta.format == 'iso8601datetime' || columnMeta.format == 'iso8601time'
      ) {
        dataSelectBox.numeric.forEach(function(el) {
          $selectBox.append('<option value="' + el.value + '"' + (el.value === defaultSelectedValue ? 'selected="selected"' : '') + '">'+ el.title +'</option>');
        });

      } else {
        dataSelectBox.string.forEach(function(el) {
          $selectBox.append('<option value="' + el.value + '"' + (el.value === defaultSelectedValue ? 'selected="selected"' : '') + '">'+ el.title + (columnMeta.is_lc_format && el.value === '='  ? " *" : "") + '</option>');
        });
      }

      $selectBox.attr('data-jf-crud-customize-col-name', columnMeta.key);
      $selectBox.addClass('crud-customizable');

      let loadedFilter = _.get(loadedPreference, ['filterOperators', columnMeta.key, 'operator']);
      let currentFilter = _.get(currentPreference, ['filterOperators', columnMeta.key, 'operator']);

      if (crudCustomizationInProgress && loadedFilter !== currentFilter) {
        $selectBox.addClass('col-customized');
      } else if (crudCustomizationInProgress && loadedFilter === currentFilter) {
        $selectBox.addClass('col-non-customized');
      }
    }

    return $selectBox;
  }

  function createInputFieldForFilter(columnMeta, filterData) {
    let $inputBox = $('<i />');
    if (columnMeta.schemaType == 'boolean') {
    } else {
      $inputBox = $('<input type="text" size="10" class="form-control input-sm autowidth" tb-jf2-crud-compact-filters-value-input style="margin: auto;" />');

	  if (filterData.filters && filterData.filters[ columnMeta.key ]) {
        $inputBox.val( filterData.filters[ columnMeta.key ].val );
      }
    }

    return $inputBox;
  }

  function populateTableHead(meta, content) {
    $tableHead.html('');
    let timeBegin = Date.now();
    ASSERT.isArray(orderedKeys);

    var nShownFilters = 5;
    var restFiltersSelector = `.tb-jf2-crud-compact-filters-row:nth-child(n+${nShownFilters+1})`;

    var areHidden = true;
    var moreButton = $compactFilter.find('#tb-jf-crud-compact-filters-show-more-button');
    moreButton.on('click', (e) => {
      e.preventDefault();
      if (areHidden = !areHidden) {
        $(restFiltersSelector).hide();
        moreButton.text('▾ Show more ▾');
      } else {
        moreButton.text('▴ Hide more ▴');
        $(restFiltersSelector).show();
      }
    });
    if (orderedKeys.length <= 5){
      moreButton.hide();
    }

    function handleFilterColChange(ev) {
      if (crudState.IsHandleFilterColChangeCalled) {
        return;
      }
      crudState.IsHandleFilterColChangeCalled = true;

      if (ev) {
        var value = $(ev.target).closest('tr').find('.tb-jf2-crud-compact-filters-column-select')[0].selectize.getValue();
        if (value == '') {
          return;
        }
      }
      $compactFilter.find('.tb-jf2-crud-compact-filters-op').hide();

      $('tr.tb-jf2-crud-compact-filters-row').each((i, e) => {
        var $tr = $(e);

        let column = orderedKeys[i];

        var $select = $tr.find('.tb-jf2-crud-compact-filters-operation').find(`select[data-column=${column}]`);
        $select.show();

        var isBool = $select.attr('data-jf-crud-filter-bool') == 'true';
        $tr.find('[tb-jf2-crud-compact-filters-value-input]').toggle(!isBool);
      });
    }

    let $headMeta = $('<tr data-jf-crud-column-title-table-row></tr>');

    if ( GetFastSearchValue(meta.form) && meta.has_more_pages ) {
      if (queryParams.filter_data || ! crudState.is_first_search) {
        $headMeta.show();
      } else {
        $headMeta.hide();
      }
    }

    var $headCustomize = $('<tr style="display: none;" data-jf-crud-column-customize-control-row class="crud-column-customize"></tr>');
    $headCustomize.append($('<th></th>'))

    var $headMetaSecond = $('<tr class="filter-row" data-jf-crud-filter-row-non-compact-container></tr>');

    var $headMetaPlus = $('<th class="text-left vertical-align-top"></th>');
    $headMeta.append($headMetaPlus);

    let $headMetaPlusDropdown = $(`
      <div id="tb-dbr-dropdown-export" class="btn-group jf-crud-btn-group">
        <a class="btn btn-sm btn-success fa fa-plus tb-jf2-crud-insert-button" style="display: none; margin-right: 8px;"></a> 
        <a class="btn btn-sm btn-success fa fa-gavel tb-jf2-crud-insert-approval-button" style="display: none; margin-right: 8px;"></a> 
        <a class="btn btn-sm btn-info fa fa-pencil-square-o" style="display: none; margin-right: 8px;" id="tb-jfc-open-autosave"></a>
        <a class="btn btn-sm btn-info fa fa-filter" style="display: none;" data-jf2-crud-compact-filters-shower data-jf2-crud-compact-filters-shower-button></a>
      </div>
    `);

    $headMetaPlus.append($headMetaPlusDropdown);

    var $additionalActions = $(`.additional-actions`);

    var $headMetaPlusButton = $additionalActions.find('#tb-jf-mie-import-multiple-button');
    $headMetaPlusButton.on('click', () => TB.multipleImportExport.createImportModal({isImport:true}));

    var $headMetaMultipleUpdate = $additionalActions.find('#tb-jf-mie-update-multiple-button');
    $headMetaMultipleUpdate.on('click', () => TB.multipleImportExport.createImportModal({isUpdate:true}));

    var $headMetaPlusButton = $headMetaPlusDropdown.find('.tb-jf2-crud-insert-button');
    var tinyAppParams = 'view=' + queryParams['p0'] + ';';
    var url = 'app?table_name=' + tableName +
      '&form_title=' + meta.table_name +
      '&ta_crud_jf2=1&ta_crud_create=1' +
      (queryParams['submit_ui_action'] ? '&submit_ui_action=' + queryParams['submit_ui_action'] : '') +
      (queryParams['form_name'] ? ';form_name=' + queryParams['form_name'] : '') +
      ';' + tinyAppParams;
    $headMetaPlusButton.attr('href', url);

    var $headMetaReportButton = $additionalActions.find('.tb-jf2-crud-report-button');
    tinyAppParams = 'view=' + queryParams['p0'] + ';';
    url = 'app?table_name=' + tableName +
      (queryParams['submit_ui_action'] ? '&submit_ui_action=' + queryParams['submit_ui_action'] : '') +
      (queryParams['form_name'] ? ';form_name=' + queryParams['form_name'] : '') +
      '&show_as_report=1' +
      ';' + tinyAppParams;
    $headMetaReportButton.attr('href', url);

    var $headMetaApprovePlusButton = $headMetaPlusDropdown.find('.tb-jf2-crud-insert-approval-button');
    tinyAppParams = 'view=' + queryParams['p0'] + ';';
    url = 'app?table_name=' + tableName +
      '&form_title=' + meta.table_name +
      '&ta_crud_jf2=1&ta_crud_approve_create=1' +
      (queryParams['submit_ui_action'] ? '&submit_ui_action=' + queryParams['submit_ui_action'] : '') +
      (queryParams['form_name'] ? ';form_name=' + queryParams['form_name'] : '') +
      ';' + tinyAppParams;
    $headMetaApprovePlusButton.attr('href', url);

    var $headMetaFilterButton = $('<a class="btn btn-sm btn-info fa fa-filter"></a>');
    $headMetaFilterButton.click(filterContent);
    if ( ! GetFastSearchValue(meta.form) ) {
      $headMetaPlusDropdown.append($headMetaFilterButton);
    } else {
      $headCustomize.find('[data-jf-crud-column-customize-control-row]').hide();
      $('[data-jf-crud-customize-columns]').hide();
    } 

    var $headMetaFirstDropdown = $('<div id="tb-crud-customize-btn-group" class="btn-group">');
    var $headMetaFirstCell = $('<th class="text-center"></th>');
    $headMetaFirstCell.append($headMetaFirstDropdown);
    $headMetaSecond.append($headMetaFirstCell);

    let hiddenColumnsFromPreferencesCount = _.filter(currentPreference.hiddenColumnKeys, 'isHidden').length;
    orderedKeys.forEach(function(key, idx) {
      var columnMeta = keysMeta[ key ];
      if (_.get(meta, ['hidden_columns', key])) {
        return;
      }

      var $currentColumnCustomize = $('<th class="text-center"></th>');

      // add to first row
      var $currentColumnFirst = $('<th class="text-left vertical-align-top"></th>');
      var isSortable = columnMeta.is_searchable !== false;

      var $customizeButtons = $('<div class="crud-column-customize" data-jf-crud-customize-col-name="' + key + '" style="display: none;"></div>');

      let loadedOrdering = _.get(loadedPreference, ['columnOrder', key, 'crudOrdering']);
      let currentOrdering = _.get(currentPreference, ['columnOrder', key, 'crudOrdering']);

      let loadedIsHidden = _.get(loadedPreference, ['hiddenColumnKeys', key, 'isHidden']) || false;
      let currentIsHidden = _.get(currentPreference, ['hiddenColumnKeys', key, 'isHidden']) || false;

      var $leftArrowBtn = $('<a data-jf-crud-shift-column data-jf-crud-left-shift-column style="font-size: 18px; margin: 0 2px;" class="fa fa-chevron-left crud-customizable"></a>');
      if (crudCustomizationInProgress && loadedOrdering !== currentOrdering) {
        $leftArrowBtn.addClass('col-customized');
      } else if(crudCustomizationInProgress && loadedOrdering === currentOrdering) {
        $leftArrowBtn.addClass('col-non-customized');
      }

      let isFirst = (idx === 0);
      if ( isFirst ) {
        $leftArrowBtn.hide();
      }

      if ( ! currentIsHidden ) {
        $customizeButtons.append($leftArrowBtn);
      }

      let $toggleVisibilityBtn = $('<a data-jf-crud-hide-column style="font-size: 18px; margin: 0 2px;" class="fa crud-customizable col-non-customized"></a>');
      if ( _.get(currentPreference, ['hiddenColumnKeys', key, 'isHidden']) ) {
        $toggleVisibilityBtn.addClass('fa-eye-slash');
      } else {
        $toggleVisibilityBtn.addClass('fa-eye');
      }

      if (crudCustomizationInProgress && loadedIsHidden !== currentIsHidden ) {
        $toggleVisibilityBtn.addClass('col-customized');
      } else if(crudCustomizationInProgress && loadedIsHidden !== currentIsHidden ) {
        $toggleVisibilityBtn.addClass('col-non-customized');
      }
      $customizeButtons.append($toggleVisibilityBtn);

      let $rightArrowBtn = $('<a data-jf-crud-shift-column data-jf-crud-right-shift-column style="font-size: 18px; margin: 0 2px" class="fa fa-chevron-right crud-customizable customization-active"></a>');
      if (crudCustomizationInProgress && loadedOrdering !== currentOrdering) {
        $rightArrowBtn.addClass('col-customized');
      } else if(crudCustomizationInProgress ) {
        $rightArrowBtn.addClass('col-non-customized');
      }

      let isLast = (idx === orderedKeys.length - 1 - hiddenColumnsFromPreferencesCount);
      if ( isLast ){
        $rightArrowBtn.hide();
      }

      if ( ! currentIsHidden ) {
        $customizeButtons.append($rightArrowBtn);
      }

      var $currentColumnFirstAnchorWrapper = $('<span style="cursor: pointer;"></span>');
      var $currentColumnFirstAnchor;
      if (isSortable) {
        $currentColumnFirstAnchorWrapper.attr('data-jf-crud-sort-container', '1');
        $currentColumnFirstAnchorWrapper.attr('data-jf-crud-column', key);
        $currentColumnFirstAnchorWrapper.attr('data-jf-crud-sort-value', '0');

        $currentColumnFirstAnchor = $('<a></a>');
      } else {
        $currentColumnFirstAnchor = $('<a data-jf-crud-column="' + key + '"></a>');
      }

      $currentColumnCustomize.append($customizeButtons);

      let titleWords = columnMeta.title.split(' ');
      let titleLastWord = titleWords[ titleWords.length - 1 ];
      let titleWithoutLastWord = titleWords.slice(0, -1).filter(e => e).join(' ');

      $currentColumnFirstAnchor.text( titleWithoutLastWord + ' ' );
      $currentColumnFirstAnchorWrapper.append( $currentColumnFirstAnchor );
      $currentColumnFirst.append( $currentColumnFirstAnchorWrapper );
      if (isSortable) {
        let $span = $(`<span class="text-nowrap">${titleLastWord} <i class="${FA_CLASS_DEFAULT_SORT}"></i></span>`)
        $currentColumnFirstAnchorWrapper.append( $span );
      } else {
        $currentColumnFirstAnchor.append(' ' + titleLastWord);
      }

      $headCustomize.append($currentColumnCustomize);

      $currentColumnFirst.append($currentColumnFirst);
      $headMeta.append($currentColumnFirst);

      // add to second row
      var $currentColumnSecond = $('<th class="text-center" data-jf-crud-filter-container=1 data-jf-crud-filter-bool=' + (columnMeta.schemaType == 'boolean') + ' data-jf-crud-filter-name="' + key + '" title="Filter"></th>');

      var filterData = parseFLInitParams(queryParams);
      if (filterData) {
        filterData = filterData.filter_data; 
      }

      if (queryParams.filter_data) {
        try {
          filterData = JSON.parse(queryParams.filter_data);
        } catch (e) {
        }
      }
      filterData = filterData || {};

      if (columnMeta.is_searchable !== false) {
        var $filterHead = $('<div style="display: flex;margin-bottom: 1px;"></div>');

        let $selectBox = createSearchBox( columnMeta, filterData );
		let $inputBox = createInputFieldForFilter( columnMeta, filterData );

		$inputBox.appendTo($currentColumnSecond);

        $selectBox.prependTo($filterHead);
        $filterHead.prependTo($currentColumnSecond);
      }

      $currentColumnSecond.appendTo($headMetaSecond);
    });

    if ( GetFastSearchValue(meta.form) ) {
      if (meta.has_more_pages || queryParams.filter_data || parseFLInitParams(queryParams)) {
        $compactFilters.append($compactFilter);

        let filterData = parseFLInitParams(queryParams);
        if (filterData) {
          filterData = filterData.filter_data; 
        }

        if (queryParams.filter_data) {
          filterData = JSON.parse(queryParams.filter_data);
        } 
        filterData = filterData || {};

        let $compactFiltersTable = $compactFilter.find('[data-id="compact-filters-table"]');
        orderedKeys.forEach(function(key, idx) {
          let columnMeta = keysMeta[ key ];
          if (_.get(meta, ['hidden_columns', key])) {
            return;
          }

          let compactFilterRow = createCompactFilterRow( columnMeta, filterData );
          $compactFiltersTable.append( compactFilterRow );
        });

        handleFilterColChange();
      }
    } else {
      if (meta.has_more_pages || queryParams.filter_data) {
        $tableHead.append($headMetaSecond);
      }
    }

    if ( crudCustomizationInProgress ) {
      $("[data-jf-crud-save-customization]").show();
    } else {
      $("[data-jf-crud-save-customization]").hide();
    }

    var $headMetaCrudReorderControls = $(`
    <div class="jf-crud-reorder-controls">
        <a class="fa fa-bookmark jf-crud-reorder-actions" data-jf-crud-save-customization data-jf-crud-save-customization-local title="Save Preference"></a>
     </div>
      `);

    if ( CAN_EDIT_GLOBAL )
    {
      $headMetaCrudReorderControls.append(`
        <a class="fa fa-bookmark-o jf-crud-reorder-actions" data-jf-crud-save-customization data-jf-crud-save-customization-global title="Save Preference (system wide)"></a>
      `);
    }

    $headMetaCrudReorderControls.append(`
        <a class="fa fa-close jf-crud-reorder-actions" data-jf-crud-customize-columns title="Cancel Preference Edit"></a>
    `);


    $headCustomize.append($('<th class="text-center"></th>').append($headMetaCrudReorderControls));

    $headMeta.append('<th></th>');

    $tableHead.append($headCustomize);
    $tableHead.append($headMeta);

    if ( GetFastSearchValue(meta.form) ) {
      $compactFilters.find('tr.tb-jf2-crud-compact-filters-row').first().find('[tb-jf2-crud-compact-filters-value-input]').focus();
    }

    if (areHidden) {
      $(restFiltersSelector).hide();
    }

    if (crudCustomizationInProgress) {
      $('.crud-column-customize').show();
    } else {
    }

    let timeEnd = Date.now();
    console.info("\tCrud: populateTableHead() called! Time taken: " + (timeEnd - timeBegin) + "ms");


    PermissionToUI(meta);
  }

  function filterContent(e, { autoOpen } = {}) {
    crudState.is_searching = true;


    // defaults
    var filterData = {
      filters: {},
      page_number: 1,
      orders: {},
      filters_order: currentFiltersOrder
    };

    if( GetFastSearchValue() ) {
      var filters = [];

      $compactFilters.find('[data-jf-crud-filter-container]').each((i, e) => {
        let $operatorSelect = $(e).find('[data-jf-crud-filter-operator-select]');
        let $valueInput = $(e).find('[tb-jf2-crud-compact-filters-value-input]');


        let column = $operatorSelect.attr('data-column');
        let op = $operatorSelect.val();
        let isBool = $operatorSelect.attr('data-jf-crud-filter-bool') === 'true';
        let value = $valueInput.val();

        if (value !== undefined) {
          value = value.trim();
        }

        if (value || (isBool && op !== '')) {
          filterData.filters[column] = {
            op,
            val: value
          };
        }
        filters.push({column, op, value});
      });

      if ($('#tb-jf2-crud-compact-filters-checkbox-preserve-filters').is(':checked')) {
        localStorage.setItem('tb-jf-crud-compact-filters', JSON.stringify({
          filters,
          // autoOpen
          autoOpen: $('#tb-jf2-crud-compact-filters-checkbox-auto-open').is(':checked')
        }));
      } else {
        localStorage.removeItem('tb-jf-crud-compact-filters');
      }

    } else {
      $('[data-jf-crud-filter-row-non-compact-container]').find('[data-jf-crud-filter-container]').each(function(idx, el) {
        var $el = $(el);

        var filterValue = $el.find('input').val();
        if ($el.find('input').length === 0 && $el.attr('data-jf-crud-filter-bool') === 'false') {
          return;
        }

        if (filterValue !== undefined) {
          filterValue = filterValue.trim();
        }
        var filterOperator = $el.find('select').val();
        var filterTitle = $el.find('select').find('option:selected').text();
        var filterName = $el.attr('data-jf-crud-filter-name');

        if (filterValue === '') {
          return;
        }
        if ( $el.attr('data-jf-crud-filter-bool') === 'true' && filterOperator === '' ) {
          return;
        }

        filterData.filters[filterName] = {
          op: filterOperator,
          val: filterValue,
          title: filterTitle,
        };
      });
    }

    $('[data-jf-crud-sort-container]').each(function(idx, el) {
      var sortColumn = $(this).attr('data-jf-crud-column');
      var sortValue = $(this).attr('data-jf-crud-sort-value');

      if (sortValue == 0) {
        return;
      }

      filterData.orders[sortColumn] = sortValue;
    });

    if (crudState.is_page_changed) {
      filterData.page_number = currentPageNumber;
    } else {
      currentPageNumber = 1;
    }

    console.log('marti1', filterData.filters_order);

    showLoading();
    api.formCrudListSearch({filter_data: filterData})
      // .then(jfUtils.prepareFormFieldsWithContext('list'))
      .then(async function(resp) {
        resp = jfUtils.prepareFormFields(resp, 'list');
        resp.form.fields = jfUtils.getTopLevelFields(resp.form, resp.schema, 'list').filter(e => e.key);


        if (crudState.isFastSearch) {
          if (crudState.is_first_search) {
            crudState.is_first_search = false;
            // TODO: so preferences actually work?
            // currentResp = applyPreference(currentResp, currentPreference, crudCustomizationInProgress);
            await buildCrudTable(API_RESPONSE);

            // TODO: recreate the whole table!
            populateTableBody(resp.content, resp, {
              openFirstRow: resp.content.length === 1 && autoOpen,
              populateSelect: GetFastSearchValue(),
            });
          } else {
            // TODO: recreate the whole table!
            populateTableBody(resp.content, resp, {
              openFirstRow: resp.content.length === 1 && autoOpen,
              populateSelect: GetFastSearchValue(),
            });
          }
        } else {
          populateTableBody(resp.content, resp, {
            openFirstRow: resp.content.length === 1 && autoOpen,
            populateSelect: GetFastSearchValue(),
          });
        }


        $('[data-jf2-crud-head]>tr').not('[data-jf-crud-column-customize-control-row]').show();

        hideLoading();
        var queryParamsCopy = _.cloneDeep(queryParams);
        delete queryParamsCopy.filter_data;
    
        var str = '?';
        for (var key in queryParamsCopy) {
          str += key + '=' + queryParamsCopy[key] + '&';
        }
        str += 'filter_data=' + encodeURIComponent(JSON.stringify(filterData));

        history.pushState({}, "Admin Title", str);
        crudState.is_searching = false;
        crudState.is_page_changed = false;

        $('[data-jf2-crud-compact-filters]').hide();

        if (resp.content.length > 0 && GetFastSearchValue()) {
          $('[data-jf2-crud-compact-filters]').hide();
          $('[data-jf2-crud-compact-filters-shower]').show();
        }
      }, function(err) {
        hideLoading();

        crudState.is_searching = false;
        crudState.is_page_changed = false;
      });
  }


  window.addEventListener('tb_libs_loaded', async (event) => {
    var flagDOMElementAttribute = 'data-init-start-jf2-crud';
    var crudTableHeadAttribute = 'data-jf2-crud-head';
    var crudTableBodyAttribute = 'data-jf2-crud-body';
    var crudCompactFiltersAttribute = 'data-jf2-crud-compact-filters';

    if ( $('[' + flagDOMElementAttribute + ']').length == 0 ) {
      jfCrudEnabled = true;
      return false;
    }

    $table = $('[' + flagDOMElementAttribute + ']');

    $tableHead = $('[' + crudTableHeadAttribute + ']');
    $tableBody = $('[' + crudTableBodyAttribute + ']');
    $compactFilters = $('[' + crudCompactFiltersAttribute + ']');

    var apiUrl = TB.CONFIG.API_URL || TB.API_URL || queryParams['api_url'] || './jsonformapi'; // TODO use only TB.CONFIG values
    var apiKey = TB.CONFIG.API_KEY || TB.API_KEY || queryParams['api_key']; // TODO use only TB.CONFIG values
    $(".table-responsive").floatingScroll("init");

    api = new JfApi({
      apiUrl: apiUrl,
      apiKey: apiKey,
      requestParams: {
        'version': 'rav=2.0/apv=1.0',
      },
    });


    initHandlers();
    var initFilterData = parseFLInitParams(queryParams);

    if (queryParams.filter_data) {
      
      try {
        initFilterData = {
          filter_data: JSON.parse(queryParams.filter_data)
        };
      } catch (e) {
      
      }
    }

    if (initFilterData && initFilterData.filter_data && initFilterData.filter_data.filters_order) {
      currentFiltersOrder = initFilterData.filter_data.filters_order;
    }

    showLoading();
    // TODO: @momo - 04052020: Init and Run Time Filter should use the same code! Merge it! #refactor

    api.formCrudListSearch(initFilterData)
      // .then(jfUtils.prepareFormFieldsWithContext('list'))
      .then(function (resp){
        autosaveKey = resp['login'];
        return resp;
      })
      .then(function (resp){
        // @simo: resp.meta.form.fields = jfUtils.getTopLevelFields(resp.meta.form, resp.meta.schema, 'list').filter(e => e.key);
        // why is the above function not caled anywhere in this API cb, but in the other cb's its called
        TRACE("Before prepareFormFields");

        return jfUtils.prepareFormFields(resp, 'list');
      })
      .then(fetchPreferencesIntoResp)
      .then(resolvePreference)
      .then(buildCrudTable)
      .then(promptAutosave)
      .catch(function(err) {
        CAN_EDIT_PREFERENCE = false;

        err = TB.NORMALIZE_ERROR(err);
        TB.ERROR_HANDLER(err);
        hideLoading();
      });

  });

  async function fetchPreferencesIntoResp(resp){
    TRACE("Inside fetchPreferencesIntoResp");
    ASSERT(queryParams["form_name"] || queryParams["table_name"], 'No table_name nor form_name');

    var params = {
      table_name: queryParams["form_name"] || queryParams["table_name"]
    };
    resp.preferences = await TB.GLOBAL_API.send('crud_load_preferences', params);

    return resp;
  }

  function resolvePreference(resp){
    TRACE("Inside resolvePreference");
    ASSERT(resp != null, "resp is missing");
    ASSERT(resp.preferences != null, "preference is missing");
    ASSERT(resp.preferences.can_edit_global != null, "property result.can_edit_global is not set", resp.preferences);

    LOADED_USER_PREFERENCE = resp.preferences.user_preference || {
      columnOrder: {},
      filterOperators: {},
      hiddenColumnKeys: {}
    };

    LOADED_GLOBAL_PREFERENCE = resp.preferences.global_preference || {
      columnOrder: {},
      filterOperators: {},
      hiddenColumnKeys: {}
    };

    CAN_EDIT_GLOBAL = resp.preferences.can_edit_global;
    if ( resp.preferences.can_edit_global){
      resp.form.fields = _.sortBy(resp.form.fields, "crudOrdering");
      API_RESPONSE = _.cloneDeep(resp);
      currentPreference = _.merge({}, LOADED_GLOBAL_PREFERENCE, LOADED_USER_PREFERENCE);
    } else {
      API_RESPONSE = applyPreference(resp, LOADED_GLOBAL_PREFERENCE, crudCustomizationInProgress);
      currentPreference = _.cloneDeep(LOADED_USER_PREFERENCE);
    }

    loadedPreference = _.cloneDeep(currentPreference);
    return API_RESPONSE;
  }

  function applyPreference(resp, preference, showHidden){

    ASSERT(_.isPlainObject(resp), resp);
    ASSERT(_.isPlainObject(resp.form), resp);
    ASSERT(_.isArray(resp.form.fields), resp.form);
    ASSERT(_.isArray(resp.form.excludedFields), resp.form);
    ASSERT(_.isPlainObject(preference), preference);
    ASSERT(_.isPlainObject(preference.columnOrder), preference);
    ASSERT(_.isPlainObject(preference.hiddenColumnKeys), preference);
    ASSERT(_.isPlainObject(preference.filterOperators), preference);

    let respCopy = _.cloneDeep(resp);

    for (const field of respCopy.form.fields) {
      if ( field.key != null ) {

        field.crudOrdering = _.get(preference, ["columnOrder", field.key, "crudOrdering"]) ?? field.crudOrdering;

        field.defaultOperator = _.get(preference, ["filterOperators", field.key, "operator"]) ?? field.defaultOperator;

        if ( _.get(preference, ["hiddenColumnKeys", field.key, "isHidden"]) === true )
        {
          if ( showHidden ){
            field.crudOrdering = respCopy.form.fields[respCopy.form.fields.length - 1].crudOrdering + 100;
          } else {
            respCopy.form.excludedFields.push({ key: field.key, list: true, excludedByPreference: true });
          }
        }
      }
    }

    jfUtils.getTopLevelFields(respCopy.form, respCopy.schema, 'list');
    return respCopy;
  }

  async function buildCrudTable(resp){
    TRACE("Inside buildCrudTable");
    
    resp = applyPreference(resp, currentPreference, crudCustomizationInProgress);

    $table.children().empty();

    hideLoading();
    // var formField = resp.form.fields = jfUtils.getTopLevelFields(resp.form, resp.schema, 'list').filter(e => e.key);
    var formField = resp.form.fields;

    // TODO check if this is correct, and why it's needed
    resp.form.title = resp.table_name;

    jfUtils.modifySchemaAddMisingFormFields(resp.schema, formField, resp.form);

    var formTree = new jfUI.FormTree({
      ...resp,
      validator: new tbjsonAjv2Tb.getAjv2tbInstance(),
      ignore_missing_check: true,
    });

    for (const field of formField) {
      field.title = formTree.keyToTitlePath[field.key]; //field.title || resp.schema.properties[field.key].title;
    }

    $('#tb-ta-subsubtitle').text(' - Browsing ' + resp.table_name);
    $('#tb-ta-subsubtitle').closest('.title_left').css('width', '100%');
    $('#tb-ta-subsubtitle').append('<span class="customized" style="display: none;">*</span>');
    //var $tableCaption = $('<caption>' + 'Browsing `' + resp.table_name + '`</caption>');
    //$table.prepend($tableCaption);
    orderedKeys = [];
    formField.map(function(f) {
      if (f.key) {
        f.schemaElement = formTree.keyToNode[f.key].schemaElement;
        var st = f.schemaElement.type;
        if ( ! f.schemaType ) {
          f.schemaType = Array.isArray(st) ? st.find(t=>t != 'null') : st;
        }

        orderedKeys.push( f.key );
        keysMeta[ f.key ] = f;
      }
    });

    var content = resp.content;
    populateTableHead(resp, content);

    let showInitialBody = false;
    if (queryParams.filter_data || ! resp.has_more_pages || ! GetFastSearchValue(resp.form)) {
      var $headMeta = $('[data-jf-crud-column-title-table-row]');
      if (queryParams.filter_data) {
        $headMeta.show();
      }

      showInitialBody = true;
    }

    if (showInitialBody) {
      populateTableBody(content, resp);
    } else {
      $('.tb-jf-crud-show-first-ten-rows').click(function() {
        $('[data-jf-crud-customize-columns]').show();
        crudState.isFastSearch = false;

        var $headMeta = $('[data-jf-crud-column-title-table-row]');
        $('[data-id="insert-fast-search"]').hide();

        $headMeta.show();

        populateTableBody(content, resp);
        $('[data-id="insert-fast-search"]').hide();
        s('[data-jf2-crud-compact-filters-shower]').show();
      });

      var tinyAppParams = 'view=' + queryParams['p0'] + ';';
      var url = 'app?table_name=' + queryParams['table_name'] +
        '&form_title=' + resp.table_name +
        '&ta_crud_jf2=1&ta_crud_create=1' +
        (queryParams['submit_ui_action'] ? '&submit_ui_action=' + queryParams['submit_ui_action'] : '') +
        (queryParams['form_name'] ? ';form_name=' + queryParams['form_name'] : '') +
        ';' + tinyAppParams;
      
      $('.tb-jf2-crud-insert-button').attr('href', url);
    }


    if (GetFastSearchValue(resp.form)) {
      var urlSearchParams = new URLSearchParams(queryParams);
      urlSearchParams.delete('compact_filters');
      $('#tb-jf-crud-compact-filters-legacy-link').attr('href', '?' + urlSearchParams.toString());
    }

    if (GetFastSearchValue(resp.form)) {
      $('#tb-jf-crud-compact-filters-select-record').on('change', () => {
        // TODO: @momo: when do we use the below code?
        var meta = resp;
        var selectedRecord = $('#tb-jf-crud-compact-filters-select-record').val();

        if (selectedRecord) {
          $('#tb-jf-crud-edit-button, #tb-jf-crud-show-button, #tb-jf-crud-clone-button').attr('disabled', false);
        } else {
          $('#tb-jf-crud-edit-button, #tb-jf-crud-show-button, #tb-jf-crud-clone-button').attr('disabled', true);
          $('#tb-jf-crud-edit-button, #tb-jf-crud-show-button, #tb-jf-crud-clone-button').removeAttr('href');
          return;
        }


        if (meta.permissions.update) {
          var $firstMetaColumnEdit = $('#tb-jf-crud-edit-button');
          var tinyAppParams = 'view=' + queryParams['p0'] + '';
          var url = 'app?record_id=' + selectedRecord +
            ';form_title=' + meta.table_name +
            ';table_name=' + tableName +
            ';ta_crud_jf2=1;ta_crud_edit=1' +
            (queryParams['submit_ui_action'] ? '&submit_ui_action=' + queryParams['submit_ui_action'] : '') +
            (queryParams['form_name'] ? ';form_name=' + queryParams['form_name'] : '') +
            ';' + tinyAppParams;

          $firstMetaColumnEdit.attr('href', url);
        }

        if (meta.permissions.read) {
          var $firstMetaColumnShow = $('#tb-jf-crud-show-button');
          var tinyAppParams = 'view=' + queryParams['p0'] + ';';
          var url = 'app?record_id=' + selectedRecord +
            ';form_title=' + meta.table_name +
            ';table_name=' + tableName +
            ';ta_crud_jf2=1;ta_crud_show=1' +
            (queryParams['submit_ui_action'] ? '&submit_ui_action=' + queryParams['submit_ui_action'] : '') +
            // ';ta_crud_jf2=1;ta_crud_edit=1;form_mode=preview' +
            (queryParams['form_name'] ? ';form_name=' + queryParams['form_name'] : '') +
            ';' + tinyAppParams;

          $firstMetaColumnShow.attr('href', url);
        }

        if (meta.permissions.read && meta.permissions.insert) {
          var $firstMetaColumnClone = $('#tb-jf-crud-clone-button');
          var tinyAppParams = 'view=' + queryParams['p0'] + ';';
          var url = 'app?clone_id=' + selectedRecord +
            ';form_title=' + meta.table_name +
            ';table_name=' + tableName +
            ';ta_crud_jf2=1;ta_crud_create=1;' +
            (queryParams['submit_ui_action'] ? '&submit_ui_action=' + queryParams['submit_ui_action'] : '') +
            (queryParams['form_name'] ? ';form_name=' + queryParams['form_name'] : '') +
            ';' + tinyAppParams;

          $firstMetaColumnClone.attr('href', url);
        }
      })
    }

    if (crudCustomizationInProgress) {
      $('.customized').show();
      $('.jf-crud-btn-group a.btn').addClass('disabled').addClass('tb-disabled');
      $('[data-jf-crud-sort-container=1]').addClass('disabled').addClass('tb-disabled');
      $('[data-jf-crud-filter-container] .form-control:not(.crud-customizable)').attr('readonly', true);
    } else {
      promptAutosave();
    }
  }

  function initHandlers() {
    let $compactFilterBtn = $compactFilter.find('.btn.tb-jf-crud-compact-filters-filter-button');
    $compactFilterBtn.on('click', filterContent);

    $(document).on('click', '[data-jf-crud-prev]', function(e){
      if (crudState.is_searching) {
        return;
      }
      crudState.is_page_changed = true;

      currentPageNumber -= 1;

      filterContent(e);
    });

    $(document).on('click', '[data-jf-crud-next]', function(e){
      if (crudState.is_searching) {
        return;
      }
      crudState.is_page_changed = true;

      currentPageNumber += 1;

      filterContent(e);
    });

    $(document).on('keypress', function(e) {
      if (crudState.is_searching) {
        return;
      }

      var keycode = (event.keyCode ? event.keyCode : event.which);
      if(keycode === 13){
        filterContent(e);
      }
    });

    $(document).on('click', '[data-jf-crud-sort-container]', function(e) {
      var column = $(this).attr('data-jf-crud-column');
      var currentOrderValue = + $(this).attr('data-jf-crud-sort-value');

      var $ic = $(this).find('i.fa');
      $ic.removeClass(REMOVE_VALUE_FROM_CLASS[currentOrderValue]);
      $ic.addClass(ORDER_VALUE_TO_CLASS[currentOrderValue]);

      currentOrderValue += 1;
      currentOrderValue = currentOrderValue % 3;

      $(this).attr('data-jf-crud-sort-value', currentOrderValue);

      currentFiltersOrder = [column, ...currentFiltersOrder.filter(e => e !== column)];

      filterContent(e);
    });


    $(document).on('click', '.tb-jf2-crud-approval-delete-button-init', function(e) {
      e.preventDefault();

      var $this = $(this);
        var url = $this.attr('href');
        var dataHash = TB.parseQueryParams(url);

        var tableName = dataHash.table_name;
        var recordId = dataHash.record_id;

      $modalApprovalSubmit.find('#record_id').val(recordId);
      $modalApprovalSubmit.find('#table_name').val(tableName);

      $modalApprovalSubmit.modal('show');  
      $modalApprovalSubmit.show();  
    });

    $(document).on('click', '#tb-jfp-pending-submit', function(e) {
      e.preventDefault();

      var promise = api.formCrudApprovalDelete({
        record_id: $('#record_id').val(),
        table_name: $('#table_name').val(),
        approval_delete: true,
        approval_code_to: $('#tb-jfp-pending-submit-to').val(),
      });


      var fromProccesing = false;
      promise
        .then(function(resp){
          fromProccesing = true;
          TB.createNotification('Operation Successful', 'The row was successfully requested for deletion!', 'success');
          $modalApprovalSubmit.modal('hide');
        })
        .catch(function(err) {
          if (fromProccesing) {
            ASSERT(0, err);
          }
        });

      TB.isModalShown = true;
    });

    $(document).on('click', '.tb-jf2-crud-delete-button', function(e){
      e.preventDefault();
      var $this = $(this);

      if (crudState.is_deleting[$this.attr('href')]) {
        return;
      }

      if (! confirm('Are you sure you want to delete this?')) {
        return;
      }

      crudState.is_deleting[$this.attr('href')] = true;

      $this.attr('disabled', 'disabled');

      var url = $this.attr('href');
      var dataHash = TB.parseQueryParams(url);

      var tableName = dataHash.table_name;
      var recordId = dataHash.record_id;

      var promise = api.formCrudDelete({
        record_id: recordId,
        table_name: tableName,
      });

      var fromProccesing = false;
      promise
        .then(function(resp){
          fromProccesing = true;

          TB.createNotification('Operation Successful', 'The row was successfully deleted!', 'success');
          $this.closest('tr').hide('slow', function () {
            crudState.is_deleting[$this.attr('href')] = false;
          });
        })
        .catch(function(err) {
          if (fromProccesing) {
            ASSERT(0, err);
          }
        });

      TB.isModalShown = true;
    });

    function swapTableColumnsFromTo(resp, $table, fromIdx, toIdx) {

      // they are swapped in resp already
      let fromKey = resp.form.fields[toIdx].key;
      let toKey = resp.form.fields[fromIdx].key;

      let excludedFieldsObj = _.reduce(resp.form.excludedFields, function(res, excludedField){
        res[excludedField.key] = true;
        return res;
      }, {...currentPreference.hiddenColumnKeys});

      let fieldsSizeWithoutExcluded = _.filter(resp.form.fields, (field)=>{
        return !excludedFieldsObj[field.key];
      }).length;

      $(`[data-jf-crud-customize-col-name="${fromKey}"] > [data-jf-crud-left-shift-column]`).removeClass('col-non-customized').addClass('col-customized');
      $(`[data-jf-crud-customize-col-name="${fromKey}"] > [data-jf-crud-right-shift-column]`).removeClass('col-non-customized').addClass('col-customized');
      $(`[data-jf-crud-customize-col-name="${toKey}"] > [data-jf-crud-left-shift-column]`).removeClass('col-non-customized').addClass('col-customized');
      $(`[data-jf-crud-customize-col-name="${toKey}"] > [data-jf-crud-right-shift-column]`).removeClass('col-non-customized').addClass('col-customized');
      
      let leftIdx = Math.min(fromIdx, toIdx);
      let rightIdx = Math.max(fromIdx, toIdx);
      $table.find('tr').each(function() {
        let $leftTd = $(this).find(`td:eq(${leftIdx + 1})`);
        let $leftTh = $(this).find(`th:eq(${leftIdx + 1})`);

        let $rightTd = $(this).find(`td:eq(${rightIdx + 1})`);
        let $rightTh = $(this).find(`th:eq(${rightIdx + 1})`);

        $leftTd.detach().insertAfter($rightTd);
        $leftTh.detach().insertAfter($rightTh);
      }); 

      $('[data-jf-crud-shift-column]').show();
      $('[data-jf-crud-column-customize-control-row] [data-jf-crud-left-shift-column]').first().hide();
      $('[data-jf-crud-column-customize-control-row] [data-jf-crud-right-shift-column]').last().hide();
    }

    function swapFieldsIdxFromTo(resp, preference, fromIdx, toIdx){

      ASSERT(_.isPlainObject(resp), resp);
      ASSERT(_.isPlainObject(resp.form), resp);
      ASSERT(_.isArray(resp.form.fields), resp.form);

      ASSERT(_.isPlainObject(preference), preference);
      ASSERT(_.isPlainObject(preference.columnOrder), preference);

      ASSERT(fromIdx >= 0, `"fromIdx" can't be negative`, fromIdx);
      ASSERT(toIdx >= 0, `"toIdx" can't be negative`, toIdx);
      ASSERT(fromIdx < resp.form.fields.length, `"fromIdx" can't exceed "fields" length`, fromIdx);
      ASSERT(toIdx < resp.form.fields.length, `"toIdx" can't exceed "fields" length`, toIdx);

      let fromKey = resp.form.fields[fromIdx].key;
      let toKey = resp.form.fields[toIdx].key;
      let fromOrdering = resp.form.fields[fromIdx].crudOrdering;
      let toOrdering = resp.form.fields[toIdx].crudOrdering;

      if ( fromOrdering === toOrdering )
      {
        if ( fromIdx > toIdx )
        {
          fromOrdering += 50;
        } else {
          toOrdering += 50;
        }
      }

      preference.columnOrder[ fromKey ] ||= {};
      preference.columnOrder[ toKey ] ||= {};
      preference.columnOrder[ fromKey ].crudOrdering = toOrdering;
      preference.columnOrder[ toKey ].crudOrdering = fromOrdering;

      resp.form.fields[fromIdx].crudOrdering = toOrdering;
      resp.form.fields[toIdx].crudOrdering = fromOrdering;

      changedPreferencePaths[`columnOrder.${fromKey}.crudOrdering`] = toOrdering;
      changedPreferencePaths[`columnOrder.${toKey}.crudOrdering`] = fromOrdering;

      resp.form.fields = _.sortBy(resp.form.fields, "crudOrdering");
    }

    $(document).on('click', '[data-jf-crud-left-shift-column]', function (e){
      let selectedKey = $(this).parent().attr('data-jf-crud-customize-col-name');

      let currentResp = applyPreference(API_RESPONSE, currentPreference, crudCustomizationInProgress);

      let selectedFieldIdx = _.findIndex(currentResp.form.fields, { key: selectedKey });

      swapFieldsIdxFromTo(currentResp, currentPreference, selectedFieldIdx, selectedFieldIdx - 1);
      swapTableColumnsFromTo(currentResp, $('[data-init-start-jf2-crud]'), selectedFieldIdx, selectedFieldIdx - 1);
    });

    $(document).on('click', '[data-jf-crud-hide-column]', function (e){
      var selectedKey = $(this).parent().attr('data-jf-crud-customize-col-name');

      console.log('simo hide', keysMeta);

      _.set(currentPreference, ['hiddenColumnKeys', selectedKey, 'isHidden'], !(_.get(currentPreference, ['hiddenColumnKeys', selectedKey, 'isHidden'])) || false);
      changedPreferencePaths[`hiddenColumnKeys.${selectedKey}.isHidden`] = _.get(currentPreference, `hiddenColumnKeys.${selectedKey}.isHidden`);

      buildCrudTable(API_RESPONSE);
    });

    $(document).on('click', '[data-jf-crud-right-shift-column]', function (e){
      var selectedKey = $(this).parent().attr('data-jf-crud-customize-col-name');

      let currentResp = applyPreference(API_RESPONSE, currentPreference, crudCustomizationInProgress);

      let selectedFieldIdx = _.findIndex(currentResp.form.fields, { key: selectedKey });

      swapFieldsIdxFromTo(currentResp, currentPreference, selectedFieldIdx, selectedFieldIdx + 1);
      swapTableColumnsFromTo(currentResp, $('[data-init-start-jf2-crud]'), selectedFieldIdx, selectedFieldIdx + 1);
    });

    function confirmPreferenceReload(){
        let confirmed = confirm("You have unsaved preferences (colored in yellow). If you exit now, you will lose unsaved progress. Proceed?");
        return confirmed;
    }

    function toggleCustomizationMode(){

      ASSERT_USER(CAN_EDIT_PREFERENCE, {msg: "Permission Denied", code: "JFC/5100"});

      if (crudCustomizationInProgress && ! _.isEqual(loadedPreference, currentPreference) ) {
        if ( confirmPreferenceReload() ) {
          currentPreference = _.cloneDeep(loadedPreference);
        } else {
          return;
        }
      }
      crudCustomizationInProgress = !crudCustomizationInProgress;
      if ( crudCustomizationInProgress ) {
        $('[data-jf-crud-customize-columns]').hide();
      } else {
        $('[data-jf-crud-customize-columns]').show();
      }
      buildCrudTable(API_RESPONSE);
    }

    $(document).on('change', 'select.crud-customizable', function (e){
      if (crudCustomizationInProgress) {
        var selectedKey = $(this).attr('data-jf-crud-customize-col-name');
        var currentResp = _.cloneDeep(API_RESPONSE);
        currentPreference.filterOperators[selectedKey] = {operator: this.value}
        changedPreferencePaths[`filterOperators.${selectedKey}.operator`] = this.value;
        if ( _.isEqual(currentPreference.filterOperators[selectedKey], loadedPreference.filterOperators[selectedKey]) ){
          $(this).addClass('col-non-customized').removeClass('col-customized');
        } else {
          $(this).addClass('col-customized').removeClass('col-non-customized');
        }
      }
    })

    $(document).on('click', '[data-jf-crud-customize-columns]', toggleCustomizationMode);

    $(document).on('click', '[data-jf-crud-save-customization]' , async function (){
      try {
        var crudPreferenceId = queryParams["table_name"] || queryParams["form_name"];
        ASSERT(crudPreferenceId, 'No table_name', queryParams);

        let filterMap = {};
        for (const node of document.querySelectorAll('th[data-jf-crud-filter-bool="false"]').values()){
          var filterName = node.dataset['jfCrudFilterName'];
          var operator = node.querySelector('select').value;
          filterMap[filterName] = {};

          for ( const option of node.querySelectorAll('select option') ) {
            filterMap[filterName][option.getAttribute('value')] = option.textContent;
          }

          currentPreference.filterOperators[filterName] = {operator};
        }

        var params = {};
        params['preference'] = currentPreference;
        params['table_name'] = crudPreferenceId;
        let isGlobal = $(this).data('jf-crud-save-customization-global') != null;

        let audit = [];

        if ( isGlobal ){
          params['preference'].version = LOADED_GLOBAL_PREFERENCE.version;
        } else {
          params['preference'].version = LOADED_USER_PREFERENCE.version;
        }

        let hasChanges = false;
        let compareFrom = isGlobal ? LOADED_GLOBAL_PREFERENCE : LOADED_USER_PREFERENCE;
        for (const changedPath in changedPreferencePaths) {
          if ( _.get(compareFrom, changedPath) !== _.get(currentPreference, changedPath)){

            hasChanges = true;

            let fieldTitlePath = changedPath.split('.');
            let pathCategory = fieldTitlePath.shift();
            
            let pathCategoryLabel;
            if ( pathCategory === 'hiddenColumnKeys' ) {
              pathCategoryLabel = 'Hidden';
              fieldTitlePath.pop();
            }
            if ( pathCategory === 'columnOrder' ) {
              pathCategoryLabel = 'Order';
              fieldTitlePath.pop();
            }
            if ( pathCategory === 'filterOperators' ) {
              pathCategoryLabel = 'Filter';
              fieldTitlePath.pop();
            }

            let columnName = fieldTitlePath.map(el=>el.replace(/([A-Z])/g,' $1').replace(/_+([a-z])/g, (m,p1)=>' ' + p1.toUpperCase() )).map(s => s && s[0].toUpperCase() + s.slice(1)).join('/');
            
            let oldValue = _.get(compareFrom, changedPath);
            let newValue = _.get(currentPreference, changedPath);

            if ( oldValue === false ) {
              oldValue = 'NO';
            }
            if ( oldValue === true ) {
              oldValue = 'YES';
            }
            if ( newValue === false ) {
              newValue = 'NO';
            }
            if ( newValue === true ) {
              newValue = 'YES';
            }

            if ( pathCategory === 'filterOperators' ) {
              oldValue = filterMap[fieldTitlePath[0]][oldValue];
              newValue = filterMap[fieldTitlePath[0]][newValue];
            }

            if ( oldValue != null ) {
              audit.push(`Column "${columnName}" - ${pathCategoryLabel} : "${oldValue}" => "${newValue}"`);
            } else {
              audit.push(`Column "${columnName}" - ${pathCategoryLabel} : "${newValue}"`);
            }
          }
        }

        ASSERT_USER(hasChanges, {msg: `The changes you are trying to save won't alter the state.`, code: 'JFC/4100'});

        let hasAtLeastOneVisibleColumn = false;
        let resp = applyPreference(API_RESPONSE, currentPreference, false);
        let excludedFieldsKeys = _.reduce(resp.form.excludedFields, (res, field) => (res[field.key] = true, res), {});
        for (const field of resp.form.fields)
        {
          if ( ! excludedFieldsKeys[field.key] )
          {
            hasAtLeastOneVisibleColumn = true;
            break;
          }
        }

        ASSERT_USER(hasAtLeastOneVisibleColumn, {msg: "The interface must have at least one visible column.", code: 'JFC/4200'});

        params['audit_string'] = audit.join('\n');

        // simo
        let saveResponse;
        if ( isGlobal ) {
          params['preference'].form_title = resp.table_name;
          saveResponse = await TB.GLOBAL_API.send('crud_save_preferences_global', params);
        }else {
          saveResponse = await TB.GLOBAL_API.send('crud_save_preferences_local', params);
        }

        ASSERT_PEER(saveResponse, 'No response from crud_save_preferences', saveResponse, params);
        console.log('simo saveResp', saveResponse);
        LOADED_GLOBAL_PREFERENCE = saveResponse.global_preference;
        LOADED_USER_PREFERENCE = saveResponse.user_preference;

        // currentPreference = _.cloneDeep(LOADED_USER_PREFERENCE);
        currentPreference = _.merge({}, LOADED_GLOBAL_PREFERENCE, LOADED_USER_PREFERENCE);
        ASSERT(currentPreference, "Missing user_preference in save response", saveResponse);

        loadedPreference = _.cloneDeep(currentPreference);

        toggleCustomizationMode();

        $('span.customized').hide();
        TB.createNotification('Operation Successful', 'Preferences have been saved successfully!', 'success');
      } catch (e) {
        console.error(e);
      }
    });

    window.addEventListener('beforeunload', function (e) {
      if ( crudCustomizationInProgress && ! _.isEqual(loadedPreference, currentPreference) ) {
        // Show browser warning
        e.preventDefault();
        e.returnValue = '';
      } 
    })
  }


  function promptAutosave(){
    TRACE("Inside promptAutosave");
    var formIdentifier = queryParams.table_name || queryParams.form_name;
    ASSERT(formIdentifier != null, 'Missing form identifier', queryParams);

    try {
      var autosavedChanges = localStorage.getItem(`autosavedChanges.${autosaveKey}`);
      autosavedChanges = JSON.parse(autosavedChanges) || {};

      autosavedChanges = _.get(autosavedChanges, [formIdentifier, '"_basicRecord"']);

      if ( _.isEmpty(autosavedChanges) ) {
        return;
      }

      ASSERT(autosavedChanges.recordId);
      autosavedChanges.recordId = autosavedChanges.recordId.replaceAll('"', '');

      ASSERT(autosavedChanges.mode);

      var tinyAppParams = 'view=' + queryParams['p0'] + '';
      var url = 'app?autosave;table_name=' + formIdentifier + ';ta_crud_jf2=1';
      if ( autosavedChanges.mode === 'crudEdit' ) {
        url += ';record_id=' + autosavedChanges.recordId;
        url += ';ta_crud_edit=1';
      } else if ( autosavedChanges.mode === 'crudClone' ) {
        url += ';ta_crud_create=1';
        url += ';clone_id=' + autosavedChanges.recordId;
      } else if ( autosavedChanges.mode === 'crudCreate' ) {
        url += ';ta_crud_create=1';
      } else {
        ASSERT(0);
      }
      url += (queryParams['submit_ui_action'] ? '&submit_ui_action=' + queryParams['submit_ui_action'] : '') +
        (queryParams['form_name'] ? ';form_name=' + queryParams['form_name'] : '') +
        (autosavedChanges['formTitle'] ? ';form_title=' + encodeURIComponent(autosavedChanges['formTitle']) : '') +
        ';' + tinyAppParams;

      if ( autosavedChanges ) {
        $('#tb-jfc-open-autosave').show().attr('href', url);;
        let autosaveTimeString = new Date(autosavedChanges.time).toLocaleString( 'sv', { timeZoneName: 'shortOffset' });
        let $overwriteAutosaveWarning = $('[data-overwrite-autosave-warning]');
        $overwriteAutosaveWarning.text(`Autosave detected: ${autosavedChanges.formTitle} from ${autosaveTimeString}`);
      }

    } catch (e) {
      console.error('simo', e);
    }
  }

});

