/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @desc Handling files inside the browser
 * @module File
 * @memberOf TB
 */
(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('lodash'), require('tb.xerrors'), require('jf.utils'), require('jf.api'), require('tbjson.ajv2tb'), require('tbjson.deepmerge'), require('tb.translate'));
  } else if (typeof define === 'function' && define.amd) {
    define(['lodash', 'tb.xerrors', 'jf.utils', 'jf.api', 'tbjson.ajv2tb', 'tbjson.deepmerge', 'tb.translate'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    global.TB = global.TB || {};
    // TODO това да се разкара, трябва да се каже на цецо, да го търсят в правилния namespace
    global.TB.jf = global.TB.jf || global.TB.JSONForm || {};

    global.TB.jf.jfTiny = factory(global._, global.TB, global.TB.jf.utils, global.TB.jf.API, global.TB.tbjson.ajv2tb, global.TB.tbjson.deepmerge, global.TB.Translate);
    global.TB.JSONForm = global.TB.jf;
  }
})(this, function (_, TB, jfUtils, JfApi, tbjsonAjv2tb, tbjsonDeepmerge, TbTranslate) {
  'use strict';

  var PASSWORD_LABELS = {
    'old': 'Old Password',
    'new': 'New Password',
    'confirm': 'Confirm Password'
  };

  function afterSuccessCb () {
    alert('Successfully saved');
  }

  function populateField (domEl, elSchema, initValue, jfTinyInstance) {
    var nodeName = domEl.nodeName.toLowerCase();

    if (nodeName === 'select') {
      if (elSchema.type === 'boolean') {
          elSchema.enum = [true, false];
          elSchema.enumNames = ['YES', 'NO'];
      }
      if ( elSchema.enum === undefined ) {
        var resources = jfTinyInstance.apiResult.resources;
        if ( resources ) {
          elSchema.enum = [];
          elSchema.enumNames = [];
          var myResources = resources[ elSchema.refTable ];
          var records = myResources.records;
 
          var idKey = elSchema.refCol;
          var titleKey = elSchema.refColTitle;
          if ( !titleKey && records[0].name ) {
            titleKey = 'name';
          }

	  if ( jfUtils.contains(elSchema.type, "null") ) {
            elSchema.enum.push("");
            elSchema.enumNames.push("-");
          }

          for ( var i = 0; i < records.length; i++ ) {
            var value = jfUtils.forceValueTypes(jfTinyInstance.schema, elSchema, records[ i ][ idKey ]);
            var title = records[i][ titleKey ];

            elSchema.enum.push( value );
            elSchema.enumNames.push( title );
          }
        }
      }

      ASSERT.isArray(elSchema.enum, { msg: 'Found select field, but missing enum in schema, please check your schema first near $schema$.', msgParams: { schema: elSchema } });

      // removeChildren
      while (domEl.hasChildNodes()) {
        domEl.removeChild(domEl.lastChild);
      }

      // add options elements
      for (var i = 0, l = elSchema.enum.length; i < l; i++) {
        var value = elSchema.enum[i];
        var label = translate(elSchema.enumNames[i]);
        // Check if current option is selected, wheter in multiple or single <select>
        var selected = (initValue === undefined)
          ? false
          : (initValue instanceof Array)
              ? (initValue.indexOf(value) >= 0)
              : (initValue === value);

        value = (value === null) ? '' : value;

        domEl.appendChild(createOptionNode(value, label, selected));
      }
    } else if (nodeName === 'input' || nodeName === 'textarea') {
      if (domEl.type === 'file') {
        window.c = window.c || 1;
        domEl.setAttribute('data-value', initValue || '');
        domEl.value = '';
      } else if (domEl.type === 'checkbox') {
        domEl.checked = !!initValue;
        domEl.value = initValue || '';
      } else {
        domEl.value = initValue || '';
      }
    } else if (nodeName === 'textarea') {
      // Just in case to show that textarea is used in different way
      domEl.innerHTML = initValue || '';
    } else {
      domEl.innerHTML = initValue || '';
    }
  }

  function createOptionNode (value, label, selected) {
    var optionNode = document.createElement('option');

    optionNode.value = value;
    optionNode.innerHTML = label !== undefined ? label : value;
    optionNode.selected = !!selected;

    return optionNode;
  }

  function populateLabel (elSel, elSchema) {
    if (!elSchema.title && elSchema.title !== 0) return;

    var el = elSel;

    el = getEl(el);

    ASSERT(el, { msg: 'Cannot find <label> in DOM for $schema$ `title`. Looking for DOM with selector $elsel$, but $el$ found.', msgParams: { schema: elSchema, elsel: elSel, el: el } });

    el.innerHTML = translate(elSchema.title);
  }

  function populateDescr (elSel, elSchema) {
    if (!elSchema.description && elSchema.description !== 0) return;

    var el = elSel;

    el = getEl(el);

    ASSERT(el, { msg: 'Cannot find <label> in DOM for $schema$ `description`. Looking for DOM with selector $elsel$, but $el$ found.', msgParams: { schema: elSchema, elsel: elSel, el: el } });

    el.innerHTML = translate(elSchema.description);
  }

  function getJsonPathFromId (idStr) {
    var parts = idStr.match('tb-jf.*?-id-(.*)');

    if (!parts) {
      return null;
    }

    return jfUtils.unescapeId(parts[1]);
  }

  function getPasswordFieldTypeFromId (idStr) {
    var parts = idStr.match('tb-jf.*?-field-slave-(.*)-id-.*');

    if (!parts) {
      return null;
    }

    return parts[1];
  }

  var translate = function (str) {
    return str;
  };

  function getEl (el) {
    if (el instanceof Element) {
      return el;
    }

    return document.querySelector(el);
  }

  function replaceFieldId (fieldId, value) {
    return fieldId.replace(/(#)?(tb-jf\w*-\d+)-field-((slave-[a-zA-Z0-9_]*-)?id-[a-zA-Z0-9_]+)/, '$1$2-' + value + '-$3');
  }

  function afterSuccessCb () {
    alert('Successfully saved');
  }


  var p = {};

  function jfTiny (method, opts) {
    if (opts === undefined) {
      if (typeof method !== 'string') {
        opts = method;
        method = 'init';
      }
    }

    var apiUrl = opts.apiUrl || TB.API_URL;
    var apiKey = opts.apiKey || TB.API_KEY;
    var formTitle = opts.formTitle || TB.formTitle;

    ASSERT.isNotNil(apiUrl, { msg: 'Missing apiUrl. Please check if you`ve given `apiUrl` property to jfTiny`s constructor OR set it globally through `TB.API_URL`.' });
    ASSERT.isNotNil(apiUrl, { msg: 'Missing apiKey. Please check if you`ve given `apiKey` property to jfTiny`s constructor OR set it globally through `TB.API_KEY`.' });

    this.s = opts;

    // TODO allow defaults
    this.s.locale = this.s.locale || 'en_US';
    this.s.lockFields = (this.s.lockFields === undefined) ? 'disabled' : this.s.lockFields;
    this.s.afterSuccessCb = this.s.afterSuccessCb ? this.s.afterSuccessCb : afterSuccessCb;

    ASSERT(this.s.lockFields === 'false' || /disabled|readonly/.test(this.s.lockFields), { msg: 'lockFields property must be false, "disabled"(default) or "readonly", but given $value$', msgParams: { value: this.s.lockFields } });

    this.el = getEl(opts.el);
    this.validator = tbjsonAjv2tb.getAjv2tbInstance();
    this.jsonPathCache = {};
    this.api = new JfApi({
      apiUrl: apiUrl,
      apiKey: apiKey,
      form_title: formTitle,
      payloadParams: this.s.payloadParams,
      requestParams: this.s.requestParams
    });

    this.init(opts);
  }

  jfTiny.prototype = p;

  p.init = function init (s) {
    var self = this;

    if (s.formDesc !== undefined) {
      this.schema = s.formDesc.schema;
      this.content = s.formDesc.content;

      this.setupForm();
    } else if (s.payloadParams) {
      this.api.formLoad(s.payloadParams)
        .then(function (result) {
          TRACE("Result from server: ", result);
          ASSERT(result.schema, { msg: "No schema given from the server!", code: "JFT600" });
          ASSERT(result.content, { msg: "No content given from the server!", code: "JFT650" });
          self.schema = result.schema;
          self.content = result.content;

	  // save the result for the resources field!
          self.apiResult = result;
          self.translate = new TbTranslate(result.translations, [self.s.locale], Object.keys(result.translations)[0]);

          translate = function (str) {
            return self.translate.gettext(str);
          };

          self.setupForm();
        })
        .catch(function (err) {
          self.triggerEvent('error', {
            msg: 'Unable to load form!',
            errData: err
          });

          throw err;
        });
    } else {
      THROW_SYS('Must have either `formDesc` or `url`&`params` options');
    }
  };

  p._loopByIds = function _loopByIds (fieldIds, cb) {
    ASSERT.isArray(fieldIds, { code: 10510, msg: 'fieldIds must be an array, but $fieldIds$ given', msgParams: { fieldIds: fieldIds } });

    for (var i = 0, l = fieldIds.length; i < l; i++) {
      var fieldId = fieldIds[i];
      var field = getEl('#' + fieldId);

      ASSERT(field, { code: 10520, msg: 'Unable to find field with id `$fieldId$`', msgParams: { fieldId: fieldId } });

      var jsonPath = getJsonPathFromId(fieldId);
      var schema = tbjsonAjv2tb.getSchemaByJsonPointer(this.schema, jsonPath);
      var value = jfUtils.getObjByKey(this.content, jsonPath);

      var keepLooping = cb(field, schema, value, jsonPath);

      if(keepLooping === false) break;
    }
  }

  p.resetFields = function resetFields (fieldIds) {
    var self = this;

    this._loopByIds(fieldIds, function(field, schema, value, jsonPath) {
      populateField(field, schema, value, self);

      self.clearErrors(field);
    });
  };

  p.hasDirtyFields = function hasDirtyFields (fieldIds) {
    var self = this;
    if ( ! self.schema ) {
      return false;
    }

    var hasDirtyFields = false;

    this._loopByIds(fieldIds, function(field, schema, value, jsonPath) {
      hasDirtyFields = self._isDirtyField(field, value, schema);

      if(hasDirtyFields) {
        return false;
      }
    });

    return hasDirtyFields;
  };

  p.setupForm = function setupForm () {
    // jfUtils.escapeSchemaKeys(this.schema);

    this.validator.compile(this.schema, this.schema.id);
    this.populateForm();
    // this.listenForSubmit();

    this.triggerEvent('ready', { instance: this });
  };

  p.populateForm = function populateForm () {
    var fields = this.el.querySelectorAll('.tb-jft-field');

    for (var i = 0, l = fields.length; i < l; i++) {
      var field = fields[i];

      ASSERT(field.id, { msg: 'Missing field HTML attribute id on field. Please check the additional data of this error for more info.', msgParams: { dom: field } });

      var jsonPath = getJsonPathFromId(field.id);
      var elSchema = tbjsonAjv2tb.getSchemaByJsonPointer(this.schema, jsonPath);
      var value = jfUtils.getObjByKey(this.content, jsonPath);

      this.jsonPathCache[ jsonPath ] = {
        origId: field.id
      };

      ASSERT(_.isPlainObject(elSchema), { code: 10010, msg: 'Schema must be an object, but $schema$ given. I guess there is an field in DOM which resolves to path with $path$, so please check whether your DOM has loaded the most recent HTML ids and other meta data.', msgParams: { schema: elSchema, path: jsonPath, value: value, field: field } });

      if (field.type === 'password') {
        var old = elSchema.title;

        elSchema.title = PASSWORD_LABELS[getPasswordFieldTypeFromId(field.id)];
        populateLabel('#' + field.id.replace(/(tb-jf\w*-\d+)-field(-slave-\w*-)(id-[a-zA-Z0-9_]+)/, '$1-' + 'label' + '$2$3'), elSchema);

        elSchema.title = old;
        field.value = '';
      } else {
        populateField(field, elSchema, value, this);
        populateLabel('#' + replaceFieldId(field.id, 'label'), elSchema);
        populateDescr('#' + replaceFieldId(field.id, 'descr'), elSchema);
      }
    }

    return field;
  };

  p.toggleLockFields = function (toggle) {
    var attr = this.s.lockFields;

    if (!attr) return;

    var els = this.el.querySelectorAll('.tb-jft-field');

    for (var i = 0, l = els.length; i < l; i++) {
      var el = els[i];

      el[attr] = (toggle instanceof Boolean) ? toggle : !el[attr];
    }
  };

  p.listenForSubmit = function listenForSubmit () {
    var self = this;

    this.el.addEventListener('submit', function (e) {
      e.preventDefault();

      self.submit(e.target);
    });
  };

  p._isDirtyField = function _isDirtyField (el, oldVal, schema) {
    var passwordType = getPasswordFieldTypeFromId(el.id);
    var nodeName = el.nodeName.toLowerCase();

    console.log("Private _isDirtyField ", typeof el.value, el.value, "|| ", typeof oldVal, oldVal, "||", el.name, el.id, !(el.value === '' && oldVal === null), el.value !== (oldVal + ''));

    oldVal = oldVal === null || typeof oldVal === 'undefined' ? '' : oldVal;

    if (el.type === 'file') {
      return (el.files.length > 0);
    } else if (el.type === 'checkbox') {
      return el.checked !== oldVal;
    } else if (passwordType) {
      return el.value !== '';
    } else if (nodeName === 'select') {
      return el.value != oldVal;
    } else {
      var val = el.value;
      //TODO: probably use the forceValueTypes function of the jfUtils module?
      if (jfUtils.contains(schema.type, 'number') || jfUtils.contains(schema.type, 'integer')) {
        val = Number(val);
      }
      
      return val !== oldVal;
    }

    return false;
  };

  p.submit = function submit () {
    var self = this;
    var els = this.el.querySelectorAll('.tb-jft-field');
    var rawResult = {};
    var files = {
        fileRequest: {},
    }; 
    var files_for_validation = {};


    var passwordFields = {};
    var filePromises = [];

    this.toggleLockFields(true);
    
    for (var i = 0, l = els.length; i < l; i++) {
      var el = els[i];
      var jsonPath = getJsonPathFromId(el.id);
      var passwordType = getPasswordFieldTypeFromId(el.id);
      

      if (el.type === 'file') {
        var schemaElement = tbjsonAjv2tb.getSchemaByJsonPointer(this.schema, jsonPath);
        //if (el.getAttribute('tb-jf-type') === 'fileRequest') { TODO: make jf give tbjftype
        if ((el.getAttribute('tb-jf-type') === 'fileRequest' || schemaElement.format === 'file') && el.files.length > 0) {
          files.fileRequest[jsonPath] = {
            name: el.files[0].name,
            file: el.files[0],
          };
          
          files_for_validation[el.name] = {};
          var resValueEntry = files_for_validation[el.name];
          resValueEntry['name'] = [];
          resValueEntry['file'] = []

          for (var j = 0; j < el.files.length; j++) {
            resValueEntry['name'][j] = el.files[j].name;
            resValueEntry['file'][j] = el.files[j];
          } 

          // @TODO - escape triple pipes
          jfUtils.setObjValueByKey(rawResult, jsonPath, resValueEntry['name'].join('|||')); 
        } else {
          if (el.files.length > 0) {
            (function (jsonPath) {
              var filePromise = TB.File.loadFile(el.files[0], 'DataURL')
                .then(function (fileContent) {
                  jfUtils.setObjValueByKey(rawResult, jsonPath, fileContent);
                });
              filePromises.push(filePromise);
            })(jsonPath);
          } else {
            jfUtils.setObjValueByKey(rawResult, jsonPath, el.dataset.value);
          }
          // Handle all password fields separately
        }

      } else if (passwordType !== null) {
        if (!passwordFields.hasOwnProperty(jsonPath)) {
          passwordFields[jsonPath] = {};
        }

        passwordFields[jsonPath][passwordType] = el.value;

        /* eslint-disable operator-linebreak */
        if (passwordFields[jsonPath].hasOwnProperty('confirm') && passwordFields[jsonPath]['confirm'] !== ''
           && passwordFields[jsonPath].hasOwnProperty('old') && passwordFields[jsonPath]['old'] !== ''
           && passwordFields[jsonPath].hasOwnProperty('new') && passwordFields[jsonPath]['new'] !== '') {
       /* eslint-enable operator-linebreak */
          var value = Object.keys(passwordFields[jsonPath]).reduce(function (res, key) {
            res[key + 'Value'] = passwordFields[jsonPath][key];
            return res;
          }, {});

          jfUtils.setObjValueByKey(rawResult, jsonPath, JSON.stringify(value));
          delete passwordFields[jsonPath];
        } else {
          jfUtils.setObjValueByKey(rawResult, jsonPath, null);
        }
      } else if (el.type === 'checkbox') {
        jfUtils.setObjValueByKey(rawResult, jsonPath, el.checked);
      } else {
        jfUtils.setObjValueByKey(rawResult, jsonPath, el.value);
      }
    }

    Promise.all(filePromises)
      .then(function (values) {
        var result = jfUtils.forceValueTypes(self.schema, self.schema, rawResult);

        result = jfUtils.mergeValues(self.content, result);

        self.validator.files = files_for_validation;
        var valid = self.validator.validate(self.schema, result);

        if (valid !== true) {
          self.clearAllErrors();
          console.log('Invalid values :(', valid);

          self.setErrors(valid.tbData.validationErrors);
          self.toggleLockFields(els, false);

          self.triggerEvent('error', {
            msg: 'Unable to submit form! Invalid data, browser check!',
            errData: valid
          });

          return;
        }

        result.$schemaId = result.$schemaId || self.content.$schemaId || self.schema.id;

        return self.api.formSubmit(_.merge({ content: _.merge(self.content, result) }, self.s.payloadParams), files)
          .then(function (result) {
            self.content = result.content;

            self.toggleLockFields(els, false);
            self.populateForm();
            self.triggerEvent('submitted', { instance: self });
          });
      })
        .catch(function (err) {
          self.toggleLockFields(els, false);

          if (_.has(err, 'reqErr.validationErrors')) {
            console.log('Invalid values2 :(', err);

            self.clearAllErrors();
            self.setErrors(err.reqErr.validationErrors);
          }

          self.triggerEvent('error', {
            msg: 'Unable to submit form!',
            errData: err
          });

          throw err;
        });
  };

  p.clearAllErrors = function clearAllErrors () {
    var errMsgs = this.el.querySelectorAll('.tb-jft-msg');

    if (!errMsgs) return;

    for (var i = 0, l = errMsgs.length; i < l; i++) {
      errMsgs[i].innerHTML = '';
    }
  };

  p.clearErrors = function clearErrors (elSel) {
    var el = getEl(elSel);

    ASSERT(el, { code: 10530, msg: 'Unable to find field $elSel$', msgParams: { elSel: elSel }})

    var errMsg = getEl('#' + replaceFieldId(el.id, 'msg'));

    ASSERT(errMsg, { code: 10540, msg: 'Unable to find msg for field $elSel$', msgParams: { elSel: elSel }})

    errMsg.innerHTML = '';
  };

  /**
   * @param {Array[Object]} errList
   * @todo Set error class
   * @example
   *   jft.setErrors([{
   *    msg: 'Translated message here!',
   *    dataPath: '/path/to/field'
   *   }]);
   **/


  p.setErrors = function setErrors (errList) {
    for (var i = 0, l = errList.length; i < l; i++) {
      var errObj = errList[i];
      var jsonPath;
      if ( errObj.dataPath ) {
        // arbitrary change in format ...
        jsonPath = errObj.dataPath.replace(/\./g, '/').substring(1);
      } else {
      	jsonPath = errObj.tbData.debug.ajvErr.dataPath.replace(/\./g, '/').substring(1);

      }


      // TODO should become assert, not continue :) @ivo fix ids please!
      if (!this.jsonPathCache[ jsonPath ]) continue;

      var errorMessage = this.translate.gettext(errObj.msg);

      var id = '#' + this.jsonPathCache[ jsonPath ].origId;
      var el = getEl(id);
      var errMsg = getEl(replaceFieldId(id, 'msg'));

      ASSERT(errMsg, { msg: 'Unable to find the element to set message in. Please check your DOM, because no element with id selector $id$ found.', msgParams: { id: replaceFieldId(id, 'msg') } });

      errMsg.innerHTML = errorMessage;

      var event = new CustomEvent('tb.jft.error', {
        detail: {
          errData: errObj
        }
      });

      el.dispatchEvent(event);
    }
  };

  p.triggerEvent = function triggerEvent (eventName, data) {
    console.log('Event triggered ' + eventName);

    var event = new CustomEvent('tb_jft_' + eventName, {
      detail: data
    });

    this.el.dispatchEvent(event);
  };

  return jfTiny;
});



