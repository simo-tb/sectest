(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('jquery'), require('tb.xerrors'), require('jf.api'), require('jf.jquery'), require('jf.utils'));
  } else if (typeof define === 'function' && define.amd) {
    define(['jquery', 'tb.xerrors', 'jf.api', 'jf.jquery', 'jf.utils'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    factory(global.jQuery, global.TB, global.TB.jf.API, null, global.TB.jf.utils, global.TB.tbjson.ajv2tb);
  }
})(this, function ($, TB, JfApi, jfJQuery, jfUtils, AJV) {
  var $importModal = $(`
    <div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <link rel="stylesheet" href="./pub/jsonforms2/css/style.css">
          <div class="modal-header">
            <h5 class="modal-title" style="display:inline">Update multiple rows</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body" style="overflow:auto">
            <div id="tb-jf-mu-loading">
              <img src="pub/cdn/loading.gif" height="140px">
            </div>
            <div id="tb-jf-mu-container">
              <select id="tb-jf-mu-select-field"></select>
              <form id="tb-jf-mu-form">
              </form>
              <button id="tb-jf-mu-btn-save" class="btn btn-primary" type="button">Save</button>
            </div>
          </div>
          <div class="modal-footer" style="padding: 0">
          </div>
        </div>
      </div>
    </div>
  `);

  var $saveBtn = $importModal.find('#tb-jf-mu-btn-save');
  var $mainContainer = $importModal.find('#tb-jf-mu-container');
  var $selectField = $importModal.find('#tb-jf-mu-select-field');
  var $form = $importModal.find('#tb-jf-mu-form');

  function showLoading() {
    $importModal.find('#tb-jf-mu-loading').show();
    $mainContainer.hide();
  }

  function hideLoading() {
    $importModal.find('#tb-jf-mu-loading').hide();
    $mainContainer.show();
  }

  var jfApi;
  function initializeAPI() {
    if (jfApi == null) {
      var apiUrl = TB.CONFIG.API_URL || TB.API_URL || queryParams['api_url']; // TODO use only TB.CONFIG values
      var apiKey = TB.CONFIG.API_KEY || TB.API_KEY || queryParams['api_key']; // TODO use only TB.CONFIG values

      ASSERT.isNotNil(apiUrl, { code: 'TB/MIE/10081' });
      ASSERT.isNotNil(apiKey, { code: 'TB/MIE/10090' });

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

  function createMultipleUpdateModal() {
    $importModal.modal('show');
    createMultipleUpdateInElement($importModal.find('#tb-jf-multiple-import-container'));
  }

  var queryParams = TB.parseQueryParams();
  function createMultipleUpdateInElement($element) {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;

    showLoading();

    initializeAPI();

    jfApi.formCrudEditLoad().then(function (result) {
      var schemaResolver = new TB.tbjson.schemaResolver(result.schema);

      var keyToField = {};
      var keyToSchemaEl = {};

      for (var field of result.form.fields) {

        keyToField[field.key] = field;

        var $opt = $('<option/>').text(field.key).val(field.key);
        $selectField.append($opt);

        var schemaElement = schemaResolver.getByPointer('/' + field.key);

        keyToSchemaEl[field.key] = schemaElement;

        var type = schemaElement.type;

        type = Array.isArray(type) ? type : [type];

        // skip complex types
        if (schemaElement.type.includes('object') || schemaElement.type.includes('array')) {
          continue;
        }

        // skip readonly
        if (schemaElement.readOnly || schemaElement.readonly) {
          continue;
        }

        // skip foreign key cols
        if ('refCol' in schemaElement) {
          continue;
        }
      }

      initializeValidator(result.schema);

      $saveBtn.on('click', e => {
          var queryParams = TB.parseQueryParams();
          ASSERT_USER(queryParams['filter_data'], 'You must filter the rows to update in the CRUD interface', 'TB/JF/MU/1000');

          var filter_data = JSON.parse(queryParams['filter_data']);

          var jfVal = $form.jsonform('values');

          jfApi.tableCrudMultipleUpdateSubmit({
            inserted_array_items: jfVal.insertedArrayItems,
            content_subtree: jfVal.clientData,
            content_subtree_ui: jfVal.clientDataLabels,
            content: jfVal.values,
            filter_data
          }, {
            fileRequest: jfVal.files
          }).then(resp => {
            TB.createNotification('Success', `Successfully updated ${resp.rows} rows`, 'success');
          });

      });

      $selectField.on('change', e => {
        updateForm();
      });

      updateForm();

      function updateForm() {
        var key = $selectField.val();
        var field = keyToField[key];
        var schemaEl = keyToSchemaEl[key];

        var fakeSchemaId = "martitest" + key;

        var jfDescriptor = {
          schema: {
            id: fakeSchemaId,
            $schemaId: fakeSchemaId,
            type: "object",
            properties: {
              [key]: schemaEl
            }
          },
          form: {
            $schemaId: fakeSchemaId,
            fields: [
              {
                ...field,
                [key]: 'value'
              }
            ]
          }
        };

        $form.jsonform('destroy');
        $form.jsonform({ data: jfDescriptor });
      }

      hideLoading();
    })
    .catch(e => ASSERT(0, e));
  }

  window.TB.multipleUpdate = {
    createMultipleUpdateModal,
    createMultipleUpdateInElement
  }
});

