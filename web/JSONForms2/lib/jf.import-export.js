(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    require('jquery','jf.page', 'tbjson.schemaResolver');
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(['jquery', 'jf.page', 'tbjson.schemaResolver'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    factory($, undefined, global.TB.tbjson.schemaResolver);
  }
})(this, function ($, undefined, schemaResolver) {
  var global = window;

  var notify = global.TB.jfpage.createNotification.bind(global.TB.jfpage);
  var queryParams = global.TB.parseQueryParams();

  var $form = $('#tb-jfp-form');
  // $form.on('tb_jfp_submitted', function() { $form.data('jf-unsaved-changes', false) });

  $form.on('tb_jfp_loading_finish', initializeImportExport);

  var $exportBtn;
  var $importFileInput;
  var $importBtn;

  var initializeCalled = false;
  function initializeImportExport() {

    ASSERT_USER(queryParams.jf_hide_export === '1' || queryParams.jf_hide_export === '0' || queryParams.jf_hide_export === undefined, 'Invalid params', 'JF/IE/P');
    if (queryParams.jf_hide_export == '1') {
      return;
    }
    if (initializeCalled) {
      return;
    }
    initializeCalled = true;

    $exportBtn = $('#tb-jfp-btn-export');
    $importFileInput = $('#tb-jfp-input-file-import');
    $importBtn = $('#tb-jfp-label-import');

    ASSERT($exportBtn.length === 1, {$exportBtn});
    ASSERT($importFileInput.length === 1, {$importFileInput});
    ASSERT($importBtn.length === 1, {$importBtn});

    if (TB.jfpage && TB.jfpage.hideSubmit) {
    } else {
      $exportBtn.show();

      if (!queryParams.hide_import_button == "1") {
        $importBtn.show();        
      }

      $( 'body' ).append( $modalSaveAs );
    }

    $exportBtn.on('click', chooseState);
    $importFileInput.on('change', importContent);
  }

  function chooseState() {
    var jfVal = $form.jsonform('values');
    if (_.isEqual(jfVal.clientData, {})) {
      exportContent();
    } else {
      $modalChooseState.modal('show');
      $modalChooseState.find('#tb-jfp-prefix-export-saved').off().click(() => exportContent())
      $modalChooseState.find('#tb-jfp-prefix-export-current').off().click(() => exportContent({ content: jfVal.values}));
    }
  }

  function exportContent(settings = {}) {
    ASSERT(initializeCalled);

    $modalChooseState.modal('hide');

    var jfVal = $form.jsonform('values');

    var formIdentifier = queryParams.table_name || queryParams.form_name;
    var formTitle = queryParams.form_title;
    var tree = $form.data('jfFormTree');
    var keyToTitlePath = tree.keyToTitlePath;
    var schema = tree.formDesc.schema;

    var content;

    if (settings.content) {
      content = settings.content;
    } else {
      content = $form.data('jf-original-args').data.content;
    }

    var NOEXPORT_SUFFIX_PROPS = ['jf_approval_diff_checksum', 'jf_approval_timestamp', 'jf_approval_code', 'jf_approval_pending_data', 'jf_approval_user'];
    for (var prop of NOEXPORT_SUFFIX_PROPS) {
      if (NOEXPORT_SUFFIX_PROPS.some(suff => prop.endsWith(suff))) {
        delete content[prop];
      }
    }

    var NOEXPORT_PROPS_RECURSIVE = ['$schemaId'];
    (function recursiveRemove(obj) {
      if (!_.isObject(obj)) {
        return;
      }
      for (var prop of NOEXPORT_PROPS_RECURSIVE) {
        delete obj[prop];
      }
      for (var prop in obj) {
        recursiveRemove(obj[prop]);
      }
    })(content);

    ASSERT(_.isObject(content));

    function schemaHasProperty(val, key){
      return _.has(schema.properties, key);
    }
    var contentInSchema = _.pickBy(content, schemaHasProperty);
    // var contentInSchema = content;

    var saveObj = { formIdentifier, content: contentInSchema, keyToTitlePath, formTitle };
    var saveString = JSON.stringify(saveObj);
    var contentHash = hashString(saveString);

    createSaveAsModal(queryParams.form_title || formIdentifier, `.${saveString.length}.${contentHash}.json`, fileName => {
      saveAsFile(fileName, saveString);
    });
  }

  function saveAsFile(fileName, saveString) {
    var blob = new Blob([saveString], {type: 'application/json'});
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function importContent(e) {
    var file = e.target.files[0];
    if (!file) {
      notify('Warning', 'No data selected to import!', 'warning');
      return;
    }
    var reader = new FileReader();
    reader.onload = e => handleImportFile(e, file);
    reader.readAsText(file);
  }

  function handleImportFile(e, file) {

      var orig = $form.data('jf-original-args');

      var formTree = $form.data('tb-jf-tree');
      function shouldIgnoreKeySchema(key){
        return formTree.keyToNode[key] && formTree.keyToNode[key].view && formTree.keyToNode[key].view.treatAsLiteral;
      }

      var fileContent = e.target.result;
      var fileName = file.name;

      var matches = fileName.match(/.*\.(\d+)\.([-\d]+)[^.]*\.json/);

      ASSERT_USER(matches, 'Invalid filename!', 'JF/IE/IFN', { fileName, fileContent });

      var contentLen = +matches[1];
      var contentHash = +matches[2];

      ASSERT_USER(contentLen == fileContent.length, 'Import data length doesn\'t match filename!', 'JF/IE/IFL', { fileName, fileContent, contentLen, contentHash });
      ASSERT_USER(contentHash == hashString(fileContent), 'Import data doesn\'t match filename!', 'JF/IE/IFH', { fileName, fileContent, contentLen, contentHash });

      TRACE('import_data', JSON.parse(fileContent));
      var { formIdentifier, content, keyToTitlePath, formTitle } = JSON.parse(fileContent);

      var currFormIdentifier = queryParams.table_name || queryParams.form_name;

      ASSERT_USER(currFormIdentifier == formIdentifier, `Trying to import ${formTitle || formIdentifier} data into ${queryParams.form_title || currFormIdentifier}!`, 'JF/IE/IID', { currFormIdentifier, fileContent, queryParams });

      ASSERT(_.isObject(content), content);
      var extraFields = findContentFieldsMissingFromSchema(content, $form.data('jfFormTree').formDesc.schema, undefined, undefined, undefined, undefined, shouldIgnoreKeySchema );
      TRACE('import_extra_fields', extraFields);

      filterFields(content, extraFields);
      TRACE('import_extra_filtered', content);

      function formatField({path, value, type}) {
        var title = keyToTitlePath[path] || keyToTitlePath[path.slice(1)] || path;
        var valueDisplay = type.includes('object') ? ' (Section)' : `: "${value}"`;
        return title + valueDisplay;
      }

      if (extraFields.length > 0) {
        var extraFieldsFormatted = extraFields.map(formatField).join('\n');
        notify('Warning', `The following fields are not present in the schema and not going to be imported:\n${extraFieldsFormatted}`, 'warning');
      }

      var origContent = orig.data.content;
      orig.data.content = content;

      // full reload
      reloadForm($form, orig);

      // workaround for no diff problem
      $form.jsonform('setOrigContent', {content: origContent});

      $importFileInput.val(null);
    };

  var $modalSaveAs = $(`
    <div id = "tb-jf-prefix-' + 500 + '" style="display: none;" class="modal fade bd-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Save As</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <form id="tb-jfp-save-as-form"> </form>
          </div>
          <div class="modal-footer" style="padding: 0">
          </div>
        </div>
      </div<
    </div>
  `);

  var $modalChooseState = $(`
    <div id = "tb-jf-prefix-' + 500 + '" class="modal fade bd-example-modal-lg" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Warning</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p> You have made changes that you haven't saved. Do you want to export the saved data or the current (edited) data? </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="tb-jfp-prefix-export-current">Export current</button>
            <button type="button" class="btn btn-primary" id="tb-jfp-prefix-export-saved">Export saved</button>
          </div>
        </div>
      </div<
    </div>
  `);

  function reloadForm ($form, data) {
    var tree = $form.data('tb-jf-tree');
    if (tree) {
      var originalContent = tree.formDesc.content;
      $form.empty();
      $form.removeData();
      $form.jsonform(data);
      var newTree = $form.data('tb-jf-tree');
      newTree.formDesc._originalContent = originalContent;
    } else {
      $form.empty();
      $form.removeData();
      $form.jsonform(data);
    }
  }

  function createSaveAsModal(fileNamePrefix, fileNameSuffix, callback) {
    var $newForm = $modalSaveAs.find('#tb-jfp-save-as-form');

    $modalSaveAs.find('.controls').css('width', '85%');

    $modalSaveAs.modal('show');
    $modalSaveAs.show();

    $modalSaveAs.on('shown.bs.modal', function() {
      reloadForm($newForm, {data: {
        schema: {
          id: "http://jschemas.tbpro.com/tblib/jf/page/save-as",
          type: "object",
          properties: {
            fileNamePrefix: {
              type: "string"
            }
          }
        },
        form: {
          $schemaId: "http://jschemas.tbpro.com/tblib/jf/page/save-as",
          gridLayout: true,
          noGridPadding: true,
          fields: {
            fileNamePrefix: {
              key: "fileNamePrefix",
              title: "File name",
              ordering: 10,
              append: fileNameSuffix,
              value: fileNamePrefix
            },
            cancel: {
              type: "button",
              buttonType: "danger",
              title: "Cancel",
              ordering: 30,
              notitle:true,
              buttonFloat: 'right',
              htmlClass: 'tb-jfp-saveas-btn-cancel',
              onClick: () => {
                $modalSaveAs.modal('hide');
                $modalSaveAs.hide();
              }
            },
            save: {
              type: "button",
              title: "Save",
              buttonType: "primary",
              ordering: 20,
              notitle: true,
              buttonFloat: 'right',
              htmlClass: 'tb-jfp-saveas-btn-save',
              onClick: () => {
                var { values, errors } = $newForm.jsonform('values');
                if (errors) {
                  return;
                }
                callback(values.fileNamePrefix + fileNameSuffix);
                $modalSaveAs.modal('hide');
                $modalSaveAs.hide();
              }
            }
          },
          jsonformVersion: "2.0"
        }
      }});
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


  function findContentFieldsMissingFromSchema(content, schema, resolver, path, extraFields, resolverOpts, shouldIgnoreFieldSchema) {
    resolver = resolver || new schemaResolver(schema);
    path = path || '';
    extraFields = extraFields || [];

    resolverOpts = _.cloneDeep(resolverOpts) || {useAdditionalProperties: true};

    if ( content && content.anyOfId) {
      if (resolverOpts.anyOfIds) {
        resolverOpts.anyOfIds.unshift(content.anyOfId); 
      } else {
        resolverOpts.anyOfIds = [content.anyOfId];
      }
    }

    schema = resolver.getByPointer(path, resolverOpts);

    function addExtra(path) {
      extraFields.push({path, type: schemaTypes || [], value: content});
    }

    if (_.isUndefined(schema) || _.isUndefined(schema.type)) {
      addExtra(path);
      return extraFields;
    }

    var schemaTypes = _.isArray(schema.type) ? schema.type : [schema.type];

    if (_.isObject(content)) {
      if (schemaTypes.includes('object') || (_.isArray(content) && schemaTypes.includes('array'))) {
        if ( ! _.isUndefined(schema.properties) || ! _.isUndefined(schema.items) ) {
          for (var key in content) {
            if ( ! shouldIgnoreFieldSchema(key)) {
              var keyPath = `${path}/${key}`;
              findContentFieldsMissingFromSchema(content[key], schema, resolver, keyPath, extraFields, resolverOpts, shouldIgnoreFieldSchema);
            }
          }
        }
      } else {
        addExtra(path);
      }
    } else if (typeof content == 'number' || typeof content == 'string') { // treat numbers and string the same
      if (!(schemaTypes.includes('number') || schemaTypes.includes('integer') || schemaTypes.includes('string'))) {
        addExtra(path);
      }
    } else if (typeof content == 'boolean') {
      if (!schemaTypes.includes('boolean')) {
        addExtra(path);
      }
    } else if (content === null) {
      if (!schemaTypes.includes('null')) {
        // on null do nothing, uncomment to count as diff
        // addExtra(path);
      }
    } else {
      ASSERT(0, 'Type not recognized');
    }
    return extraFields;
  }

  function filterFields(content, fields) {
    for (var field of fields) {
      removeField(content, field.path);
    }
  }

  function removeField(content, path) {
    if (path.startsWith('/')) {
      path = path.slice(1);
    }

    var segments = path.split('/');

    var currentNode = content;
    for (var i = 0; i < segments.length - 1; i++) {
      currentNode = currentNode[segments[i]];
    }

    ASSERT(_.isObject(currentNode), path, content);

    delete currentNode[segments[segments.length - 1]];
  }

    /*
    function hashSchema(schema) {
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


    var DIFF_TYPE_CHANGE = 'type change',
        DIFF_REF_CHANGE = 'ref change',
        DIFF_REMOVE = 'remove',
        DIFF_ADD = 'add',
        DIFF_REMOVE_PROPERTIES = 'remove props',
        DIFF_ADD_PROPERTIES = 'add props',
        DIFF_REMOVE_ITEMS = 'remove items',
        DIFF_ADD_ITEMS = 'add items';

    function findDifferences(s1, s2, path = '', list = []) {

      ASSERT(s1 && s2);

      if (path == '') {
        if (s1.definitions && s2.definitions) {
          for (var id in s1.definitions) {
            var idPath = `#/definitions/${id}`;
            if (id in s2.definitions) {
              findDifferences(s1.definitions[id], s2.definitions[id], idPath, list, s1, s2);
            }
          }
        }
      }

      if (!_.isEqual(s1.type, s2.type)) {
        list.push({type: DIFF_TYPE_CHANGE, path, from: s1.type, to: s2.type});
        return list;
      }

      if (s1.$ref && s1.$ref != s2.$ref) {
        list.push({type: DIFF_REF_CHANGE, path, from: s1.$ref, to: s2.$ref});
        return list;
      }

  // if (s1.type == 'object') {
        if (s1.properties && s2.properties) {
          var checkedProps = [];
          for (var prop in s1.properties) {
            var propPath = path + `/${prop}`;
            if (prop in s2.properties) {
              findDifferences(s1.properties[prop], s2.properties[prop], propPath, list);
              checkedProps[prop] = 1;
            } else {
              list.push({type: DIFF_REMOVE, path: propPath});
            }
          }

          for (var prop in s2.properties) {
            var propPath = path + `/${prop}`;
            if (!(prop in s1.properties)) {
              list.push({type: DIFF_ADD, path: propPath});
            }
          }
        } else if (s1.properties) {
          list.push({type: DIFF_REMOVE_PROPERTIES, path});
        } else if (s2.properties) {
          list.push({type: DIFF_ADD_PROPERTIES, path});
        }
  // }

  // if (s1.type == 'array') {
        if (s1.items && s2.items) {
          findDifferences(s1.items, s2.items, path + '[0]', list);
        } else if (s1.items) {
          list.push({type: DIFF_REMOVE_ITEMS, path});
        } else if (s2.items) {
          list.push({type: DIFF_ADD_ITEMS, path});
        }
  // }

      return list;
    }

    function formatDifferences(list) {
      var signs = {
        [DIFF_TYPE_CHANGE]: '!',
        [DIFF_REF_CHANGE]: '#',
        [DIFF_REMOVE]: '-',
        [DIFF_ADD]: '+',
        [DIFF_ADD_ITEMS]: '!',
        [DIFF_REMOVE_ITEMS]: '!',
        [DIFF_ADD_PROPERTIES]: '!',
        [DIFF_REMOVE_PROPERTIES]: '!'

      };
      var output = '';
      for (var diff of list) {
        output += `${signs[diff.type] || '?'} ${diff.path}\n`;
      }
      return output;
    }
    */

});
