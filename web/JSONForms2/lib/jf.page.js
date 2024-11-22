(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('jslibs/bootstrap-3.3.5/dist/js/bootstrap.min'), require('jquery'), require('tb.xerrors'), require('jf.api-wrapper'), require('jf.jquery'), require('jf.utils'), require('jf.ui'), require('tbjson.ajv2tb'), require('tbjson.schemaResolver'), require('tbjson-generatesubtree'));
  } else if (typeof define === 'function' && define.amd) {
    define(['jslibs/bootstrap-3.3.5/dist/js/bootstrap.min','jquery', 'tb.xerrors', 'jf.api-wrapper', 'jf.jquery', 'jf.utils', 'jf.ui', 'tbjson.ajv2tb', 'tbjson.schemaResolver', 'tbjson-generatesubtree'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    factory(undefined, global.jQuery, global.TB, global.TB.jf.api_wrapper, global.TB.jf.jquery, global.TB.jf.utils, global.TB.jf.ui, global.TB.tbjson.ajv2tb, global.TB.tbjson.schemaResolver, global.TB.tbjson.generateObjectLevelDiffPatch);
  }
})(this, function (bootstrap, $, TB, JfApi, jfjQuery, jfUtils, jfUI, tbjsonAjv2Tb, schemaResolver, tbjsonGenerateSubtree) {
  "use strict";

  const BASIC_AUTOSAVE_MODE = true || window.location.search.indexOf('simoDev') !== -1;

  // multiple foreign key requests for the same table is bad, performance wise ...
  var globalCacheForTableFKeyRequests = {};
  var state = {
    autosaveRunning: false,
    formLoadBegin: 0,
    formSubmitBegin: 0,
    numberOfPendingFKeyRequest: 0,
    hasChanges: false,
    disableValidation: false,
    disableAutosave: false,
    foreignKeysNeedRendering: true,
    isRendering: true,
  };

  window.TB.jfpage = window.TB.jfpage || {};
  window.TB.jfpage.state = state;

  window.TB.jfpage.createNotification = window.TB.createNotification;
  console.log("Some compilation shit v2");

  var showLoading = function showLoading() {
    if ($('#load-modal').length > 0) {
      // TinyApp modal
      $('#load-modal').modal('show');
    } else if ($('#load-modal-jf').length > 0) {
      // JF2 modal (copy of TinyApp)
      $('#load-modal-jf').modal('show');
    } else {
      ASSERT(0, "No loading modal found, please debug!");
    }

    $submit.prop('disabled', true);
  }

  var hideLoading = function hideLoading() {
    if ($('#load-modal').length > 0) {
      $('#load-modal').modal('hide');
    } else if ($('#load-modal-jf').length > 0) {
      // JF2 modal (copy of TinyApp)
      $('#load-modal-jf').modal('hide');
    } else {
      ASSERT(0, "No loading modal found, please debug!");
    }

    $submit.prop('disabled', false);
  }

  var createMsgs = function (type, msg) {
    return '<div class="alert alert-' + type + '">' + msg + '</div>';
  };
  var $modalApproveResubmitData = $(`
    <div id = "tb-jf-prefix-' + 500 + '" style="display: none;" class="modal fade bd-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Overwrite Detected</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p id="tb-jfp-data-meta" style="white-space: pre-line;"></p>
            <span id="tb-jfp-data-overwrite">
            <p>The data you want to edit was updated between <br /><span id="tb-jfp-data-diff-begin"></span> and <span id="tb-jfp-data-diff-end"></span> by another user.<br />Code: <span id="tb-jfp-data-diff-code"></span><br />Menu: <span id="tb-jfp-data-diff-form-name"></span></p>
            <div id="tb-jfp-data-diff"></div>
            </span>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary" id="tb-jfp-prefix-save-data">Confirm</button>
          </div>
        </div>
      </div<
    </div>
  `);
  $( 'body' ).append( $modalApproveResubmitData );

  var $modalWithPendingDifferenceData = $(`
    <div id = "tb-jf-prefix-' + 500 + '" style="display: none;" class="modal fade bd-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
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
            <button type="button" class="btn btn-primary" id="tb-jfp-pending-data-submit">Approve & Update</button>
            <button type="button" class="btn btn-primary" id="tb-jfp-pending-data-send-code">Send Code</button>
            <button type="button" class="btn btn-danger" id="tb-jfp-pending-data-reject">Reject</button>
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div<
    </div>
  `);
  $( 'body' ).append( $modalWithPendingDifferenceData );

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


  var approvalChecksum;
  var queryParams = TB.parseQueryParams();
  var approvalConfirmation = true;
  var submitConfirmation = true;

  var BUTTON_SUBMIT_TEXT = queryParams['button_submit_text'] || 'Save';
  var OPERATION_SUBMIT_FOR_APPROVAL_SUCCESS_TITLE_TEXT = queryParams['operation_submit_for_approval_success_title_text'] || 'Operation Successful';
  var OPERATION_SUBMIT_FOR_APPROVAL_SUCCESS_DESCRIPTION_TEXT = queryParams['operation_submit_for_approval_success_description_text'] || 'Successfully Submitted the Pending Request!';
  var OPERATION_APPROVAL_CODE_SENT_SUCCESS_TITLE_TEXT = queryParams['operation_approval_code_sent_success_title_text'] || 'Operation Successful';
  var OPERATION_APPROVAL_CODE_SENT_SUCCESS_DESCRIPTION_TEXT = queryParams['operation_approval_code_sent_success_description_text'] || 'Code Successfully Sent';
  
  var OPERATION_SUCCESS_TITLE_TEXT = queryParams['operation_success_title_text'] || 'Operation Successful';
  var OPERATION_SUCCESS_DESCRIPTION_TEXT = queryParams['operation_success_description_text'] || 'Successfully Saved the data!';
  var OPERATION_APPROVAL_SUCCESS_TITLE_TEXT = queryParams['operation_approval_success_title_text'] || 'Operation Successful';
  var OPERATION_APPROVAL_SUCCESS_DESCRIPTION_TEXT = queryParams['operation_approval_success_description_text'] || 'Successfully Saved the data!';

  var apiUrl = TB.CONFIG.API_URL || TB.API_URL || queryParams['api_url']; // TODO use only TB.CONFIG values
  var apiKey = TB.CONFIG.API_KEY || TB.API_KEY || queryParams['api_key']; // TODO use only TB.CONFIG values
  if (TB.CONFIG.API_KEY == null) {
    TB.CONFIG.API_KEY = apiKey;
  }
  if (TB.API_KEY == null) {
    TB.API_KEY = apiKey;
  }

  var formMode = TB.CONFIG.FORM_MODE || TB.FORM_MODE || queryParams['form_mode'];

  var sessionToken = TB.CONFIG.SESSION_TOKEN || queryParams['session_token'];
  var formTitle = queryParams['form_title'] || '';
  var exitEventName = queryParams['exit_event_name'];

  ASSERT.isNotNil(apiUrl, { code: 'TB/JFP/10080' });
  //ASSERT.isNotNil(apiKey, { code: 'TB/JFP/10090' });
  TB.CONFIG.INTERFACE_NAME = formTitle;

  var api = new JfApi({
    apiUrl: apiUrl,
    apiKey: apiKey,
  });

  async function JFPAGEGetToken() {
    await api.getSessionToken();
  }
  // JFPAGEGetToken();

  var $crudTitle = $('[data-title-crud-id]');
  var $title = $('[data-title-id]');
  var $cancel = $('#tb-jfp-btn-cancel');
  var $submit = $('#tb-jfp-btn-submit');
  var $difference = $('#tb-jfp-btn-diff');
  var $showDetailedViewButton = $('#tb-jfp-btn-show-detailed-readonly-view');
  var $form = $('#tb-jfp-form');
  var $msgs = $('#tb-jfp-msgs');
  var $expand = $('#tb-jfp-btn-expand');
  var $importFromFile = $('#tb-jfp-label-import');

  $msgs.width($msgs.parent().width());

  if (queryParams['button_position_ui'] == 'top-sticky') {
    $('.navbar-fixed-top').css({ position: 'fixed' });
  } else if (queryParams['button_position_ui'] == 'bottom') {
    $('.navbar-fixed-top').css({ position: 'relative', marginBottom: '1rem' });
  } else {
    $('.x_panel .navbar-fixed-top').css({ position: 'relative', marginBottom: '1rem' });
  }

  $form.on('jfloadBegin', function() {
    //TB.JFP_HOOK_LOADING();
  });
  $form.on('jfload', function() {
    TB.JFP_HOOK_LOADING_FINISH();
  });

  $form.on('tb_jfp_saving', function () {
    state.formSubmitBegin = new Date();
    TB.JFP_HOOK_SAVING();
  });

  $form.on('tb_jfp_saving_finish', function () {
    TB.JFP_HOOK_SAVING_FINISH();
  });

  $form.on('tb_jfp_loading', function () {
    TB.JFP_HOOK_LOADING();
  });

  $form.on('tb_jfp_loading_finish', function () {
    TB.JFP_HOOK_LOADING_FINISH();
  });

  $form.on('tb_jfp_submitted', function (e) {
    TB.JFP_HOOK_SUCCESS(e.detail && e.detail.customSuccessMessage);
  });


  $form.on('tb_jfp_rejected', function () {
    TB.JFP_HOOK_REJECT();
  });

  $form.on('tb_jfp_error', function (evt, err) {
    TB.JFP_HOOK_ERROR(err);
  });

  $form.on('tb_jfp_pending_submit', function () {
    TB.JFP_HOOK_PENDING_SUCCESS();
  });

  $form.on('tb_jfp_approval_code_sent', function () {
    TB.JFP_HOOK_APPROVAL_CODE_SENT();
  });

  TB.CONFIG.XERRORS_HOOK_ERROR_HANDLER_UI = function (err) {
    if ( isConfirmationErr(err) ) {
      // ignore error, JF will handle it!
	  } else {
      TB.JFP_HOOK_ERROR(err);
    }
  };

  var canSave = false;
  var approveError = false;

  var hasPending = false;
  var $submitForApprovalInitBtn = $('#tb-jfp-btn-save-for-approval');
  var $submitForApproval = $('#tb-jfp-pending-submit');
  var $approvers = $('#tb-jfp-pending-submit-to');

  var $pending = $('#tb-jfp-btn-pending-diff');
  var $pendingDiffCode = $('#tb-jfp-pending-diff');
  var $pendingDate = $('#tb-jfp-pending-date');
  var $pendingUser = $('#tb-jfp-pending-user');
  var $pendingCodeReceivedBy = $('#tb-jfp-pending-code-received');
  var $pendingCode = $('#tb-jfp-pending-code');
  var $pendingRejectButton =  $('#tb-jfp-pending-data-reject');
  var $pendingApproveError = $('#tb-jfp-pending-error');

  var NEEDS_RESUBMIT = "U/JF/BASE/CONFIRM";
  var ALREADY_APPROVED_CODE = 'U/TBJF1200';
  var WRONG_CODE_CODE = 'U/TBJF1100';

  function isConfirmationErr(err) {
    return _.get(err, 'addParams.req_err.data.status.server_extra_data.confirmation_required');
  }

  function getErrConfirmationData(err) {
    return _.get(err, 'addParams.req_err.data.status.server_extra_data');
  }

  function populateCanApprove(approvers) {
    $approvers.html('');
    
    $approvers.append($('<option value="">All</option>'));

    for (var i = 0; i < approvers.length; i++) {
      $approvers.append($(`<option value="${approvers[i].id}">${approvers[i].title}</option>`));
    } 
  }

  var globalPendingInformation;
  function showPendingInformation(pendingData) {
    globalPendingInformation = pendingData;
    if (pendingData.meta.can_approve) {
      populateCanApprove(pendingData.meta.can_approve);
    }

    if ( ! pendingData.has_pending ) {
      return;
    }

    hasPending = true;
    $pending.css("display", "inline-block");
    pendingData.diff = pendingData.diff.replace(/\n/g, '<br />');
    $pendingDiffCode.html( pendingData.diff );
    $pendingDate.text(pendingData.meta.timestamp);
    $pendingUser.text(pendingData.meta.user);
    $pendingCodeReceivedBy.text(pendingData.meta.sent_to_mails);
    
    if (pendingData.meta.has_code) {
      $pendingCode.parent().show();
      $pendingCode.text(pendingData.meta.has_code);
    }

    approvalChecksum = pendingData.meta.checksum;
  }
  function hidePendingInformation() {
    hasPending = false;
    approvalChecksum = undefined;
    $pending.css("display", "none");
    $('#tb-jfp-pending-data-code-submit').val('');
  }

  var crudShow = false;
  var crudCreate = false;
  var crudCreateClone = false;
  var crudCreateApprove = false;
  var crudEdit = false;
  var crudInterface = false;
  var crudShortShow = false;
  if ( queryParams['ta_crud_jf2'] ||  queryParams['ta_crud_edit'] || queryParams['ta_crud_create'] || queryParams['ta_crud_show'] || queryParams['ta_crud_approve_create'] ){
    crudInterface = true;

    $crudTitle.show();
    $('[data-title-id="tb-jfp-title-page"]').remove();
  }

  if ( queryParams['ta_crud_edit'] ){
    crudEdit = true;
  }
  if ( queryParams['ta_crud_create'] ) {
    crudCreate = true;
  }
  if ( queryParams['ta_crud_approve_create'] ) {
    crudCreateApprove = true;
  }
  if ( queryParams['ta_crud_show'] ) {
    crudShow = true;
  }
  if ( queryParams['clone_id'] != undefined ) {
    crudCreateClone = true;
  }
  if ( queryParams.form_mode && queryParams.form_mode == 'preview' ) {
    crudShortShow = true;
  }

  var fullFormTitle;
  if (formTitle) {
    if (crudCreate) {
      fullFormTitle = "Insert into `" + formTitle + "`";
    } else if (crudShortShow) {
      fullFormTitle = "Viewing `" + formTitle + "`";
    } else if (crudEdit) {
      fullFormTitle = "Editing `" + formTitle + "`";
    } else {
      fullFormTitle = formTitle;
    }

    if ($('#tb-ta-subsubtitle')) {
      $('#tb-ta-subsubtitle').text( ' - ' + fullFormTitle );
      $('#tb-ta-subsubtitle').closest('.title_left').css('width', '100%');
      $title.remove();
    } else {
      $title.text(fullFormTitle);
    }
    document.title = fullFormTitle;
  } else {
    $title.remove();
  }

  function PermissionToUI(APIResult) {
    $submit.text(BUTTON_SUBMIT_TEXT);

    showPendingInformation( APIResult.pending );

    if ( ! APIResult.permissions.has_approval_enabled ) {
      canSave = true; // TODO: why is it canSave??? ...
    }

    if (APIResult.permissions) {
      if (true
        && APIResult.permissions.has_approval_enabled
        && ! APIResult.permissions.approval_update
        && APIResult.permissions.update
      ) {
        $('#tb-jfp-pending-data-send-code').show();
      } else {
        $('#tb-jfp-pending-data-send-code').hide();
      }
    }
   
    if ( APIResult.permissions && APIResult.permissions.has_approval_enabled ) {
      canSave = ! APIResult.permissions.approval_update;
      if ( APIResult.permissions.approval_update ) {
        $submitForApproval.css('display', 'inline-block');
        $submitForApprovalInitBtn.css('display', 'inline-block');
      }

      if ( ! canSave ) {
        $submit.css('display', 'none');
      } else {
        if ( ! TB.jfpage.hideSubmit ) {
          $submit.css('display', 'inline-block');
        }
        $('#tb-jfp-pending-data-code-submit').hide();
      }
    } else {
      if ( ! TB.jfpage.hideSubmit ) {
        $submit.css('display', 'inline-block');
      }
    }

    $cancel.css('display', 'inline-block');

    if (crudCreateApprove) {
      $pending.show();
      $submitForApprovalInitBtn.hide();
      $submit.hide();
      $cancel.hide();
    } 

    if (queryParams.hide_submit_cancel_buttons == '1') {
      $submitForApprovalInitBtn.hide();
      $submit.hide();
      $cancel.hide();
    }

    if (queryParams.hide_submit_button == '1') {
        $submitForApprovalInitBtn.hide();
        $submit.hide();
    }

    if (queryParams.hide_cancel_button == '1') {
        $cancel.hide();
    }

    if (queryParams.hide_import_button == '1') {
        $importFromFile.hide();
    }
  }

  $expand.click(function() {
    var orig = $form.data('jf-original-args');

    $form.jsonform('destroy');
    initializeEventHandlers();
    orig.data.form.render_full_form = true;

    $form.jsonform(orig);

    var tree = $form.data('tbJfTree');
    var $root = $(tree.domRoot);
    $root.find('.tb-jf-enumerate-form').show();

		$root.find('.tab-pane.fade').addClass('in active');
    $root.find('[data-tb-jf-type="preview"]').children('.tb-jf-label').css('width', 'auto');

    $root.find('ul.nav.nav-tabs').children('li').each((idx, el) => {
      let dataIdx = $(el).attr('data-idx');
      let $dataIdxContent = $(el).parent().siblings('.tab-content').children('[data-idx="' + $(el).attr('data-idx') + '"]');

      let tabText = $(el).html();

      if ($dataIdxContent.children().children('fieldset').length == 0) {
        let $itemWithText = $('<legend class="tb-jf-legend">' + tabText + '</legend>');

        $dataIdxContent.children().prepend( $itemWithText );
      } 
    });

    $root.find('ul.nav.nav-tabs').remove();
    $root.find('.tb-jf-label').css('font-weight', 'bold');

    let superInterval = setInterval(function() {
      if ($root.find('.tb-os-container').attr('style') && $root.find('.tb-os-container').attr('style').indexOf('max-height') > -1) {
        $root.find('.tb-os-container').removeAttr('style');
        $root.find('.tb-os-container').children('ol.tb-os-select').removeAttr('style');
      }
    }, 100);
  });

  function approvalSendCode(e) {
    let approvalPromise = api.formApproveSendCode({});

    approvalPromise.then(
      function (resp) {
        $pendingApproveError.text('');
        $pendingApproveError.hide();

        $modalWithPendingDifferenceData.modal('hide');
        $modalWithPendingDifferenceData.hide();

        $form[0].dispatchEvent(new Event('tb_jfp_saving_finish', { bubbles: true }));
        $form[0].dispatchEvent(new Event('tb_jfp_approval_code_sent', { bubbles: true }));
      },
    )
    .catch(function (err) {
      $form.trigger('tb_jfp_error', err);
    });
  }


  function approvalClick( e ) {
    var code = $('#tb-jfp-pending-data-code-submit').val();
    var data = e.data;

    $form[0].dispatchEvent(new Event('tb_jfp_saving', { bubbles: true }));
    var approvalPromise;
    if (crudInterface && queryParams['ta_crud_approve_create']) {
      approvalPromise = api.formApproveInsertSubmit({ approval_code: code, approval_checksum: approvalChecksum, confirmation_required: true, confirmation_required_approve: true, approval: data.approval, approval_create: true, approval_create_stuff: true, });
    } else if (crudInterface) {
      approvalPromise = api.formCrudApprove( { approval_code: code, approval_checksum: approvalChecksum, confirmation_required: true, confirmation_required_approve: true, approval: data.approval, approval_update: true, } );
    } else {
      approvalPromise = api.formApprove( { approval_code: code, approval_checksum: approvalChecksum, confirmation_required: true, confirmation_required_approve: true, approval: data.approval, approval_update: true } );
    }

    approvalPromise.then(
    function (resp) {
      $pendingApproveError.text('');
      $pendingApproveError.hide();

      // iterateContent(resp.content, '', resp.content);

      var orig = $form.data('jf-original-args');
      orig.data.content = resp.content;
      $form.jsonform('destroy');
      initializeEventHandlers();
      $form.jsonform(orig);

      $modalWithPendingDifferenceData.modal('hide');
      $modalWithPendingDifferenceData.hide();
      hidePendingInformation();

      $form[0].dispatchEvent(new Event('tb_jfp_saving_finish', { bubbles: true }));
      if ( data.approval ) {
        $form[0].dispatchEvent(new Event('tb_jfp_approval_submitted', { bubbles: true }));
      } else {
        $form[0].dispatchEvent(new Event('tb_jfp_rejected', { bubbles: true }));
      }
    },
    function (err) {
      $form[0].dispatchEvent(new Event('tb_jfp_saving_finish', { bubbles: true }));

      if ( err.code === WRONG_CODE_CODE ) {
        $pendingApproveError.text( err.msg );
        $pendingApproveError.show();
      } else if ( err.code === ALREADY_APPROVED_CODE ) {
        $modalWithPendingDifferenceData.modal('hide');
        $modalWithPendingDifferenceData.hide();
        hidePendingInformation();
        $pendingApproveError.text( err.msg );
        $pendingApproveError.show();
        // $pendingApproveError.hide();

      } else {
        approveError = true;

        $pendingApproveError.text( err.msg );
        $pendingApproveError.show();

      }

      if ( isConfirmationErr(err) ) {
        $modalWithPendingDifferenceData.modal('hide');
        $modalWithPendingDifferenceData.hide();
        $pendingApproveError.text('');

        var APIResultError;
        if (_.get(err, 'addParams.req_err') !== undefined) {
          APIResultError = _.get(err, 'addParams.req_err');
        } else {
          APIResultError = err.req_err;
        }
        APIResultError.isFromApprovalWorkflow = true;

        JFP_HOOK_RESUBMIT_ERROR(err);
	    }
    });
  }

  $('#tb-jfp-pending-data-send-code').click(approvalSendCode);

  $('#tb-jfp-pending-data-submit').click({
    approval: true,
  }, approvalClick);

  $('#tb-jfp-pending-data-reject').click({
    approval: false,
  }, approvalClick);


  //TODO: make it work
  $difference.click(function() {
    var formTree = $form.data('jfFormTree');

    console.log("changed: ", formTree.changedFields);
  });


  if (['readOnly', 'preview'].indexOf(formMode) > -1) {
    $submit.attr('disabled', 'disabled');
  }

  TB.JFP_HOOK_LOADING = TB.JFP_HOOK_LOADING || function () {
    showLoading();
  };
  TB.JFP_HOOK_LOADING_FINISH = TB.JFP_HOOK_LOADING_FINISH || function () {
    hideLoading();

    $('.ui-sortable').sortable( "option", "cancel", '.controls');

    window.addEventListener('beforeunload', function (e) {
      // if ($form && !_.isEqual($form.jsonform('values').clientData, {})) {
      if ($form && state.hasChanges && ! state.isRendering ) {
        // Show browser warning
        e.preventDefault();
        e.returnValue = '';
      }
    });
  };

  TB.JFP_HOOK_SAVING = TB.JFP_HOOK_SAVING || function () {
    showLoading();
  };
  TB.JFP_HOOK_SAVING_FINISH = TB.JFP_HOOK_SAVING_FINISH || function () {
    hideLoading();
    state.hasChanges = false;
  };

  TB.JFP_HOOK_REJECT = TB.JFP_HOOK_REJECT || function () {
    TB.createNotification('Pending Request Rejected!', 'Pending Request Rejected!', 'warning');
  };

  TB.JFP_HOOK_PENDING_SUCCESS = TB.JFP_HOOK_PENDING_SUCCESS || function () {
    TB.createNotification(OPERATION_SUBMIT_FOR_APPROVAL_SUCCESS_TITLE_TEXT, OPERATION_SUBMIT_FOR_APPROVAL_SUCCESS_DESCRIPTION_TEXT, 'success');
  };

  TB.JFP_HOOK_APPROVAL_CODE_SENT = TB.JFP_HOOK_APPROVAL_CODE_SENT || function () {
    TB.createNotification(OPERATION_APPROVAL_CODE_SENT_SUCCESS_TITLE_TEXT, OPERATION_APPROVAL_CODE_SENT_SUCCESS_DESCRIPTION_TEXT, 'success');
  };

  TB.JFP_HOOK_SUCCESS = TB.JFP_HOOK_SUCCESS || function (titleMsg) {
    hideLoading();
    TB.createNotification(titleMsg || 'Operation Successful', 'Successfully Saved the data!', 'success');

    if (queryParams['submit_redirect_url']) {
      var id = setTimeout(function(){ location.href = queryParams['submit_redirect_url']; });
    } else {
      if (queryParams['submit_ui_action'] && queryParams['submit_ui_action'] === 'none') {
      } else {
        var id = setTimeout(function(){ 
          if (document.referrer) {
            window.location.replace(document.referrer);
          } else {
            history.back(); 
          }
        }, 1000);
      }
    }
  };

  TB.JFP_HOOK_APPROVAL_SUCCESS = function () {
    hideLoading();
    TB.createNotification(OPERATION_APPROVAL_SUCCESS_TITLE_TEXT, OPERATION_APPROVAL_SUCCESS_DESCRIPTION_TEXT, 'success');

    if (queryParams['submit_redirect_url']) {
      var id = setTimeout(function(){ location.href = queryParams['submit_redirect_url']; });
    } else {
      if (queryParams['submit_ui_action'] && queryParams['submit_ui_action'] === 'none') {
      } else {
        var id = setTimeout(function(){ 
          if (document.referrer) {
            window.location.replace(document.referrer);
          } else {
            history.back(); 
          }
        }, 1000);
      }
    }
  };

  TB.JFP_HOOK_ERROR = function (err) {
    TRACE('ERROR :', err);
    var APIResultError;
    // APIResultError - we should fix this! tb.service does not return the real result, but we need to get it from add_params???
    if (_.get(err, 'addParams.req_err') !== undefined) {
      APIResultError = _.get(err, 'addParams.req_err');
    } else {
      APIResultError = err.req_err;
    }

    if ( isConfirmationErr(err) ) {
      JFP_HOOK_RESUBMIT_ERROR(err);
    } else {
      TB.CONFIG.XERRORS_DEFAULT_ERROR_HANDLER_UI(err);
    }

    var validationErrors = _.get(APIResultError, 'details.validation_errors');
    if (validationErrors) {
      validationErrors.forEach(e => {
        // workaround because this error handler can be called multiple times by the same error
        if (e.data_path_is_dot_notation) {
          return e;
        }
        e.data_path = tbjsonAjv2Tb.jsonPointerNotationToDotNotation(e.data_path)
        e.data_path_is_dot_notation = true;
      });
      $form.jsonFormErrors(validationErrors);
    } else {
      if (err instanceof TB.TbCustomError || err && err.reqErr) {
        // either custom error, or protocol error from tb.service, either way - the error is already handled, no reason for additional audits...
      } else {
        // unknown error - rethrow it
        throw err;
      }
    }

    if (err instanceof TB.TbCustomError && err.type_id == TB.CONFIG.USER_ERROR_AUDIT_TYPE_ID) {
      hideLoading();
    }
  };

  TB.JFP_SPECIAL_SEARCH = function(e) {
    var origEvt = e.originalEvent;
    var evtData = origEvt.detail;
    delete evtData.sp;

    var cacheKey = evtData.ref_table_view || evtData.ref_table;
    if (evtData.foreign_filter) {
      // foreign_filter is its own request!
      cacheKey += evtData.foreign_filter;
    }
    if (evtData.foreign_extra_cols) {
      cacheKey += evtData.foreign_extra_cols;
    }

    globalCacheForTableFKeyRequests[cacheKey] = globalCacheForTableFKeyRequests[cacheKey] || {};
    globalCacheForTableFKeyRequests[cacheKey].data = globalCacheForTableFKeyRequests[cacheKey].data || {};

    if (evtData.ref_value !== undefined) {
      globalCacheForTableFKeyRequests[cacheKey].data[evtData.ref_value] = 1;
    }

    if (evtData.loadcb) {
      evtData.loadcb();
    }

    state.numberOfPendingFKeyRequest += 1;

    setTimeout(function() {
      console.info("", evtData);
      var promise;
      if (globalCacheForTableFKeyRequests[cacheKey] && globalCacheForTableFKeyRequests[cacheKey].isPending) {
        promise = globalCacheForTableFKeyRequests[cacheKey].request;
      } else {
        evtData.cacheEntry = {
            data: globalCacheForTableFKeyRequests[cacheKey].data
        };
        promise = api.searchForeignKey({data: evtData});

        globalCacheForTableFKeyRequests[cacheKey].isPending = true;
        globalCacheForTableFKeyRequests[cacheKey].request = promise;
      }

      promise.then(function(response){
        state.numberOfPendingFKeyRequest -= 1;
        globalCacheForTableFKeyRequests[cacheKey].isPending = false;
        if (response) {
          globalCacheForTableFKeyRequests[cacheKey].response = response;
        } else {
          // for some reason, the response is undefined in the second run of the script, even when the cb is commented out
          // I have some doubt about the .then binding in tb.request.js @momo
          response = globalCacheForTableFKeyRequests[cacheKey].response;
        }

        evtData.cb(_.cloneDeep(response), undefined);
        $("#" + evtData.nodeId).removeAttr('disabled');

        if (state.numberOfPendingFKeyRequest == 0) {
          if ( state.foreignKeysNeedRendering ) {
            $form[0].dispatchEvent(new Event('loaded_fkeys', { bubbles: true }));
            state.foreignKeysNeedRendering = false;
          }
        }
      }).catch(function (err) {
        globalCacheForTableFKeyRequests[cacheKey].isPending = false;
        state.numberOfPendingFKeyRequest -= 1;

        $("#" + evtData.nodeId).removeAttr('disabled');

        evtData.cb(undefined, err);
        if (state.numberOfPendingFKeyRequest == 0) {
          if ( state.foreignKeysNeedRendering ) {
            $form[0].dispatchEvent(new Event('loaded_fkeys', { bubbles: true }));
            state.foreignKeysNeedRendering = false;
          }
        }
      });
    }, 0);

  }

  TB.JFP_ADD_FKEY = function (e) {
    var origEvt = e.originalEvent;
    var evtData = origEvt.detail;
    var selectNode = evtData.selectNode;

    evtData.selectNode = undefined;
    console.info("jf_addFKey: the first one", evtData);

    api.addForeignEntry({data: evtData}).then(function(response) {
      jfUtils.modifySchemaAddMisingFormFields(response.schema, response.form.fields, response.form);
      handleAddFKey(response, evtData, selectNode);
    }).catch(function (err) {
      console.info("Something bad happened: ", _.cloneDeep(err));
      $("#" + evtData.nodeId).removeAttr('disabled');

      var $button = $("#" + evtData.nodeId);
      $button.hide();

      $form.trigger('tb_jfp_error', err);
    });
  }

  var JFP_HOOK_RESUBMIT_ERROR = function (err) {
    var serverData = getErrConfirmationData(err);
    ASSERT(serverData !== undefined, err);

    $form[0].dispatchEvent(new Event('tb_jfp_saving_finish', { bubbles: true }));

    // make modal smaller
    if (!serverData.body_text) {
      $modalApproveResubmitData.find('.modal-body').hide();
    }

		// TODO marti - is this the correct way to check overwrite error?
		// is overwrite error
		if (serverData.oldData) {
			$modalApproveResubmitData.find('#tb-jfp-data-overwrite').show();

			serverData.title_text = 'Overwrite Detected';
			serverData.confirm_button_text = 'Overwrite';
			serverData.oldDiff = serverData.oldDiff || '';
			serverData.current_database_time = serverData.current_database_time || '-';

			var isoStringDate;
			if (typeof state.formLoadBegin === 'string') {
				isoStringDate = state.formLoadBegin;
			} else {
				isoStringDate = state.formLoadBegin.toISOString();
			}

			$('#tb-jfp-data-diff').html( serverData.oldDiff );
			$('#tb-jfp-data-diff-begin').text( isoStringDate.split('.')[0].replace('T', ' ') );
			$('#tb-jfp-data-diff-end').text( serverData.current_database_time.split('.')[0].replace('T', ' ') );
			$('#tb-jfp-data-diff-form-name').text(serverData.audit_form_name);
			$('#tb-jfp-data-diff-code').text(serverData.audit_submit_code);
      $modalApproveResubmitData.find('.modal-body').show();
		} else {
			$modalApproveResubmitData.find('#tb-jfp-data-overwrite').hide();
		}

		$modalApproveResubmitData.find('#tb-jfp-prefix-save-data').text(serverData.confirm_button_text);
		$modalApproveResubmitData.find('.modal-title').text(serverData.title_text || err.msg);
        if (serverData.has_html) {
          $modalApproveResubmitData.find('#tb-jfp-data-meta').html(serverData.body_text);
        } else {
          $modalApproveResubmitData.find('#tb-jfp-data-meta').text(serverData.body_text);
        }

    // USER has corrupted data from a previous submit!
    $modalApproveResubmitData.modal('show');
    $modalApproveResubmitData.show();
    $modalApproveResubmitData.on('shown.bs.modal', function() {

      $('body').off('click','#tb-jfp-prefix-save-data');
      $('body').on('click', '#tb-jfp-prefix-save-data', function( e ) {
        e.preventDefault();

        // resubmit!
        var jfVal = $form.jsonform('values');

        // remove the loading bar or whatever bar there is!
        $modalApproveResubmitData.modal('hide');
        $form[0].dispatchEvent(new Event('tb_jfp_saving', { bubbles: true }));

        var values = jfVal.values;
        var submitValues = {};
        _.each(values, function(value, key) {
          if (key.indexOf('/') === -1) {
            submitValues[ key ] = value;
          }
        });

        var promise;
        if (_.get(err, 'addParams.req_err.isFromApprovalWorkflow')) {
          if (crudInterface) {
            promise = api.formCrudApprove( { approval_code: $('#tb-jfp-pending-data-code-submit').val(), approval_checksum: approvalChecksum, approval: true, is_confirmed: true } )
          } else {
            promise = api.formApprove( { approval_code: $('#tb-jfp-pending-data-code-submit').val(), approval_checksum: approvalChecksum, approval: true, is_confirmed: true } )
          }
        } else {
          if (crudCreate) {
            promise = api.tableCrudInsertSubmit({ inserted_array_items: jfVal.insertedArrayItems, content_subtree: jfVal.clientData, content_subtree_ui: jfVal.clientDataLabels, content: submitValues, approval_checksum: approvalChecksum, is_confirmed: true, }, { fileRequest: jfVal.files });
          } else if (crudEdit) {
            let currentPageAutosave = loadCurrentAutosave();

            if ( currentPageAutosave && $form.data('jfFormTree').autosaveAccepted ) {
              let autosaveSp = currentPageAutosave.formData.sp;

              promise = api.tableCrudEditSubmit({ sp: autosaveSp, inserted_array_items: jfVal.insertedArrayItems, content_subtree: jfVal.clientData, content_subtree_ui: jfVal.clientDataLabels, content: submitValues, approval_checksum: approvalChecksum, is_confirmed: true }, { fileRequest: jfVal.files });
            } else {
              promise = api.tableCrudEditSubmit({ inserted_array_items: jfVal.insertedArrayItems, content_subtree: jfVal.clientData, content_subtree_ui: jfVal.clientDataLabels, content: submitValues, approval_checksum: approvalChecksum, is_confirmed: true }, { fileRequest: jfVal.files });
            }

          } else {
            promise = api.formSubmit({inserted_array_items: jfVal.insertedArrayItems, content_subtree: jfVal.clientData, content_subtree_ui: jfVal.clientDataLabels, content: submitValues, approval_checksum: approvalChecksum, is_confirmed: true }, { fileRequest: jfVal.files });
          }
        }

        promise.then(function (resp) {
          TRACE("The responce from the server is: ", _.cloneDeep(resp));

          var orig = $form.data('jf-original-args');
          orig.data.content = resp.content;
          $form.jsonform('destroy');
          initializeEventHandlers();
          $form.jsonform(orig);

          iterateContent(resp.content, '', resp.content);
          if ( resp.pending && resp.pending.has_pending ) {
            showPendingInformation( resp.pending );
          } else {
            hidePendingInformation();
          }

          $form[0].dispatchEvent(new Event('tb_jfp_saving_finish', { bubbles: true }));
          $form[0].dispatchEvent(new CustomEvent('tb_jfp_submitted', { bubbles: true, detail: { customSuccessMessage: resp.custom_success_msg }, }));

        }, function (err) {
          $form[0].dispatchEvent(new Event('tb_jfp_saving_finish', { bubbles: true }));
          TB.CONFIG.XERRORS_DEFAULT_ERROR_HANDLER_UI(err);
          $modalApproveResubmitData.modal('hide');
        }
        );

        return;
      });
    });
  }

  TB.JFP_HOOK_CANCEL_BUTTON = TB.JFP_HOOK_CANCEL_BUTTON || function () {
    //var previousUrl = document.referrer;
    //window.location = previousUrl;
    history.back();
  };

  TB.JFP_HOOK_CHANGE = function (e) {
    $submit.prop('disabled', false)

    if ( state.isRendering ) {

    } else {
      state.hasChanges = true;
      if ( state.autosaveRunning ) {
        // selectfieldset in selectfieldset changes before fully
        // initialized
        setTimeout(function (){
          storeAutosave();
        }, 5);
      }
    }
  }

  function initializeEventHandlers() {
    // input as event, instead of dom element
    $form.on('input change', TB.JFP_HOOK_CHANGE);

    $form.on('jfloadBegin', function() {
      //TB.JFP_HOOK_LOADING();
    });
    $form.on('jfload', function() {
      TB.JFP_HOOK_LOADING_FINISH();
    });

    $form.on('tb_jfp_saving', function () {
      state.formSubmitBegin = new Date();
      if ( state.autosaveRunning ) {
        removeAutosave();
        state.autosaveRunning = false;
      }
      TB.JFP_HOOK_SAVING();
    });

    $form.on('tb_jfp_saving_finish', function () {
      TB.JFP_HOOK_SAVING_FINISH();
    });

    $form.on('tb_jfp_loading', function () {
      TB.JFP_HOOK_LOADING();
    });

    $form.on('tb_jfp_loading_finish', function () {
      TB.JFP_HOOK_LOADING_FINISH();
      let formTree = $form.data('jfFormTree');
      formTree.events ||= {};
      if ( ! formTree.events.autosaveInitialized ) {
        initializeAutosave();
        formTree.events.autosaveInitialized = true;
        state.autosaveRunning = true;
      }
    });


    $form.on('tb_jfp_submitted', function (e) {
      TB.JFP_HOOK_SUCCESS(e.detail && e.detail.customSuccessMessage);
    });

    $form.on('tb_jfp_approval_submitted', function () {
      TB.JFP_HOOK_APPROVAL_SUCCESS();
    });

    $form.on('tb_jfp_rejected', function () {
      TB.JFP_HOOK_REJECT();
    });

    $form.on('tb_jfp_error', function (evt, err) {
      TB.JFP_HOOK_ERROR(err);
    });

    $form.on('tb_jfp_pending_submit', function () {
      TB.JFP_HOOK_PENDING_SUCCESS();
    });

    $form.on('jf_addFKey', TB.JFP_ADD_FKEY);

    $form.on('jf_specialSearch', TB.JFP_SPECIAL_SEARCH);
  }

  initializeEventHandlers();

  $form[0].dispatchEvent(new Event('tb_jfp_loading', { bubbles: true }));

  if (!exitEventName) {
    $cancel.text('Cancel');
  }

  $cancel.on('click', function () {
    if (exitEventName) {
      window.dispatchEvent(new Event(exitEventName));
    } else {
      TB.JFP_HOOK_CANCEL_BUTTON();
    }
  });

  var jfInstancesStack = [];

  var global_data = 0;
  var handleAddFKey = function handleAddFKey(fullDescr, evtData, selectNode) {
    global_data += 1;

    var $modal = $('<div id = "tb-jf-prefix-' + global_data + '" class="modal fade bd-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true"></div>');
    var $content_wrapper_outer = $('<div class="modal-dialog modal-lg"></div>');
    var $content_wrapper_inner = $('<div class="modal-content"></div>');
    var $form_fkey_add = $('<form></form>');

    var $error_text = $('<div class="controls"><span class="help-block tb-jf-errortext form-control" style="color: red; border: 0px;"></span></div>');

    $form_fkey_add.appendTo($content_wrapper_inner);
    $content_wrapper_inner.appendTo($content_wrapper_outer);
    $content_wrapper_outer.appendTo($modal);

    var $button = $('<button id="tb-jfp-btn-submit" class="btn btn-primary" style="display: inline-block; float: right;" type="submit">Save</button>');
    var $cancelButton = $('<button id="tb-jfp-btn-cancel" class="btn btn-danger" style="display: inline-block; float: right;" type="button">Cancel</button>');

    $cancelButton.click(function(e) {
      e.preventDefault();
      $modal.modal('hide');
    });

    $button.click(function(e) {
        e.preventDefault();

        var jfVal = $form_fkey_add.jsonform('values');
        if (jfVal.errors instanceof Array && jfVal.errors.length > 0) {
          return;
        }

        var values = jfVal.values;
        var submitValues = {};
        _.each(values, function(value, key) {
          if (key.indexOf('/') === -1) {
            submitValues[ key ] = value;
          }
        });

        var fkeyAPI = new JfApi({
          apiUrl: apiUrl,
          apiKey: apiKey,
        });

        var promise = fkeyAPI.tableCrudInsertSubmit({ inserted_array_items: jfVal.insertedArrayItems, content_subtree: jfVal.clientData, content_subtree_ui: jfVal.clientDataLabels, content: submitValues, approval_checksum: approvalChecksum, is_confirmed: true, return_inserted_data_on_insert: true, table_name: evtData.ref_table, form_name:_.get(fullDescr, 'form.form_name'), record_id: null, sp: fullDescr.sp, terminalName: queryParams['form_title'], }, { fileRequest: jfVal.files });
        promise
          .then(function (resp) {
          console.info("The responce from the server is: ", resp);
          var record = resp.content;

          if (selectNode.formElement.type === "selecttemplate") {
            jfUI.elementTypes.selecttemplate.addOptionFromRecord(selectNode, record);
            jfUI.elementTypes.selecttemplate.setValueFromRecord(selectNode, record);
          } else {
            jfUI.elementTypes.select.addOptionFromRecord(selectNode, record);
            jfUI.elementTypes.select.setValueFromRecord(selectNode, record);
          }

          $modal.modal('hide');
        }, function (err) {
          $form_fkey_add.trigger('tb_jfp_error', err);
        });

        //$modal.modal('hide');
    });

    $modal.modal('show');
    $modal.on('shown.bs.modal', function () {

        $content_wrapper_inner.prepend('<div class="modal-header"><button type="button" class="close" data-dismiss="modal">&times;</button><h4 class="modal-title">' + (fullDescr.formName || fullDescr.form.title) + '</h4></div>');

        fullDescr.form.enableDefault = true; // we are always in INSERT mode
        jfUtils.modifySchemaAddMisingFormFields(fullDescr.schema, fullDescr.form.fields, fullDescr.form);
        $form_fkey_add.jsonform({ data: fullDescr });

        var $content_wrapper_inner_inner = $('<div></div>');

        $content_wrapper_inner_inner.append($button);
        $content_wrapper_inner_inner.append($cancelButton);
        $content_wrapper_inner.append($content_wrapper_inner_inner);

        $content_wrapper_inner.append($error_text);

    });

    $modal.on('hidden.bs.modal', function (e) {
        $("#" + evtData.nodeId).removeAttr('disabled');
    });

    $form_fkey_add.on('jf_addFKey', function (e) {
        var origEvt = e.originalEvent;
        var evtData = origEvt.detail;
        console.info("jf_addFKey", evtData);


        var localSelectNode = evtData.selectNode;
        delete evtData.selectNode;

        api.addForeignEntry({data: evtData}).then(function(response) {
          handleAddFKey(response, evtData, localSelectNode);
        }).catch(function (err) {
          console.info("Something bad happened: ", err);
          var $button = $("#" + evtData.nodeId);
          $button.hide();
          $form_fkey_add.trigger('tb_jfp_error', err);
        });
    });

    $form_fkey_add.on('jf_specialSearch', function(e) {
      var origEvt = e.originalEvent;
      var evtData = origEvt.detail;

      console.info("", evtData);
      var promise;
      if (globalCacheForTableFKeyRequests[evtData.ref_table] && globalCacheForTableFKeyRequests[evtData.ref_table].isPending) {
        promise = globalCacheForTableFKeyRequests[evtData.ref_table].request;
      } else {
        promise = api.searchForeignKey({data: evtData});

        globalCacheForTableFKeyRequests[evtData.ref_table] = {
          isPending: true,
          request: promise,
        };
      }

      promise.then(function(response){
        globalCacheForTableFKeyRequests[evtData.ref_table].isPending = false;
        if (response) {
          globalCacheForTableFKeyRequests[evtData.ref_table].response = response;
        } else {
          // for some reason, the response is undefined in the second run of the script, even when the cb is commented out
          // I have some doubt about the .then binding in tb.request.js @momo
          response = globalCacheForTableFKeyRequests[evtData.ref_table].response;
        }

        evtData.cb(_.cloneDeep(response), undefined);
        $("#" + evtData.nodeId).removeAttr('disabled');
      }).catch(function (err) {
        globalCacheForTableFKeyRequests[evtData.ref_table].isPending = false;

        evtData.cb(undefined, err);
        $("#" + evtData.nodeId).removeAttr('disabled');
      });
    });
  }

  function iterateContent(value, currPath, obj) {
    currPath = (currPath === undefined ? '' : currPath);

    if ( _.isPlainObject(value) || _.isArray(value) ) {

      for (var key in value) {
        if (!value.hasOwnProperty(key)) {
          continue;
        }

        iterateContent(value[key], currPath + '/' + key, obj);

      }

    } else {
      $form.jsonFormSetValue(currPath.substring(1), obj, false);
    }
  }

  $pending.on('click', function(e) {
    $modalWithPendingDifferenceData.modal('show');
    $modalWithPendingDifferenceData.show();
  });

  function submitForm( e ) {
    var data = e.data;
    e.preventDefault();

    $modalApprovalSubmit.modal('hide');
    $modalApprovalSubmit.hide();

    var jfVal = $form.jsonform('values');

    console.log('Submitted form with value: $value$', { value: jfVal });


    if (jfVal.errors instanceof Array && jfVal.errors.length > 0) {
      return;
    }

    var values = jfVal.values;
    var submitValues = {};
    _.each(values, function(value, key) {
      if (key.indexOf('/') === -1) {
        submitValues[ key ] = value;
      }
    });

    if (globalPendingInformation && globalPendingInformation.has_pending) {
      if ( ! confirm("Saving will overwrite the current pending request!") ) {
        return;
      }
    }

    $form[0].dispatchEvent(new Event('tb_jfp_saving', { bubbles: true }));
    var promise;
    if (crudCreate) {
      promise = api.tableCrudInsertSubmit({ inserted_array_items: jfVal.insertedArrayItems, content_subtree: jfVal.clientData, content_subtree_ui: jfVal.clientDataLabels, content: submitValues, approval_checksum: approvalChecksum, confirmation_required: true, confirmation_required_approve: true, approval: data.approval, approval_code_to: $('#tb-jfp-pending-submit-to').val(), approval_create_stuff: true, }, { fileRequest: jfVal.files });
    } else if (crudEdit) {
      let currentPageAutosave = loadCurrentAutosave();

      if ( currentPageAutosave && $form.data('jfFormTree').autosaveAccepted ) {
        let autosaveSp = currentPageAutosave.formData.sp;

        promise = api.tableCrudEditSubmit({ sp: autosaveSp, inserted_array_items: jfVal.insertedArrayItems, content_subtree: jfVal.clientData, content_subtree_ui: jfVal.clientDataLabels, content: submitValues, approval_checksum: approvalChecksum, confirmation_required: true, confirmation_required_approve: true, approval: data.approval, approval_code_to: $('#tb-jfp-pending-submit-to').val(), }, { fileRequest: jfVal.files });
      } else {
        promise = api.tableCrudEditSubmit({ inserted_array_items: jfVal.insertedArrayItems, content_subtree: jfVal.clientData, content_subtree_ui: jfVal.clientDataLabels, content: submitValues, approval_checksum: approvalChecksum, confirmation_required: true, confirmation_required_approve: true, approval: data.approval, approval_code_to: $('#tb-jfp-pending-submit-to').val(), }, { fileRequest: jfVal.files });
      }
    } else {
      promise = api.formSubmit({inserted_array_items: jfVal.insertedArrayItems, content_subtree: jfVal.clientData, content_subtree_ui: jfVal.clientDataLabels, content: submitValues, approval_checksum: approvalChecksum, confirmation_required: submitConfirmation, approval: data.approval, confirmation_required_approve: approvalConfirmation, approval_code_to: $('#tb-jfp-pending-submit-to').val(), }, { fileRequest: jfVal.files });
    }

    promise.then(function (resp) {
        console.info("The responce from the server is: ", _.cloneDeep(resp));
        // iterateContent(resp.content, '', resp.content);

        state.isRendering = true;
        var orig = $form.data('jf-original-args');
        orig.data.content = resp.content;
        $form.jsonform('destroy');
        initializeEventHandlers();
        if (crudCreate) {
          orig.data.form.enableDefault = true;
        }
        $form.jsonform(orig);

        if ( resp.pending.has_pending ) {
          showPendingInformation( resp.pending );
        } else {
          hidePendingInformation();
        }

        $form[0].dispatchEvent(new Event('tb_jfp_saving_finish', { bubbles: true }));
        if ( data.approval ) {
          $form[0].dispatchEvent(new Event('tb_jfp_pending_submit', { bubbles: true }));
        } else {
          $form[0].dispatchEvent(new CustomEvent('tb_jfp_submitted', { bubbles: true, detail: { customSuccessMessage: resp.custom_success_msg }, }));
        }
      }, function (err) {
        $form[0].dispatchEvent(new Event('tb_jfp_saving_finish', { bubbles: true }));
        $form.trigger('tb_jfp_error', err);
      });

    console.info("TRACE after the dispatch of the promise!");
  }

  $submitForApprovalInitBtn.click(function(e) {
    var data = e.data;
    e.preventDefault();

    $modalApprovalSubmit.modal('hide');
    $modalApprovalSubmit.hide();

    var jfVal = $form.jsonform('values');

    console.log('Submitted form with value: $value$', { value: jfVal });


    if (jfVal.errors instanceof Array && jfVal.errors.length > 0) {
      return;
    }

    $modalApprovalSubmit.modal('show');  
    $modalApprovalSubmit.show();  
  });

  $submitForApproval.click( { approval: true }, submitForm );
  $submit.click( { approval: false }, submitForm );

  $form[0].dispatchEvent(new Event('tb_jfp_loading', { bubbles: true }));

  function ExtendFormParamsWithURLParams(form) {
    form.fieldProperties = form.fieldProperties || {};

    var prefixToProperty = {
      'fl_hide_': {
          'propName': 'type',
          'propValue':'hidden',
      },
      'fl_ro_': {
          'propName': 'readOnly',
          'propValue': true,
      },
      'fl_def_': {
          'propName': 'default',
          'propValue': 'queryVal',
      },
    };


    var tableName = queryParams.table_name;
    _.forEach(queryParams, function(val, key) {
      var res = key.match(/^(fl_hide_|fl_ro_|fl_def_)(.*)/);
      if (res) {
        var fieldName = res[2];
        fieldName = fieldName.replace(tableName + '_', '');
        form.fieldProperties[fieldName] = form.fieldProperties[fieldName] || {};

        var fieldPropExtendor = prefixToProperty[res[1]];
        form.fieldProperties[fieldName][ fieldPropExtendor['propName'] ] = fieldPropExtendor['propValue'] === 'queryVal' ? val : fieldPropExtendor['propValue'];
      }
    });

    return form;
  }

  function finalizeInitialization(result) {
      ASSERT(result != null);

      let resolveCb;
      let initializePromise = new Promise((resolve, reject) => {
        resolveCb = resolve;
      });

      if (state.numberOfPendingFKeyRequest == 0) {
          resolveCb(result);
      } else {
          $form.on('loaded_fkeys', function() {
              resolveCb(result);
          });
      }

      return initializePromise;
  }

  function onLoadComplete(result) {
      ASSERT(result != null);

      state.hasChanges = false;
      state.isRendering = false;
      PermissionToUI(result);

      $form[0].dispatchEvent(new Event('tb_jfp_loading_finish', { bubbles: true }));

      return result;
  }

  function Main() {

    let formCrudParams = {};
    let autosaveDiff;

    let currentPageAutosave = loadCurrentAutosave();
    if ( !state.disableAutosave && currentPageAutosave) {
    }

    var loadPromise;

    if (crudShow) {
      $('[data-title-id="tb-jfp-title-page"]').text('');
      ASSERT_USER(queryParams['record_id'], {msg: "Invalid Params!", code: "JFC500"});

      api.formCrudListSearch({ skip_string_limit: true, filter_data: { record_id: queryParams['record_id'] } })
        .then(function(resp){
          state.formLoadBegin = new Date();
          $form[0].dispatchEvent(new Event('jfload', { bubbles: true }));
          $title.hide();

          var content = resp.content;
          ASSERT_USER(content.length === 1, {msg: "Invalid Params!", code: "JFP600"});

          var orderedKeys = [];
          var keysMeta = [];
          var $table = $('<table border="0" cellspacing="2" cellpadding="2" class="table table-condensed table-striped table-bordered autowidth"></table>');

          resp = jfUtils.prepareFormFields(resp, 'list');
          var formField = resp.form.fields = jfUtils.getTopLevelFields(resp.form, resp.schema, 'list').filter(e => e.key);

          // TODO check if this is correct, and why it's needed
          resp.form.title = resp.table_name;

          jfUtils.modifySchemaAddMisingFormFields(resp.schema, formField, resp.form);

          var formTree = new jfUI.FormTree({
            ...resp,
            validator: new tbjsonAjv2Tb.getAjv2tbInstance()
          });

          for (const field of formField) {
            field.title = formTree.keyToTitlePath[field.key]; //field.title || resp.schema.properties[field.key].title;
          }

          var content = resp.content;

          formField.map(function(f) {
            if (f.key) {
              f.schemaElement = formTree.keyToNode[f.key].schemaElement;
              var st = f.schemaElement.type;
              f.schemaType = Array.isArray(st) ? st.find(t=>t!=null) : st;

              orderedKeys.push( f.key );
              keysMeta[ f.key ] = f;
            }
          });

          var $tableCaption = $('<caption>' + 'Browsing `' + resp.table_name + '`</caption>');
          $table.append($tableCaption);

          var $tableBody = $('<tbody></tbody>');
          orderedKeys.forEach(function(el) {
            var columnMeta = keysMeta[ el ];
            var currentDatum = content[0][el];

            var $tableBodyRow = $('<tr></tr>');

            $tableBodyRow.append($('<td><b>' + keysMeta[el].title + '</b></td>'));
            var $currentDatumEl = $('<td class="word-break-break-all text-left"></td>');

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

            $tableBodyRow.append($currentDatumEl);

            $tableBodyRow.appendTo($tableBody);
          });

          $tableBody.appendTo($table);
          $('#tb-jfp-form').append($table);

          $submit.css('display', 'none');
          $cancel.css('display', 'inline-block').text('Return');

          $showDetailedViewButton.show();

          var currentUrl = window.location.href;
          currentUrl = currentUrl.replace('ta_crud_show=1', 'ta_crud_edit=1;form_mode=preview;hide_submit_button=1;hide_import_button=1');
          $showDetailedViewButton.attr('href', currentUrl);
      })
      .catch(function (err) {
        $form.trigger('tb_jfp_error', err);
      });


    } else if ( crudEdit ) {
      $('[data-title-id="tb-jfp-title-page"]').parent().hide();

      loadPromise = api.formCrudEditLoad(formCrudParams)

      loadPromise
        .then(function (result) {
          autosaveDiff = result['autosave_humanized_diff'];

          schemaChecksum = result['schema_checksum'];

          result = jfUtils.prepareFormFields(result, 'edit');
          result.form.fields = jfUtils.getTopLevelFields(result.form, result.schema, 'edit');
          jfUtils.modifySchemaAddMisingFormFields(result.schema, result.form.fields, result.form);

          state.formLoadBegin = result.current_database_time;

          if (formMode === 'preview') {
            result.form.preview = true;
          }
          result.form = ExtendFormParamsWithURLParams(result.form);
          result.form.liveValidation = _.isUndefined(result.form.liveValidation) ? true : result.form.liveValidation;

          $form.jsonform({ data: result });

          if (formMode === 'preview') {
            if (['readOnly', 'preview'].indexOf(formMode) > -1) {
              $expand.show();
            }
          }

          $cancel.text('Return');
          $importFromFile.css('display', 'none');

          return result;
        })
        .then(finalizeInitialization)
        .then(onLoadComplete)
      .catch(function (err) {
        $form.trigger('tb_jfp_error', err);
      });

    } else if (crudCreate) {
      $('[data-title-id="tb-jfp-title-page"]').parent().hide();

      if (crudCreateClone) {
        loadPromise = api.formCrudEditLoad({ta_crud_add: true});
      } else {
        loadPromise = api.formCrudCreateLoad({ta_crud_add: true});
      }

      loadPromise
        .then(function (result) {
          schemaChecksum = result['schema_checksum'];

          result = jfUtils.prepareFormFields(result, 'insert');
          result.form.fields = jfUtils.getTopLevelFields(result.form, result.schema, 'insert');
          jfUtils.modifySchemaAddMisingFormFields(result.schema, result.form.fields, result.form);

          state.formLoadBegin = new Date();
          result.form = ExtendFormParamsWithURLParams(result.form);
          result.form.liveValidation = _.isUndefined(result.form.liveValidation) ? true : result.form.liveValidation;


          if (!crudCreateClone) {
            result.form.enableDefault = true;
          }

          $form.jsonform({ data: result });

          if (formMode === 'preview') {
            return;
          }

          return result;
      })
      .then(finalizeInitialization)
      .then(onLoadComplete)
      .catch(function (err) {
        $form.trigger('tb_jfp_error', err);
      });
    } else if (crudCreateApprove) {
      loadPromise = api.formLoadApprove();

      loadPromise
        .then(function (result) {
          state.formLoadBegin = new Date();

          result.form.preview = true;
          $form.jsonform({ data: result });

          return result;
      })
        .then(finalizeInitialization)
        .then(onLoadComplete)
      .catch(function (err) {
        $form.trigger('tb_jfp_error', err);
        if ( ! err.isTemporary ) {
          $form[0].dispatchEvent(new Event('jfload', { bubbles: true }));
        }
      });
    } else if ( crudInterface === false ) {
      loadPromise = api.formLoad();

      loadPromise
        .then(function (result) {
          state.formLoadBegin = new Date();

          if (formMode === 'preview') {
            result.form.preview = true;
          }

          if (result.form.enableDefault === undefined) {
            if (result.content) {
              var numberOfKeysInContent = Object.keys(result.content).length;
              if (numberOfKeysInContent === 1 && result.content['$schemaId'] !== undefined || numberOfKeysInContent === 0) {
                result.form.enableDefault = true
              }  else {
                result.form.enableDefault = false;
              }
            } else {
              result.form.enableDefault = true;
            }
          }

          $form.jsonform({ data: result });

          return result;
      })
      .then(finalizeInitialization)
      .then(onLoadComplete)
      .catch(function (err) {
        $form.trigger('tb_jfp_error', err);
      });
    } else {
      ASSERT(0, {msg: "Please dont abuse me, im a weak library", code: "666"});
    }
  }

  var $modalWithAutosaveDiff = $(`
    <div id = "modalWithAutosaveDiff" style="display: none;" class="modal fade bd-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Data Recovery</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div id="tb-jfp-autosave-diff" class="word-break-break-all"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-danger" data-dismiss="modal" id="tb-jfp-dismiss-autosave">Discard</button>
            <button type="button" class="btn btn-primary" id="tb-jfp-accept-autosave">Recover</button>
            <button type="button" class="btn btn-success" data-dismiss="modal" id="tb-jfp-finish-autosave" style="display: none;">Finish</button>
          </div>
        </div>
      </div<
    </div>
  `);
  $( 'body' ).append( $modalWithAutosaveDiff );


  function removeAutosaveUnsupported(formTree, autosaveContent, parentKey='') {
    for ( const changedKey in autosaveContent) {

      let fullKey = `${parentKey}${changedKey}`;

      let changedNode = _.get(formTree.keyToNode, fullKey);
      if ( _.get(changedNode, ['view', 'autosaveDisabled' ]) ) {
        delete autosaveContent[changedKey];
      }

      if ( _.isObject(autosaveContent[changedKey]) ) {
        removeAutosaveUnsupported(formTree, autosaveContent[changedKey], fullKey+'/');
      }
    }
  }

  function acceptAutosaveChanges(e){
    state.autosaveRunning = false;

    let currentPageAutosave = loadCurrentAutosave();
    ASSERT(currentPageAutosave != null);
    // jfUtils.forceValueTypes(formTree.formDesc.schema, formTree.formDesc.schema, orig.data.content);

    var formTree = $form.data('jfFormTree');
    var originalContent = currentPageAutosave.formData.originalContent;
    var content = currentPageAutosave.formData.jfValues.values;
            
    var orig = $form.data('jf-original-args');
    orig.data.content = _.merge({}, originalContent, content);

    for (const key in formTree.formDesc.keyToNode) {
      if ( _.get(formTree.formDesc.keyToNode, [...key.split('/'), 'view','autosaveDisabled'] )) {
        let originalValue = _.get(formTree.formDesc._originalContent, key.split('/'));
        _.set(orig.data.content, key.split('/'), originalValue);
      }
    }

    $form.jsonform('destroy');
    initializeEventHandlers();
    $form.jsonform(orig);
    formTree = $form.data('jfFormTree');
    formTree.formDesc._originalContent = originalContent;
    state.disableValidation = false;

    $noticeLoadAutosave.hide();
    $('[data-overwrite-autosave-warning]').hide();
    removeAutosave();

    formTree.autosaveAccepted = true;
    formTree.autosaveInitializeContent = currentPageAutosave.formData.jfValues;

    state.foreignKeysNeedRendering = true;
    $form.one('loaded_fkeys', function (){
      state.autosaveRunning = true;
    });

    $('#tb-jfp-finish-autosave').show();
    $('#tb-jfp-accept-autosave').hide();
    $('#tb-jfp-dismiss-autosave').prop('disabled', true);
    // $('#modalWithAutosaveDiff .modal-body').hide();
    $('#tb-jfp-autosave-diff').text('Recovery Successful');

  }

  $('.page-title #autosave-failed').append('<small style="display: none;margin-left: 2em;font-weight: bold;" id="autosaveFailedNotif">WARNING! Autosave failed!</small>');

  var schemaChecksum;

  function loadCurrentAutosave() {

    let mode;
    let recordId;

    let formIdentifier = queryParams.table_name || queryParams.form_name;

    if ( formIdentifier == null ) {
        return;
    }

    if ( queryParams.record_id ) {
      recordId = queryParams.record_id;
      mode = 'crudEdit';
    } else if ( queryParams.clone_id ) {
      recordId = queryParams.clone_id;
      mode = 'crudClone';
    } else {
      recordId = '__recordIdPlaceholder';
      mode = 'crudCreate';
    }
    let changesPath = `${formIdentifier}."${recordId}"`

    var autosavedChanges;
    try{
      autosavedChanges = localStorage.getItem(`autosavedChanges.${window.TB.LOGIN}`);
      autosavedChanges = JSON.parse(autosavedChanges) || {};
    } catch (err) {
      notifyAutosaveFailed();
      return;
    }

    let currentPageAutosave;
    if ( BASIC_AUTOSAVE_MODE ) {
      // currentPageAutosave = _.get(autosavedChanges, '_basicTable."_basicRecord"');
      currentPageAutosave = _.get(autosavedChanges, `${formIdentifier}."_basicRecord"`);
    } else {
      currentPageAutosave = _.get(autosavedChanges, changesPath);
    }

    if ( currentPageAutosave != null ) {
      currentPageAutosave = migrateAutosave(currentPageAutosave);
    }

    return currentPageAutosave;
  }

  function showAutosaveDiff(){
    $noticeLoadAutosave.hide();

    let currentPageAutosave = loadCurrentAutosave();
    if ( currentPageAutosave == null ) {
        return;
    }

    if ( currentPageAutosave.schemaChecksum !== schemaChecksum ) {
        return;
    }

    var formTree = $form.data('jfFormTree');
    var originalContent = currentPageAutosave.formData.originalContent;
    var content = currentPageAutosave.formData.jfValues.values;

    jfUtils.removeKeysWithForwardSlash(content);
    jfUtils.forceValueTypes(formTree.formDesc.schema, formTree.formDesc.schema, content);
    var autosaveValues = currentPageAutosave.formData.jfValues.clientData;
    
    state.disableValidation = true;

    let loadedValues = _.cloneDeep($form.jsonFormValue().values);

    function fillAutosaveDiffModal(autosaveContent, loadedContent, parentKey = "") {
      for (const currentKey in autosaveContent) {
        if (currentKey.startsWith('_')) {
            continue;
        }

        let fullKey = `${parentKey}${currentKey}`;
        if ( _.get(formTree.keyToNode, [fullKey, 'view', 'autosaveDisabled' ]) ) {
            continue;
        }
        if ( _.get(formTree.keyToNode, [fullKey, 'view', 'array' ]) ) {
            continue;
        }

        let title = currentPageAutosave.formData.jfValues.clientDataLabels[fullKey];

        let autosaveDisplayValue = autosaveContent[currentKey];
        let loadedDisplayValue = loadedContent[currentKey];

        let isForeignKey = _.get(formTree.foreignKeysData, fullKey.split('/'));
        if ( isForeignKey ) {
          let node = formTree.keyToNode[fullKey];
          let autosaveOptions = currentPageAutosave.formData.foreignKeyUi[fullKey];
          for (const option of node.options) {
            if ( option.id === loadedDisplayValue ) {
              loadedDisplayValue = option.title;
            }
          }
          for (const option of autosaveOptions) {
            if ( option.id === autosaveDisplayValue ) {
              autosaveDisplayValue = option.title;
            }
          }
        }

        // if ( newDataRepresentation == null && latestData == null ) {
        //   continue;
        // }

        if ( autosaveDisplayValue === true ) {
          autosaveDisplayValue = "YES";
        } else if ( autosaveDisplayValue === false ) {
          autosaveDisplayValue = "NO";
        }

        if ( loadedDisplayValue === true ) {
          loadedDisplayValue = "YES";
        } else if ( loadedDisplayValue === false ) {
          loadedDisplayValue = "NO";
        }

        if ( _.isObject(loadedDisplayValue) && ! _.isObject(autosaveDisplayValue) ) {
          loadedDisplayValue = JSON.stringify(loadedDisplayValue);
        }

        if ( _.isObject( autosaveContent[currentKey] ) && _.isObject( loadedContent[currentKey] ) ) {
            fillAutosaveDiffModal( autosaveContent[currentKey], loadedContent[currentKey], `${fullKey}/` );
        } else if ( _.isObject( autosaveContent[currentKey] ) && !_.isObject( loadedContent[currentKey] ) ) {
            fillAutosaveDiffModal( autosaveContent[currentKey], {}, `${fullKey}/` );
        } else {
            if ( loadedDisplayValue == autosaveDisplayValue ) {
                continue;
            }

            if ( loadedDisplayValue == null ) {
              $('#tb-jfp-autosave-diff').append($(`
              <div class='tb-jf-vertical-bar-right tb-jf-diff-container-field'>
                <p class='tb-jf-diff-container-field-paragraph tb-jf-diff-container-field-paragraph-title'> Field: "${title}"</p>
                <p class='tb-jf-diff-container-field-paragraph'>New Field Element Value: "${autosaveDisplayValue}"</p>
              </div>
            `));
            } else {
              $('#tb-jfp-autosave-diff').append($(`
              <div class='tb-jf-vertical-bar-right tb-jf-diff-container-field'>
                <p class='tb-jf-diff-container-field-paragraph tb-jf-diff-container-field-paragraph-title'> Field: "${title}"</p>
                <p class='tb-jf-diff-container-field-paragraph'>Your field value: "${loadedDisplayValue}" => "${autosaveDisplayValue}"</p>
              </div>
            `));
            }
        }
      }
    }

    if ( Object.keys(autosaveValues).length > 0 ) { 
      fillAutosaveDiffModal(autosaveValues, loadedValues);
    }

    $modalWithAutosaveDiff.find('#tb-jfp-accept-autosave').off().click(acceptAutosaveChanges);
    $modalWithAutosaveDiff.find('#tb-jfp-dismiss-autosave').off().click(() => {
      // what do ?
      removeAutosave();
    });

    if ( $('#tb-jfp-autosave-diff').children().length > 0 ) {
      $modalWithAutosaveDiff.modal('show');
      $modalWithAutosaveDiff.show();
    }
  }

  function initializeAutosave(){
    
    let formTree = $form.data('jfFormTree');

    let formIdentifier = queryParams.table_name || queryParams.form_name;
    if ( formIdentifier == null ) {
        notifyAutosaveFailed();
        return;
    }

    state.disableValidation = true;
    formTree.autosaveInitializeContent = $form.jsonFormValue(true, true);
    jfUtils.forceValueTypes(formTree.formDesc.schema, formTree.formDesc.schema, formTree.autosaveInitializeContent.clientData);
    _.unset(formTree.autosaveInitializeContent, 'errors');
    state.disableValidation = false;

    let recordId; // = queryParams.record_id || queryParams.clone_id;
    if ( queryParams.record_id ) {
      recordId = queryParams.record_id;
    } else if ( queryParams.clone_id ) {
      recordId = queryParams.clone_id;
    } else {
      recordId = '__recordIdPlaceholder';
    }

    let currentPageAutosave = loadCurrentAutosave();

    if (currentPageAutosave ) {
    
      formTree.sp = currentPageAutosave.formData.sp;

      /*
      if ( currentPageAutosave.formIdentifier && currentPageAutosave.formIdentifier !== formIdentifier ) {
        return;
      }

      if ( currentPageAutosave.recordId && currentPageAutosave.recordId !== recordId ) {
        return;
      }
      */

      let willOverwrite = false;
      let $overwriteAutosaveWarning = $('[data-overwrite-autosave-warning]');
      if ( currentPageAutosave.recordId && recordId === '__recordIdPlaceholder' && currentPageAutosave.recordId !== '__recordIdPlaceholder' ) {
        $overwriteAutosaveWarning.text(`You will overwrite an autosave from edit interface`);
        willOverwrite = true;
      }
      else if ( currentPageAutosave.recordId && recordId !== '__recordIdPlaceholder' && currentPageAutosave.recordId === '__recordIdPlaceholder' ) {
        $overwriteAutosaveWarning.text(`You will overwrite an autosave from insert interface`);
        willOverwrite = true;
      }
      else if ( currentPageAutosave.recordId && recordId !== currentPageAutosave.recordId ) {
        $overwriteAutosaveWarning.text(`You will overwrite an autosave from edit interface`);
        willOverwrite = true;
      }
      
      if ( willOverwrite ){
        let autosaveTimeString = new Date(currentPageAutosave.time).toLocaleString( 'sv', { timeZoneName: 'shortOffset' });
        let autosaveRowName = currentPageAutosave.formTitle;
        $overwriteAutosaveWarning.text(`There are unsaved changes in ${autosaveRowName} from ${autosaveTimeString}. Changes in this interface will discard the changes in ${autosaveRowName}.`);
        return;
      } else {
        $overwriteAutosaveWarning.text('');
      }

      showAutosaveDiff();

      /*

      
      $noticeLoadAutosave.find('#autosave-time').text(autosaveTimeString);
      // $noticeLoadAutosave.modal('show');
      $noticeLoadAutosave.show();
      $noticeLoadAutosave.find('#tb-jfp-show-autosave-diff').off().click(showAutosaveDiff);
      $noticeLoadAutosave.find('#tb-jfp-dismiss-autosave-diff').off().click(() => {
        // what do ?
        // $noticeLoadAutosave.hide();
        $noticeLoadAutosave.hide();
        removeAutosave();
      });
      */
    } 

    $('#tb-jfp-btn-cancel').click(removeAutosave);


  }

  function removeAutosave(e){
      try {
          var autosavedChanges = localStorage.getItem(`autosavedChanges.${window.TB.LOGIN}`);
          autosavedChanges = JSON.parse(autosavedChanges) || {};

          if ( BASIC_AUTOSAVE_MODE ) {
            var formIdentifier = queryParams.table_name || queryParams.form_name;
            ASSERT(formIdentifier != null, 'Missing form identifier', queryParams);
           _.unset(autosavedChanges, formIdentifier); 
          } else {
            _.unset(autosavedChanges, changesPath);
          }

          localStorage.setItem(`autosavedChanges.${window.TB.LOGIN}`, JSON.stringify(autosavedChanges));
      } catch (e) {
        notifyAutosaveFailed();
      }
  }

  function clearOldAutosaves() {
    for ( const localStorageKey in window.localStorage ) {
      if ( localStorageKey.startsWith('autosavedChanges') ) {
        
      }
    }
  }

  function notifyAutosaveFailed() {
    $('#autosaveFailedNotif').show(); 
  }


  var removeScalars = function (obj, skipKeys) {
    var keys = Object.keys(obj);

    // delete all scalar fields in the current obj
    for (var i = keys.length - 1; i >= 0; i--) {
      var currKey = keys[i];
      if (currKey === 'load_array_length') {
        continue;
      }

      if (skipKeys[ currKey ]) {
        continue;
      }

      if ( ! _.isPlainObject(obj[currKey]) ) {
        delete obj[currKey];
        continue;
      }
    }
  }

  // TODO: Move to generatesubtree.js / separate file
  function traverseTreeRemoveInDepth(loadContent, submitContent, fullDescr, key) {
    if (loadContent === null || loadContent === undefined) {
      return submitContent;
    }

    key = key || '';
    var loadKeys = Object.keys(loadContent);
    var submitKeys = Object.keys(submitContent);

    var isChangedScalar = false;
    var isChangedRef = false;
    var changedTypeKeys = {};

    var forDeletionReferences = [];

    for (var i = 0; i < submitKeys.length; i++) {
      var currKey = submitKeys[i];
      var currKeyIsArray = false;

      if (_.isArray(submitContent[currKey])) {
        currKeyIsArray = true;
        submitContent[currKey] = Object.assign( {}, submitContent[currKey] );
      }

      if ( ! loadContent.hasOwnProperty(currKey) ) {
        // this is an added item! Update the whole item
        isChangedScalar = true;
        continue;
      }

      if (_.isArray(loadContent[currKey])) {
        currKeyIsArray = true;
        loadContent[currKey] = Object.assign( {}, loadContent[currKey] );
      }

      // if ((currKeyIsArray  || _.isPlainObject(submitContent) || _.isPlainObject(loadContent)) && loadContent[currKey] != undefined && submitContent[currKey] != undefined) {
      if (currKeyIsArray && loadContent[currKey] != undefined && submitContent[currKey] != undefined) {
        var keysLoad = Object.keys(loadContent[currKey]);
        var keysSubmit = Object.keys(submitContent[currKey]);

        // delete pseudo check, because missing OID on the arrays
        submitContent[currKey].load_array_length = keysSubmit.length;
        loadContent[currKey].load_array_length = keysLoad.length;

        if (keysLoad.length > keysSubmit.length) {
          submitContent.__replace_val = submitContent.__replace_val || {};
          submitContent.__replace_val[currKey] = true;

          isChangedRef = true;
          continue;
        } else {
        }
      }

      // if ((_.isPlainObject(loadContent[currKey]) || _.isPlainObject(submitContent[currKey])) && fullDescr && fullDescr.form && fullDescr.form.fields) {
      // if (key == '' && fullDescr) {
      //   traverse_form(fullDescr.form, 'type', 'jsoneditor').forEach(function (el) {
      //     var key = '/' + el.path;
      //     var c1 = tbjsonJsonpointer.get(loadContent, key);
      //     if (typeof c1 != 'string') {
      //       tbjsonJsonpointer.set(JSON.stringify(loadContent), key, JSON.stringify(c1));
      //     }

      //     var c2 = tbjsonJsonpointer.get(submitContent, key);
      //     if (typeof c2 != 'string') {
      //       tbjsonJsonpointer.set(submitContent, key, JSON.stringify(c2));
      //     }
      //   });
      // }
      // }

      if ( _.isPlainObject(loadContent[currKey]) && _.isPlainObject(submitContent[currKey]) ) {
        // if (traverseTree(loadContent[currKey], submitContent[currKey], fullDescr, key + '/' + currKey)) {
        if (traverseTreeRemoveInDepth(loadContent[currKey], submitContent[currKey], fullDescr)) {
          isChangedRef = true;
        } else {
          if (currKey !== 'load_array_length') {
            // special key!
            // delete submitContent[currKey];

            forDeletionReferences.push(currKey);
          }
        }
      } else if (
        ( _.isPlainObject(   loadContent[currKey] ) && ! _.isPlainObject( submitContent[currKey] ) ) ||
        ( _.isPlainObject( submitContent[currKey] ) && ! _.isPlainObject(   loadContent[currKey] ) )
      ) {
        isChangedRef = true;
        changedTypeKeys[currKey] = true;
      } else {
        if (loadContent[currKey] == null && submitContent[currKey] == null) {
          forDeletionReferences.push(currKey);
        } else if ( (loadContent[currKey] == null && submitContent[currKey] != null) || 
                    (loadContent[currKey] != null && submitContent[currKey] == null) ) {
          isChangedScalar = true;
        } else {
          if ( loadContent[currKey] !== submitContent[currKey] ) {
            isChangedScalar = true;
          } else {
            forDeletionReferences.push(currKey);
          }
        }
      }
    }

    var beforeScalarDeletionSizeOfObjectLoadContent = Object.keys(loadContent).length;
    var beforeScalarDeletionSizeOfObjectSubmitContent = Object.keys(submitContent).length;

    // The case: we delete an element in the object, so the loadContent is X, and submitContent: X - NumberOfDeletedElements
    if (beforeScalarDeletionSizeOfObjectSubmitContent < beforeScalarDeletionSizeOfObjectLoadContent) {
      isChangedRef = true; 

      if ( _.isPlainObject(loadContent) && _.isPlainObject(submitContent) ) {
        for (const loadedContentKey in loadContent) {
          let submitSchema = (key === '') ? fullDescr.schema : tbjsonAjv2Tb.getSchemaByJsonPointer(fullDescr.schema, key);
          if ( submitContent[loadedContentKey] === undefined && ( ! submitSchema.properties || submitSchema.properties[loadedContentKey] === undefined ) && ! _.isEmpty(submitSchema.additionalProperties) ) { // TODO: check if field is deleteable
            submitContent['__deleted_keys'] = submitContent['__deleted_keys'] || {};
            submitContent['__deleted_keys'][loadedContentKey] = true;   
          }
        }
      }
    }

    if ( ! isChangedScalar ) {
      removeScalars(submitContent, changedTypeKeys);
    }

    for (var i = 0; i < forDeletionReferences.length; i++) {
      delete submitContent[ forDeletionReferences[i] ];
    }

    for (const deletedKey in submitContent['__deleted_keys']) {
      submitContent[deletedKey] = null;
    }

    return isChangedScalar || isChangedRef;
  }

  const LATEST_AUTOSAVE_VERSION = 2;
  function guessAutosaveVersion(autosaveRecord) {
    if ( autosaveRecord.formData && autosaveRecord.formData.clientData ) {
        return 1;
    } else if ( autosaveRecord.formData.jfValues ) {
        return 2;
    } else {
        return null;
    }
  }

  let migrationDispatchTable = {
    1: function(autosaveRecord){
      let {originalContent, sp, foreignKeyUi, ...jfValues} = autosaveRecord.formData;
      autosaveRecord.formData = {
        originalContent,
        sp,
        foreignKeyUi,
        jfValues
      }
      return autosaveRecord;
    }
  };

  function migrateAutosave(autosaveRecord) {
    let autosaveRecordVersion = guessAutosaveVersion(autosaveRecord);
    while ( autosaveRecordVersion < LATEST_AUTOSAVE_VERSION ) {
      autosaveRecord = (migrationDispatchTable[autosaveRecordVersion] || _.noop)(autosaveRecord);
      autosaveRecordVersion = guessAutosaveVersion(autosaveRecord);
    }

    return autosaveRecord;
  }

  function storeAutosave(){

      $noticeLoadAutosave.hide();
      $('[data-overwrite-autosave-warning]').hide();

      if ( state.disableAutosave ) {
        return;
      }

      var formTree = $form.data('jfFormTree');

      var formData = {};

      state.disableValidation = true;
      formData.jfValues = $form.jsonFormValue();
      state.disableValidation = false;

      /*
      let originalContent = _.get(formTree, ['autosaveInitializeContent', 'clientData']);
      if ( _.isEmpty(originalContent) ) {
        originalContent = formTree.formDesc._originalContent;
      }
      */
      formData.originalContent = _.cloneDeep(formTree.formDesc._originalContent);

      formData.sp = formTree.formDesc.sp;

      removeAutosaveUnsupported(formTree, formData.jfValues.clientData);
      jfUtils.removeKeysWithForwardSlash(formData.jfValues.clientData);
      jfUtils.forceValueTypes(formTree.formDesc.schema, formTree.formDesc.schema, formData.jfValues.clientData);
      traverseTreeRemoveInDepth(formData.originalContent, formData.jfValues.clientData, formTree.formDesc);

      if ( _.isEmpty(formData.jfValues.clientData) ) {
        return;
      }

      formData.foreignKeyUi = {};
      for ( const foreignKey in formTree.foreignKeysData )
      {
        formData.foreignKeyUi[foreignKey] = _.filter(formTree.keyToNode[foreignKey].options, { id: formData.jfValues.clientData[foreignKey] });
      }

      try {
          var autosavedChanges = localStorage.getItem(`autosavedChanges.${window.TB.LOGIN}`);
          autosavedChanges = JSON.parse(autosavedChanges) || {};

          let formTitle = queryParams.form_title;
          let formIdentifier = queryParams.table_name || queryParams.form_name;

          let mode;
          let recordId;
          if ( queryParams.record_id ) {
            recordId = queryParams.record_id;
            mode = 'crudEdit';
          } else if ( queryParams.clone_id ) {
            recordId = queryParams.clone_id;
            mode = 'crudClone';
          } else {
            recordId = '__recordIdPlaceholder';
            mode = 'crudCreate';
          }

          let autosaveData = {
            formData,
            time: Date.now(),
            schemaChecksum,
            mode,
            formTitle,
            formIdentifier,
            recordId,
          }

          if ( BASIC_AUTOSAVE_MODE ) {
            _.set(autosavedChanges, `${formIdentifier}."_basicRecord"` , autosaveData);
            // _.set(autosavedChanges, '_basicTable."_basicRecord"' , autosaveData);
          } else {
            _.set(autosavedChanges, changesPath , autosaveData);
          }

          localStorage.setItem(`autosavedChanges.${window.TB.LOGIN}`, JSON.stringify(autosavedChanges));
      }catch (err){
        notifyAutosaveFailed();
        return;
      }

      state.unsavedAutosaveChanges = false;
  }

  var $noticeLoadAutosave = $(`
    <div class="col-md-3 pull-right autosave-popup" style="display: none;float: right;z-index: 999999 !important;">
      <div class="panel panel-primary" id="autosave-notice" style="margin-bottom: 0;">
        <div class="panel-heading" data-toggle="collapse" href="#autosave-content" aria-expanded="false" aria-controls="autosave-content">
            Unsaved Changes Detected
        </div>
        <div class="collapse" id="autosave-content">
          <div class="panel-body">
              <p> You have done changes from <span id="autosave-time" style="font-weight: bold;"></span> that you haven't saved nor discarded. Do you want to load your previous work or use current (edited) data? <span id="autosave-extra-columns"></span> </p>
          </div>
          <div class="panel-footer" style="text-align: right;">
              <button type="button" class="btn btn-danger" id="tb-jfp-dismiss-autosave-diff">Dismiss</button>
              <button type="button" class="btn btn-primary" id="tb-jfp-show-autosave-diff">Show</button>
          </div>
        </div>
      </div>
    </div>
  `);

	$('.main_container').append($noticeLoadAutosave);

  function HandleLoad(e) {
    window.removeEventListener('tb_libs_loaded', HandleLoad);
    Main();
  }

  window.addEventListener('tb_libs_loaded', HandleLoad);
});

