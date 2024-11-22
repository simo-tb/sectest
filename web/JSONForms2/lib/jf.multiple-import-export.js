(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('jquery'), require('tb.xerrors'), require('jf.api'), require('jf.jquery'), require('jf.utils'), require('tbjson.ajv2tb'), require('tbjson.schemaResolver'), require('jf.ui'), require('tbjson.jsonpointer'), require('jf.crud'));
  } else if (typeof define === 'function' && define.amd) {
    define(['jquery', 'tb.xerrors', 'jf.api-wrapper', 'jf.jquery', 'jf.utils', 'tbjson.ajv2tb', 'tbjson.schemaResolver', 'jf.ui', 'tbjson.jsonpointer', 'jf.crud'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    factory(global.jQuery, global.TB, global.TB.jf.API, null, global.TB.jf.utils, global.TB.tbjson.ajv2tb, global.TB.tbjson.schemaResolver, global.TB.jf.ui, global.TB.tbjson.jsonpointer);
  }
})(this, function ($, TB, JfApi, jfJQuery, jfUtils, AJV, SchemaResolver, JfUi, jsonPointer) {
  var rowImportMetaKey = '__tb_mie_row_import_meta';
  var importInfo;

  var $importModal = $(`
    <div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
      <style>
        .tb-mie-errors-group tr.tb-mie-errors-row {
          border-left: 20px solid transparent;
        }

        .tb-mie-errors-group-header {
          background-color: #EBF5FB;
        }

      </style>
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <link rel="stylesheet" href="./pub/jsonforms2/css/style.css">
          <div class="modal-header">
            <h5 class="modal-title tb-mie-import-only" style="display:inline">Import multiple rows</h5>
            <h5 class="modal-title tb-mie-update-only" style="display:inline">Update multiple rows</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body" style="overflow:auto">
            <div id="tb-mie-container">
              <div id="tb-mie-loading">
                <img src="pub/cdn/loading.gif" height="140px">
              </div>
              <div id="tb-mie-summary-info" style="display: none; height: 130px;">

              </div>
              <!--
              <label for="tb-mie-checkbox-required-only">required only</label>
              <input id="tb-mie-checkbox-required-only" type="checkbox"/>
              -->
              <br/>
              <div class="tb-mie-update-only"> Primary field: <select id="tb-mie-select-unique-key"></select> </div>
              <button id="tb-mie-btn-download-template" class="btn btn-success" type="button"><span class="tb-mie-import-only">Download import template</span> <span class="tb-mie-update-only">Download update template</span></button>
              <label id="tb-mie-btn-import" for="tb-mie-input-file-import" class="btn btn-success">Upload filled in template</label>
              <input id="tb-mie-input-file-import" type="file" style="display: none;"/>
              <button id="tb-mie-btn-start" class="btn btn-primary" type="button">Start</button>
              <button id="tb-mie-btn-stop" class="btn btn-primary" style="display: none;" type="button">Stop</button>
              <button id="tb-mie-btn-retry" class="btn btn-warning" type="button">Retry errors</button>
              <button id="tb-mie-btn-interrupt" class="btn btn-danger" style="display: none;" type="button">Interrupt</button>
              <button id="tb-mie-btn-continue" class="btn btn-danger" style="display: none;" type="button">Continue</button>
              <div style="max-height: 400px; overflow:auto">
                <table style="color: red" id="tb-mie-errors" style="width:100%" class="table">
                  <tbody> <tr> <th> Sheet row </th> <th> Code </th> <th> Message </th> </tr> </tbody>
                  <tbody> </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-footer" style="padding: 0">
          </div>
        </div>
      </div>
    </div>
  `);

  var $downloadTemplateBtn = $importModal.find('#tb-mie-btn-download-template');
  var $importBtn = $importModal.find('#tb-mie-btn-import');
  var $importInput = $importModal.find('#tb-mie-input-file-import');
  var $retryBtn = $importModal.find('#tb-mie-btn-retry');
  var $interruptBtn = $importModal.find('#tb-mie-btn-interrupt');
  var $requiredCheckbox = $importModal.find('#tb-mie-checkbox-required-only');
  var $startBtn = $importModal.find('#tb-mie-btn-start');
  var $stopBtn = $importModal.find('#tb-mie-btn-stop');
  var $importInfo = $importModal.find('#tb-mie-summary-info');
  var $errors = $importModal.find('#tb-mie-errors');
  var $continueBtn = $importModal.find('#tb-mie-btn-continue');
  var $selectUniqueKey = $importModal.find('#tb-mie-select-unique-key');

  $importModal.on("hide.bs.modal", function (e) {
    if(confirm('Are you sure you want to close this window? Any importing will be interrupted.')) {
      stopSubmitting = true;
      // importInfo = undefined;
      importedContent = undefined;
    } else {
      return false;
    }
  });

  function showLoading() {
    $importModal.find('#tb-mie-loading').show();
    $importInfo.hide();
  }

  function hideLoading() {
    $importModal.find('#tb-mie-loading').hide();
    $importInfo.show();
  }

  var jfApi;
  function initializeAPI() {
    if (jfApi == null) {
      var apiUrl = TB.CONFIG.API_URL || TB.API_URL || queryParams['api_url']; // TODO use only TB.CONFIG values
      var apiKey = TB.CONFIG.API_KEY || TB.API_KEY || queryParams['api_key']; // TODO use only TB.CONFIG values

      ASSERT.isNotNil(apiUrl, { code: 'TB/MIE/10081' });
      ASSERT.isNotNil(apiKey, { code: 'TB/MIE/10090' });

      TRACE('For 7e1df', typeof JfApi, JfApi);

      jfApi = new JfApi({
        apiUrl: apiUrl,
        apiKey: apiKey,
        requestParams: {
          'version': 'rav=2.0/apv=1.0',
        },
        retardTimeout: 500,
        retardCb: function () {
          console.log("This is a retard...");
        },
        terminalName: queryParams['form_title'],
      });
    }
  }

  var validateContent;
  function initializeValidator(schema) {
    var validator = new AJV.getAjv2tbInstance();
    validateContent = validator.compile(schema);
  }

  function createImportModal(options) {
    createImportInElement($importModal.find('#tb-jf-multiple-import-container'), options);
    $importModal.modal('show');
    hideLoading();
  }

  var queryParams = TB.parseQueryParams();
  var importedContent;
  var sheetRows;
  var jfDescriptor;
  var interruptSubmitting = false;
  var stopSubmitting = false;
  var hasStarted = false;

  var clientDataLabels = {
    enum_data: {},
    enum_names_data: {},
    foreign_key_data: {}
  };

  var globalOptions;

  function createImportInElement($element, options) {
    ASSERT((options.isImport || options.isUpdate) && !(options.isImport && options.isUpdate), options);
    globalOptions = options;

    $importModal.find('.tb-mie-import-only').toggle(!!options.isImport);
    $importModal.find('.tb-mie-update-only').toggle(!!options.isUpdate);

    if (this.isInitialized) {
      importInfo = undefined;
      updateUI();
      return;
    }
    this.isInitialized = true;

    updateUI();

    showLoading();

    initializeAPI();

    jfApi.formCrudCreateLoad({
      skip_usage_audit: true,
      skip_usage_audit_reason: "This is not a real user action, its \"Automatic\" system behaviour",
    }).then(function (result) {
      jfDescriptor = result;

      var requiredColumns = [];
      var allColumns = [];
      var keyToCol = {};

      TRACE("Before prepareFormFields");
      result = jfUtils.prepareFormFields(result, 'insert');
      result.form.fields = jfUtils.getTopLevelFields(result.form, result.schema, 'insert');
      jfUtils.modifySchemaAddMisingFormFields(result.schema, result.form.fields, result.form);

      var schemaResolver = new SchemaResolver(result.schema);

      TRACE("SCHEMA: ", { schema: result.schema });
      var formTree = new JfUi.FormTree({
        validator: new AJV.getAjv2tbInstance(),
        ...result,
        ignore_missing_check: true,
      }, true);

      TRACE("Before schemaKeysOrdered");
      let schemaKeysOrdered = Object.keys(result.schema.properties);
      schemaKeysOrdered.sort( ( a, b ) => {
        if (result.schema.properties[ a ].crudOrdering > result.schema.properties[ b ].crudOrdering) {
          return 1;
        } else if (result.schema.properties[ b ].crudOrdering > result.schema.properties[ a ].crudOrdering) {
          return -1;
        } else {
          return 0;
        }
      } );

      TRACE("Before schemaKeysOrdered iterate");
      schemaKeysOrdered.forEach( (key, idx) => {
        var schemaElement = schemaResolver.getByPointer('/' + key);
        var type = schemaElement.type;
        type = Array.isArray(type) ? type : [type];

        if (formTree.keyToNode[key] === undefined) {
          return;
        }

        var field = formTree.keyToNode[key].formElement;

        // skip complex types
        if (type.includes('object') || type.includes('array')) {
          return;
        }

        // skip readonly
        if (schemaElement.readOnly || schemaElement.readonly) {
          return;
        }

        // skip foreign key cols
        if ('refCol' in schemaElement) {
          return;
        }

        var col = {originalKey: field.key, title: field.title || schemaElement.title, description: field.description || schemaElement.description, schemaElement};

        keyToCol[field.key] = col;

        allColumns.push(col);

        // required in json forms is not null, after forceValueTypes and ajv it should work
        if (!type.includes('null')) {
          requiredColumns.push(col);
        }

        clientDataLabels[field.key] = schemaElement.title || field.title;

        if (schemaElement.enum) {
          clientDataLabels.enum_data[field.key] = schemaElement.enum;
          clientDataLabels.enum_names_data[field.key] = schemaElement.enumNames;
        }
      });

      // ASSERT(!_.isEmpty(result.unique_key_columns));
      if (!_.isEmpty(result.unique_key_columns)) {
        for (var col of result.unique_key_columns) {
          // ASSERT(keyToCol[col]);
          if (keyToCol[col]) {
            ASSERT(keyToCol[col].title);
            $selectUniqueKey.append($('<option/>').attr('value', col).text(keyToCol[col].title));
          }
        }
        // TODO multiple-import-export should not manage hiding of jf.crud buttons
        $("#tb-jf-mie-update-multiple-button").prop('disabled', false);
      }
      $("#tb-jf-mie-import-multiple-button").prop('disabled', false);

      result.schema.properties[rowImportMetaKey] = { type: 'object', properties: { sheetRow: { type: 'number' }, state: { type: 'string' } }, errorType: { type: 'string' } };

      var schema = {
        id: result.schema.id + '_multiple_import_export',
        type: 'object',
        definitions: {
          ...result.schema.definitions,
          [result.schema.id]: result.schema
        },
        properties: {
          rows: {
            type: 'array',
            items: {
              type: result.schema.type,
              $ref: result.schema.id,
            }
          }
        }
      };

      initializeValidator(schema);

      $retryBtn.on('click', e => {
        saveHandler(e, false);
      });
      $startBtn.on('click', e => {
        hasStarted = true;
        saveHandler(e, true);
      });
      $continueBtn.on('click', e => {
        saveHandler(e, false, importInfo.lastProcessedRow[rowImportMetaKey].idx + 1);
      });
      // $downloadTemplateBtn.on('click', () => downloadTemplate($requiredCheckbox[0].checked ? requiredColumns : allColumns));
      $downloadTemplateBtn.on('click', () => downloadTemplate(allColumns));
      $importInput.on('change', e => {
        TRACE("Inside change handler")
        showLoading();
        $errors.find('.tb-mie-errors-row').remove();
        hasStarted = false;
        importFile(e, schema).then(() => {
          TRACE("Inside import file");
          hideLoading();
          $importInput.val('');
        });
      });

      $interruptBtn.on('click', () => interruptSubmitting = true);
      $stopBtn.on('click', () => stopSubmitting = true);
      hideLoading();
    }).catch(e => TB.ERROR_HANDLER(TB.NORMALIZE_ERROR(e)));
  }

  function saveHandler(e, submitAll, startFromRow) {
    ASSERT_USER(importedContent && importedContent.rows, 'Please import a file first!', 'TB/MIE/12000');

    if (submitAll) {
      ASSERT(startFromRow === undefined);
      importInfo = undefined;
      updateUI();
    }

    if (startFromRow == undefined) {
      $errors.find('.tb-mie-errors-row, .tb-mie-errors-group, .tb-mie-errors-group-header').remove();
    }

    let submitValues = importedContent;

    // validateContent(submitValues), validateContent.errors);

    importInfo.inProgress = true;
    updateUI();

    var promiseChain = Promise.resolve();
    interruptSubmitting = false;
    stopSubmitting = false;
    //submitValues.rows.forEach((row, i) => {
    var submitRow = (i) => {
      var row = submitValues.rows[i];
      while (row && row[rowImportMetaKey].state == 'success' && !submitAll) {
        // skip already submitted rows;
        i++;
        row = submitValues.rows[i];
      }

      if (interruptSubmitting || i >= submitValues.rows.length) {
        importInfo.inProgress = false;
        updateUI();
        return;
      }

      if (stopSubmitting) {
        // importInfo = undefined;
        importInfo.inProgress = false;
        importedContent = undefined;
        updateUI();
        return;
      }

      ASSERT(row);
      promiseChain = promiseChain.then(async function () {
        importInfo.lastProcessedRow = row;
        importInfo.inProgress = true;
        updateUI();

        ASSERT(clientDataLabels);

        var rowCopy = {...row};
        delete rowCopy[rowImportMetaKey];

        jfPayload = {
          form_name: jfDescriptor.form.form_name,
          content_subtree: rowCopy,
          content_subtree_ui: clientDataLabels,
          content: rowCopy,
          inserted_array_items: {}
        };

        if (globalOptions.isUpdate) {
          var uniqueKey = sheetRows[META_ROW_IDX][DATA_START_COL];
          let res = await jfApi.tableUniqueColToID({ col_name: uniqueKey, col_value: rowCopy[uniqueKey], });
          jfPayload.record_id = res.id;

          let contentRow = res.row || {};
          jfPayload.content = {
            ...contentRow,
            ...rowCopy
          };


          // overrides conflicts automatically
          jfPayload.confirmation_required = false;
          // overrides conflicts automatically
          jfPayload.is_confirmed = true;
          jfPayload.primary_key_column = uniqueKey;
        }

        function onSuccess() {
          if (row[rowImportMetaKey].state == 'error')
          {
            importInfo.error--;
          }
          importInfo.successful++;
          row[rowImportMetaKey].state = 'success';
          importInfo.lastInsertedRow = row;
          updateUI();
        }
        if (globalOptions.isImport) {
          return jfApi.tableCrudInsertSubmit(jfPayload, { fileRequest: {} }).then(onSuccess);
        } else if (globalOptions.isUpdate) {
          return jfApi.tableCrudEditSubmit(jfPayload, { fileRequest: {} }).then(onSuccess);
        } else {
          ASSERT(0);
        }
      }).catch(function (err) {
        // console.log('err', err);
        err = TB.NORMALIZE_ERROR(err);
		let match = err.code.match(/^[UTIC]/);
        ASSERT(match);
        let type = match[0];
        if (row[rowImportMetaKey].state != 'error')
        {
          row[rowImportMetaKey].state = 'error';
          row[rowImportMetaKey].errorType = type;
          importInfo.errorsByType[type]++;
          importInfo.error++;
        } else if (row[rowImportMetaKey].errorType != 'errorType') {
          importInfo.errorsByType[row[rowImportMetaKey].errorType]--;
          importInfo.errorsByType[type]++;
          row[rowImportMetaKey].errorType = type;
        }

        var $errRow = $('<tr class="tb-mie-errors-row"/>')
		  .append($('<td class="tb-mie-errors-sheet-row"/>').text(row[rowImportMetaKey].sheetRow + 1))
          .append($('<td class="tb-mie-err-code"/>').text(err.code))
          .append($('<td class="tb-mie-err-msg"/>').text(err.msg));

        var $lastGroup = $errors.find('tbody').last();

        var $lastErrRow = $lastGroup.find('.tb-mie-errors-row').last();
        var lastMsg = $lastErrRow.find('.tb-mie-err-msg').text();
        var lastCode = $lastErrRow.find('.tb-mie-err-code').text();
        var lastSheetRow = +$lastErrRow.find('.tb-mie-errors-sheet-row').text();

        if ($lastGroup.children().length === 0 || (lastCode == err.code && lastMsg == err.msg && lastSheetRow === row[rowImportMetaKey].sheetRow - 1)) {
          $lastGroup.append($errRow);
        } else {
          var $newGroup = $('<tbody></tbody>');
          $newGroup.append($errRow);
          $errors.append($newGroup);
        }


        if ($lastGroup.children().length > 1) {
          var $existingHeader = $lastGroup.prev();
          if (!$existingHeader.is('.tb-mie-errors-group-header')) {
            var $groupMsg = $('<th style="cursor: pointer"/>')
              .append($('<span class="tb-mie-errors-group-counter">2</span>'))
              .append($('<span>x </span>)'))
              .append($('<span/>').text(lastMsg));
            var $groupHeader = $('<tbody class="tb-mie-errors-group-header"/>').append(
              $('<tr/>')
                .append($('<th class="tb-mie-errors-sheet-row"/>').text('*'))
                .append($('<th/>').text(lastCode))
                .append($groupMsg)
            );
            $lastErrRow.parent().before($groupHeader);
            $lastGroup.hide();
            $lastGroup.addClass('tb-mie-errors-group');
            $groupHeader.on('click', function (e) {
              // $lastGroup.toggle();
            });
            $existingHeader = $groupHeader;
          }

          var $children = $lastGroup.children().find('.tb-mie-errors-sheet-row');
          $existingHeader.find('.tb-mie-errors-group-counter').text($children.length);
          $existingHeader.find('.tb-mie-errors-sheet-row').text(`${$children.first().text()} - ${$children.last().text()}`);
        }

        updateUI();
      }).then(() => {
        //return submitRow(i + 1);
        return new Promise(resolve => setTimeout(() => resolve(submitRow(i + 1)), 0));
      });
    };
    submitRow(startFromRow || 0);
  }

  function updateUI() {
    if (!importInfo) {
      importInfo = {
        loaded: importedContent ? importedContent.rows.length : 0,
        successful: 0,
        error: 0,
        errorsByType: {
          U: 0,
          T: 0,
          I: 0,
		  C: 0,
        },
        lastInsertedRow: null,
        lastProcessedRow: null,
        inProgress: false
      };
    }

    $importModal.find('modal-title').text(globalOptions.isImport ? 'Import multiple rows' : 'Update multiple rows');

    if (importInfo.inProgress) {
      updateButtonsInProgress();
    } else {
      updateButtonsOutOfProgress();
      $startBtn.prop('disabled', hasStarted);
    }

    var $importInfo = $importModal.find('#tb-mie-summary-info');

    $importInfo.html(`
      <h4>Loaded rows: ${importInfo.loaded}</h4>
      <h4 style="color: green">Successfully ${globalOptions.isImport ? 'imported' : 'updated'} rows: ${importInfo.successful}</h4>
      <h4 style="color: red">Error rows: ${importInfo.error} <br> (${importInfo.errorsByType.U} User errors, ${importInfo.errorsByType.C} Configuration errors, ${importInfo.errorsByType.T} Temporary errors, ${importInfo.errorsByType.I} I
nternal errors)</h4>
      ${
        importInfo.lastInsertedRow == null && !importInfo.inProgress || importInfo.lastProcessedRow == null ? '<p style="opacity:0;">.</p>' :
        importInfo.inProgress
          ? `<p> Importing sheet row ${+importInfo.lastProcessedRow[rowImportMetaKey].sheetRow} ...</p>`
          : `<p> Last imported sheet row ${+importInfo.lastInsertedRow[rowImportMetaKey].sheetRow} </p>`
      }
    `);

    if (importInfo.error) {
      $errors.show();
    } else {
      $errors.hide();
    }
  }

  function updateButtonsInProgress() {
    $startBtn.hide();
    $stopBtn.show();
    $retryBtn.prop('disabled', true);
    $importBtn.attr('disabled', true);
  }

  function updateButtonsOutOfProgress() {
    $startBtn.show();
    $stopBtn.hide();
    $importBtn.attr('disabled', false);
    $retryBtn.prop('disabled', !importInfo.error);
  }

  var DATA_START_ROW = 5;
  var DATA_START_COL = 1;
  var META_ROW_IDX = 2;

  var cachedResult;
  function downloadTemplate(exportColumns) {
    exportColumns = _.cloneDeep(exportColumns);

    var uniqueKey = $selectUniqueKey.val();

    // move the primary column to first
    for (var i = 0; i < exportColumns.length; i++) {
      if (exportColumns[i].originalKey === uniqueKey) {
        [exportColumns[0], exportColumns[i]] = [exportColumns[i], exportColumns[0]];
        break;
      }
    }

    var meta = {
      table_name: queryParams['table_name'],
      // keys: exportColumns.map(c => c.originalKey),
      // types: exportColumns.map(c => c.schemaElement.type)
    };

    var titlesRow = exportColumns.map(c => c.title);

    var descriptionsRow = exportColumns.map(c => c.description);

    var enumRow = exportColumns.map(c => {
      if (c.schemaElement.enumNames)
        return c.schemaElement.enumNames.join(', ');

      var type = Array.isArray(c.schemaElement.type) ? c.schemaElement.type : [c.schemaElement.type];
      var typeWithoutNull = type.filter(e => e !== 'null');

      ASSERT(typeWithoutNull.length === 1);

      var userType = typeWithoutNull[0];

      if (userType === 'boolean')
        return 'yes/no';
      if (userType === 'string')
        return 'text';

      return c.schemaElement.type
    });

    var requiredRow = exportColumns.map(c => !(_.isArray(c.schemaElement.type) ? c.schemaElement.type : [c.schemaElement.type]).includes('null')).map(e => e ? 'yes' : 'no');

    var metaRow = exportColumns.map(c => c.originalKey); //, enum: c.schemaElement.enum, enumNames: c.schemaElement.enumNames });

    var headerRows = [
      ['Title', ...titlesRow],
      ['Description', ...descriptionsRow],
      ['Meta', ...metaRow], // META_ROW_IDX
      ['Possible values', ...enumRow],
      ['Required', ...requiredRow],
    ];

    ASSERT(headerRows.length === DATA_START_ROW);

    for (var row of headerRows) {
      ASSERT(row.length == exportColumns.length + DATA_START_COL);
    }

    var mainSheet = XLSX.utils.aoa_to_sheet(headerRows);

    var metaHash = hashObject(meta);

    var metaSheet = XLSX.utils.aoa_to_sheet([
      [JSON.stringify(meta), metaHash]
    ]);

    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, mainSheet, 'main');
    XLSX.utils.book_append_sheet(wb, metaSheet, 'meta');
		XLSX.writeFile(wb, `${queryParams.table_name}.xlsx`)
  }

  function importFile(e, schema) {

    $startBtn.prop('disabled', true);

    let files = e.target.files, f = files[0];
    ASSERT_USER(f != null, 'Please select a file', 'TB/JF/MIE/11100');

    return new Promise(async (resolve, reject) => {

      var reader = new FileReader();
      reader.onload = function(e) {
        var data = new Uint8Array(e.target.result);

        try {
          var workbook = XLSX.read(data, {type: 'array', cellDates: true, dateNF: 'mm/dd/yyyy;@'});
        } catch (e) {
          ASSERT_USER(0, 'Invalid xlsx file', 'TB/JF/MIE/10100', { err: e });
          return;
        }

        sheetRows = XLS.utils.sheet_to_json(workbook.Sheets['main'], { header: 1, defval: null, dateNF: 'YYYY-MM-DD' });
        console.log(sheetRows);
        ASSERT_USER(sheetRows.length >= DATA_START_COL, 'Invalid file', 'TB/JF/MIE/10110');
        var [[metaStr, metaHash]] = XLS.utils.sheet_to_json(workbook.Sheets['meta'], { header: 1, defval: null });
        var meta = JSON.parse(metaStr);
        var { table_name } = meta;
        var keys = sheetRows[META_ROW_IDX];

        var curr_table_name = queryParams['table_name'];
        ASSERT_USER(table_name == curr_table_name, `Trying to import ${table_name} data into ${curr_table_name}!`, 'TB/MIE/11000', { table_name, curr_table_name });

        ASSERT_USER(hashObject(meta) == metaHash, `File is corrupted - metadata doesn't match!`, 'TB/MIE/11010', { table_name, curr_table_name });

        var rows = [];


        var keyToSchema = {};
        var schemaResolver = new SchemaResolver(schema);
        var rowItems = schemaResolver.getByPointer('/rows/0');
        for (var key in rowItems.properties) {
          var schemaElement = schemaResolver.getByPointer('/rows/0/' + key);
          keyToSchema[key] = schemaElement;
        }

        for (var j = DATA_START_ROW; j < sheetRows.length; j++) {
          var sheetRow = sheetRows[j];
          var row = {};
          for (var i = DATA_START_COL; i < sheetRow.length; i++) {
            var value = sheetRow[i];
            var key = keys[i];

            //row = jsonPointer.set(row, key.replace(/^rows\[\]/, ''), value);
            if (value != null && value.toString().trim() != '') {
              row = jsonPointer.set(row, '/' + key, value);
            }
          }

          if (!_.isEmpty(row)) {
            rows.push(row);
          }
        }

        var boolTitles = {
          '0': false,
          'n': false,
          'no': false,
          '1': true,
          'y': true,
          'yes': true,
          /*
          't': true,
          'true': true,
          'f': false,
          'false': false
          */
        };

        rows.forEach(function (r, i) {
          for (var row of rows) {
            for (var key in row) {
              var schema = keyToSchema[key];
              // TODO change bools
              var type = schema.type;
              type = Array.isArray(type) ? type : [type];

              if (schema.enum && schema.enumNames) {
                var val = row[key];
                var idx = schema.enumNames.indexOf(val);
                if (idx >= 0) {
                  row[key] = schema.enum[idx];
                }
              } else if (type.includes('boolean')) {
                var bool = boolTitles[row[key].toLowerCase()];
                if (bool !== undefined) {
                  row[key] = bool;
                }
              }
            }
          }

          r[rowImportMetaKey] = { sheetRow: i + DATA_START_ROW, idx: i }
        });

        // TODO is forceValueTypes needed?
        importedContent = {rows};//jfUtils.forceValueTypes(schema, schema, {rows});
        isImported = true;
        importInfo = undefined;
        updateUI();

        $startBtn.prop('disabled', false);

        resolve();
      };
      reader.readAsArrayBuffer(f);
    });
  }

  // copied from Java's String.hashCode()
  function hashString(string) {
    var hash = 0;
    if (string.length == 0) {
      return hash;
    }
    for (var i = 0; i < string.length; i++) {
      var char = string.charCodeAt(i);
      hash = ((hash<<5)-hash)+char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  function hashObject(schema) {
    function stringify(value) {
      if (_.isObject(value)) {
        return '{' +
          Object
          .keys(value)
          .sort()
          .map(key => `"${key}":${stringify(value[key])}`)
          .join(',') + '}';
      }
      if (_.isArray(value)) {
        return '[' +
          value
          .map(el => stringify(el))
          .join(',') + ']';
      }
      if (_.isString(value)) {
        return `"${value}"`;
      }
      return _(value).toString();
    }

    return hashString(stringify(schema));
  }

  window.addEventListener('tb_libs_loaded', function () {
    createImportInElement($importModal.find('#tb-jf-multiple-import-container'), { isImport: true })
  });

  window.TB.multipleImportExport = {
    createImportModal,
    createImportInElement
  }
});

