
/* Copyright (c) 2!012 Joshfire - MIT license */
/**
 * @fileoverview Core of the JSON Form client-side library.
 *
 * Generates an HTML form from a structured data model and a layout description.
 *
 * The library may also validate inputs entered by the user against the data model
 * upon form submission and create the structured data object initialized with the
 * values that were submitted.
 *
 * The library depends on:
 *  - jQuery
 *  - the underscore/lodash library
 *  - a json parser/serializer. Nothing to worry about in modern browsers.
 *  - a jsonSchema validation library Ajv for validation purpose
 *
 * See documentation at:
 * http://developer.joshfire.com/doc/dev/ref/jsonform
 *
 * The library creates and maintains an internal data tree along with the DOM.
 * That structure is necessary to handle arrays (and nested arrays) that are
 * dynamic by essence.
 */

 /* global window */

// TODO array reordering DOM parents

(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('lodash'), require('tb.xerrors'), require('jf.utils'), require('tb.template'),
      require('tb.file'), require('tbjson.ajv2tb'),
      require('moment-2'), require('jquery'), require('tinymce-4'),
      require('tbjson.traverseSchema'),
      require('jsoneditor-5'), require('tbjson.jsonpointer'), require('tbjson-generatesubtree'),
    );
  } else if (typeof define === 'function' && define.amd) {
    define(['lodash', 'tb.xerrors', 'jf.utils', 'tb.template', 'tb.file', 'tbjson.ajv2tb',
      'moment', 'jquery', 'tinymce-4', 'tbjson.traverseSchema', 'jsoneditor-5', 'tbjson.jsonpointer', 'tbjson-generatesubtree'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    global.TB = global.TB || {};
    global.TB.jf = global.TB.jf || {};
    global.TB.jf.ui = factory(global._, global.TB, global.TB.jf.utils,
      global.TB.Template, global.TB.File, global.TB.tbjson.ajv2tb, global.moment, global.jQuery, global.tinyMCE, global.TB.tbjson.traverseSchema,
      global.JSONEditor, global.TB.tbjson.jsonpointer, global.TB.tbjson.generateObjectLevelDiffPatch);
  }
})(this, function (_, TB, jfUtils, tbTemplate, tbFile, tbjsonAjv2Tb, moment, $, tinyMCE, tbjsonTraverseSchema, JSONEditor, tbjsonJsonpointer, tbjsonGenerateSubtree) {
  'use strict';

  // ace & tinymce do not require-export their variables
  tinyMCE = tinyMCE || window.tinyMCE;
  JSONEditor = JSONEditor || window.JSONEditor;
  ace = window.ace;
  
  TB.performance = TB.performance || {};

  // TODO find a better place for this (use URL params?)
  TB.CONFIG.XERRORS_LOG_CONSOLE = true;
  var regexRepalceComputeInitialValues = '{{values/';

  /**
   * The jsonform object whose methods will be exposed to the window object
   */
  var jsonform = {util: {}};
  var editors = {};
  var totalTimeInInsertms = 0;

  var REGEX = {
    PATH_ADDITIONAL_PROPERTIES: /\{\}/g,
    PATH_ARRAY: /\[[0-9]*\]\/?/g,
    PATH_FILTERSCHEMA: /\/(?!filterSchema)/g,
    GET_ARRAY_INDEX_FROM_INPUT_FIELD: /\[([0-9]*)\](?=\[|\/|$)/g,
    ESCAPE_SELECTOR: /([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g,
    EVALUATE_VIEW: /\{\[([\s\S]+?)\]\}/g,
    INTERPOLATE_VIEW: /\{\{([\s\S]+?)\}\}/g,
    REPLACE_ESCAPED_KEY: /\.|~|\/|#/,
    REPLACE_UNESCAPED_KEY: /\.|~|\/|#/,
    MAGIC_REGEX: /^((([^\\[/]|\\.)+)|\[(\d+)\])\/?(.*)$/,
    MAGIC_REGEX_2: /\{\{values\/([^}]+)\}\}/g,
    MAGIC_REGEX_3: /^((([^\\[/]|\\.)+)|\[(\d+)\])\/?(.*)$/,
    REMOVE_NUMBERS_FROM_ARRAY_INDEX_IN_INPUT_FIELD: /\[[0-9]+\]/g,
    GET_CLOSEST_ARRAY_PARENT: /\[\][^[\]]*$/,
    EVALUATE_TEMPLATE: /<%([\s\S]+?)%>/g,
    INTERPOLATE_TEMPLATE: /<%=([\s\S]+?)%>/g,
    REPLACE_ALL_DASHES_WITH_DOTS: /\//g,
    CATCH_CONTAINER_OR_FIELD: /tb-jf.{0,1}-\d-(container|field)-id-.*/g
  };

  var QUESTIONARY_TYPES = {
    text: {
      title: 'Text',
      schemaType: 'string'
    },
    number: {
      title: 'Number',
      schemaType: 'number'
    },
    select: {
      title: 'Select',
      schemaType: 'string',
      formType: 'select',
      hasValues: true
    },
    checkbox: {
      title: 'YES/NO',
      schemaType: 'boolean',
      // formType: 'checkbox'
    }
    /*
    multipleselect: {
      title: 'Multiple select',
      schemaType: 'string',
      formType: 'multipleselect',
      hasValues: true
    }
    */
  };

  var pA = function () {
    var lineNumber = (new Error).stack.split("\n")[2];
    var argArray = Array.from(arguments);
    var beginLog = argArray.pop();

    for (var i = 0; i < argArray.length; i++) {
      console.info(beginLog + i, _.cloneDeep(argArray[i]), lineNumber);
    }
  }

  var removeFromContent = function (content, key) {
    var keyParsed = key.split('/');
    _.unset(content, keyParsed);
  }

  var removeCustomSchemaFromSchemaDefinitions = function (schema) {
    if (schema && schema.definitions) {
      delete schema.definitions[tbjsonAjv2Tb.metaSchema.id];
      delete schema.definitions[jfUtils.escapeKey(tbjsonAjv2Tb.metaSchema.id)];
    }
  }

  var removeFromContentWithSchemaKey = function (schemaKey, content) {

  }

  var mergeContentAndFormValues = function (content, formValue, schema, form) {
    // @TODO: check why it explodes with velisalv stuff
    // var processedContent = tbjsonAjv2Tb.preprocessContent(content, formValue, schema);
    // return jfUtils.mergeValues(content, processedContent);

    return jfUtils.mergeValues(content, formValue, form);
  }

  var replaceCurlyBracesWithData = function (template, replaceWith) {
    return template.replace(REGEX.PATH_ADDITIONAL_PROPERTIES, '/' + replaceWith);
  };

  var setDataToField = function (field, replaceWithKey) {
    field.formElement.additionalPropertiesKey = field.formElement.key;
    field.formElement.key = replaceCurlyBracesWithData(field.formElement.key, replaceWithKey);

    // If its helptext, it shouldn't have id...
    if (field.formElement.id) {
      field.formElement.id = replaceCurlyBracesWithData(field.formElement.id, replaceWithKey);
    }

    field.formElement.name = field.formElement.key;

    if (field.formElement.type === 'helptext') {
      var currView = _.clone(field.view);

      currView.template = tbTemplate.render(field.formElement.content, {'objKey': replaceWithKey});
      field.view = currView;
    }
  };

  var getDefaultTimeValue = function (node) {
    var value;

    if (!_.isUndefined(node.value)) {
      value = node.value
    } else if (!_.isUndefined(node.schemaElement.default)) {
      value = node.schemaElement.default;
    } else if (node.formElement.useNowAsDefault) {
      value = moment(new Date()).format(node.formElement.pluginoptions.format);
    }

    return value;
  }

  /**
   * Template settings for form views
   */
  var fieldTemplateSettings = {
    evaluate: REGEX.EVALUATE_TEMPLATE,
    interpolate: REGEX.INTERPOLATE_TEMPLATE
  };

  var PG_INTERVAL_NAMES = ['microseconds', 'milliseconds', 'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'quarters', 'years', 'decades', 'centuries', 'millennia'];

  /**
   * Template settings for value replacement
   */
  var valueTemplateSettings = {
    evaluate: REGEX.EVALUATE_VIEW,
    interpolate: REGEX.INTERPOLATE_VIEW
  };

  var _template = (typeof _.template('', {}) === 'string')
    ? _.template
    : function (tmpl, data, opts) {
      if (data &&
        data.node &&
        data.node.view.template &&
        data.node.isTbTemplate === true) {
        // return TB.Template.render(tmpl);
        return _.template(tmpl, opts)(data);
      } else {
        return _.template(tmpl, opts)(data);
      }
    };

  /**
   * Regular expressions used to extract array indexes in input field names
   */
  var reArray = REGEX.GET_ARRAY_INDEX_FROM_INPUT_FIELD;

  /**
   * create a json object of the format key: value
   * containing the latest value for the current element
   *
   * for nested objects include only the property which is
   * goingto be validated
   */
  var constructObjectByKey = function (key, val) {
    ASSERT.isString(key, {msg: 'constructObjectByKey: given invalid value for key %KEY%.', msgParams: {KEY: key}, code: 2010});
    return _.set({}, key.split('/'), val);
  };

  /**
   * Sort the keys of an abject according to the ordering keyword or the key name.
   */
  var getSortedPropertyKeys = function (object) {
    ASSERT.isPlainObject(object, {msg: 'Only the properties of objects can be sorted, but given $object$', code: 2030, msgParams: {object: object} });

    return _(object)
      .keys()
      .sortBy([
        function (prop) {
          return object[prop].ordering;
        },
        function (prop) {
          return prop;
        }
      ])
      .value();
  };

  /*
   * Given an object and a key it checks whether the key contains
   * ~0, ~1 or ~9 and in case it does the key is deleted and a new one
   * with escaped characters is created
   *
   * @function
   * @param {Object} the object whose key may be replaced
   * @param {oldKey} the key which may contain ~9, ~1 or ~0
   */
  var replaceEscapedKey = function (collection, oldKey) {
    if (String(oldKey).match(REGEX.REPLACE_ESCAPED_KEY)) {
      var key = jfUtils.unescapeKey(String(oldKey));

      collection[key] = collection[oldKey];
      delete collection[oldKey];
    }
  };

  /*
   * Parse the content/value and rename the keys containg . or ~
   *
   * @function
   * @param {Object} the object whose key may be replaced
   * @param {oldKey} the key which may contain a ~9, ~1 or ~0
   */
  var escapeValueKeys = function (content, obj) {
    if (!obj) {
      obj = {};
    }

    _.each(content, function (value, key) {
      key = String(key);
      if (_.isPlainObject(value)) {
        obj[jfUtils.escapeKey(key)] = {};
        escapeValueKeys(value, obj[jfUtils.escapeKey(key)]);
      } else if (_.isArray(value)) {
        obj[jfUtils.escapeKey(key)] = [];
        escapeValueKeys(value, obj[jfUtils.escapeKey(key)]);
      } else {
        obj[jfUtils.escapeKey(key)] = value;
      }

    });

    return obj;
  };

  /**
   * Parse the content/value and rename the keys containg . or ~
   *
   * @function
   * @param {Object} the object whose key may be replaced
   * @param {oldKey} the key which may contain ~9, ~1 or ~0
   */
  var unescapeValueKeys = function (content) {
    _.each(content, function (value, key) {
      replaceEscapedKey(content, key);
      if (typeof value === 'object') {
        unescapeValueKeys(value);
      }
    });
  };

  /**
   * getInnermostJsonPathKey( form/element1/subproperty ) => subproperty
   * getInnermostJsonPathKey( form/element1/arrSubproperty[] ) => arrSubproperty
   */
  var getInnermostJsonPathKey = function (key) {
    var childKeysArray = convertJsonPathStringToArray(key);
    var innermostChild = '';

    for (var i = childKeysArray.length - 1; i >= 0; i--) {
      innermostChild = childKeysArray[i];

      if (innermostChild !== '') {
        break;
      }
    }

    if (innermostChild.slice(-2) === '[]') {
      innermostChild = innermostChild.slice(0, -2);
    }

    return innermostChild;
  };

  var convertJsonPathStringToArray = function (path) {
    return path.split('/');
  };

  var getArrayFieldValueHtml = function (domElement, tree) {

    ASSERT(tree);

    var formArray = [];
    formArray = formArray.concat( $( $(domElement)[0].querySelectorAll('input') ).serializeArray() );
    formArray = formArray.concat( $('select', domElement).serializeArray() );

    _.each(_.keys(jsonform.elementTypes), function (elementType) {
      if (jsonform.elementTypes[elementType].getFieldValue) {
        formArray = formArray.concat(
          $('[data-tb-jf-type="' + elementType + '"]:not(.tb-jf-disabled)', $(domElement).get(0)).map(function () {
            return jsonform.elementTypes[elementType].getFieldValue(this, tree);
          }).get()
        );
      }
    });

    return formArray;
  };

  /**
   * Get the schema element with the specified key
   *
   * @function
   * @param {Object} the whole schema object
   * @param {String} schema key
   * @return {Object} The schema definition of the keys' parent.
   */
  var getParentSchemaByKey = function (formDesc, key, ownerTree, node, formElement) {
    key = tbjsonAjv2Tb.jsonformPointerToJsonPointer(key).split('/');
    key.pop();
    key = key.join('/');

    return tbjsonAjv2Tb.getSchemaByJsonPointer(formDesc.schema, key, undefined, getAnyOfIdsByParentFormElements(formElement) || _.cloneDeep(node.anyOfIds));
  };

  /**
   * Truncates the key path to the requested depth.
   *
   * For instance, if the key path is:
   *  foo/bar[]/baz/toto[]/truc[]/bidule
   * and the requested depth is 1, the returned key will be:
   *  foo/bar[]/baz/toto
   *
   * Note the function includes the path up to the next depth level.
   *
   * @function
   * @param {String} key The path to the key in the schema, each level being
   *  separated by a dot and array items being flagged with [].
   * @param {Number} depth The array depth
   * @return {String} The path to the key truncated to the given depth.
   */
  var truncateToArrayDepth = function (key, arrayDepth) {
    var depth = 0;
    var pos = 0;

    if (!key) {
      return null;
    }

    if (arrayDepth > 0) {
      while (depth < arrayDepth) {
        pos = key.indexOf('[]', pos);
        if (pos === -1) {
          // Key path is not "deep" enough, simply return the full key
          return key;
        }
        pos = pos + 2;
        depth += 1;
      }
    }

    // Move one step further to the right without including the final []
    pos = key.indexOf('[]', pos);
    return (pos === -1) ? key : key.substring(0, pos);
  };

  /**
   * Applies the array path to the key path.
   *
   * For instance, if the key path is:
   *  foo/bar[]/baz/toto[]/truc[]/bidule
   * and the arrayPath [4, 2], the returned key will be:
   *  foo/bar[4]/baz/toto[2]/truc[]/bidule
   *
   * @function
   * @param {String} key The path to the key in the schema, each level being
   *  separated by a dot and array items being flagged with [].
   * @param {Array(Number)} arrayPath The array path to apply, e.g. [4, 2]
   * @return {String} The path to the key that matches the array path.
   */
  var applyArrayPath = function (key, arrayPath) {
    var depth = 0;

    if (!key) {
      return null;
    }
    if (!arrayPath || (arrayPath.length === 0)) {
      return key;
    }
    var newKey = key.replace(reArray, function (str, p1) {
      // Note this function gets called as many times as there are [x] in the ID,
      // from left to right in the string. The goal is to replace the [x] with
      // the appropriate index in the new array path, if defined.
      var newIndex = str;
      if (!_.isNil(arrayPath[depth])) {
        newIndex = '[' + arrayPath[depth] + ']';
      }
      depth += 1;
      return newIndex;
    });

    return newKey;
  };

    var applyObjectPath = function(key, objectPath) {
      var pathIndex = 0;

      if (!key) {
        return null;
      }
      if (!objectPath || (objectPath.length === 0)) {
        return key;
      }
      var newKey = key.replace(/\{\}(?=\/|$)/g, function (str) {
        var currentPathEl = objectPath[pathIndex] || str;
        pathIndex += 1;
        return currentPathEl;
      });

      return newKey;
    };

  /**
   * Returns the initial value that a field identified by its key
   * should take.
   *
   * The "initial" value is defined as:
   * 1. the previously submitted value if already submitted
   * 2. the default value defined in the layout of the form
   * 3. the default value defined in the schema
   *
   * The "value" returned is intended for rendering purpose,
   * meaning that, for fields that define a titleMap property,
   * the function returns the label, and not the intrinsic value.
   *
   * The function handles values that contains template strings,
   * e.g. {{values/foo[]/bar}} or {{idx}}.
   *
   * When the form is a string, the function truncates the resulting string
   * to meet a potential "maxLength" constraint defined in the schema, using
   * "..." to mark the truncation. Note it does not validate the resulting
   * string against other constraints (e.g. minLength, pattern) as it would
   * be hard to come up with an automated course of action to "fix" the value.
   *
   * @function
   * @param {Object} formObject The JSON Form object
   * @param {String} key The generic key path (e.g. foo[]/bar/baz[])
   * @param {Array(Number)} arrayPath The array path that identifies
   *  the unique value in the submitted form (e.g. [1, 3])
   * @param {Object} tpldata Template data object
   * @param {Boolean} usePreviousValues true to use previously submitted values
   *  if defined.
   */
  var getInitialValue = function (formObject, key, arrayPath, tpldata, usePreviousValues) {
    var value = null;

    // Complete template data for template function
    tpldata = tpldata || {};
    tpldata.idx = tpldata.idx ||
      (arrayPath ? arrayPath[arrayPath.length - 1] : 1);
    tpldata.value = !_.isNil(tpldata.value) ? tpldata.value : '';
    tpldata.getValue = tpldata.getValue || function (key) {
      return getInitialValue(formObject, key, arrayPath, tpldata, usePreviousValues);
    };

    // Helper function that returns the form element that explicitly
    // references the given key in the schema.
    var getFormElement = function (elements, key) {
      var formElement = null;
      if (!elements || !elements.length) {
        return null;
      }
      _.each(elements, function (elt) {
        if (formElement) {
          return;
        }

        if (elt === key) {
          formElement = { key: elt };
          return;
        }

        if (_.isString(elt)) {
          return;
        }

        if (elt.key === key) {
          formElement = elt;
        } else if (elt.items) {
          formElement = getFormElement(elt.items, key);
        }
      });
      return formElement;
    };
    var formElement = getFormElement(formObject.form.fields || [], key);
    var schemaElement = tbjsonAjv2Tb.getSchemaByJsonPointer(formObject.schema, key);

    if (usePreviousValues && formObject.value) {
      // If values were previously submitted, use them directly if defined
      value = jfUtils.getObjByKey(formObject.value, applyArrayPath(key, arrayPath));
    }

    if (_.isNil(value)) {
      if (formElement &&
        (typeof formElement['value'] !== 'undefined')) {
        // Extract the definition of the form field associated with
        // the key as it may override the schema's default value
        // (note a "null" value overrides a schema default value as well)
        value = formElement['value'];
      } else if (schemaElement) {
        // Simply extract the default value from the schema
        if (!_.isNil(schemaElement['default'])) {
          value = schemaElement['default'];
        }
      }

      if (value && value.indexOf('{{values/') !== -1) {
        // This label wants to use the value of another input field.
        // Convert that construct into {{getValue(key)}} for
        // lodash to call the appropriate function of formData
        // when template gets called (note calling a function is not
        // exactly Mustache-friendly but is supported by lodash).
        value = value.replace(
          REGEX.MAGIC_REGEX_2,
          '{{getValue("$1")}}');
      }
      if (value) {
        value = _template(value, tpldata, valueTemplateSettings);
      }
    }

    // TODO: handle on the formElement.options, because user can setup it too.
    // Apply titleMap if needed
    if (!_.isNil(value) && formElement && _.has(formElement.titleMap, value)) {
      value = _template(formElement.titleMap[value],
        tpldata, valueTemplateSettings);
    }

    // Check maximum length of a string
    if (value && _.isString(value) &&
      schemaElement && schemaElement.maxLength) {
      if (value.length > schemaElement.maxLength) {
        // Truncate value to maximum length, adding continuation dots
        value = value.substr(0, schemaElement.maxLength - 1) + '…';
      }
    }

    if (_.isNil(value)) {
      return null;
    } else {
      return value;
    }
  };

  var getDefaultClasses = function (cssFramework) {
    switch (cssFramework) {
      case 'bootstrap2':
        return {
          groupClass: 'control-group',
          groupMarkClassPrefix: '',
          labelClass: 'control-label tb-jf-label',
          controlClass: 'controls',
          iconClassPrefix: 'icon',
          buttonClass: 'btn',
          textualInputClass: '',
          prependClass: 'input-prepend',
          appendClass: 'input-append',
          addonClass: 'add-on',
          inlineClassSuffix: ' inline'
        };
      case 'bootstrap3':
        return {
          groupClass: 'form-group',
          groupMarkClassPrefix: 'has-',
          labelClass: 'control-label tb-jf-label',
          controlClass: 'controls',
          iconClassPrefix: 'glyphicon glyphicon',
          buttonClass: 'btn btn-default',
          textualInputClass: 'form-control tb-jf-input-class',
          prependClass: 'input-group',
          appendClass: 'input-group',
          addonClass: 'input-group-addon',
          buttonAddonClass: 'input-group-btn',
          inlineClassSuffix: '-inline'
        };
      case 'none':
        return {
          groupClass: 'jf-form-group',
          groupMarkClassPrefix: 'jf-has-',
          labelClass: 'jf-control-label tb-jf-label',
          controlClass: 'jf-controls',
          iconClassPrefix: 'jf-glyphicon jf-glyphicon',
          buttonClass: 'jf-btn btn-default',
          textualInputClass: 'jf-form-control tb-jf-input-class',
          prependClass: 'jf-input-group',
          appendClass: 'jf-input-group',
          addonClass: 'jf-input-group-addon',
          buttonAddonClass: 'jf-input-group-btn',
          inlineClassSuffix: 'jf-inline'

        };
      default:
        THROW({ msg: 'Unknown cssFramework: $CSS_FRAMEWORK$', msgParams: { CSS_FRAMEWORK: cssFramework } });
    }
  };

  var createOverlay = function ( el ) {
    return $('<div>')
      .addClass('tb-jf-overlay')
      .height(el.height() + 10)
      .width(el.width() + 20)
      .offset({
        left: el.offset().left - 10,
        top: el.offset().top - 10
      });
  }

  /**
   * displays a loading bar on the given DOM element and display a custom
   * loading message
   * TODO @momo когато гръмне нещо в jsonform, остава да се показва loading анимацията, да се поправи
   */
  var displayLoadingAnimation = function (el, message) {
    // create loading dots
    var loadingMessage = $('<span>')
      .addClass('tb-jf-loading-message')
      .text(message || 'Loading ...');
    var loadingDots = $('<ul><li><li><li></ul>')
      .addClass('tb-jf-loading-dots');

    // render loading dots
    $(el).prepend(
      $('<div>')
        .addClass('tb-jf-loading text-center')
        .prepend(loadingDots)
        .prepend(loadingMessage)
    );

    // generate transparent overlay
    var overlay = createOverlay( el );

    $(el.height).on('change', function () {
      overlay.height = el.height + 20;
    });

    $(el.width).on('change', function () {
      overlay.width = el.width + 20;
    });

    // render transparent overlay
    $(el).append(overlay);
  };

  /**
   * removes the loading animation from the given DOM element
   */
  var removeLoadingAnimation = function (el) {
    $(el).find('.tb-jf-loading:first')
      .remove();

    $(el).find('.tb-jf-overlay:first')
      .remove();
  };

  var multipleSelectFunction = function (node) {
    var fkeyData = getForeignKeyFields(node.ownerTree, node.schemaElement, node.formElement);
    // ASSERT(0, "TODO: make multipleselect and orderedselect work with foreign keys", "JF2000");
    var type;
    var isNullable = false;
    var types = _.isArray(node.schemaElement.type) ? node.schemaElement.type : [node.schemaElement.type];

    for(var i = 0; i < types.length; i++) {
      if (types[i] === 'null') {
        isNullable = true;
      } else {
        type = types[i];
      }
    }

    var event = new CustomEvent('jf_specialSearch', {
      detail: {
        ref_col: fkeyData.refCol,
        ref_table: fkeyData.refTable,
        ref_table_view: fkeyData.refTableView,
        ref_col_title: fkeyData.refColTitle,

        form_id: node.ownerTree.formDesc.form.$formIdCode,
        schema_id: node.ownerTree.formDesc.schema.id,
        foreign_filter: node.formElement.foreign_filter,
        foreign_extra_cols: node.formElement.foreign_extra_cols,
        jf_is_multipleselect: true,

        field_schema: node.schemaElement,
        field_type: type,
        is_nullable: isNullable,

        sp: node.ownerTree.formDesc.sp,

        cb: function(responce, err) {
          if (err) {
            TRACE(err);
            var errorMessage = err.msg;
            $(node.el).addClass('has-error');
            $(node.el).find('.tb-jf-errortext').text(errorMessage);
            $(node.el).find('.tb-jf-errortext').removeClass('tb-jf-hide');

            return;
          }

          var result = responce.result;
          if (result) {
            result.records = result.data;
            delete result.data;

            var options = result.records.map( function(item, idx) {
              return {
                id: item.data[item.refFieldName],
                title: item.data[item.refFieldTitleName]
              }
            });

            node.ownerTree.formDesc.resources[fkeyData.refTableView] = result;
            node.ownerTree.foreignKeysData[node.key] = fkeyData;

            var $node = $('#' + node.id);
            $node.empty();
            options.forEach(function(el) {
              if (node.value && node.value.indexOf(el.id) >= 0) {
                $node.append('<option selected value="' + el.id + '">' + el.title + '</option>');
              } else {
                $node.append('<option value="' + el.id + '">' + el.title + '</option>');
              }
            });

            $('#' + node.id).orderedSelect(options, node.value);
          }
        }
      }
    });

    node.ownerTree.domRoot.dispatchEvent(event);
  }

  var selectForeignKeySetupFunction = function (node) {
    var fkeyData = getForeignKeyFields(node.ownerTree, node.schemaElement, node.formElement);

    node.ownerTree.formDesc.resources = node.ownerTree.formDesc.resources || {};

    var type;
    var isNullable = false;
    var types = _.isArray(node.schemaElement.type) ? node.schemaElement.type : [node.schemaElement.type];

    for(var i = 0; i < types.length; i++) {
      if (types[i] === 'null') {
        isNullable = true;
      } else {
        type = types[i];
      }
    }


    var event = new CustomEvent('jf_specialSearch', {
      detail: {
        ref_col: fkeyData.refCol,
        ref_table: fkeyData.refTable,
        ref_col_title: fkeyData.refColTitle,
        ref_table_view: fkeyData.refTableView,
        ref_value: (type === "array" ? null : node.value),

        form_id: node.ownerTree.formDesc.form.$formIdCode,
        // form_name: node.ownerTree.formDesc.form.form_name,
        schema_id: node.ownerTree.formDesc.schema.id,
        foreign_filter: node.formElement.foreign_filter,
        foreign_extra_cols: node.formElement.foreign_extra_cols,

        field_schema: node.schemaElement,
        field_type: type,
        is_nullable: isNullable,

        jf_is_multipleselect: (type === "array"),

        sp: node.ownerTree.formDesc.sp,

        loadcb: function() {
          var $select = $(node.el).find('.controls select');
          $(node.el).find('.for-removal').show();
          $select.css('display', 'inline-block').css('width', '93%').attr('disabled', 'disabled');
        },

        cb: function(responce, err) {
          var $select = $(node.el).find('.controls select');
          $(node.el).find('.for-removal').hide();

          if (node.formElement.useLegacySelect){
            $select.css('display', 'block').css('width', '100%');
          } else {
              if ($select[0].selectize) {
                $select[0].selectize.$wrapper.css('display', 'block').css('width', '100%');
              }
          }

          if ( ! node.readOnly ) {
            $select.removeAttr('disabled');
          }


          if (err) {
            TRACE(err);
            var errorMessage = err.msg;
            $(node.el).addClass('has-error');
            $(node.el).find('.tb-jf-errortext').text(errorMessage);
            $(node.el).find('.tb-jf-errortext').removeClass('tb-jf-hide');

            return;
          }

          var result = responce.result;
          if (result) {
            result.records = result.data;
            delete result.data;

            var options = result.records.map( function(item, idx) {
              return {
                id: item.data[item.refFieldName],
                title: item.data[item.refFieldTitleName]
              }
            });

            node.ownerTree.formDesc.resources[fkeyData.refTableView] = result;
            node.ownerTree.foreignKeysData[node.key] = fkeyData;

            jsonform.elementTypes.select.setupForeignKey(node, fkeyData, responce);
          }
        }
      }
    });

    node.ownerTree.domRoot.dispatchEvent(event);
  }

  var previewFKeyFunction = function (node) {
    var fkeyData = getForeignKeyFields(node.ownerTree, node.schemaElement, node.formElement);
    console.log("FK: ", fkeyData);
    node.ownerTree.formDesc.resources = node.ownerTree.formDesc.resources || {};

    var type;
    var isNullable = false;
    var types = _.isArray(node.schemaElement.type) ? node.schemaElement.type : [node.schemaElement.type];

    for(var i = 0; i < types.length; i++) {
      if (types[i] === 'null') {
        isNullable = true;
      } else {
        type = types[i];
      }
    }

    var event = new CustomEvent('jf_specialSearch', {
      detail: {
        ref_col: fkeyData.refCol,
        ref_table: fkeyData.refTable,
        ref_table_view: fkeyData.refTableView,
        ref_col_title: fkeyData.refColTitle,
        ref_value: (type === "array" ? null : node.value),

        form_id: node.ownerTree.formDesc.form.$formIdCode,
        schema_id: node.ownerTree.formDesc.schema.id,
        foreign_filter: node.formElement.foreign_filter,
        foreign_extra_cols: node.formElement.foreign_extra_cols,

        field_schema: node.schemaElement,
        field_type: type,
        is_nullable: isNullable,

        jf_is_multipleselect: (type === "array"),

        sp: node.ownerTree.formDesc.sp,

        cb: function(responce, err) {
          if (err) {
            TRACE(err);
            var errorMessage = err.msg;
            $(node.el).addClass('has-error');
            $(node.el).find('.tb-jf-errortext').text(errorMessage);
            $(node.el).find('.tb-jf-errortext').removeClass('tb-jf-hide');

            return;
          }

          var result = responce.result;
          if (result) {
            result.records = result.data;
            delete result.data;

            var options = result.records.map( function(item, idx) {
              return {
                id: item.data[item.refFieldName],
                title: item.data[item.refFieldTitleName]
              }
            });

            node.ownerTree.formDesc.resources[fkeyData.refTableView] = result;
            node.ownerTree.foreignKeysData[node.key] = fkeyData;

            let titleTexts = [];

            let valuesToObject = {};
            if ( _.isArray(node.value) ) {
              node.value.forEach(val => {
                valuesToObject[ val ] = true;
              });
            } else {
              valuesToObject[ node.value ] = true;
            }

             options.forEach(val => {
              if (valuesToObject[ val.id ]) {
                titleTexts.push(val.title);
               }
             });

            var $el = $('#' + node.id);
            $el.find('.tb-jf-value').text( titleTexts.join(', ') );
          }
        }
      }
    });

    node.ownerTree.domRoot.dispatchEvent(event);
  }





  /**
   * Retrieves the key identified by a path selector in the structured object.
   *
   * Levels in the path are separated by a dot. Array items are marked
   * with [x]. For instance:
   *  foo/bar[3]/baz
   *
   * @function
   * @param {Object} obj Structured object to parse, can be array too
   * @param {String} key Path to the key to retrieve
   * @return {Object} The key's value.
   * @todo replace with _.get
   */
  jsonform.util.getObjByKeyEx = function (obj, key, objKey) {
    ASSERT.isStringOrNil(key, {msg: 'getObjByKeyEx received unexpected input.', code: 2140});

    var innerobj = obj;

    if (key === null || key === undefined || key === '') {
      return obj;
    }

    if (typeof objKey === 'string' && objKey.length > 0) {
      if (key.slice(0, objKey.length) !== objKey) {
        throw new Error('key [' + key + '] does not match the objKey [' + objKey + ']');
      }
      key = key.slice(objKey.length);
      if (key[0] === '/') {
        key = key.slice(1);
      }
    }

    var m = key.match(REGEX.MAGIC_REGEX_3);

    if (!m) {
      throw new Error('bad format key: ' + key);
    }

    // TODO what all those numbers mean?
    if (typeof m[2] === 'string' && m[2].length > 0) {
      innerobj = innerobj[m[2]];
    } else if (typeof m[4] === 'string' && m[4].length > 0) {
      innerobj = innerobj[Number(m[4])];
    } else {
      // TODO great message, though
      throw new Error('impossible reach here');
    }

    if (innerobj && m[5].length > 0) {
      innerobj = this.getObjByKeyEx(innerobj, m[5]);
    }

    if (innerobj && innerobj.$ref) {
      innerobj = jfUtils.resolveSchema(jsonform.schema, innerobj, key);
    }

    return innerobj;
  };

  /**
   * Validate the given value against the schema type and make sure that they match.
   * Two validation modes are available: strict and not strict. In strict mode every error triggers an assert.
   * In the unstrict mode the schema is modified so that the given values are valid.
   *
   * This should be used only for backwards compatibility with the values
   * submitted from old schemas during the migration to jsonform.
   *
   * @param  {[Object]} object which contains the schemaElement
   * @param  {Boolean|String|Number|Object|Array|null} the value which will be compared against the schema type
   * @param  {[Boolean]} strict validation or not
   */
  jsonform.util.validateValueType = function (key, schemaElement, formElement, deprecatedValue, value, strictNumberTypes, formDesc) {
    var valueType = jfUtils.getJsonType(value, _.includes(schemaElement.type, 'integer'));

    /**
     * in strict mode an assert fires in case the value does not obey the schema type constraint
     */
    var jsonValueTypes = [ 'null', 'boolean', 'string', 'integer', 'number', 'object', 'array' ];

    ASSERT(_.includes(jsonValueTypes, valueType), { code: 2183 });

    ASSERT(valueType === 'null' || jfUtils.hasValidJsonType(schemaElement.type, value), {
      code: 2150,
      msg: 'The value of schema key $KEY$ with allowed schema types $SCHEMATYPE$ is of type $VALUETYPE$, deduced from $VALUE$.',
      msgParams: { KEY: key, SCHEMATYPE: schemaElement.type, VALUETYPE: valueType, VALUE: value }
    });

    if (valueType === 'array') {
      ASSERT.isNotNil(schemaElement.items, {msg: 'Invalid Schema: no items descriptor defined for this array.', code: 2180});
      ASSERT.isPlainObject(schemaElement.items, {msg: 'Currently supports only ``object`` on items.', code: 2181});

        /**
        * if the instance is a complex array (array of objects) each of the object properties
        * will be validated when the appropriate key is reached
        * otherwise iterate through all values and make sure they are valid
        */
      if (_.includes(schemaElement.items.type, 'object')) {
        _.each(value, function (childValue, index) {
          ASSERT(jfUtils.hasValidJsonType(schemaElement.items.type, childValue), {msg: 'Invalid value: The value of schema.items for key $KEY$ with allowed schema types $SCHEMATYPE$ is of type $VALUETYPE$.', msgParams: {KEY: key, SCHEMATYPE: schemaElement.items.type, VALUETYPE: valueType}, code: 2190});
            /**
             * in case the form element requires an enum check whether the schema is valid
             */
          if (jsonform.elementTypes[formElement.type].requiresEnum) {
            ASSERT(schemaElement.items.enum, {msg: 'Enums are required, but there were none found!', code: 2200});
          }
        });
      }
    }

    return value;
  };

  // Standard input template
  jsonform.fieldTemplate = function (inner) {
    return '' +
      '<div <%= node.formElement.gridLayout ? `style="float: ${node.formElement.buttonFloat}"` : `` %>  <% if (node.formElement.type === "hidden") { %>style="display: none;"<% } %> class="<%= cls.groupClass %> tb-jf-node <%= (node.rowWidth || node.formElement.rowWidth) ? "col" : ""  %> col-sm-<%= node.rowWidth || node.formElement.rowWidth %>' +
      '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
      '<%= (elt.notitle) ? " tb-jf-notitle-field" : ""%>' +
      '<%= elt.htmlClass ? " " + elt.htmlClass : "" %>' +
      '<%= (node.formElement && node.formElement.required && (node.formElement.type !== "checkbox") ? " tb-jf-required" : "") %>' +
      '<%= (node.isReadOnly() ? " tb-jf-readonly" : "") %>' +
      '<%= (node.disabled ? " tb-jf-disabled" : "") %>"' +
      ' data-tb-jf-type="<%= node.formElement.type %>"' +
      ' name="<%= node.key %>">' +
      '<% if (node.getTitle() && !elt.notitle) { %>' +
        '<label class="<%= cls.labelClass %> tb-jf-clear-margins" for="<%= node.id %>"><%- node.getTitle() %> <span class="tb-jf-enumerate-form"><%= enumerationText %>: </span></label>' +
        // '<% if (node.characterCounter) { %>' +
        //   '<span class="label label-primary tb-jf-character-counter">' +
        //   '<span class="tb-jf-characters-used">10</span>' +
        //   ' / <span class="tb-jf-characters-limit">100</span>' +
        //   '</span>' +
        // '<% } %>' +
      '<% } %>' +

      '<div class="<%= cls.controlClass %>">' +
        '<% if (node.formElement && !node.formElement.readOnly &&  (node.formElement.enableUndo || node.formElement.enableRedo || node.formElement.enableReset)) { %>' +
        '<div class="tb-jf-value-history-buttons">' +

        '<% if (node.formElement.enableReset) { %>' +
        '<button type="button" class="btn btn-xs btn-default tb-jf-description tb-jf-value-history-reset">' +
        '<span>' +
        '↻ reset' +
        '</span>' +
        '</button> ' +
        '<% } %>' +

        '<% if (node.formElement.enableUndo) { %>' +
        '<button type="button" class="btn btn-xs btn-default tb-jf-description tb-jf-value-history-undo">' +
        '<span>' +
        '↰ undo' +
        '</span>' +
        '</button> ' +
        '<% } %>' +

        '<% if (node.formElement.enableRedo) { %>' +
        '<button type="button" class="btn btn-xs btn-default tb-jf-description tb-jf-value-history-redo">' +
        '<span>' +
        '↱ redo' +
        '</span>' +
        '</button> ' +
        '<% } %>' +

        '</div>' +
        '<% } %>' +

        '<% if (node.prepend || node.append) { %>' +
          '<div class="<%= node.prepend ? cls.prependClass : "" %> ' +
          '<%= node.append ? cls.appendClass : "" %>">' +
          '<% if (node.prepend && node.prepend.indexOf("<button ") >= 0) { %>' +
            '<% if (cls.buttonAddonClass) { %>' +
              '<span class="<%= cls.buttonAddonClass %>"><%= node.prepend %></span>' +
            '<% } else { %>' +
              '<%= node.prepend %>' +
            '<% } %>' +
          '<% } %>' +
          '<% if (node.prepend && node.prepend.indexOf("<button ") < 0) { %>' +
            '<span class="<%= cls.addonClass %>"><%= node.prepend %></span>' +
          '<% } %>' +
        '<% } %>' +

        // '<% if (node.schemaElement && node.schemaElement.refCol && node.schemaElement.refTable) { %>' +
        //   "<button type=\'button\' data-tb-jf-addForeignKey=\'foreignKey\' >+</button>" +
        // '<% } %>' +
        inner +
        '<% if (node.description) { %>' +
          '<span class="help-block tb-jf-description"><%= node.description %></span>' +
        '<% } %>' +

        '<% if (node.append && node.append.indexOf("<button ") >= 0) { %>' +
          '<% if (cls.buttonAddonClass) { %>' +
            '<span class="<%= cls.buttonAddonClass %>"><%= node.append %></span>' +
          '<% } else { %>' +
            '<%= node.append %>' +
          '<% } %>' +
        '<% } %>' +
        '<% if (node.append && node.append.indexOf("<button ") < 0) { %>' +
          '<span class="<%= cls.addonClass %>"><%= node.append %></span>' +
        '<% } %>' +
        '<% if (node.prepend || node.append) { %>' +
          '</div>' +
        '<% } %>' +
        '<span class="help-block tb-jf-errortext tb-jf-hide"></span>' +
      '</div></div>';
  };

  // Table cell template
  jsonform.tableCellTemplate = function (inner) {
    return '<td class="<%= cls.groupClass %> tb-jf-tablecell tb-jf-node <%= node.formElement.type == "hidden" ? "hidden" : "" %>' +
        '<%= (node.rowWidth || node.formElement.rowWidth) ? "col" : ""  %> col-sm-<%= node.rowWidth || node.formElement.rowWidth %>' +
      '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
      '<%= elt.htmlClass ? " " + elt.htmlClass : "" %>' +
      '<%= (node.formElement && node.formElement.required && (node.formElement.type !== "checkbox") ? " tb-jf-required" : "") %>' +
      '<%= (node.isReadOnly() ? " tb-jf-readonly" : "") %>' +
      '<%= (node.disabled ? " tb-jf-disabled" : "") %>' +
      '" data-tb-jf-type="<%= node.formElement.type %>">' +

      '<div class="<%= cls.controlClass %>">' +
        '<% if (node.description) { %>' +
          '<span class="help-block tb-jf-description"><%= node.description %></span>' +
        '<% } %>' +

        '<% if (node.formElement && (node.formElement.enableUndo || node.formElement.enableRedo || node.formElement.enableReset)) { %>' +
        '<div class="tb-jf-value-history-buttons">' +

        '<% if (node.formElement.enableReset) { %>' +
        '<button type="button" class="btn btn-xs btn-default tb-jf-description tb-jf-value-history-reset">' +
        '<span>' +
        '↻ reset' +
        '</span>' +
        '</button> ' +
        '<% } %>' +

        '<% if (node.formElement.enableUndo) { %>' +
        '<button type="button" class="btn btn-xs btn-default tb-jf-description tb-jf-value-history-undo">' +
        '<span>' +
        '↰ undo' +
        '</span>' +
        '</button> ' +
        '<% } %>' +

        '<% if (node.formElement.enableRedo) { %>' +
        '<button type="button" class="btn btn-xs btn-default tb-jf-description tb-jf-value-history-redo">' +
        '<span>' +
        '↱ redo' +
        '</span>' +
        '</button> ' +
        '<% } %>' +

        '</div>' +
        '<% } %>' +

        '<% if (node.prepend || node.append) { %>' +
          '<div class="<%= node.prepend ? cls.prependClass : "" %> ' +
          '<%= node.append ? cls.appendClass : "" %>">' +
          '<% if (node.prepend && node.prepend.indexOf("<button ") >= 0) { %>' +
            '<% if (cls.buttonAddonClass) { %>' +
              '<span class="<%= cls.buttonAddonClass %>"><%= node.prepend %></span>' +
            '<% } else { %>' +
              '<%= node.prepend %>' +
            '<% } %>' +
          '<% } %>' +
          '<% if (node.prepend && node.prepend.indexOf("<button ") < 0) { %>' +
            '<span class="<%= cls.addonClass %>"><%= node.prepend %></span>' +
          '<% } %>' +
        '<% } %>' +
        inner +
        '<% if (node.append && node.append.indexOf("<button ") >= 0) { %>' +
          '<% if (cls.buttonAddonClass) { %>' +
            '<span class="<%= cls.buttonAddonClass %>"><%= node.append %></span>' +
          '<% } else { %>' +
            '<%= node.append %>' +
          '<% } %>' +
        '<% } %>' +
        '<% if (node.append && node.append.indexOf("<button ") < 0) { %>' +
          '<span class="<%= cls.addonClass %>"><%= node.append %></span>' +
        '<% } %>' +
        '<% if (node.prepend || node.append) { %>' +
          '</div>' +
        '<% } %>' +
        '<span class="help-block tb-jf-errortext tb-jf-hide"></span>' +
      '</div></td>';
  };

  jsonform.dataTableCellTemplate = function (inner) {
    return '<td class="<%= cls.groupClass %> tb-jf-datatablecell' +
        '<%= (node.rowWidth || node.formElement.rowWidth) ? "col" : ""  %> col-sm-<%= node.rowWidth || node.formElement.rowWidth %>' +
      '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
      '" data-tb-jf-type="datablerow">' +
      '<div class="<%= cls.controlClass %>">' +
        inner +
      '</div></td>';
  };

  var getDateTimePickerOnInsert = function (format) {
    return function (evt, node) {
      var selector = '#' + node.id;

      node.formElement.pluginoptions = node.formElement.pluginoptions || _.cloneDeep(DATETIME_PLUGIN_DEFAULT_OPTIONS);

      if (!node.formElement.pluginoptions.format) {
        node.formElement.pluginoptions.format = format;
      }

      node.formElement.pluginoptions.useCurrent = false;

      var value = getDefaultTimeValue(node);

      var timePicker = $(selector.toString()).datetimepicker(node.formElement.pluginoptions);
      if (value) {
        timePicker.val(value);
      }

      // trigger a change event every time a different date/time is selected
      var domRoot = node.ownerTree.domRoot;
      $(selector).on('dp.change', function (evt, param) {
        $(domRoot).trigger('change');
        // $(evt.currentTarget).trigger('change');
        // $(selector).change();
        // $(selector).trigger('change');
      });
    }
  }

  var inputFieldTemplate = function (type, isTextualInput, extraOpts) {
    var templ = {
      template: '<input ' +
        'class="<%= cls.textualInputClass %> <%= fieldHtmlClass %> <%= (node.rowWidth || node.formElement.rowWidth) ? "col" : ""  %> col-sm-<%= node.rowWidth || node.formElement.rowWidth %>" ' +
        'name="<%= node.name %>" value="<%= _.escape(value) %>" id="<%= id %>"' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '<%= node.readOnly %>' +
        '<%= node.placeholder %>' +
        ' />',
      compatibleTypes: ['string', 'number', 'integer'],
      compatibleFormats: [],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      fieldtemplate: true,
      inputfield: true,
      isTbTemplate: false,
      onBeforeRender: function (data, node) {

        if (type === 'text' && _.isPlainObject(data.value)) {
          data.value = JSON.stringify(data.value);
        }

        node.readOnly = node.isReadOnly()
          ? ' readonly="readonly"'
          : '';

        node.placeholder = (node.placeholder)
          ? ' placeholder="' + node.placeholder + '"'
          : ' ';

        node.characterCounter = true;
      },
      onInsert: function (evt, node) {
        if (node.formElement.align !== undefined) {
          ASSERT(['left', 'right', 'center'].indexOf(node.formElement.align) >= 0, {msg: 'input field: the align property must be either left, right or center.', code: 2290});

          $(node.el).find('input').css('text-align', node.formElement.align);
        }

        var $input;
        if (node.formElement && node.formElement.autocomplete) {
          $input = $(node.el).find('input');
          if ($input.autocomplete) {
            $input.autocomplete(node.formElement.autocomplete);
          }
        }
        if (node.formElement &&
          (node.formElement.tagsinput || node.formElement.getValue === 'tagsvalue')) {
          if (!$.fn.tagsinput) {
            throw new Error('tagsinput is not found');
          }
          $input = $(node.el).find('input');
          var isArray = _.isArray(node.value);
          if (isArray) {
            $input.attr('value', '').val('');
          }
          $input.tagsinput(node.formElement ? (node.formElement.tagsinput || {}) : {});
          if (isArray) {
            node.value.forEach(function (value) {
              $input.tagsinput('add', value);
            });
          }
        }
        if (node.formElement && node.formElement.typeahead) {
          $input = $(node.el).find('input');
          if ($input.typeahead) {
            if (_.isArray(node.formElement.typeahead)) {
              for (var i = 1; i < node.formElement.typeahead.length; ++i) {
                var dataset = node.formElement.typeahead[i];
                if (dataset.source && _.isArray(dataset.source)) {
                  var source = dataset.source;
                  dataset.source = function (query, cb) {
                    var lq = query.toLowerCase();
                    cb(source.filter(function (v) {
                      return v.toLowerCase().indexOf(lq) >= 0;
                    }).map(function (v) {
                      return (typeof v === 'string') ? {value: v} : v;
                    }));
                  };
                }
              }
              $.fn.typeahead.apply($input, node.formElement.typeahead);
            } else {
              $input.typeahead(node.formElement.typeahead);
            }
          }
        }
      },
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('readonly', true);
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .prop('readonly', false);
      }
    };
    if (extraOpts) {
      templ = _.extend(templ, extraOpts);
    }
    return templ;
  };

  var numberFieldTemplate = function (type, isTextualInput) {
    return {
      template: '<input ' +
        'class="<%= cls.textualInputClass %> <%= fieldHtmlClass %> <%= (node.rowWidth || node.formElement.rowWidth) ? "col" : ""  %> col-sm-<%= node.rowWidth || node.formElement.rowWidth %>" ' +
        'name="<%= node.name %>" value="<%= _.escape(value) %>" id="<%= id %>"' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '<%= node.readOnly %>' +
        '<%= node.step %>' +
        '<%= node.placeholder %>' +
        ' />',
      fieldtemplate: true,
      inputfield: true,
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      isTbTemplate: false,
      compatibleTypes: ['number', 'integer'],
      compatibleFormats: [],
      onBeforeRender: function (data, node) {
        var rangeStep = _.get(node, 'range.step');

        // node.readOnly ? node.disabled = true : undefined;

        node.step = (rangeStep)
          ? ' step="' + rangeStep + '"'
          : ' ';

        node.readOnly = node.isReadOnly()
          ? ' readonly="readonly"'
          : '';

        node.placeholder = (node.placeholder)
          ? ' placeholder="' + node.placeholder + '"'
          : ' ';

        data.range = {
          step: 1
        };

        if (type === 'range') {
          data.range.min = 1;
          data.range.max = 100;
        }

        if (!node || !node.schemaElement) {
          return;
        }

        if (node.formElement && node.formElement.step) {
          data.range.step = node.formElement.step;
        } else if (node.schemaElement.type === 'number') {
          data.range.step = 'any';
        }

        var step = data.range.step === 'any' ? 1 : data.range.step;

        if (typeof node.schemaElement.minimum !== 'undefined') {
          if (node.schemaElement.exclusiveMinimum) {
            data.range.min = node.schemaElement.minimum + step;
          } else {
            data.range.min = node.schemaElement.minimum;
          }
        }

        if (typeof node.schemaElement.maximum !== 'undefined') {
          if (node.schemaElement.exclusiveMaximum) {
            data.range.max = node.schemaElement.maximum - step;
          } else {
            data.range.max = node.schemaElement.maximum;
          }
        }
      },
      onInsert: function (evt, node) {
        if (node.formElement.align !== undefined) {
          ASSERT(['left', 'right', 'center'].indexOf(node.formElement.align) >= 0, {msg: 'input field: the align property must be either left, right or center.', code: 2300});

          $(node.el).find('input').css('text-align', node.formElement.align);
        }
      },
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('readonly', true);
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .prop('readOnly', false);
      }
    };
  };

  var tableAsObject = {
    template: '<div class="tb-jf-table-container <%= (node.rowWidth || node.formElement.rowWidth) ? "col" : ""  %> col-sm-<%= node.rowWidth || node.formElement.rowWidth %>"><table ' +
      'name="<%= node.name %><%= (node.schemaElement && node.schemaElement.type === "array" ? "[]" : "") %>" ' +
      'data-attr-isarray="<%= node.view.array ? "123" : "object-table" %>"' +
      'data-attr-name="<%= node.name %>"' +
      'id="<%= id %>" ' +
      'class="tb-jf-table table table-responsive <%= node.formElement.disableTableBorder %> table-hover <%= (fieldHtmlClass ? " fieldHtmlClass " : "") %> <%= (node.formElement.displayCompressedTables ? " table-sm " : "") %>" ' +
      '<%= (node.disabled || node.readOnly? " disabled" : "")%> ' +
      '>' +
      '<thead> <tr> <%= node.formElement.thead %> <tr> </thead>' +
      '<tbody> <%= children %> </tbody>' +
      // + '<tfoot> <tr> <%= node.formElement.thead %> <tr> </tfoot>'
      '</table>' +
      '<% if (!node.isReadOnly() && node.formElement.enableAddingItems) { %>' +
      '<span class="tb-jf-array-buttons">' +
      '<a href="#" class="<%= cls.buttonClass %> btn-group-justified tb-jf-table-addmore <%= (node.formElement.displayCompressedTables ? " btn-sm " : "") %>"><i class="<%= cls.iconClassPrefix %>-plus-sign" title="Add new"></i> add new</a> ' +
      '</span>' +
      '<% } %>' +
      '</div>',
    fieldtemplate: true,
    containerField: true,
    compatibleTypes: ['array', 'object'],
    compatibleFormats: [],
    minRowWidth: 'half',
    maxRowWidth: 'full',
    isArrayContainer: true, // to replace `array` property
    isTbTemplate: false,
    onBeforeRender: function (data, node) {
      if (node.schemaElement && jfUtils.contains(node.schemaElement.type, 'object')
         || node.formElement.preview ) {
        node.formElement.enableSorting = false;
        node.formElement.enableDeletingItems = false;
        node.formElement.enableAddingItems = false;
      }

      node.arrayLimits = node.getArrayLimits();

      node.formElement.disableTableBorder = (node.formElement.disableTableBorder)
          ? ' tb-jf-disable-table-border '
          : ' table-bordered ';

      if ((!node.childTemplate) ||
          !node.childTemplate.hasOwnProperty('view') ||
          !node.childTemplate.view.hasOwnProperty('template')) {
        node.childTemplate = {
          view: {template: ''}
        };
      }
      node.childTemplate.view.template = '<tr ' +
          '<% if (node.id) { %> id="<%= node.id %>"<% } %> ' +
          'class="tb-jf-node ' +
          '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
          ' <%= elt.htmlClass ? elt.htmlClass : "" %>"> ' +
          '<%= children %>' +
          '</tr>';

      if (node.formElement.items[0].type === 'section') {
        node.formElement.items[0].type = 'tablerow';
      }

        /**
         * validate the columns in case they are specified
         * generate default values from the schema otherwise
         */

      if (node.formElement.items) {
        ASSERT.isArray(node.formElement.items, {msg: 'table: items must be an array', code: 2310});
        ASSERT(node.formElement.items.length >= 1, {msg: 'table: items must have a length of 1 or more', code: 2320});

        node.formElement.thead = '';
        _.each(node.formElement.items[0].items, function (col, index) {
          if (col.type == 'hidden') {
            return;
          }

          ASSERT(col.title, {msg: 'table: every column requires a title', code: 2330});

          if (col.type === 'section') {
            ASSERT.isArray(col.items, {msg: 'table: items must be an array', code: 2340});
            ASSERT(col.items.length >= 1, {msg: 'table: items must have a length of 1 or more', code: 2350});

              // node.formElement.items[0].items.splice(i, 1);

              // for (var i = 0, j = col.items.length; i < j; i++) {
              //   node.formElement.items[0].items.splice(i, 0, col.items[i]);
              // };
          }

          node.formElement.thead += '<th' + (node.ownerTree.keyToNode[col.key].formElement.required ? ' class="tb-jf-required" ' : '') + '><label>' + col.title + '</label></th>';
        });

        if (!node.formElement.preview) {
          if (node.formElement.enableSorting && !node.formElement.enableDeletingItems) {
            node.formElement.thead += '<th> Reorder </th>';
          } else if (!node.formElement.enableSorting && node.formElement.enableDeletingItems) {
            node.formElement.thead += '<th> Remove </th>';
          } else if (node.formElement.enableSorting && node.formElement.enableDeletingItems) {
            node.formElement.thead += '<th> Modify </th>';
          }
        }
      }
        // TODO add default table if no items are specified
        // else {
        //   ASSERT(node.schemaElement, 'table: no items array is defined therefore a schema element must be defined.');
        //   node.formElement.items = [];

        //   _.each(_.keys(node.schemaElement.items.properties), function(value, index) {
        //     node.formElement.items.push({
        //       data: value,
        //       title: value
        //     });
        //   });
        // }

        /**
         * treat all elements in the items array as table columns
         */

      _.each(node.children, function (row) {
        _.each(row.children, function (col) {
            // col.view.fieldtemplate = false;
          col.view.tablecell = true;
        });
      });
    },
    insideObjectTable: function (rootElement) {
      return $(rootElement).find('table').attr('data-attr-isarray') === 'object-table';
    },
    getFieldValue: function (rootEl) {
      if (this.insideObjectTable(rootEl)) {
        var $rootEl = $(rootEl);
        var name = $(rootEl).find('table').attr('data-attr-name');

        if ($rootEl.find('tr').length <= 2) {
          return {
            'name': name,
            'value': {}
            }
        }

      } else {
        var $rootEl = $(rootEl);
        var name = $rootEl.attr('name');

        if ($rootEl.find('tr').length <= 2) {
          return {
            'name': name,
            'value': []
            }
        }
      }
    },
    onInsert: function (evt, node) {
      var $node = $(node.el);
      var $nodeid = $(node.el).parent().find('#' + jfUtils.escapeSelector(node.id));
      var tableBody = $nodeid.find('tbody');
      var arrayLimits = node.arrayLimits;

        // Switch two nodes in an table
      var moveNodeTo = function (fromIdx, toIdx) {
          // Note "switchValuesWithNode" extracts values from the DOM since field
          // values are not synchronized with the tree data structure, so calls
          // to render are needed at each step to force values down to the DOM
          // before next move.
          // TODO: synchronize field values and data structure completely and
          // call render only once to improve efficiency.
        if (fromIdx === toIdx) {
          return;
        }

        var incr = (fromIdx < toIdx) ? 1 : -1;
        var parentEl = tableBody;

        for (var i = fromIdx; i !== toIdx; i += incr) {
          node.children[i].switchValuesWithNode(node.children[i + incr]);

          node.children[i].shouldEnhanceFunc();

          console.info("Calling Render 2: from the moveNodeTo of tableAsObject");
          node.children[i].render(parentEl.get(0));
        }

        node.children[toIdx].shouldEnhanceFunc();
        node.children[toIdx].render(parentEl.get(0));

          // No simple way to prevent DOM reordering with jQuery UI Sortable,
          // so we're going to need to move sorted DOM elements back to their
          // origin position in the DOM ourselves (we switched values but not
          // DOM elements)
        var fromEl = $(node.children[fromIdx].el);
        var toEl = $(node.children[toIdx].el);

        fromEl.detach();
        toEl.detach();

        if (fromIdx < toIdx) {
          if (fromIdx === 0) parentEl.prepend(fromEl);
          else $(node.children[fromIdx - 1].el).after(fromEl);
          $(node.children[toIdx - 1].el).after(toEl);
        } else {
          if (toIdx === 0) parentEl.prepend(toEl);
          else $(node.children[toIdx - 1].el).after(toEl);
          $(node.children[fromIdx - 1].el).after(fromEl);
        }
      };

      var addItem = function (idx) {
        if (arrayLimits.maxItems >= 0) {
          var slotNum = arrayLimits.maxItems - node.children.length;
          $node.find('> span > a.tb-jf-table-addmore')
              .toggleClass('disabled', slotNum <= 1);
          if (slotNum < 1) {
            return false;
          }
        }

        node.insertArrayItem(idx, tableBody);

        var canDelete = node.children.length > arrayLimits.minItems;
        $node.find('> span > a.tb-jf-table-deletelast')
            .toggleClass('disabled', !canDelete);

        $node.find('> ul > li > a.tb-jf-table-row-delete').toggle(canDelete);

        $node.trigger('change')
      };

      var deleteItem = function (idx) {
        var itemNumCanDelete = node.children.length - Math.max(arrayLimits.minItems, 0);

        $node.find('> span > a.tb-jf-table-deletelast')
            .toggleClass('disabled', itemNumCanDelete <= 1);
        $node.find('> ul > li > a.tb-jf-table-row-delete').toggle(itemNumCanDelete > 1);

        if (itemNumCanDelete < 1) {
          return false;
        }

        node.deleteArrayItem(idx);

        $node.find('> span > a.tb-jf-table-addmore')
            .toggleClass('disabled', arrayLimits.maxItems >= 0 && node.children.length >= arrayLimits.maxItems);
      };

        // call addItem on click
      $('+ span > a.tb-jf-table-addmore', $nodeid).click(function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        var idx = node.children.length;
        addItem(idx);
      });

        // Simulate Users click to setup the form with its minItems
      if (arrayLimits.minItems > 0) {
        for (var i = node.children.length; i < arrayLimits.minItems; i++) {
            // $('> span > a.tb-jf-table-addmore', $nodeid).click();
          node.insertArrayItem(node.children.length, $nodeid.find('> ul').get(0));
        }
      }

      var itemNumCanDelete = node.children.length - Math.max(arrayLimits.minItems, 0);
      $nodeid.find('> span > a.tb-jf-table-deletelast')
          .toggleClass('disabled', itemNumCanDelete <= 0);
      $nodeid.find('> ul > li > a.tb-jf-table-row-delete').toggle(itemNumCanDelete > 0);
      $nodeid.find('> span > a.tb-jf-table-addmore')
          .toggleClass('disabled', arrayLimits.maxItems >= 0 && node.children.length >= arrayLimits.maxItems);

        // call deleteItem to delete the last row
      $('+ span > a.tb-jf-table-deletelast', $nodeid).click(function (evt) {
        var idx = node.children.length - 1;
        evt.preventDefault();
        evt.stopPropagation();
        deleteItem(idx);
      });

        // call deleteItem to delete the clicked row
      $nodeid.on('click', '> tbody > tr > td > span > a.tb-jf-table-row-delete', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var $tr = $(e.currentTarget).parent().parent().parent();
        var idx = $tr.data('idx');

        deleteItem(idx);
      });

        // call moveNodeTo to move the row 1 step ahead
      $nodeid.on('click', '> tbody > tr > td > span > a.tb-jf-table-row-move-up', function (e) {
        e.preventDefault();
        var index = Number(this.parentNode.parentNode.parentNode.getAttribute('data-idx'));
        e.stopPropagation();

        if (index - 1 >= 0) {
          moveNodeTo(index, index - 1);
        }
      });

        // call moveNodeTo to move the row 1 step behind
      $nodeid.on('click', '> tbody > tr > td > span > a.tb-jf-table-row-move-down', function (e) {
        e.preventDefault();
        var index = Number(this.parentNode.parentNode.parentNode.getAttribute('data-idx'));
        var maxIndex = node.children.length - 1;
        e.stopPropagation();

        if (index + 1 <= maxIndex) {
          moveNodeTo(index, index + 1);
        }
      });

        // enable or disable the sorting of table elements
      if (!node.isReadOnly() && $(node.el).sortable && node.formElement.enableSorting) {
          // initialize jquery-ui sortable
        tableBody.sortable();

          // send sortable event to moveNodeTo
        tableBody.bind('sortstop', function (event, ui) {
          var idx = $(ui.item).data('idx');
          var newIdx = $(ui.item).index();

          moveNodeTo(idx, newIdx);
        });
      }
    }
  };

  tableAsObject['array'] = true;

  var tableObjectasObject = _.cloneDeep(tableAsObject);
  tableObjectasObject['array'] = false;

  var selectFieldTemplate = '' +
    '<img style="height:30px; width: 7%; display: none;" src="pub/cdn/loading.gif" class=\'for-removal\'><select name="<%= node.name %>" id="<%= id %>"' +
    'class="<%= cls.textualInputClass %> <%= fieldHtmlClass %> select-class-jf <%= (node.rowWidth || node.formElement.rowWidth) ? "col" : ""  %> col-sm-<%= node.rowWidth || node.formElement.rowWidth %>" ' +
    '<%= (node.disabled? " disabled" : "")%>' +
    '<%= (node.readOnly ? " readonly=\'readonly\' disabled=\'disabled\'" : "") %>' +
    '> ' +
    '<% _.each(node.options, function(key, val) { ' +
      'if (key instanceof Object) { ' +
        'if (value === key.value) { %> ' +
          '<option <%= (key.disabled? " disabled" : "")%> selected value="<%= escape(key.value) %>"><%= key.title %></option> ' +
        '<% } else { %> ' +
          '<option <%= (key.disabled? " disabled" : "")%> value="<%= escape(key.value) %>"><%= key.title %></option> ' +
        '<% }' +
      '} else {' +
        'if (value === key) { %> ' +
          '<option <%= (key.disabled? " disabled" : "")%> selected value="<%= key === null ? \'\' : key %>"><%= escape(key) %></option> ' +
        '<% } else { %> ' +
          '<option <%= (key.disabled? " disabled" : "")%> value="<%= key === null ? \'\' : key %>"><%= escape(key) %></option> <% }' +
        '}' +
	'}); %> ' +
    '</select>';

  var datePickerTemplate = '' +
    '<div class="row" style="position: relative;">' +
	   //'<div class="form-group">' +
         //'<div class="input-group date">' +
			'<input value="<%= node.value %>" name="<%= node.name %>" autocomplete="off" id="<%= id %>"' +
				'class="form-control <%= cls.textualInputClass %> <%= fieldHtmlClass %>" ' +
				'<%= (node.disabled? " disabled" : "")%>' +
				'<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
				'<%= (node.placeholder? " placeholder=" + \'"\' + node.placeholder + \'"\' : "")%>' +
			'value="" />' +
			//'<span class="input-group-addon">' +
			//'<span class="glyphicon glyphicon-calendar"></span>' +
			//'</span>' +
	     //'</div>' +
	   //'</div>' +
    '</div>';

  var DATETIME_PLUGIN_DEFAULT_OPTIONS = { keepInvalid: true, useStrict: true, keyBinds: { up: null, down: null, left: null, right: null, 'delete': null } };

  jsonform.elementTypes = {
    none: {
      template: ''
    },
    helptext: {
      template: '',
      compatibleTypes: ['object'],
    },
    genericHTML: {
      template: '<div class="row"><%= node.value %></div>',
      compatibleTypes: ['string'],
      onBeforeRender: function (evt, node) {
        node.value = node.value || node.default || (node.formElement && node.formElement.default);
      }
    },
    root: {
      template: '<div class="row"><%= children %></div>'
    },
    text: inputFieldTemplate('text', true),
    password: inputFieldTemplate('password', true),
    date: inputFieldTemplate('date', true, {
      onInsert: function (evt, node) {
        if (window.Modernizr && window.Modernizr.inputtypes && !window.Modernizr.inputtypes.date) {
          var $input = $(node.el).find('input');
          if ($input.datepicker) {
            var opt = {dateFormat: 'yy-mm-dd'};
            if (node.formElement && node.formElement.datepicker && typeof node.formElement.datepicker === 'object') {
              _.extend(opt, node.formElement.datepicker);
            }
            $input.datepicker(opt);
          }
        }
      }
    }),
    datetime: inputFieldTemplate('datetime', true),
    'datetime-local': inputFieldTemplate('datetime-local', true, {
      onBeforeRender: function (data, node) {
        if (data.value && data.value.getTime) {
          data.value = new Date(data.value.getTime() - data.value.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, -1);
        }
      }
    }),
    email: inputFieldTemplate('email', true),
    month: inputFieldTemplate('month', true),
    number: numberFieldTemplate('number', true),
    search: inputFieldTemplate('search', true),
    tel: inputFieldTemplate('tel', true),
    time: inputFieldTemplate('time', true),
    url: inputFieldTemplate('url', true),
    week: inputFieldTemplate('week', true),
    range: numberFieldTemplate('range'),
    color: {
      template: '<input type="text" ' +
        '<%= (fieldHtmlClass ? "class=\'" + fieldHtmlClass + "\' " : "") %>' +
        'name="<%= node.name %>" value="<%= escape(value) %>" id="<%= id %>"' +
        '<%= (node.formElement.readOnly? " disabled=\'disabled\'" : "")%>' +
        '<%= (node.required ? " required=\'required\'" : "") %>' +
        ' />',
      compatibleTypes: ['string'],
      compatibleFormats: ['color'],
      fieldtemplate: true,
      inputfield: true,
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      isTbTemplate: false,
      onInsert: function (evt, node) {
        $(node.el).find('#' + jfUtils.escapeSelector(node.id)).spectrum({
          preferredFormat: 'hex',
          showInput: true
        });
      },
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('disabled', 'disabled');

        $(node.el).find('.sp-replacer')
          .addClass('sp-disabled');
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .prop('disabled', false);

        $(node.el).find('.sp-replacer')
          .removeClass('sp-disabled');
      }
    },
    textarea: {
      template: '<textarea id="<%= id %>" name="<%= node.name %>" ' +
        'class="<%= cls.textualInputClass %> <%= fieldHtmlClass %>" ' +
        'style="<%= elt.height ? "height:" + elt.height + ";" : "" %>width:<%= elt.width || "100%" %>;"' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
        '<%= (node.placeholder? " placeholder=" + \'"\' + node.placeholder + \'"\' : "")%>' +
        '><%= escape(value) %></textarea>',
      compatibleTypes: ['string', 'number', 'integer'],
      compatibleFormats: [],
      fieldtemplate: true,
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      inputfield: true,
      isTbTemplate: false,
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('textarea')
          .prop('readonly', true);
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('textarea')
          .prop('readonly', false);
      },
      getFieldValue: function (node) {
        var textarea = $(node).find('textarea');

        return {
          name: textarea[0].getAttribute('name'),
          value: textarea.val()
        };
      },
      onBeforeRender: function (data, node) {

        if (_.isPlainObject(data.value)) {
          data.value = JSON.stringify(data.value);
        }

      },
      onInsert: function (evt, node) {
        // fix the height of the textarea when the input is long. You cant do it with css /as of 2019/
        var el = $(node.el).find('textarea')[0];
        el.style.height = '5px';
        el.style.height = (el.scrollHeight + 40)+'px';
      },
    },
      htmlpreview: {
        template: '<div id="<%= id %>" data-tb-jf-type="htmlpreview" class="tb-jf-node" name="<%= node.name %>" ' +
        'class="<%= fieldHtmlClass %> tb-jf-preview"> ' +
        '<span class="tb-jf-value"><%= node.previewValue %></span>' +
        '</div>',
        compatibleTypes: ['string', 'number', 'integer', 'boolean', 'array'],
        compatibleFormats: [],
        previewField: true,
        minRowWidth: 'quarter',
        maxRowWidth: 'full',
        isTbTemplate: false,
        inputfield: false,
        isSearchableField: true,
        onBeforeRender: function (data, node) {
          node.ownerTree.keyToNode[ node.key ] = node;

          if (node.value == null) {
            node.previewValue = node.formElement.default;
          } else {
            node.previewValue = node.value;
          }
        },
        onInsert: function (evt, node) {
          // $(node.el).data('node-data', node);
        }
      },
    preview: {
      template: '<div id="<%= id %>" data-tb-jf-type="preview" class="tb-jf-node" name="<%= node.name %>" ' +
      'class="<%= fieldHtmlClass %> tb-jf-preview"> ' +
      '<span class="tb-jf-label" style="padding-top: 0px;"> <%- node.getTitle() %> <span class="tb-jf-enumerate-form"><%= enumerationText %></span></span>' +
      '<span class="tb-jf-value word-break-break-all"><%= node.previewValue %></span>' +
      '</div>',
      compatibleTypes: ['string', 'number', 'integer', 'boolean', 'array'],
      compatibleFormats: [],
      previewField: true,
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      isTbTemplate: false,
      inputfield: false,
      isSearchableField: true,
      onBeforeRender: function (data, node) {
        /*
        if ( ! node.formElement.key ) {
            // Value is preview, used for the __skip of dbforms wanna-be jf2
        } else {
            var nodeKeyPath = node.formElement.key.split('/');
            node.title = node.title || nodeKeyPath[nodeKeyPath.length - 1].split('[')[0];
        }
        */

        node.ownerTree.keyToNode[ node.key ] = node;
        var options = node.options;
        if (options) {
          node.previewValue = node.value === undefined ? node.formElement.default : node.value;
          for (var i = 0; i < node.options.length; i++) {
            var el = node.options[i];

            if (el.value === node.previewValue) {
              node.previewValue = el.title;
              break;
            }
          }
        } else if (_.isPlainObject(node.value)) {
          node.previewValue = JSON.stringify(node.value);
        } else {
          if (node.value == null) {
            node.previewValue = node.formElement.default;
          } else {
            node.previewValue = node.value;
          }

          if ( node.previewValue === null || node.previewValue === undefined || _.trim(node.previewValue) === '' ) {
            node.previewValue = ' - ';
          } else {
            var __textarea_for_encoding = document.createElement("textarea");
            __textarea_for_encoding.innerHTML = node.previewValue;
            node.previewValue = __textarea_for_encoding.innerHTML;
          }
        }
      },
      onInsert: function (evt, node) {
        if (node.formElement.align !== undefined) {
          ASSERT(['left', 'right', 'center'].indexOf(node.formElement.align) >= 0, {msg: 'input field: the align property must be either left, right or center.', code: 2290});

          $(node.el).find('.tb-jf-preview').css('text-align', node.formElement.align);
        }

        if ( node.schemaElement && isForeignKeyField(node.schemaElement) ) {
          previewFKeyFunction(node);
        }

        $(node.el).data('node-data', node);
      },
      getFieldValue: function (node, tree) {
        var realNode = $(node).data('node-data');
        var name = $(node).attr('name');
        if (name) {
          var value;
          if (tree && tree.keyToNode[ name ] && ! realNode) {
            value = tree.keyToNode[ name ].value;
          } else if (realNode) {
            value = realNode.value;
          } else {
            ASSERT(0, "No comprende: ", name, node);
          }

          return {
            name: name, 
            value: value,
          };
        }
      }
    },
    imagepreview: {
      template: '' +
      '<div style="display: inline-block;" id="<%= id %>" name="<%= node.name %>"> ' +
        '<span class="tb-jf-title" style="display: block;"> <%= node.getTitle() %>: </span> <%= node.fullHTMLData %>' +
      '</div>',
      compatibleTypes: ['null'],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      previewField: true,
      getImageParams: function (node) {
        var data = {};
        //todo: dannificiraj
        data.imgHeight = node.formElement.filePreviewHeight || _.get(node.schemaElement, 'filePreviewHeight') || node.ownerTree.formDesc.form.filePreviewHeight;
        data.imgWidth = node.formElement.filePreviewWidth || _.get(node.schemaElement, 'filePreviewWidth') || node.ownerTree.formDesc.form.filePreviewWidth;
        data.fullName = node.formElement.fullName || node.ownerTree.formDesc.form.redirectImageDefault;
        data.thumbName = node.formElement.thumbName || node.ownerTree.formDesc.form.thumbnailImageDefault;
        data.imageTitle = node.formElement.imageTitle || node.ownerTree.formDesc.form.titleImagePreviewDefault;
        data.sources = node.formElement.imageSource;
        // data.imageBasePath = node.schemaElement.imageBasePath;
        data.value = node.value;

        return data;
      },
      checkImageParams: function (data, node) {

        ASSERT(_.isNumber(data.imgHeight), { code: 4590, msg: '$KEY$ Default values should be number for value $HEIGHT$', msgParams: {KEY: node.formElement.key, HEIGHT: data.imgHeight} });
        ASSERT(data.imgHeight > 0, { code: 4600, msg: '$KEY$ Default values should be positive $HEIGHT$', msgParams: { KEY: node.formElement.key, HEIGHT: data.imgHeight } });
        ASSERT(data.imgHeight < node.ownerTree.formDesc.form.maximumFilePreviewHeight, { code: 4610, msg: '$KEY$ Default values should be below 2000 $HEIGHT$', msgParams: { KEY: node.formElement.key, HEIGHT: data.imgHeight } });

        ASSERT(_.isNumber(data.imgWidth), { code: 4620, msg: '$KEY$ Default values should be number for value $WIDTH$', msgParams: { KEY: node.formElement.key, WIDTH: data.imgWidth } });
        ASSERT(data.imgWidth > 0, { code: 4630, msg: '$KEY$ Default values should be positive $WIDTH$', msgParams: { KEY: node.formElement.key, WIDTH: data.imgWidth } });
        ASSERT(data.imgWidth < node.ownerTree.formDesc.form.maximumFilePreviewWidth, { code: 4640, msg: '$KEY$ Default values should be below 2000 $WIDTH$', msgParams: { KEY: node.formElement.key, WIDTH: data.imgWidth } });

        //ASSERT(data.sources, { code: 4650, msg: 'Image preview must have imageSource attribute, string or array of (hashes|strings) ' })

      },
      appendElement: function ($node, thumb, full, title, $temp) {
        $node.find('a')[0].href = full;
        $node.find('img')[0].src = thumb;
        if (title) {
          $node.find('p').text(title);
        }

        $node.clone().appendTo($temp);
      },
      onBeforeRender: function (data, node) {
        var data = this.getImageParams(node);
        this.checkImageParams(data, node);

        var $node = $('<div data-tb-jf-placeholder style="display: inline-block; max-width: ' + data.imgWidth + 'px;">' +
          '<p style="word-wrap: break-word;"></p>' +
          '<a href="" target="_blank">' +
            '<img src=""' +
              'style="float: left; width: 100%; max-height: ' + data.imgHeight + 'px;">' +
          '</a>' +
        '</div>');
        var $temp = $('<div></div>');

        if (data.imageBasePath) {
          var path = data.imageBasePath + data.value;
          this.appendElement($node, path, path, null, $temp);
        } else {
          if (_.isArray(data.sources)) {
            data.sources.forEach(function(elem) {

              if ( _.isString(elem) ) {
                this.appendElement($node, elem, elem, null, $temp);
              } else {
                this.appendElement($node, elem[data.thumbName], elem[data.fullName], elem[data.imageTitle], $temp);
              }

            }, this);

          } else {
            this.appendElement($node, data.sources, data.sources, null, $temp);
          }
        }

        node.fullHTMLData = $temp[0].outerHTML;
      }
    },
    jsoneditor: {
      template: '<div id="<%= id %>" name="<%= node.name %>" ' +
        'class="<%= fieldHtmlClass %> ' +
        '<%= (node.formElement && node.formElement.required ? " tb-jf-required" : "") %>' +
        '"' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '<%= (node.readOnly? " disabled" : "")%>' +
        '></div>',
      compatibleTypes: ['string'],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      fieldtemplate: true,
      inputfield: true,
      isTbTemplate: false,
      onInsert: function (data, node) {
        var container = $('#' + node.id)[0];
        var options = {
          mode: 'text',
		  onValidationError: function (errors) {
		    errors.forEach((error) => {
			  if (error.type === 'error') {
			    // do nothing
			  }
			});
		  },
		  onError: function (error) {
		    // do nothing
		  },
        };

        if (node.readOnly) {
          options.onEditable = function (node) {
            if (!node.path) {
              // In modes code and text, node is empty: no path, field, or value
              // returning false makes the text area read-only
              return false;
            }
          }
        }

        JSONEditor = JSONEditor || window.JSONEditor ;

        var editor = new JSONEditor(container, options);
        if (typeof node.value == 'string') {
            editor.setText(node.value);
        } else if (_.isPlainObject(node.value)) {
            editor.setText( JSON.stringify(node.value) );
        } else {
            editor.setText('');
        }

        editors[node.name] = editor;
      },
      getFieldValue: function (rootEl, tree) {
        var $div = $(rootEl).find('div[name]');
        let name = $div.attr('name');

        var editor = editors[ name ];
        var node = tree.keyToNode[ name ];

        // not initialized, get the LOAD value
        if ( ! editor ) {
          return {
            name: name,
            value: node.value,
          };
        }

        var val = editor.getText();
        if (val == '') {
          return {
            name: name,
            value: null,
          };
        }

        try {
          JSON.parse(val);
        } catch (e) {
          if ( _.get(window, 'TB.jfpage.state.disableValidation') ) {

          } else {
            val = "INVALID_JSON";
          }
        };

        return {
          name: name,
          value: val
        };
      },
      getErrors: function (node) {
        var value = tbjsonJsonpointer.get(node.getFormValues(), '/' + node.key);
        var errors = [];
        
        if (_.isPlainObject(value) || value == null) {
          return false;
        }

        try {
          JSON.parse(value);
        } catch (e) {
          errors.push({
            msg: 'Invalid JSON',
            dataPath: tbjsonAjv2Tb.jsonPointerNotationToDotNotation(node.key)
          });
        }

        return errors.length ? errors : false;
      }
    },
    tinymce: {
      template: '<textarea id="<%= id %>" name="<%= node.name %>" ' +
        'class="<%= cls.textualInputClass %> <%= fieldHtmlClass %>" ' +
        'style="<%= elt.height ? "height:" + elt.height + ";" : "" %>width:<%= elt.width || "100%" %>;"' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '<%= (node.readOnly? " disabled" : "")%>' +
        '<%= (node.placeholder? " placeholder=" + \'"\' + node.placeholder + \'"\' : "")%>' +
        '><%= escape(value) %></textarea>',
      compatibleTypes: ['string', 'number', 'integer'],
      compatibleFormats: ['html'],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      fieldtemplate: true,
      inputfield: true,
      isTbTemplate: false,
      onBeforeRender: function (data, node) {
        var userGuideLink = 'https://www.radarhill.com/tinymce-user-guide';
        var showUserGuide = false;

        if (showUserGuide) {
          if (node.description) {
            node.description += ' - <a href="' + userGuideLink + '" target="_blank">user guide</a>&nbsp;&nbsp;<a style="cursor: pointer;" class="create-new-modal">Preview</a>';
          } else {
            node.description = '&nbsp;&nbsp;<a href="' + userGuideLink + '" target="_blank">user guide</a>&nbsp;&nbsp;<a style="cursor: pointer;" class="create-new-modal">Preview</a>';
          }
        } else {
          if (node.description) {
            node.description += ' - &nbsp;&nbsp;<a style="cursor: pointer;" class="create-new-modal">Preview</a>';
          } else {
            node.description = '&nbsp;&nbsp;<a style="cursor: pointer;" class="create-new-modal">Preview</a>';
          }
        }

      },
      onInsert: function (evt, node) {
        // all themes which are locally available
        var supportedThemes = [
          'modern'
        ];
        // all skins which are locally available
        var supportedSkins = [
          'lightgray', 'lightgray-gradient', 'charcoal'
        ];
        // all locally available plugins
        var supportedPlugins = [
          'advlist', 'codesample', 'noneditable', 'template',
          'anchor', 'colorpicker', 'imagetools', 'pagebreak', 'textcolor',
          'autolink', 'contextmenu', 'importcss', 'paste', 'textpattern',
          'autoresize', 'directionality', 'insertdatetime', 'preview', 'visualblocks',
          'autosave', 'emoticons', 'layer', 'print', 'visualchars',
          'base64image', 'image', 'example', 'legacyoutput', 'save', 'wordcount',
          'bbcode', 'example_dependency', 'link', 'searchreplace',
          'fullpage', 'lists', 'spellchecker',
          'charmap', 'fullscreen', 'tabfocus',
          'code', 'hr', 'nonbreaking', 'table', 'fontselect', 'fontsize'
        ];
        var pluginOptions = node.formElement.pluginOptions || {};
        /*
            _.merge(pluginOptions, {
                cleanup_on_startup: false,
                trim_span_elements: false,
                verify_html: false,
                cleanup: false,
                convert_urls: false,
            });
        */

        pluginOptions.selector = '#' + node.id;
        pluginOptions.readonly = node.isReadOnly() || node.disabled;

        if ( pluginOptions.valid_children ) {
            pluginOptions.valid_children += ',+body[style]';
        } else {
            pluginOptions.valid_children = '+body[style]';
        }

        if (pluginOptions.height !== undefined) {
          ASSERT.isNumber(pluginOptions.height, {msg: 'Height must be a number!', code: 2370});
          ASSERT(pluginOptions.height > 0, {msg: 'Height must be more than 0', code: 2380});
        } else {
          pluginOptions.height = 150;
        }

        if ( pluginOptions.valid_children ) {
            pluginOptions.valid_children += ',+body[style]';
        } else {
            pluginOptions.valid_children = '+body[style]';
        }


        if (pluginOptions.max_height !== undefined) {
          ASSERT(pluginOptions.max_height >= pluginOptions.height, {msg: 'TinyMCE: pluginOptions.max_height $MAXHEIGHT$ must be greater or equal to pluginOptions.height $HEIGHT$.', msgParams: {MAXHEIGHT: pluginOptions.max_height, HEIGHT: pluginOptions.height}, code: 2390});
        }

        if (pluginOptions.min_height !== undefined) {
          ASSERT(pluginOptions.min_height <= pluginOptions.height, {msg: 'TinyMCE: pluginOptions.min_height $MINHEIGHT$ must be lesser or equal to pluginOptions.height $HEIGHT$.', msgParams: {MINHEIGHT: pluginOptions.min_height, HEIGHT: pluginOptions.height}, code: 2400});
        }

        if (pluginOptions.width !== undefined) {
          ASSERT.isNumber(pluginOptions.width, {msg: 'Width must be a number', code: 2410});
          ASSERT(pluginOptions.width > 0, {msg: 'Height must be above 0', code: 2420});
        }

        if (pluginOptions.max_width !== undefined) {
          ASSERT.isNumber(pluginOptions.max_width, {msg: 'maxWidth must be a number', code: 2430});
          if (pluginOptions.width !== undefined) {
            ASSERT(pluginOptions.max_width >= pluginOptions.width, {msg: 'TinyMCE: pluginOptions.max_width $MAXWIDTH$ must be greater or equal to pluginOptions.width $WIDTH$.', msgParams: {MAXWIDTH: pluginOptions.max_width, WIDTH: pluginOptions.width}, code: 2440});
          }
        }

        if (pluginOptions.min_width !== undefined) {
          ASSERT.isNumber(pluginOptions.min_width, {msg: 'minWidth must be a number', code: 2450});
          if (pluginOptions.width !== undefined) {
            ASSERT(pluginOptions.min_width <= pluginOptions.width, {msg: 'TinyMCE: pluginOptions.min_width $MINWIDTH$ must be less or equal to pluginOptions.width $WIDTH$.', msgParams: {MINWIDTH: pluginOptions.min_width, WIDTH: pluginOptions.width}, code: 2460});
          }
        }

        if (pluginOptions.theme !== undefined) {
          ASSERT.isString(pluginOptions.theme, {msg: 'theme must be a string', code: 2470});
          ASSERT(supportedThemes.indexOf(pluginOptions.theme) >= 0, {msg: 'TinyMCE: pluginOptions.theme contains a theme that does not exist: $THEME$.', msgParams: {THEME: pluginOptions.theme}, code: 2480});
        } else {
          pluginOptions.theme = 'modern';
        }

        if (pluginOptions.skin !== undefined) {
          ASSERT.isString(pluginOptions.skin, {msg: 'skin must be of type string', code: 2490});
          ASSERT(supportedSkins.indexOf(pluginOptions.skin) >= 0, {msg: 'TinyMCE: pluginOptions.skin contains a skin that does not exist: $SKIN$.', msgParams: {SKIN: pluginOptions.skin}, code: 2500});
        } else {
          pluginOptions.skin = 'lightgray-gradient';
        }

        if (pluginOptions.plugins !== undefined && pluginOptions.plugins.length) {
          ASSERT(_.isArray(pluginOptions.plugins) === true, {msg: 'TinyMCE: pluginOptions.plugins must be an array.', code: 2510});

          for (var i = 0, j = pluginOptions.plugins.length; i < j; i++) {
            ASSERT(supportedPlugins.indexOf(pluginOptions.plugins[i]) >= 0, {msg: 'TinyMCE: pluginOptions.plugins contains a plugin that does not exist: $PLUGIN$', msgParams: {PLUGIN: pluginOptions.plugins[i]}, code: 2520});
          }

          if (pluginOptions.plugins.indexOf('base64image') < 0) {
            pluginOptions.plugins.push('base64image');
          }
          if (pluginOptions.plugins.indexOf('image') < 0) {
            pluginOptions.plugins.push('image');
          }
        } else {
          pluginOptions.plugins = ['base64image', 'image'];
        }

        pluginOptions.plugins.push('code');

        // images cannot be added in inline mode
        if (pluginOptions.inline !== undefined) {
        //   ASSERT.ofTbType(pluginOptions.inline, 'boolean', 'TinyMCE: pluginOptions.inline %s must be a boolean', pluginOptions.inline);
        // } else {
          pluginOptions.inline = false;
        }

        if (pluginOptions.image_advtab !== undefined) {
            /* ASSERT._isBoolean(pluginOptions.image_advtab, {msg: 'TinyMCE: pluginOptions.inline $OPTIONS_IMAGE_ADVTAB$ must be a boolean',
            {msgParam: {OPTIONS_IMAGE_ADVTAB: pluginOptions.image_advtab}, }, }); */
        } else {
          pluginOptions.image_advtab = false;
        }

        if (pluginOptions.resize !== undefined) {
          if (typeof pluginOptions.resize !== 'string') {
            ASSERT.isBoolean(pluginOptions.resize, {msg: 'TinyMCE: pluginOptions.resize $RESIZE$ must be a boolean or the string "both"', msgParams: {RESIZE: pluginOptions.resize}, code: 2530});
          } else {
            ASSERT(pluginOptions.resize === 'both', {msg: 'TinyMCE: pluginOptions.resize $RESIZE$ must be a boolean or the string "both"', msgParams: {RESIZE: pluginOptions.resize}, code: 2540});
          }
        } else {
          pluginOptions.resize = true;
        }

        if (pluginOptions.paste_data_images !== undefined) {
          ASSERT.isBoolean(pluginOptions.paste_data_images, {msg: 'TinyMCE: pluginOptions.resize $PASTE_DATA_IMAGE$ must be a boolean', msgParams: {PASTE_DATA_IMAGE: pluginOptions.paste_data_images}, code: 2550});
        } else {
          pluginOptions.paste_data_images = true;
        }

        if (pluginOptions.max_image_count !== undefined) {
          ASSERT.isNumber(pluginOptions.max_image_count, {msg: 'TinyMCE: pluginOptions.max_image_count $MAXIMAGECOUNT$ must be a number', msgParams: {MAXIMAGECOUNT: pluginOptions.max_image_count}, code: 2560});
        } else {
          pluginOptions.max_image_count = 10;
        }

        if (pluginOptions.max_image_size !== undefined) {
          ASSERT.isNumber(pluginOptions.max_image_size, {msg: 'TinyMCE: pluginOptions.max_image_size $MAXIMAGECOUNT$ must be a number', msgParams: {MAXIMAGECOUNT: pluginOptions.max_image_size}, code: 2570});
        } else {
          // default is 500kb
          pluginOptions.max_image_size = 512000;
        }

        if (pluginOptions.max_image_height !== undefined) {
          ASSERT.isNumber(pluginOptions.max_image_height, {msg: 'TinyMCE: pluginOptions.max_image_height $MAXIMAGECOUNT$ must be a number', msgParams: {MAXIMAGECOUNT: pluginOptions.max_image_height}, code: 2580});
        } else {
          pluginOptions.max_image_height = 1024;
        }

        if (pluginOptions.max_image_width !== undefined) {
          ASSERT.isNumber(pluginOptions.max_image_width, {msg: 'TinyMCE: pluginOptions.max_image_width $MAXIMAGEWIDTH$ must be a number', msgParams: {MAXIMAGEWIDTH: pluginOptions.max_image_width}, code: 2590});
        } else {
          pluginOptions.max_image_width = 1024;
        }

        pluginOptions.toolbar1 = 'undo redo | base64image styleselect image | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent | link | forecolor backcolor | preview print code';

        if (pluginOptions.readonly !== undefined) {
          ASSERT.isBoolean(pluginOptions.readonly, {msg: 'TinyMCE: pluginOptions.readonly $READONLY$ must be a boolean', msgParams: {READONLY: pluginOptions.readonly}, code: 2600});
          if (pluginOptions.readonly) {
            pluginOptions.toolbar1 = '';
          }
        }

        /**
         * TimyMCE exists in an iframe so change evnts do not bubble to the tb-jf-root
         * detect all change events and apply them to the textbox which keeps
         * the value of the TinyMCE instance
         */
        pluginOptions.setup = function (editor) {
          editor.on('change', function (e) {
            $(pluginOptions.selector).val(editor.getContent());
            $(pluginOptions.selector).trigger('change');
          });

        };

        $(pluginOptions.selector).one('click', function() {
          tinyMCE.init(pluginOptions);
        });

        $(node.el).find('.create-new-modal').click( function ( e ) {
          var editorValue = $(pluginOptions.selector).val();

          var myWindow = window.open("Preview", "PREVIEW", "resizable,scrollbars,status");
          myWindow.document.write( editorValue );
        });

      },
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        tinyMCE.get('' + node.id).setMode('readonly');
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        tinyMCE.get('' + node.id).setMode('edit');
      },
      getFieldValue: function (node) {
        var textarea = $(node).find('textarea');
        return {
          name: textarea[0].getAttribute('name'),
          value: textarea.val()
        };
      }
    },
    ace: {
      template: '<div id="<%= id %>" style="position:relative;height:<%= elt.height || "300px" %>;"><div id="<%= id %>__ace" style="width:<%= elt.width || "100%" %>;height:<%= elt.height || "300px" %>;"></div><input type="hidden" name="<%= node.name %>" id="<%= id %>__hidden" value="<%= escape(value) %>"/></div>',
      compatibleTypes: ['string', 'number', 'integer'],
      compatibleFormats: [],
      fieldtemplate: true,
      inputfield: true,
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      isTbTemplate: false,
      onBeforeRender: function (data, node) {
        if ((data.value && typeof data.value === 'object') || _.isArray(data.value)) {
          data.value = JSON.stringify(data.value, null, 2);
        }
      },
      onInsert: function (evt, node) {
        var setup = function () {
          var formElement = node.formElement || {};
          var editor = ace.edit($(node.el).find('#' + jfUtils.escapeSelector(node.id) + '__ace').get(0));
          var idSelector = '#' + jfUtils.escapeSelector(node.id) + '__hidden';
          // Force editor to use "\n" for new lines, not to bump into ACE "\r" conversion issue
          // (ACE is ok with "\r" on pasting but fails to return "\r" when value is extracted)
          editor.getSession().setNewLineMode('unix');
          editor.renderer.setShowPrintMargin(false);
          editor.setTheme('ace/theme/' + (formElement.aceTheme || 'twilight'));

          if (formElement.aceMode) {
            editor.getSession().setMode('ace/mode/' + formElement.aceMode);
          }
          editor.getSession().setTabSize(2);

          // Set the contents of the initial manifest file
          var valueStr = node.value;
          if (valueStr === null || valueStr === undefined) {
            valueStr = '';
          } else if (typeof valueStr === 'object' || Array.isArray(valueStr)) {
            valueStr = JSON.stringify(valueStr, null, 2);
          }
          editor.getSession().setValue(valueStr);

          // TODO this is clearly sub-optimal
          // 'Lazily' bind to the onchange 'ace' event to give
          // priority to user edits
          var lazyChanged = _.debounce(function () {
            $(node.el).find(idSelector).val(editor.getSession().getValue());
            $(node.el).find(idSelector).change();
          }, 600);
          editor.getSession().on('change', lazyChanged);

          editor.on('blur', function () {
            // $(node.el).find(idSelector).change();
            $(node.el).find(idSelector).trigger('blur');
          });
          editor.on('focus', function () {
            $(node.el).find(idSelector).trigger('focus');
          });

          if (node.formElement.readOnly === true) {
            editor.setReadOnly(true);
          }
        };

        // Is there a setup hook?
        if (window.jsonform_ace_setup) {
          window.jsonform_ace_setup(setup);
          return;
        }

        // Wait until ACE is loaded
        var itv = window.setInterval(function () {
          if (ace) {
            window.clearInterval(itv);
            setup();
          }
        }, 1000);
      },
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        ace.edit($(node.el).find('#' + jfUtils.escapeSelector(node.id) + '__ace').get(0))
          .setReadOnly(true);
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        ace.edit($(node.el).find('#' + jfUtils.escapeSelector(node.id) + '__ace').get(0))
          .setReadOnly(false);
      }
    },
    checkbox: {
      template: '<div class="tb-jf-single-checkbox checkbox styled"><input type="checkbox" id="<%= id %>" ' +
      'name="<%= node.name %>" value="1" <% if (value) {%>checked<% } %>' +
      '<%= (node.disabled? " disabled=\'disabled\'" : "")%>' +
      '<%= (node.readOnly? " disabled=\'disabled\'" : "")%>' +
      ' />' +
      //'<label class="tb-jf-checkbox-label" for="<%= id %>">' +
      //'<%= node.inlinetitle %>' +
      //'</label>' +
      '</div>',
      compatibleTypes: ['boolean'],
      compatibleFormats: [],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      fieldtemplate: true,
      inputfield: true,
      isTbTemplate: false,
      onBeforeRender: function (evt, node) {
        node.inlinetitle = node.formElement.inlinetitle || node.getTitle();

        node.isTbTemplate = false;
      },
      onInsert: function (evt, node) {
        if (!node.formElement.hasOwnProperty('useDeprecatedPlugin') ||
          node.formElement.useDeprecatedPlugin === false) {
          var msg = 'Checkbox plugins are deprecated as it is always necessary to specify a default value. Otherwise the library must choose a default which is problematic.';
          // alert(msg);
          TRACE(msg);
        }

        if (node.formElement.toggleNext) {
          var nextN = node.formElement.toggleNext === true ? 1 : node.formElement.toggleNext;
          var toggleNextClass = 'tb-jf-toggle-next tb-jf-toggle-next-' + nextN;
          var $next = (nextN === 1)
            ? $(node.el).next()
            : (nextN === 'all'
              ? $(node.el).nextAll()
              : $(node.el).nextAll().slice(0, nextN));

          $next.addClass('tb-jf-toggle-next-target');

          $(node.el)
            .addClass(toggleNextClass)
            .find(':checkbox')
            .on('change', function () {
              var $this = $(this);
              var checked = $this.is(':checked');
              $(node.el)
                .toggleClass('checked', checked);
              $next
                .toggle(checked)
                .toggleClass('tb-jf-visible', checked);
            }).change();
        }
      },
      getElement: function (el) {
        return $(el).parent().parent().get(0);
      },
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('disabled', true);
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .prop('disabled', false);
      },
      getFieldValue: function (node) {
        var checkbox = $(node).find(':input[type=checkbox]');

        return {
          name: checkbox[0].name,
          value: checkbox[0].checked
        };
      }
    },
    changepassword: {
      template: '' +
        '<div class="tb-jf-password-container tb-jf-error-<%= node.selectorKey %> <%= (node.rowWidth || node.formElement.rowWidth) ? "col" : ""  %> col-sm-<%= node.rowWidth || node.formElement.rowWidth %>" data-tb-jf-type="<%= node.formElement.type %>">' +
        '<span class="help-block tb-jf-errortext tb-jf-hide"></span>' +
        '<input  type="hidden" name="<%= node.name %>" id="<%= id %>" class="tb-jf-password-field" >' +
        '<div class="tb-jf-password-item-container"><%= node.passwordTitle.old %><br />' +
        '<input class="<%= cls.textualInputClass %> <%= fieldHtmlClass %> tb-jf-password-field" ' +
        ' type="password" dataId="oldPass" id="<%= node.slaveIds.old %>" ' +
        ' /></div>' +
        '<div class="tb-jf-password-item-container"><%= node.passwordTitle.new %><br />' +
        '<input class="<%= cls.textualInputClass %> <%= fieldHtmlClass %> tb-jf-password-field" ' +
        ' id="<%= node.slaveIds.new %>" type="password" dataId="newPass"' +
        ' /></div>' +
        '<div class="tb-jf-password-item-container"><%= node.passwordTitle.confirm %><br /><input  ' +
        'class="<%= cls.textualInputClass %> <%= fieldHtmlClass %> tb-jf-password-field" ' +
        ' id="<%= node.slaveIds.confirm %>" type="password" dataId="validateMe"' +
        ' /></div></div>',
      compatibleTypes: ['string'],
      compatibleFormats: ['password'],
      isTbTemplate: false,
      inputfield: true,
      minRowWidth: 'quarter',
      maxRowWidth: 'half',
      onBeforeRender: function (evt, node) {
        var regex = REGEX.CATCH_CONTAINER_OR_FIELD;
        var match = regex.exec(node.id);

        // bahti skapaniq ezik
        //multiple usages of the
        regex.lastIndex = 0;
        var passwordTitle = {};

        passwordTitle.old = node.formElement.oldPasswordTitle;
        passwordTitle.new = node.formElement.newPasswordTitle;
        passwordTitle.confirm = node.formElement.confirmNewPasswordTitle;
        node.passwordTitle = passwordTitle;

        // matches[1] contains either container or field, and can be extended in the regex for any other, if the future demands it
        var oldSlave = node.id.replace(match[1], match[1] + '-slave-old');
        var newSlave = node.id.replace(match[1], match[1] + '-slave-new');
        var confirmSlave = node.id.replace(match[1], match[1] + '-slave-confirm');

        var slaveIds = {
          old: oldSlave,
          new: newSlave,
          confirm: confirmSlave
        };

        node.slaveIds = slaveIds;
      },
      getFieldValue: function (rootEl) {
        var $rootEl = $(rootEl);
        var realInputField = $rootEl.find('[type="hidden"]');

        var name = $rootEl.find('[name]').attr('name');
        var oldValue = $rootEl.find('[dataId="oldPass"]').val();
        var newValue = $rootEl.find('[dataId="newPass"]').val();
        var newValueVerify = $rootEl.find('[dataId="validateMe"]').val();

        var isEmpty = false;
        var returnObject = {
          oldValue: oldValue,
          newValue: newValue,
          confirmValue: newValueVerify
        };

        if (oldValue === '' && newValue === '' && newValueVerify === '') {
          isEmpty = true;
        }

        realInputField.val(JSON.stringify(returnObject));

        return {
          'name': name,
          'value': isEmpty ? null : JSON.stringify(returnObject)
        };
      }
    },
    file: {
      template: '<span data-id="drawerjs-debugger"></span><input class="input-file form-control tb-jf-input-class" type="file" id="<%= id %>" name="<%= node.name %>" accept="<%= node.mimeTypesFormattedString %>" data-tb-jf-type="file" <%= node.isMultiple %>  /> ',
      compatibleTypes: ['string', null],
      compatibleItemTypes: 'string',
      minRowWidth: 'quarter',
      maxRowWidth: 'half',
      fieldtemplate: true,
      isTbTemplate: false,
      inputfield: true,
      onBeforeRender: function (evt, node) {
        // Uncomment this line, if you want to have multiple files!
        node.isMultiple = node.schemaElement.isMultiple ? 'multiple' : undefined;

        var mimeTypesFormattedString = '';
        var fileMimeTypesList = node.schemaElement.fileMimeTypes || _.get(node.schemaElement, 'items.fileMimeTypes');

        if (fileMimeTypesList === undefined) { return; }

        fileMimeTypesList.map(function (mimeType) {
          mimeTypesFormattedString += mimeType + ',';
        });

        // node.isMultipleField = node.schemaElement.multiple ? 'multiple':'';
        node.mimeTypesFormattedString = mimeTypesFormattedString;
      },
      onInsert: function(evt, node) {
        if (!node.formElement.isDrawer) {
          return;
        }

        $(node.el).parent().append(`
          <style>
          </style>
        `);

        function initializeCanvas({width, height, url}) {
          // todo, more efficient way?
          $('#redactor-drawer-box').remove();
          $(node.el).parent().find('.editable-canvas-image, .tb-jf-file-image-input').remove();
          DrawerJs.plugins.Marti = function (drawerInstance, ...args) {
            var base = new DrawerJs.plugins.BaseTool(drawerInstance, ...args);
            base.name = 'Marti';
            base.btnClass = 'btn-move';
            base.faClass = 'fa-arrows';
            base.tooltip = drawerInstance.t('Move');
            return base;
          };

          var drawerPlugins = [
            // Drawing tools  
            'Marti',
            //'Pencil',
            'Eraser',
            //'Text',
            //'Line',
            //'ArrowOneSide',
            //'ArrowTwoSide',
            //'Triangle',
            'Rectangle',
            //'Circle',
            'Image',
            //'BackgroundImage',
            //'Polygon',
            //'ImageCrop',

            // Drawing options
            //'ColorHtml5',
            'Color',
            'ShapeBorder',
            'BrushSize',
            'OpacityOption',

            'LineWidth',
            'StrokeWidth',

            'ShapeContextMenu',
            //'CloseButton',
            'OvercanvasPopup',
            'OpenPopupButton',
            //'MinimizeButton',
            //'ToggleVisibilityButton',
            //'MovableFloatingMode',
            //'FullscreenModeButton',

            //'TextLineHeight',
            //'TextAlign',

            //'TextFontFamily',
            //'TextFontSize',
            //'TextFontWeight',
            //'TextFontStyle',
            //'TextDecoration',
            //'TextColor',
            //'TextBackgroundColor',

            'Resize'
          ];

          var drawingCanvas = new DrawerJs.Drawer(null, {
            plugins: drawerPlugins,
            corePlugins: [
              'Zoom',
              'Resize',
            ],
            pluginsConfig: {
              Eraser: {
                brushSize: 15
              },
              Image: {
                scaleDownLargeImage: true,
                maxImageSizeKb: 102400, //1MB
                cropIsActive: true
              },
              BackgroundImage: {
                scaleDownLargeImage: true,
                maxImageSizeKb: 102400,
                imagePosition: 'center',
                acceptedMIMETypes: ['image/jpeg', 'image/png', 'image/gif'] ,
                dynamicRepositionImage: true,
                dynamicRepositionImageThrottle: 100,
                cropIsActive: true,
                fixedBackgroundUrl: url
              },
              Text: {
                editIconMode : false,
                editIconSize : 'large',
                defaultValues : {
                  fontSize: 72,
                  lineHeight: 2,
                  textFontWeight: 'bold'
                },
                predefined: {
                  fontSize: [8, 12, 14, 16, 32, 40, 72],
                  lineHeight: [1, 2, 3, 4, 6]
                }
              },
              Zoom: {
                enabled: true,
                showZoomTooltip: true,
                useWheelEvents: true,
                zoomStep: 1.05,
                defaultZoom: 1,
                maxZoom: 32,
                minZoom: 0.01,
                smoothnessOfWheel: 0,
                //Moving:
                enableMove: false,
                enableWhenNoActiveTool: true,
                enableButton: true
              }
            },

            toolbars: {
              drawingTools: {
                position: 'left',
                positionType: 'outside',
                compactType: 'multiline',
                hidden: false,
                toggleVisibilityButton: false,
              },
              toolOptions: {
                position: 'top',
                positionType: 'outside',
                compactType: 'popup',
                hidden: false,
                toggleVisibilityButton: false,
              },
              settings: {
                position: 'left',
                positionType: 'outside',
              },
            },
            contentConfig: {
              saveInHtml: false,
              saveAfterInactiveSec: 99999
            },
            defaultImageUrl: url,
            defaultActivePlugin : { name : 'Pencil', mode : 'lastUsed'},
            //debug: true,
            activeColor: '#000000',
            //transparentBackground: true,
            //backgroundCss: '#000000',
            //align: 'floating',  //one of 'left', 'right', 'center', 'inline', 'floating'
            align: 'center',
            lineAngleTooltip: { enabled: true, color: 'blue',  fontSize: 15},
            imagesContainer: '#image-container',
          }, width, height);

          var $canvas = drawingCanvas.getHtml();
          $(node.el).parent().append($canvas);
          drawingCanvas.onInsert();
          $(node.el).parent().append($('<div class="tb-jf-file-image-input"></div>').data('drawing-canvas', drawingCanvas).data('name', node.key));

          return drawingCanvas;
        }

        function getMetaAsync(url) {
          return new Promise((resolve, reject) => {
            var image = new Image();
            image.src = url;

            image.onload = function() {
              //let canvas = document.getElementById('myCanvas');
              //canvas.width = this.width;
              //canvas.height = this.height;
              //let ctx = canvas.getContext("2d");
              //ctx.drawImage(image, 0, 0);

              resolve({
                image,
                width: this.width,
                height: this.height
              });
            }
          });
        }

        function readFileAsync(file) {
          return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.onload = function() {
              resolve(reader.result);
            }
            reader.onerror = function() {
              reject(reader.error);
            }
            reader.readAsDataURL(file);
          });
        }

        function mapMerge(images) {
          var totalWidth = 0;
          var totalHeight = 0;

          for (var img of images) {
            totalWidth += img.width;
            totalHeight = Math.max(totalHeight, img.height);
          }

          var maxHeight = node.schemaElement.imageMaxHeight;
          var maxWidth = node.schemaElement.imageMaxWidth;

          var scaleX = 1;
          var scaleY = 1;

          if (maxWidth && totalWidth > maxWidth) {
            scaleX = maxWidth / totalWidth;
            totalWidth = maxWidth;
          }

          if (maxHeight && totalHeight > maxHeight) {
            scaleY = maxHeight / totalHeight;
            totalHeight = maxHeight;
          }

          if (scaleX > scaleY) {
            totalWidth *= scaleY / scaleX;
            scaleX = scaleY;
          }

          if (scaleY > scaleX) {
            totalHeight *= scaleX / scaleY;
            scaleY = scaleX;
          }

          var drawer = initializeCanvas({width: totalWidth, height: totalHeight});

          var maxElHeight = node.formElement.drawerMaxElementHeight;
          var maxElWidth = node.formElement.drawerMaxElementWidth;

          var elScale = 1;

          if (maxElWidth && totalWidth > maxElWidth) {
            elScale = maxElWidth / totalWidth;
          }

          if (maxElHeight && totalHeight > maxElHeight) {
            elScale = Math.min(elScale, maxElHeight / totalHeight);
          }

          const elTargetHeight = totalHeight * elScale;

/*          
          $(node.el).siblings('[data-id="drawerjs-debugger"]').html(`
            IMAGE PROPS:  width: ${img.width} height: ${img.height}<br />
            CANVAS IMAGE PROPS:  ???
            CANVAS PROPS: width: ${node.formElement.drawerMaxElementWidth} height: ${node.formElement.drawerMaxElementHeight}<br />
            scalingFactor: ${elScale} <br />
          `);
*/
          $(node.el).parent().find('style').html(`
            .editable-canvas-image, .canvas-container, .redactor-drawer-resizer {
              transform: scale(${elScale});
              transform-origin: top left;
              margin-bottom: ${elTargetHeight - totalHeight}px;
            }
            .toolbars-wrapper {
              max-height: ${elTargetHeight}px;
            }
            #redactor-drawer-box {
              border: none !important;
              background: transparent !important;
	      width: ${totalWidth * elScale}px !important;
	      height: ${elTargetHeight}px !important;
            }
            .canvas-container {
              border: 1px dashed rgb(195, 194, 194);
            }
          `);

          $(node.el).parent().css('width', totalWidth * elScale + 'px').css('height', elTargetHeight + 50 + 'px');


          drawer.api.startEditing();
          var currWidth = 0;
          for (var img of images) {
            drawer.api.addImage(img.image, {
              left: currWidth,
              top: 0,
              scaleX,
              scaleY
            });
            currWidth += img.width * scaleX;
          }

          drawer.api.stopEditing();
        }

        function mergeImages(files) {
          Promise.all(files.map(f => readFileAsync(f).then(getMetaAsync))).then(mapMerge);
        }

        // TODO trigger change on canvas change?
        $(node.el).change();
        $(node.el).on('change', ev => {
          var files = node.el.files;
          mergeImages([...files]);
        });

        var contentFiles = node.ownerTree.formDesc && node.ownerTree.formDesc.files && node.ownerTree.formDesc.files[node.key];
        if (contentFiles) {
          Promise.all(contentFiles.file.map(e => getMetaAsync(URL.createObjectURL(e)))).then(mapMerge);
        }
      },
      getFieldValue: function (rootEl) {
        var $fileInput = $(rootEl);
        var value;
        if ($fileInput.find('.input-file.form-control').length !== 0) {
          $fileInput = $fileInput.find('.input-file.form-control');
        }

        for (var i = 0; i < $fileInput[0].files.length; i++) {
          value = $fileInput[0].files[i].name;
        }

        return {
          name: $fileInput.attr('name'),
          value: value !== undefined ? value : null
        };
      }
    },
    // TODO FIXME do not depend on the classes 1-debug & 2-debug
    base64file: {
      template: '<input type="hidden" id="<%= id %>"  name=<%= node.name %> /><input class="input-file form-control" accept="<%= node.mimeTypesFormattedString %>" data-tb-jf-type="base64file" type="file" <%= node.isMultipleField %> /> ',
      compatibleTypes: ['string', null],
      compatibleFormats: ['base64'],
      minRowWidth: 'quarter',
      maxRowWidth: 'half',
      fieldtemplate: true,
      isTbTemplate: false,
      inputfield: true,
      onBeforeRender: function (evt, node) {
        var mimeTypesFormattedString = '';
        var fileMimeTypesList = node.schemaElement.fileMimeTypes || _.get(node.schemaElement, 'items.fileMimeTypes');

        ASSERT(fileMimeTypesList, {msg: 'Please give mimetypes', code: 2610});

        fileMimeTypesList.map(function (mimeType) {
          mimeTypesFormattedString += mimeType + ',';
        });

        // node.isMultipleField = node.schemaElement.multiple ? 'multiple':'';
        node.mimeTypesFormattedString = mimeTypesFormattedString;
      },
      appendImagePlaceholder: function ($hiddenInput, $imgContainer, imgWidth, imgHeight) {
        var $imageWrapper = $('<div class="1-debug tb-jf-file-preview-container"></div>');
        var $img = $('<img />');
        var $span = $('<span class="glyphicon glyphicon-remove-circle"></span>');

        $imageWrapper.append($img);
        $imageWrapper.append($span);
        $span.css('display', 'none');
        $img.css('display', 'none')
            .css('max-height', imgHeight)
            .css('max-width', imgWidth);

        $imgContainer.append($imageWrapper);

        $span.click(function () {
          var $fileInput = $(this).parent().parent().siblings('[type="file"]');
          $fileInput.val('');

          $(this).siblings('.2-debug img').attr('src', '');
          $($imgContainer).find('img').css('display', 'none');
          $imgContainer.find('span').css('display', 'none');

          $hiddenInput.val('');
        });
      },
      changeImg: function ($hiddenInput, imgData, $imgContainer, parsedFileData) {
        $hiddenInput.val(imgData);

        $($imgContainer).find('img').prop('src', parsedFileData ? parsedFileData[2] : displayCompactData)
          .css('display', 'inline-block');


        $imgContainer.find('span').css('display', 'inline-block');
      },
      onInsert: function (evt, node) {
        var parseAsText = ['text/x-url', 'application/x-url', 'text/url'];
        var self = this;
        var idSelector = '#' + jfUtils.escapeSelector(node.id);
        var $hiddenInput = $(node.el).find(idSelector);
        var $fileInput = $hiddenInput.next();
        var $fileInputParent = $fileInput.parent();
        var $imgContainer = $('<div class="2-debug"></div>');
        var imgHeight;
        var imgWidth;
        var imagesDefaultValue;

        $fileInputParent.append($imgContainer);

        imgHeight = node.formElement.filePreviewHeight || _.get(node.schemaElement, 'filePreviewHeight') || node.ownerTree.formDesc.form.filePreviewHeight;
        imgWidth = node.formElement.filePreviewWidth || _.get(node.schemaElement, 'filePreviewWidth') || node.ownerTree.formDesc.form.filePreviewWidth;
        imagesDefaultValue = node.value || node.schemaElement.default;

        ASSERT(_.isNumber(imgHeight), { code: 2620, msg: '$KEY$ Default values should be number for value $HEIGHT$', msgParams: {KEY: node.formElement.key, HEIGHT: imgHeight} });

        // TODO @momo сложи навсякъде първото нещо на асъртите да е техния код, така е много по-четимо какво се е случило, защото го хващаш само по числото
        ASSERT(imgHeight > 0, { code: 2630, msg: '$KEY$ Default values should be positive $HEIGHT$', msgParams: { KEY: node.formElement.key, HEIGHT: imgHeight } });
        ASSERT(imgHeight < node.ownerTree.formDesc.form.maximumFilePreviewHeight, { code: 2640, msg: '$KEY$ Default values should be below 2000 $HEIGHT$', msgParams: { KEY: node.formElement.key, HEIGHT: imgHeight } });

        ASSERT(_.isNumber(imgWidth), { code: 2650, msg: '$KEY$ Default values should be number for value $WIDTH$', msgParams: { KEY: node.formElement.key, WIDTH: imgWidth } });

        ASSERT(imgWidth > 0, { code: 2660, msg: '$KEY$ Default values should be positive $WIDTH$', msgParams: { KEY: node.formElement.key, WIDTH: imgWidth } });
        ASSERT(imgWidth < node.ownerTree.formDesc.form.maximumFilePreviewWidth, { code: 2670, msg: '$KEY$ Default values should be below 2000 $WIDTH$', msgParams: { KEY: node.formElement.key, WIDTH: imgWidth } });

        this.appendImagePlaceholder($hiddenInput, $imgContainer, imgWidth, imgHeight);

        if (!_.isNil(imagesDefaultValue)) {
          ASSERT(_.isString(imagesDefaultValue), {msg: 'Default values should be string for value $DEFAULT$', msgParams: {DEFAULT: imagesDefaultValue}, code: 2680});

          var arrayOfImgs = [imagesDefaultValue];

          for (var i = 0; i < arrayOfImgs.length; i++) {
            var found = arrayOfImgs[i].match('data:(.+);base64,(.*)');
            if ( parseAsText.indexOf( found[1] ) > 0 ) {
              this.changeImg($hiddenInput, arrayOfImgs[i], $imgContainer, found);
            } else {
              this.changeImg($hiddenInput, arrayOfImgs[i], $imgContainer);
            }
          }
        }

        $fileInput.on('change', function (e) {
          var myFile = $(this).prop('files')[0];

          ASSERT_USER(myFile, {msg: '$NODENAME$ No file found', msgParams: {NODENAME: node.name}, code: 2690});

          for (var i = 0; i < $(this).prop('files').length; i++) {
            var file = $(this).prop('files')[i];

            tbFile.loadFile(file, 'DataURL')
              .then(function (fileContent) {
                self.changeImg($hiddenInput, fileContent, $imgContainer);
              });
          }
        });
      }
    },
    pgtimeinterval: {
        template: '<div id="<%= id %>" style="display: inline-block; cursor: pointer; padding-top: 6px;">' +
        '<div class="col-lg-6" style="display: inline-block; width: 350px;">' +
        '<span class="tb-jf-pgtimeinterval"></span>' +
        '</div>' +
        '</div>',
      minRowWidth: 'half',
      maxRowWidth: 'half',
      compatibleTypes: ['string'],
      compatibleFormats: ['base64'],
      fieldtemplate: true,
      isTbTemplate: false,
      inputfield: true,
      autosaveDisabled: true,
      onInsert: function (evt, node) {
        var selectTemplate = '<div class="input-group"><span class="input-group-addon" id="basic-addon1">How many units</span> <input class="form-control handler" placeholder="Units" ' +
            'aria-describedby="basic-addon1" type="number" style="width: auto; display: inline-block;" /> ' +
            '</div>' +
            '<div class="col-lg-6" style="display: inline-block; width: 350px;"><div class="input-group">' +
            '<span class="input-group-addon" id="basic-addon2">Units of data</span>' +
            '<select class="form-control" style="width: auto; display: inline-block;">' +
            PG_INTERVAL_NAMES.map(function (opt) { return '<option>' + opt + '</option>'; }) +
            '</select></div></div>';

        var conversionOrder = ['years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds', 'microseconds'];
        var conversions = {
            years: 12,
            months: 30,
            days: 24,
            hours: 60,
            minutes: 60,
            seconds: 1000,
            milliseconds: 1000
        };
        var dbIntervalPattern = /^(?:([+-]?\d+) years? ?)?(?:([+-]?\d+) mons? ?)?(?:([+-]?\d+) days? ?)?(?:([+-]?\d+):(\d\d):(\d\d\.?\d*))?$/;

        var initialValue = node.value;
        if (initialValue) {
            ASSERT(dbIntervalPattern.test(initialValue), 'Initial value has invalid format');
        }

        var $container = $('#' + node.id);
        var $text = $container.find('span.tb-jf-pgtimeinterval');
        $text.text(initialValue || 'empty');

        $container.one('click', () => {
          $text.replaceWith(selectTemplate);
          var $input = $container.find('input.handler');
          var $select = $container.find('select');
          if (!initialValue) {
            return;
          }

      //ASSERT(!node.value || PG_INTERVAL_NAMES.indexOf(node.value) !== -1, {msg: 'pgtimeinterval: content input value $VALUE$ from schema must be inside $OPTIONS$', msgParams: {VALUE: node.value, OPTIONS: PG_INTERVAL_NAMES}, code: 2700});
      //ASSERT(!node.schemaElement.default || PG_INTERVAL_NAMES.indexOf(node.schemaElement.default) !== -1, {msg: 'pgtimeinterval: schema input value $INPUT$ from schema must be inside $OPTIONS$ ', msgParams: {INPUT: node.schemaElement.default, OPTIONS: PG_INTERVAL_NAMES}, code: 2710});

          var found = initialValue.match(dbIntervalPattern);
          var values = {
            years:        +found[1] || 0,
            months:       +found[2] || 0,
            days:         +found[3] || 0,
            hours:        +found[4] || 0,
            minutes:      +found[5] || 0,
            seconds:      +found[6] || 0
          };

           // check if hours block is negative (ex. 1 day -12:34:56)
          if (found[4] && found[4][0] == '-') {
              values.minutes *= -1;
              values.seconds *= -1;
          }

          values.microseconds = Math.floor(values.seconds * 1000 * 1000 % 1000);
          values.milliseconds = Math.floor(values.seconds * 1000 % 1000);
          values.seconds = Math.floor(values.seconds);

          // find the biggest unit of time that is non-zero
          var selectedUnit = 'seconds'; // default unit if all are 0
          for (var key of conversionOrder) {
              if (values[key] != 0) {
                  selectedUnit = key;
              }
          }

          // apply conversions sequentially down to the selected unit
          for (let i = 0; conversionOrder[i] != selectedUnit; i++) {
              values[conversionOrder[i+1]] += values[conversionOrder[i]] * conversions[conversionOrder[i]];
          }

          $select.find('option').each(function () {
            if (this.text == selectedUnit) {
              $(this).prop('selected', true);
              return false;
            }
          });

          $input.val(values[selectedUnit]);
        });
      },
      getFieldValue: function (rootEl) {
        var $text = $(rootEl).find('span.tb-jf-pgtimeinterval');

        var returnValue;
        if ($text.length > 0) {
          returnValue = $text.text();
          if (returnValue == 'empty') {
            returnValue = null;
          }
        } else {
          var $input = $(rootEl).find('input.handler');
          var $select = $(rootEl).find('select');
          returnValue = $input.val() ? $input.val() + ' ' + $select.val() : null;
        }

        return {
         name: $(rootEl).attr('name'),
         value: returnValue
        };
      }
    },
    timeinterval: {
      template: '<div id="<%= id %>" style="display: inline-block; width: 90%;" data-tb-jf-base-unit="<%= node.schemaElement.baseUnit %>">' +
      //  '<div class="col-lg-6" style="display: inline-block; width: 350px;">' +
      //  '<div class="input-group"><span class="input-group-addon" id="basic-addon1">How many units</span>' + */
        '<div class="input-group">' +
        '<input class="form-control handler" placeholder="Units" />' +
      //  'aria-describedby="basic-addon1" type="number" style="width: auto; display: inline-block;" /> ' +
      //  '</div>' +
      //  '<div class="col-lg-6" style="display: inline-block; width: 350px;"><div class="input-group">' +
      //  '<span class="input-group-addon" id="basic-addon2">Units of data</span>' +
        '<div class="input-group-addon" style="border: 0; padding: 0;">' +
        '<select class="form-control" style="width: auto; display: inline-block;">' +
        '</select>' +
        '</div>' +
      //  '</div>' +
        '<div class="input-group-addon">' +
        '<span class="tb-jf-timeinterval-tooltip"></span>' +
        '</div></div></div>',
      minRowWidth: 'half',
      maxRowWidth: 'half',
      compatibleTypes: ['number'],
      compatibleFormats: ['base64'],
      fieldtemplate: true,
      isTbTemplate: false,
      inputfield: true,
      onInsert: function (evt, node) {
        ASSERT(node.schemaElement.format, 'timeinterval field must have format timeinterval in schema');
        ASSERT(node.schemaElement.baseUnit, 'timeinterval must have baseUnit in schema');

        var initialValue = node.value || node.formElement.default || node.schemaElement.default;

        var $container = $('#' + node.id);

        var $input = $container.find('input.handler');
        var $select = $container.find('select');

        var baseUnit = node.schemaElement.baseUnit;

        var losslessGroups = [
          // ['years'],
          // ['months'],
          ['days', 'hours', 'minutes', 'seconds', 'milliseconds', 'microseconds']
        ];

        var selectedGroup;
        for (var group of losslessGroups) {
          if (group.includes(baseUnit)) {
            selectedGroup = group;
          }
        }
        ASSERT(selectedGroup, `unsupported baseUnit ${baseUnit}`);

        var options = selectedGroup;

        // if extraUnits are specified assert if they are compatible and use them
        if (Array.isArray(node.formElement.extraUnits)) {
          node.formElement.extraUnits.forEach(e => {
            ASSERT(selectedGroup.includes(e), `Extra unit ${e} is not compatible with baseUnit ${baseUnit}`);
            ASSERT(selectedGroup.indexOf(e) <= selectedGroup.indexOf(baseUnit), `Extra unit ${e} is smaller than baseUnit ${baseUnit}. This can cause fractions`);
          });
          options = node.formElement.extraUnits;
        }

        // always include the baseUnit
        if (!options.includes(baseUnit)) {
          options.push(baseUnit);
        }

        // filter duplicates
        options = [...new Set(options)];
        // sort decreasing order
        options = options.sort((a, b) => selectedGroup.indexOf(a) - selectedGroup.indexOf(b));
        // remove units smaller than the base unit
        options = options.slice(0, options.indexOf(baseUnit) + 1);

        $select.html(options.map(opt => '<option>' + opt + '</option>'));
        $select.find('option').each(function () {
          if (this.text == baseUnit) {
            $(this).prop('selected', true);
            return false;
          }
        });

        if (!node.formElement.extraUnits || options.length == 1) {
          $select.attr('disabled', true);
        }

        if (initialValue != null) {
          $input.val(initialValue);
        }

        var updateTooltip = () => {
          var $container = $('#' + node.id);
          var $tooltip = $container.find('.tb-jf-timeinterval-tooltip');
          var { value } = this.getFieldValue(node.el);
          var isValid = tbjsonAjv2Tb.getAjv2tbInstance().ajv.validate(node.schemaElement, value);
          $tooltip.text(
            value == null ? '(empty)' :
            !isValid      ? 'invalid value' :
                            `(${value} ${baseUnit})`
          );
        };
        updateTooltip();
        $input.on('input', updateTooltip);
        $select.on('input', updateTooltip);
      },
      getFieldValue: function (rootEl) {
        var conversionOrder = ['years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds', 'microseconds'];
        var conversions = {
          years: 12,
          months: 30,
          days: 24,
          hours: 60,
          minutes: 60,
          seconds: 1000,
          milliseconds: 1000
        };

        var baseUnitIdx = conversionOrder.findIndex(e => e == $(rootEl).find('[id]').data('tb-jf-base-unit'));

        var $input = $(rootEl).find('input.handler');
        ASSERT($input, 'could not find my input field');
        var $select = $(rootEl).find('select');
        ASSERT($select, 'could not find my select field');

        var selectedUnitIdx = conversionOrder.findIndex(e => e == $select.val());

        var name = $(rootEl).attr('name');
        var value = $input.val();

        if (value === '') {
          return { name, value: null };
        }

        value = +value;

        ASSERT(selectedUnitIdx <= baseUnitIdx);

        for (let i = selectedUnitIdx; i < baseUnitIdx; i++) {
            value *= conversions[conversionOrder[i]];
        }

        value = value.toString();

        return { name, value };
      }
    },
    select: {
      template: selectFieldTemplate,
      compatibleTypes: ['string', 'number', 'integer', 'boolean', 'null'],
      compatibleFormats: [],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      fieldtemplate: true,
      inputfield: true,
      isSearchableField: true,
      requiresEnum: true,
      usesEnum: true,
      isTbTemplate: false,
      setOptions: function (node, values, inSearch, hasMoreRecords) {
        node.options = values;
        node.formElement.options = values;
        // Remove from this and the below functions all the code you can and generalize it to all the select with fkey controlki

        var $select = $(node.el).find('select.select-class-jf');

        if (values.length === 0) {
          if (node.formElement.useLegacySelect) {
            $select.html('');
          }

          var warningText;
          if (inSearch) {
            if (hasMoreRecords) {
              if (node.formElement.useLegacySelect) {
                var $options = '<option value="" disabled selected hidden>There are more results. Please specify more precisely</option>';
                $select.append($options);
              } else {
                warningText = 'There are more results. Please specify more precisely';
              }
            } else {
              if (node.formElement.useLegacySelect) {
                var $options = '<option value="" disabled selected hidden>No Results Found!</option>';
                $select.append($options);
              } else {
                warningText = 'No Results Found!'; 
              }
            }
          } else {
            if (hasMoreRecords) {
              if (node.formElement.useLegacySelect) {
                var $options = '<option value="" disabled selected hidden>There are more results. Please specify more precisely</option>';
                $select.append($options);
              } else {
                warningText = 'There are more results. Please specify more precisely';
              }
            } else {
              if (node.formElement.useLegacySelect) {
                var $options = '<option value="" disabled selected hidden>---</option>';
                $select.append($options);
              } else {
                warningText = '---';
              }
            }
          }

          if (! node.formElement.useLegacySelect) {
            $select[0].selectize.settings.placeholder = warningText;
            $select[0].selectize.updatePlaceholder();
          }

        } else {
          if (node.formElement.useLegacySelect) {
            for (var i = 0; i < values.length; i++) {

              var val = values[i];

              var $option = $('<option value="' + val.id + '">' + val.title + '</option>');
              $select.append($option);
            }
          } else {
            $select[0].selectize.clearOptions(true);
            _.forEach(values, function(val) {
              if ($select[0].selectize.options && $select[0].selectize.options[ val.id ]) {
                $select[0].selectize.removeOption(val.id);
              }
            });

            for (const value of values) {
              $select[0].selectize.addOption({value: value.id, text: value.title});
            }

            
            let newValue = values[0].id; // not sure if correct
            let shouldChangeSilently = !inSearch;
            if ( newValue == node.value ) {
              shouldChangeSilently = true;
            } else if ( newValue === '' && node.value == null ) { // can't have null as value attribute in html, so API uses ''
              shouldChangeSilently = true;
            }

            $select[0].selectize.setValue(newValue, shouldChangeSilently);
            $select[0].selectize.refreshState();

            if ( node.readOnly ) {
              $select[0].selectize.disable();
            }
            else {
              $select[0].selectize.enable();
            }
          }
        }

      },
      addOptionFromRecord: function (node, record) {
        var id_field = node.schemaElement.refCol;
        var name_field = node.schemaElement.refColTitle || node.schemaElement.refCol;

        jsonform.elementTypes.select.addOption(node, {id: record[id_field], title: record[name_field]});
      },
      addOption: function (node, record) {
        var $select = $(node.el).find('select.select-class-jf');
        if (node.formElement.useLegacySelect) {
            var $option = $('<option value="' + record.id + '">' + record.title + '</option>');
            $select.append($option);
        } else {
          $select[0].selectize.addOption({value:record.id,text:record.title});
        }
      },
      setMetaData: function (node, moreResults, $el) {
        if (moreResults) {
          $el.find('.tb-jf-infotext').text('There are more results! Select has loaded value!').show();
        } else {
          $el.find('.tb-jf-infotext').text('').hide();
        }
      },
      setValueFromRecord: function (node, record) {
        var id_field = node.schemaElement.refCol;
        jsonform.elementTypes.select.setValue(node, record[id_field]);
      },
      setValue: function (node, value) {
        var $select = $(node.el).find('select.select-class-jf');

        var isTrueFalse = true;
        if (node.options && node.options[0] && node.options[0].id) {
          if (typeof node.options[0].id === typeof 1) {
            // the server gave 1/0, map true/false to 1/0
            isTrueFalse = false;
          } else {
            // the server gave true/false, do nothing
          }
        }

        var valueForSelect = value;
        if (typeof value === typeof true) {
          if ( isTrueFalse ) {
            // just stringify
            valueForSelect = String(value);
          } else {
            if (value) {
              valueForSelect = 1;
            } else {
              valueForSelect = 0;
            }
          }
        }

        if (node.formElement.useLegacySelect) {
            $select.val(valueForSelect != null ? valueForSelect : '');
        } else {
          let newValue = valueForSelect != null ? valueForSelect : '';
          let shouldChangeSilently = false;
          if ( newValue == node.value ) {
            shouldChangeSilently = true;
          } else if ( newValue === '' && node.value == null ) { // can't have null as value attribute in html, so API uses ''
            shouldChangeSilently = true;
          }
          $select[0].selectize.setValue(newValue, shouldChangeSilently);
          // $select[0].selectize.refreshItems();
        }
      },
      onChange: function (evt, node) {
      },
      setupForeignKey: function(node, fkeyData, responce) {
        var resources = node.ownerTree.formDesc.resources[fkeyData.refTableView];
        var setFilterState = function setFilterState(node) {
          node.filterOptionCurrent = {
            select: $select.val(),
            value: $input.val()
          };
        }

        var $el = $(node.el);

        $el.find('div.momo').remove();

        var $div = $('<div class="momo"></div>');
        var $info_text = $('<div class="help-block tb-jf-infotext tb-jf-hide"></div>');
        var $error_text = $('<div class="help-block tb-jf-errortext-fkey tb-jf-hide"></div>');

        let showFilter = !node.readOnly && responce.result.hasMoreRecords;

        if (showFilter) {
          var $select = $('<select filterTreeSelect></select>');
          $select.change(function(){ setFilterState(node) });

          var arr = filterOptionsToArray(responce.result.filter_options);
          if (arr.length === 0) {
            // if nothing else given, use refColTitle
            arr = [{
              title: node.title,
              id: fkeyData.refColTitle || fkeyData.refCol,
              type: 'string',
            }];
          }

          for (var i = 0; i < arr.length; i++) {
            var obj = arr[i];
            var itemName = obj.title;
            var itemValue = obj.id;
            var itemType = _.isArray(obj.type) ? (obj.type.filter(function(el){ if (el !== 'null') { return el; } }))[0] : obj.type;

            var $item = $('<option data-selected-type="' + itemType + '"  value="' + itemValue + '">' + itemName + '</option>');

            $select.append($item);
          }

          var $input = $('<input type="text" />');
          $input.change(function(){ setFilterState(node) });

          var triggerFilter = function(e) {
            $button.attr('disabled', 'disabled');

            var filters = [];
            filters.push({
              field_value: $input.val(),
              field_name: $select.val(),
              field_title: $select.find('option:selected').text(),
              type: $select.find(':selected').attr('data-selected-type'),
            });

            var type;
            var isNullable = false;
            var types = _.isArray(node.schemaElement.type) ? node.schemaElement.type : [node.schemaElement.type];

            for(var i = 0; i < types.length; i++) {
              if (types[i] === 'null') {
                  isNullable = true;
              } else {
                  type = types[i];
              }
            }

            var isNull = (node.schemaElement.type);

            var resolvedSchema = jfUtils.resolveRefs(node.ownerTree.formDesc.schema, node.schemaElement.filterSchema, true);
            var event = new CustomEvent('jf_specialSearch', {
              detail: {
                filters: filters,

                ref_col: node.schemaElement.refCol,
                ref_table: node.schemaElement.refTable,
                ref_table_view: node.schemaElement.refTableView,
                ref_col_title: node.schemaElement.refColTitle,

                form_id: node.ownerTree.formDesc.form.$formIdCode,
                schema_id: node.ownerTree.formDesc.schema.id,
                foreign_filter: node.formElement.foreign_filter,
                foreign_extra_cols: node.formElement.foreign_extra_cols,

                field_schema: node.schemaElement,
                field_type: type,
                is_nullable: isNullable,

                sp: node.ownerTree.formDesc.sp,
                nodeId: uniqueIdSearchButton,

                cb: function(responce, err) {
                  if (err) {
                    TRACE(err);
                    var errorMessage = err.msg;
                    $(node.el).addClass('has-error');
                    $(node.el).find('.tb-jf-errortext').text(errorMessage + " - " + err.code);
                    $(node.el).find('.tb-jf-errortext').removeClass('tb-jf-hide');

                    return;
                  }

                  $(node.el).removeClass('has-error');

                  $error_text.css('display', 'none');
									$info_text.css('display', 'none');

                  var result = responce.result;
                  if (result) {

                    var options = [];
                    if (result.hasMoreRecords) {
                      if ( ! node.value ) {
                        options = [];
                      } else {
                        options = result.data.filter( function(item, idx) {
                          return node.value == item.data[item.refFieldName];
                        }).map( function(item, idx){
                          return {
                            id: item.data[item.refFieldName],
                            title: item.data[item.refFieldTitleName]
                          }
                        });
                      }
                    } else {
                      options = result.data.map( function(item, idx) {
                        return {
                          id: item.data[item.refFieldName],
                          title: item.data[item.refFieldTitleName]
                        }
                      });
                    }

                    node.currentOptions = options;
                    jsonform.elementTypes.select.setOptions(node, options, true, result.hasMoreRecords);

                    jsonform.elementTypes.select.setMetaData(node, result.hasMoreRecords, $div);
                  }
                }
              }
            });

            node.ownerTree.domRoot.dispatchEvent(event);
          }

            
          $input.on('keydown',function (e){
            if (e.key === "Enter" ) {
              triggerFilter(e);
            }
          });

          var uniqueIdSearchButton = _.uniqueId();
          var $button = $('<button id="' + uniqueIdSearchButton + '"class="btn btn-search" type="button"><i class="fa fa-search fa-fw"></i></button>');
          $button.click(triggerFilter);
        }

        var currKey = node.formElement.key;
        var foreignKeyData = resources.records || [];

        if (foreignKeyData.length > 0 && ( ! resources.hasMoreRecords || node.value != null )) {
          var id_field = node.schemaElement.refCol;
          var name_field = foreignKeyData[0].refFieldTitleName;
          ASSERT(name_field, foreignKeyData[0], node.schemaElement);
          var nullable = jfUtils.contains(node.schemaElement.type, 'null');

          if (nullable) {
            var dataObj = {};
            dataObj[id_field] = '';
            dataObj[name_field] = node.ownerTree.formDesc.form.nullValueTitle;

            foreignKeyData.unshift({
              data: dataObj,
            });
          }

          let options = [];
          if (resources.hasMoreRecords && node.value != null) {
            options = foreignKeyData.filter(item => item.data[id_field] == node.value);
          } else {
            options = foreignKeyData;
          }

          jsonform.elementTypes.select.setOptions(
            node,
            options.map( function(fkeyData) {
              return {
                id: (id_field === name_field && fkeyData.data[id_field] === node.ownerTree.formDesc.form.nullValueTitle) ? '' : fkeyData.data[id_field],
                title: fkeyData.data[name_field]
              }
            }),
            undefined,
            resources.hasMoreRecords
          );


          if (node.value) {
            if (resources.hasMoreRecords) {
              for (var i = 0; i < foreignKeyData.length; i++) {
                var currentForeignKeyEntry = foreignKeyData[i].data;

                if (currentForeignKeyEntry[id_field] === node.value) {
                  jsonform.elementTypes.select.setValue(node, node.value);
                  break;
                }
              }
            } else {
              jsonform.elementTypes.select.setValue(node, node.value);
            }
          } else {
            jsonform.elementTypes.select.setValue(node, node.value);
          }
        } else {
          jsonform.elementTypes.select.setOptions(node, [], undefined, resources.hasMoreRecords);
        }

        var uniqueId = _.uniqueId();
        var $addButton = $('<button type="button" id="' + uniqueId + '" class="btn btn-success">+</button>');
        if (resources.canInsertReferencedRecord) {
          $addButton.click(function() {
            $addButton.attr('disabled', 'disabled');
            var type;
            var isNullable = false;
            var types = _.isArray(node.schemaElement.type) ? node.schemaElement.type : [node.schemaElement.type];

            for(var i = 0; i < types.length; i++) {
              if (types[i] === 'null') {
                  isNullable = true;
              } else {
                  type = types[i];
              }
            }

            var isNull = (node.schemaElement.type);

            var resolvedSchema = jfUtils.resolveRefs(node.ownerTree.formDesc.schema, node.schemaElement.filterSchema, true);

            var event = new CustomEvent('jf_addFKey', {
              detail: {

                ref_col: node.schemaElement.refCol,
                ref_table: node.schemaElement.refTable,
                ref_col_title: node.schemaElement.refColTitle,

                form_id: node.ownerTree.formDesc.form.$formIdCode,
                schema_id: node.ownerTree.formDesc.schema.id,

                field_schema: node.schemaElement,
                field_type: type,
                is_nullable: isNullable,

                foreign_form_id: node.formElement.filterForm,
                form_name: node.formElement.filterForm,

                sp: node.ownerTree.formDesc.sp,
                nodeId: uniqueId,
                selectNode: node
              }
            });

            node.ownerTree.domRoot.dispatchEvent(event);

          });


          $div.append($addButton);
        }

        $div.append($select);
        $div.append($input);
        $div.append($button);
        $div.append('<div style="width:100%">'); // flex break
        $div.append($error_text);
        $div.append($info_text);

        if (node.value) {
          jsonform.elementTypes.select.setMetaData(node, resources.hasMoreRecords, $div);
        }


        if (showFilter
          || resources.canInsertReferencedRecord
          || resources.hasMoreRecords) {
          $el.find('.controls').prepend($div);
        }

        // stylings

        if (resources.hasMoreRecords || showFilter) {
            $el.find('.controls')
                .css('display', 'inline-flex')
                .css('flex-wrap', 'wrap');

            $div.css('display', 'inline-flex')
                .css('flex-wrap', 'wrap')
                .css('width', '100%');

        } else if (resources.canInsertReferencedRecord) {
           $el.find('.controls').css('display', 'inline-flex');
        }

        $addButton.css('margin-bottom', '0');
        $div.css('height', 'auto');
        $div.css('padding-bottom', '5px');

        if ($input && $button) {
            $input.css('height', '34px');
            $input.css('margin-left', '9px');
            $input.css('padding', '5px');
            $input.css('height', '32px');
            $input.css('flex-grow', '1');

            $button.css('margin-left', '5px');
            $button.css('margin-right', '0');
            $button.css('margin-bottom', '0');
            $button.css('background-color', '#4dd0e1');
        }
      },
      onInsert: function (evt, node) {
        var $select = $(node.el).find('select.select-class-jf');

        if (node.anyOfIds) {
          node.el.setAttribute('data-tb-jf-any-of-ids', node.anyOfIds);
        }

        if (!$select.selectize){
          ASSERT_PEER(node.formElement.useLegacySelect, 'Trying to use select, without selectize enabled. Consider setting "usingLegacySelect".', node.formElement, $select);
        }

        if (!(node.schemaElement && isForeignKeyField(node.schemaElement))) return;

        // this innerFunc bullshit is so we have fast INSERT formload: we dont need all the data all at once, because... we don't. We need it onClick
        // BUGID: TBLIBJNJYUPL1
        var innerFunc = function() {
          // Remove the errors because it will look bad - you don't click it, press "Save", and it becomes as error. Then you click it, it loads, and its still with error, pretty sadge
          $(node.el).removeClass('has-error');
          $(node.el).find('.tb-jf-errortext').text('');
          $(node.el).find('.tb-jf-errortext').hide();

          selectForeignKeySetupFunction(node);
          node.el.removeEventListener('mousedown', innerFunc);
        }

        if (0 && node.ownerTree.formDesc.form.enableDefault && node.value == null) {
          // make the empty value to be selected!
          // its odd that it isnt selected by default...
          $(node.el).find('option[value=""]').attr('selected', 'selected');

          node.el.addEventListener('mousedown', innerFunc);
        } else {
          innerFunc();
        }

        if (!node.formElement.useLegacySelect && $select[0] && !$select[0].selectize) {
          $select.selectize({
            plugins: ["restore_on_backspace"],
            persist: false,
            onKeyPress: function(e) {},
            onChange: function(val) {}
          });
        }
      },
      onBeforeRender: function (evt, node) {
        var $select = $(node.el).find('select.select-class-jf');

        if (node.formElement.titleMap) {
          _.each(node.options, function (key) {
            if (node.formElement.titleMap[key.value]) {
              key.title = node.formElement.titleMap[key.value];
            }
          });
        }

        if (node.value) {
          var addSelectedOption = true;

          if (node.options) {
            for (var i = 0; i < node.options.length; i++) {
              if (node.options[i].value === node.value)  {
                addSelectedOption = false;
                break;
              }
            }
          } else {
            node.options = [];
          }

          if (addSelectedOption) {
            node.options.push({
              value: node.value,
              title: node.value,
            });
          }
        }

      },
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }
        if ( ! ($select && $select.selectize) || (node.formElement.useLegacySelect || ! (node.schemaElement && isForeignKeyField(node.schemaElement) )) ) {
            $(node.el).find('select').prop('disabled', true);
        } else {
          var $select = $(node.el).find('select')[0];
          $select[0].selectize.disable();
        }
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        if ( ! ($select && $select.selectize) || (node.formElement.useLegacySelect || ! (node.schemaElement && isForeignKeyField(node.schemaElement) )) ) {
            $(node.el).find('select').prop('disabled', false);
        } else {
          var $select = $(node.el).find('select')[0];
          $select[0].selectize.enable();
        }
      },
      getFieldValue: function (node) {
        var select = $(node).find('select:not([filterTreeSelect])');
        if (select.length === 0) {
          select = $(node).find('select');
        }

        var selectValue;
        if ( select && select[0].selectize ) {
          selectValue = select[0].selectize.getValue();
        } else {
          selectValue = select.val();
        }

        return {
          name: select[0].getAttribute('name'),
          value: selectValue,
          anyOfIds: node.getAttribute('data-tb-jf-any-of-ids')
        };
      }
    },
    selectize: {
      template: '' +
        '<select name="<%= node.name %>" ' +
        ' <%= (node.schemaElement && (node.schemaElement.type === "array" || Array.isArray(node.schemaElement.type) && node.schemaElement.type.indexOf("array") !== -1 ) ? "multiple=\'multiple\'" : "") %>' +
        ' id="<%= id %>"' +
        ' <%= (fieldHtmlClass ? " class=\'" + fieldHtmlClass + "\'" : "") %>' +
        ' <%= (node.disabled? " disabled" : "")%>' +
        '> ' +
        ' <% _.each(node.options, function(key, val) { %>' +
        '   <option <%= (value === key.value || (value.indexOf(key.value) >= 0)) ? "selected" : "" %> value="<%= key.value === null ? \'\' : escape(key.value) %>">' +
        '       <%= key.title %>' +
        '   </option>' +
        ' <% }) %>' +
        '</select>',
      compatibleTypes: ['string', 'number', 'integer', 'boolean'],
      compatibleFormats: [],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      fieldtemplate: true,
      requiresEnum: true,
      inputfield: true,
      isSearchableField: true,
      isTbTemplate: false,
      onInsert: function (evt, node) {
        var options = {};

        if (node.formElement.pluginOptions) {
          options = node.formElement.pluginOptions;
        }

        $('#' + node.id).selectize(options);
      },
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('select')[0]
          .selectize.disable();
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('select')[0]
          .selectize.enable();
      },
      getFieldValue: function (node) {
        var select = $(node).find('select:not([filterTreeSelect])');

        return {
          name: select[0].getAttribute('name'),
          value: select.val()
        };
      }
    },
    selecttemplate: {
      template: '' +
        '<select name="<%= node.name %>" ' +
        ' <%= (node.schemaElement && (node.schemaElement.type === "array" || Array.isArray(node.schemaElement.type) && node.schemaElement.type.indexOf("array") !== -1 ) ? "multiple=\'multiple\'" : "") %>' +
        ' id="<%= id %>"' +
        ' <%= (fieldHtmlClass ? " class=\'" + fieldHtmlClass + "\'" : "") %>' +
        ' <%= (node.disabled? " disabled" : "")%>' +
        ' <%= (node.readOnly? " readonly" : "")%>' +
        ' <%= (node.schemaElement && node.schemaElement.required ? " required=\'required\'" : "") %>' +
        '> ' +
        '</select>',
      compatibleTypes: ['string', 'number', 'integer', 'object'],
      compatibleFormats: [],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      fieldtemplate: true,
      inputfield: true,
      requiresEnum: true,
      isSearchableField: true,
      isTbTemplate: false,
      setMetaData: function (node, moreResults, $el) {
        if (moreResults) {
          $el.find('.tb-jf-infotext').text('There are more results!').removeClass('tb-jf-hide');
        } else {
          $el.find('.tb-jf-infotext').text('').addClass('tb-jf-hide');
        }
      },
      setValueFromRecord: function (node, record) {

        var element = ( $('#' + node.id) )[0];

        var valueField = element.selectize.settings.valueField;
        element.selectize.setValue(record[valueField], true);
      },
      setValue: function (node, value) {

        var element = ( $('#' + node.id) )[0];

        element.selectize.setValue(value, true);
      },
      addOptionFromRecord: function (node, record) {

        var element = ( $('#' + node.id) )[0];

        element.selectize.addOption(record);
        element.selectize.refreshOptions();
      },
      setOptions: function (node, options, inSearch, pluginOptions) {
        pluginOptions.options = options;

        pluginOptions.render = {
          option: function (data, escape) {
            return tbTemplate.render(pluginOptions.optionTemplate, data);
          },
          item: function (data, escape) {
            if (pluginOptions.itemTemplate) {
              return tbTemplate.render(pluginOptions.itemTemplate, data);
            } else {
              return tbTemplate.render(pluginOptions.optionTemplate, data);
            }
          }
        };

        if (!pluginOptions.searchField) {
          pluginOptions.searchField = [pluginOptions.valueField];

          if (node.schemaElement.enumTemplate) {
            _.each(_.keys(pluginOptions.options[0]), function (value) {
              pluginOptions.searchField.push(value);
            });
          }
        }

        var element = ( $('#' + node.id) )[0];
        // element.selectize(node.formElement.pluginOptions);

        var clearedOptions = options;

        element.selectize.clearOptions();
        element.selectize.addOption(clearedOptions);

        var triggerDropDown = false; // default is TRUE in the selectize
        element.selectize.refreshOptions(triggerDropDown);

      },
      onBeforeRender: function (data, node) {
        ASSERT(tbTemplate, {msg: 'TB.Template not loaded', code: 2720});
        ASSERT.isPlainObject(node.formElement.pluginOptions, {msg: 'selecttemplate: no pluginOptions object.', code: 2730});
        ASSERT.isString(node.formElement.pluginOptions.valueField, {msg: 'selecttemplate: no valueField speciefied.', code: 2740});
        /**
         * in order to validate the results we need to find the type of the returned field
         * and construct an enum of all the calues contained in the original enum
         */

        var pluginOptions = node.formElement.pluginOptions;

        if (isForeignKeyField(node.schemaElement)) {
          var resources = node.ownerTree.formDesc.resources;
          ASSERT_USER(resources,{msg: 'Foreign key: I did not find my resources! Resources: $resource$; Key: $key$', msgParams: {resources: node.ownerTree.formDesc.resources, key: node.name}, code: 2725} );
          ASSERT(resources, { code: 2750, msg: 'Resources were not in the top level of the form descriptor. Please include it!' });
          ASSERT(node.schemaElement.refTable,
                  { code: 2752, msg: 'No Reftable defined on the formelement, and we use it for the resources. formElement: $formelement$', msgParams: { formelement: node.formElement } }
          );
          /*
          ASSERT(resources[node.schemaElement.refTableView || node.schemaelement.refTable],
                  { code: 2754, msg: 'No resources given for the ref field! node: $node$', msgParams: { node: node } }
          );

          var resourcesForField = resources[node.schemaElement.refTable];
          node.ownerTree.formDesc.form.templateData = node.ownerTree.formDesc.form.templateData || {};
          node.ownerTree.formDesc.form.templateData[node.formElement.key] = resourcesForField.records;

          */
        }

        // ASSERT.isPlainObject(node.ownerTree.formDesc.form.templateData, {msg: 'selecttemplate: no templateData object.', code: 2741});
        /**
         * in case selecttemplate is loaded with values from the schema send them to the selectize plugin
         * and apply the appropriate template
         */
        if (1 || node.ownerTree.formDesc.form.templateData && node.ownerTree.formDesc.form.templateData[node.formElement.key]) {
          // pluginOptions.options = node.ownerTree.formDesc.form.templateData[node.formElement.key];

          pluginOptions.render = {
            option: function (data, escape) {
              return tbTemplate.render(pluginOptions.optionTemplate, data);
            },
            item: function (data, escape) {
              if (pluginOptions.itemTemplate) {
                return tbTemplate.render(pluginOptions.itemTemplate, data);
              } else {
                return tbTemplate.render(pluginOptions.optionTemplate, data);
              }
            }
          };
        }

        /**
         * selectize expects an array of properties which will be searchable by the user.
         * If none are specified the array is filled with the valueField (the returned field)
         * and all properties from the enum if it exists.
         */
        if (!pluginOptions.searchField) {
          pluginOptions.searchField = [pluginOptions.valueField];

          if (node.schemaElement.enumTemplate) {
            _.each(_.keys(pluginOptions.options[0]), function (value) {
              pluginOptions.searchField.push(value);
            });
          }
        }


        /**
         * when the user types in the selectize field a search event is passed.
         * The event contains information about the node and a callback function which expects
         * an array of object which will be rendered by TB.Template when the callback is executed.
         */
        node.formElement.pluginOptions.load = function (query, callback) {
          /**
           * @options  array of objects whose properties will be used by TB.Template
           */
          function updateOptions (options) {
            ASSERT.isArray(options, {msg: 'selecttemplate: the callback expected an array of options', code: 2760});

            /**
             * verify that all of the newly recieved objects follow the specified constraints
             */
            _.each(options, function (value, index) {
              var valueField = value[node.formElement.pluginOptions.valueField];

              jsonform.util.validateValueType(
                node.key,
                node.schemaElement,
                node.formElement,
                node.ownerTree.formDesc.form.deprecatedValue,
                valueField,
                true,
                node.ownerTree.formDesc
              );

              node.schemaElement.enumTemplate.push(valueField);
            });

            callback(options);
          }

          if (query.length) {
            $(node.el).trigger('search', {
              node: node,
              callback: updateOptions
            });
          }
        };
      },
      onInsert: function (evt, node) {
        var element = $('#' + node.id);

        element.selectize(node.formElement.pluginOptions);

        if (node.readOnly) {
          element[0].selectize.disable();
        }

        if (node.value && !isForeignKeyField(node.schemaElement)) {
          var isValidValue = false;

          _.each(node.schemaElement.enum, function (value) {
            if (value === node.value) {
              isValidValue = true;
            }
          });

          ASSERT(isValidValue === true, {msg: 'selecttemplate: The value does not appear in the schema enum.', code: 2770});
        }

        if (!isForeignKeyField(node.schemaElement)) {
          return;
        }

        var type;
        var isNullable = false;
        var types = _.isArray(node.schemaElement.type) ? node.schemaElement.type : [node.schemaElement.type];

        for(var i = 0; i < types.length; i++) {
          if (types[i] === 'null') {
              isNullable = true;
          } else {
              type = types[i];
          }
        }

        var event = new CustomEvent('jf_specialSearch', {
          detail: {
            ref_col: node.schemaElement.refCol,
            ref_table: node.schemaElement.refTable,
            ref_col_title: node.schemaElement.refColTitle,

            form_id: node.ownerTree.formDesc.form.$formIdCode,
            schema_id: node.ownerTree.formDesc.schema.id,

            field_schema: node.schemaElement,
            field_type: type,
            is_nullable: isNullable,

            is_selecttemplate: true,
            ref_value: node.value,

            sp: node.ownerTree.formDesc.sp,
            cb: function(responce, err) {
              if (err) {
                TRACE(err);
                throw err;
                return;
              }

              var result = responce.result;
              if (result) {
                var fkeyData = getForeignKeyFields(node.ownerTree, node.schemaElement,node.formElement);
                node.ownerTree.formDesc.resources[fkeyData.refTableView] = result;
                node.view.setupForeignKey(node, responce);
              }
            }
          }
        });

        node.ownerTree.domRoot.dispatchEvent(event);
      },
      setupForeignKey: function(node, responce) {
        var element = $('#' + node.id);

        if ( node.value !== undefined ) {
          element[0].selectize.addItem(node.value);
        }


        var fkeyData = getForeignKeyFields(node.ownerTree, node.schemaElement,node.formElement);
        // var resources = node.ownerTree.formDesc.resources[fkeyData.refTableView];
        // ASSERT_USER(resources,{msg: 'Foreign key: I did not find my resources! Resources: $resource$; Key: $key$', msgParams: {resources: node.ownerTree.formDesc.resources, key: node.name}, code: 2725} );

        var setFilterState = function setFilterState(node) {
          node.filterOptionCurrent = {
            select: $select.val(),
            value: $input.val()
          };
        }

        var $el = $(node.el);

        var $div = $('<div class="momo"></div>');
        var $info_text = $('<div style="width: 100%" class="help-block tb-jf-infotext tb-jf-hide"></div>');

        var resources = node.ownerTree.formDesc.resources[fkeyData.refTableView || fkeyData.refTable];

        if (!node.isReadOnly && resources.hasMoreRecords) {
          var $select = $('<select></select>');
          $select.change(function(){ setFilterState(node) });

          var arr = filterOptionsToArray(responce.result.filter_options);
          // arr.unshift({title: "---", id: "", itemType: "null"});

          for (var i = 0; i < arr.length; i++) {
            var obj = arr[i];
            var itemName = obj.title;
            var itemValue = obj.id;
            var itemType = _.isArray(obj.type) ? (obj.type.map(function(el){ if (el !== 'null') { return el} }))[0] : obj.type;

            var $item = $('<option data-selected-type="' + itemType + '"  value="' + itemValue + '">' + itemName + '</option>');

            $select.append($item);
          }

          var $input = $('<input type="text" />');
          $input.change(function(){ setFilterState(node) });

          var uniqueIdSearchButton = _.uniqueId();
          var $button = $(`<button id=${uniqueIdSearchButton} class="btn btn-search" type="button" style="margin-left: 5px; margin-right: 0px; margin-bottom: 0px; background-color: rgb(77, 208, 225);">
            <i class="fa fa-search fa-fw"></i></button>`);
          $button.click(function(e) {
            $button.attr('disabled', 'disabled');

            var filters = [];
            filters.push({
              field_value: $input.val(),
              field_name: $select.val(),
              type: $select.find(':selected').attr('data-selected-type'),
            });

            var type;
            var isNullable = false;
            var types = _.isArray(node.schemaElement.type) ? node.schemaElement.type : [node.schemaElement.type];

            for(var i = 0; i < types.length; i++) {
              if (types[i] === 'null') {
                  isNullable = true;
              } else {
                  type = types[i];
              }
            }

            var isNull = (node.schemaElement.type);

            // var resolvedSchema = jfUtils.resolveRefs(node.ownerTree.formDesc.schema, node.schemaElement.filterSchema, true);
            var event = new CustomEvent('jf_specialSearch', {
              detail: {
                filters: filters,

                ref_col: node.schemaElement.refCol,
                ref_table: node.schemaElement.refTable,
                ref_col_title: node.schemaElement.refColTitle,

                form_id: node.ownerTree.formDesc.form.$formIdCode,
                schema_id: node.ownerTree.formDesc.schema.id,

                field_schema: node.schemaElement,
                field_type: type,
                is_nullable: isNullable,

                is_selecttemplate: true,
                ref_value: node.value,

                sp: node.ownerTree.formDesc.sp,
                nodeId: uniqueIdSearchButton,

                cb: function(responce, err) {
                  if (err) {
                    TRACE(err);
                    throw err;
                    return;
                  }

                  var result = responce.result;
                  if (result) {

                    node.currentOptions = result.data;

                    var optionsData = result.data.map(d => d.data);

                    node.view.setOptions(node, optionsData, true, node.formElement.pluginOptions);

                    node.view.setMetaData(node, result.hasMoreRecords, $div);
                  }
                }
              }
            });

            node.ownerTree.domRoot.dispatchEvent(event);
          });
        }

        if (resources.canInsertReferencedRecord) {
          var uniqueId = _.uniqueId();
          var $addButton = $('<button type="button" id="' + uniqueId + '" class="btn btn-success">+</button>');
          $addButton.click(function() {
            $addButton.attr('disabled', 'disabled');
            var type;
            var isNullable = false;
            var types = _.isArray(node.schemaElement.type) ? node.schemaElement.type : [node.schemaElement.type];

            for(var i = 0; i < types.length; i++) {
              if (types[i] === 'null') {
                  isNullable = true;
              } else {
                  type = types[i];
              }
            }

            var isNull = (node.schemaElement.type);

            // var resolvedSchema = jfUtils.resolveRefs(node.ownerTree.formDesc.schema, node.schemaElement.filterSchema, true);

            var event = new CustomEvent('jf_addFKey', {
              detail: {

                ref_col: node.schemaElement.refCol,
                ref_table: node.schemaElement.refTable,
                ref_col_title: node.schemaElement.refColTitle,

                form_id: node.ownerTree.formDesc.form.$formIdCode,
                schema_id: node.ownerTree.formDesc.schema.id,

                field_schema: node.schemaElement,
                field_type: type,
                is_nullable: isNullable,

                foreign_form_id: node.formElement.filterForm || 'JF::TBLIB::TEST_TABLE2000',
                form_name: node.formElement.filterForm || 'JF::TBLIB::TEST_TABLE2000',

                sp: node.ownerTree.formDesc.sp,
                nodeId: uniqueId,
              }
            });

            node.ownerTree.domRoot.dispatchEvent(event);

          });


          $div.append($addButton);
        }

        if ( ! resources.canInsertReferencedRecord && ! resources.hasMoreRecords) {
          $div.hide();
        }

        $div.append($select);
        $div.append($input);
        $div.append($button);
        $div.append($info_text);

        if (node.filterOptionCurrent) {
          $select.val(node.filterOptionCurrent.select);
          $input.val(node.filterOptionCurrent.value);

          node.view.setOptions(node, node.currentOptions);
          node.view.setValue(node, node.value);

        } else if (!node.schemaElement.enum) {
          // first load of jf!!!!

          var currKey = node.formElement.key;
          var foreignKeyData = resources.data || [];

          if (foreignKeyData.length > 0) {
            var id_field = node.schemaElement.refCol;
            var name_field = node.schemaElement.refColTitle || node.schemaElement.refCol;

            if (node.value) {
              if (resources.hasMoreRecords) {

                for (var i = 0; i < foreignKeyData.length; i++) {
                  if (foreignKeyData[i].data[id_field] === node.value) {
                    node.view.setOptions(node, [foreignKeyData[i].data], true, node.formElement.pluginOptions);
                    node.view.setValue(node, node.value);
                    break;
                  }
                }

              } else {

                node.view.setOptions( node, foreignKeyData.map( function(fkeyData) { return fkeyData.data } ), true, node.formElement.pluginOptions);
                node.view.setValue(node, node.value);

              }


            } else {

              var res = foreignKeyData.map( function(fkeyData) { return {id: fkeyData[id_field], title: fkeyData[name_field]} } );
              res.unshift({id: '', title: 'Please Select'});

              node.view.setOptions( node, res, true, node.formElement.pluginOptions );
              node.view.setValue(node, node.value);

            }

          }
          else
          {
            let dataMissingString = node.ownerTree.formDesc.form.nullValueTitle;
            if (resources.hasMoreRecords) {
              dataMissingString = 'None';
            }

            let dataWhenMissing = [{id: '', [node.formElement.mainTitleValue || 'name_url_template']: dataMissingString}];

            node.view.setOptions(node, dataWhenMissing, true, node.formElement.pluginOptions);
          }

          var hasMoreRecords = resources.hasMoreRecords;
          if (hasMoreRecords) {
            node.view.setMetaData(node, hasMoreRecords, $div);
          }
        }



        $el.find('.controls').prepend($div);

        /**
         * Listen for search events on this particular node
         * and trigger the callback function to add the new options.
         *
         * var newOptions = [
         *   {"text": "four", "email": "fiver@gmail.com", "name": "four", "country": "six", "city": "four"},
         *   {"text": "five", "email": "five@gmail.com", "name": "five", "country": "five", "city": "five"}
         * ];
         *
         * $(node.el).on('search', function(event, param) {
         *   param.callback(newOptions);
         * })
        */

        if (resources.hasMoreRecords) {
          $el.find('.controls')
            .css('display', 'inline-flex')
            .css('flex-wrap', 'wrap');

          $el.find('.controls > .selectize-control')
            .css('width', '100%');

          $div.css('display', 'inline-flex')
            .css('flex-wrap', 'wrap')
            .css('width', '100%');

        } else if (resources.canInsertReferencedRecord) {
           $el.find('.controls').css('display', 'inline-flex');
        }

        if (resources.canInsertReferencedRecord) {
          $addButton.css('margin-bottom', '0');
        }

        $div.css('height', 'auto');
        $div.css('padding-bottom', '5px');

        if ($input && $button) {
            $input.css('height', '34px');
            $input.css('margin-left', '9px');
            $input.css('padding', '5px');
            $input.css('height', '32px');
            $input.css('flex-grow', '1');

            $button.css('margin-left', '5px');
            $button.css('margin-right', '0');
            $button.css('margin-bottom', '0');
            $button.css('background-color', '#4dd0e1');
        }


      },
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('select.selectized')[0]
          .selectize.disable();
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('select.selectized')[0]
          .selectize.enable();
      },
      getFieldValue: function (node) {
        var select = $(node).find('select:not([filterTreeSelect])');

        return {
          name: select[0].getAttribute('name'),
          value: select.val()
        };
      }
    },
    nativemultipleselect: {
      template: '<select name="<%= node.name %>" <%= (node.schemaElement && (node.schemaElement.type === "array" || Array.isArray(node.schemaElement.type) && node.schemaElement.type.indexOf("array") !== -1 ) ? "multiple=\'multiple\'" : "") %> id="<%= id %>"' +
        '<%= (fieldHtmlClass ? " class=\'" + fieldHtmlClass + "\'" : "") %>' +
        '<%= (node.disabled || node.readOnly? " disabled" : "")%>' +
        '> ' +
       '<% _.each(node.options, function(key, val) { if(key instanceof Object) { if (node.value && node.value.indexOf(key.value) >= 0) { %>' +
        '<option selected value="<%= key.value === null ? \'\' : escape(key.value) %>"><%= key.title %></option>' +
        ' <% } else { %> ' +
        '<option value="<%= key.value === null ? \'\' : key.value %>"><%= key.title %></option>' +
        ' <% }} else { if (value === key) { %>' +
        '<option selected value="<%= key === null ? \'\' : key %>"><%= key %></option> ' +
        ' <% } else { %>' +
        '<option value="<%= key === null ? \'\' : key %>"><%= key %></option> ' +
        '<% }}  }); %> ' +
      '</select>',
      compatibleTypes: ['array'],
      compatibleItemTypes: ['string', 'number', 'integer', 'boolean'],
      compatibleFormats: [],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      fieldtemplate: true,
      isSearchableField: true,
      requiresEnum: true,
      inputfield: true,
      isTbTemplate: false,
      onBeforeRender: function (data, node) {
        node.options = [];

        _.each(node.schemaElement.items.enum, function (key, val) {
          node.options.push({
            title: key,
            value: key
          });
        });

        if (node.formElement.titleMap) {
          _.each(node.options, function (key) {
            if (node.formElement.titleMap[key.value]) {
              key.title = node.formElement.titleMap[key.value];
            }
          });
        }
      },
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('select')
          .prop('disabled', true);
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('select')
          .prop('disabled', false);
      },
      getFieldValue: function (node) {
        var select = $(node).find('select');

        return {
          name: select[0].getAttribute('name'),
          value: select.val()
        };
      }
    },
    multipleselect: {
      template: '<select name="<%= node.name %>" <%= (node.schemaElement && (node.schemaElement.type === "array" || Array.isArray(node.schemaElement.type) && node.schemaElement.type.indexOf("array") !== -1 ) ? "multiple=\'multiple\'" : "") %> id="<%= id %>"' +
      '<%= (fieldHtmlClass ? " class=\'" + fieldHtmlClass + "\'" : "") %>' +
      '<%= (node.disabled || node.readOnly? " disabled" : "")%>' +
      '> ' +
      '<% _.each(node.options, function(key, val) { ' +
      'if (key instanceof Object) { ' +
      'if (node.value && node.value.indexOf(key.value) >= 0) { %>' +
      '<option selected value="<%= key.value === null ? \'\' : escape(key.value) %>"><%= key.title %></option> ' +
      '<% } else { %>' +
      ' <option value="<%= key.value === null ? \'\' : escape(key.value) %>"><%= key.title %></option> ' +
      '<% }} else { if (value === key) { %>' +
      ' <option selected value="<%= key === null ? \'\' : escape(key) %>"><%= key %></option> ' +
      '<% } else { %> ' +
      '<option value="<%= key === null ? \'\' : escape(key) %>"><%= key %></option> ' +
      '<% }} }); %> ' +
      '</select>',
      compatibleTypes: ['array'],
      compatibleItemTypes: ['string', 'number', 'integer', 'boolean'],
      compatibleFormats: [],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      fieldtemplate: true,
      requiresEnum: true,
      inputfield: true,
      isSearchableField: true,
      isTbTemplate: false,
      appendNull: false,
      autosaveDisabled: true,
      onBeforeRender: function (data, node) {
        if (node.formElement.titleMap) {
          _.each(node.options, function (key) {
            if (node.formElement.titleMap[key.value]) {
              key.title = node.formElement.titleMap[key.value];
            }
          });
        }

        var $node = $('#' + node.id);
        if ( ! node.options && node.value ) {
          node.options = node.options || [];

          node.value.forEach(function(el) {
            node.options.push({
              value: el,
              title: el,
            });
            // $node.append('<option selected value="' + el + '">' + el + '</option>');
          });
        }
      },
      onInsert: function (evt, node) {
        var defaultOptions = {
          sortable: false,
          animate: true,
          readOnly: node.readOnly ? true : false
        };

        var options = _.extend(defaultOptions, node.formElement.multipleselectOptions);

        if (!(node.schemaElement && isForeignKeyField(node.schemaElement))) {
          $('#' + node.id).orderedSelect(options);
        } else {
          multipleSelectFunction(node);
        }

        //todo
        // $($(node.el).find('[name="' + node.formElement.key + '"]').siblings('div')[0]).find('ol li').each(function(idx){
        //   var key = jfUtils.escapeId(node.formElement.key + '[' + idx + ']');
        //   var item = $('<span></span>');
        //   item.addClass('help-block tb-jf-errortext tb-jf-hide tb-jf-error-' + key);
        //   $(this).append(item);
        // });

      },
      getFieldValue: function (node) {
        var select = $(node).find('select');
        return {
          name: select[0].getAttribute('name'),
          value: select.val()
        };
      }
    },
    orderedselect: {
      template: '<select name="<%= node.name %>" <%= (node.schemaElement && (node.schemaElement.type === "array" || Array.isArray(node.schemaElement.type) && node.schemaElement.type.indexOf("array") !== -1 ) ? "multiple=\'multiple\'" : "") %> id="<%= id %>"' +
        '<%= (fieldHtmlClass ? " class=\'" + fieldHtmlClass + "\'" : "") %>' +
        '<%= (node.disabled || node.readOnly? " disabled" : "")%>' +
        '> ' +
        '<%= node.options_string %>' +
      '</select>',
      compatibleTypes: ['array'],
      compatibleItemTypes: ['string', 'number', 'integer', 'boolean', 'numeric'],
      compatibleFormats: [],
      minRowWidth: 'half',
      maxRowWidth: 'full',
      fieldtemplate: true,
      requiresEnum: true,
      inputfield: true,
      isSearchableField: true,
      isTbTemplate: false,
      onBeforeRender: function (data, node) {
        if (node.formElement.titleMap) {
          _.each(node.options, function (key) {
            if (node.formElement.titleMap[key.value]) {
              key.title = node.formElement.titleMap[key.value];
            }
          });
        }

        node.options_string = '';
        if ( node.schemaElement && isForeignKeyField(node.schemaElement) ) {
          _.each(node.value, function (val) {
            node.options_string += '<option selected="selected" value = "' + val + '">' + 'N/A' + '</option>';
          });
          return;
        }

        if (node.value) {
          if (_.isArray(node.value)) {
            var pushVals = _.cloneDeep(node.value);

            _.each(node.options, function (option, key) {
              var idx = pushVals.indexOf(option.value);
              if (idx > -1) {
                pushVals.splice(idx, 1);
              } else {
                if ( option.value === '' ) {
                  var idx = pushVals.indexOf(null);

                  if (idx > -1) {
                    pushVals.splice(idx, 1);
                  }
                }
              }


            });

            var deprecated = node.ownerTree.formDesc.form.deprecatedValue;
            pushVals = pushVals.map(function (value) {
              return {
                title: deprecated + ' ' + String(value) + ' ' + deprecated, value: value
              }
            });

            node.options = pushVals.concat(node.options);
          } else {
            var append = true;
            _.each(node.options, function(val, key) {

              if (node.value === val.value) {
                append = false;
                return false;

              }
            });

            if (append) {
              node.options.push({ title: node.deprecatedValues + ' ' + String(node.value) + ' ' + node.deprecatedValue, value: node.value });
            }
          }
        }

        node.options_string = '';

        _.each(node.options, function (key, val) {
          if (_.isPlainObject(key)) {
            var currValue = key.value === null ? '' : escape(key.value);
            var selected = ( (node.value && node.value.indexOf(key.value) >= 0) || (node.value && key.value === '' && node.value.indexOf(null) >= 0) ) ? 'selected' : '';

            node.options_string += '<option ' + selected + ' value = "' + currValue + '">' + key.title + '';
          }
        })
      },
      onInsert: function (evt, node) {
        var defaultOptions = {
          animate: true,
          readOnly: node.formElement.readOnly ? true : false,
          noOrder: node.formElement.noOrder ? true : false,
        };

        var options = _.extend(defaultOptions, node.formElement.multipleselectOptions);
        if (!(node.schemaElement && isForeignKeyField(node.schemaElement))) {
          $('#' + node.id).orderedSelect(options, node.value);
        } else {
          multipleSelectFunction(node);
        }
      },
      getFieldValue: function (rootNode, tree) {
        ASSERT(tree);
        var $rootNode = $(rootNode);
        var name = $rootNode.attr('name');
        var node = tree.keyToNode[name];

        var select = $rootNode.find('select');
        var val = select.val();

        return {
          name: select[0].getAttribute('name'),
          value: val == null
            ? jfUtils.getEmptyArrayValue(node.schemaElement.type, tbjsonJsonpointer.get(tree.formDesc._originalContent, '/' + node.key))
            : select.val()
        };
      }
    },
    tags: {
      template: '' +
      '<select name="<%= node.name %>" multiple="multiple"' +
      ' id="<%= id %>"' +
      ' <%= (fieldHtmlClass ? " class=\'" + fieldHtmlClass + "\'" : "") %>' +
      ' <%= (node.disabled? " disabled" : "")%>' +
      '> ' +
      ' <% _.each(node.options, function(key, val) { %>' +
      '   <option <%= (value === key.value || (value.indexOf(key.value) >= 0)) ? "selected" : "" %> value="<%= key.value === null ? \'\' : escape(key.value) %>">' +
      '       <%= key.title %>' +
      '   </option>' +
      ' <% }) %>' +
      '</select>' +
      '<input type="text" id="<%=\'tags-\' + id %>" />',
      compatibleTypes: ['array'],
      compatibleItemTypes: ['string', 'number', 'integer', 'boolean'],
      compatibleFormats: [],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      fieldtemplate: true,
      acceptsEnum: true,
      inputfield: true,
      isSearchableField: true,
      isTbTemplate: false,
      onBeforeRender: function (data, node) {
        if (node.value) {
          node.schemaElement.items.enum = node.value;
        }
      },
      onInsert: function (evt, node) {
        var options = [];
        var selectedOptions = node.value || [];
        var selectizeOptions = node.formElement.selectizeoptions || {};
        var initialInput = '';
        var textInput = $('#tags-' + node.id);
        var selectInput = $('#' + node.id);
        var delimiterRegEx = '';
        var arrayDelimiterRegEx = '';
        var isDelimiterArray = selectizeOptions.delimiters &&
          (selectizeOptions.delimiters.constructor === Array);
        node.schemaElement.getValue = 'tagsinput';

        selectInput.hide();

        _.each(selectInput.find('option'), function (option) {
          options.push(option.value);
          // if (option.selected) {
          //   selectedOptions.push(option.value);
          // }
        });

        $.extend(selectizeOptions, {
          plugins: ['drag_drop', 'remove_button'],
          persist: false,
          create: true,
          loadThrottle: null,
          onType: function (input) {
            if (isDelimiterArray) {
              if ((selectizeOptions.delimiters) &&
                  (selectizeOptions.delimiters.indexOf(input.slice(-1)) >= 0)) {
                this.createItem(input.slice(0, -1));
              }
            }
          },
          onChange: function (value) {
            var optionsString = '';
            var tags = textInput[0].value.split(selectizeOptions.delimiter);
            var i, j;
            if (isDelimiterArray && value.match(arrayDelimiterRegEx)) {
              var arrayDelimiterTags = textInput[0].value.split(delimiterRegEx);

              if (arrayDelimiterTags.length !== tags.length) {
                textInput[0].value = arrayDelimiterTags.join(selectizeOptions.delimiter);
                textInput[0].defaultValue = arrayDelimiterTags.join(selectizeOptions.delimiter);
                tags = arrayDelimiterTags;

                this.clear();
                for (i = 0; i < tags.length; i++) {
                  this.createItem(tags[i]);
                }
              }
            }

            for (i = 0, j = tags.length - 1; i <= j; i++) {
              optionsString += '' +
                '<option value="' +
                _.escape(tags[i]) +
                '" selected="selected">' +
                _.escape(tags[i]) +
                '</option>';
            }

            selectInput.find('option')
                .remove()
                .end()
                .append(optionsString);

            /**
             * add all values to the schema enum so that the json scjema is valid
             */
            node.schemaElement.items.enum = tags;

            $(node.el).trigger('change');
          }
        });

        if (!selectizeOptions.delimiter) {
          if (isDelimiterArray) {
            selectizeOptions.delimiter = selectizeOptions.delimiters[0];
          } else {
            selectizeOptions.delimiter = ',';
          }
        }

        if (isDelimiterArray) {
          delimiterRegEx = '[' + selectizeOptions.delimiter;
          arrayDelimiterRegEx = '[';

          for (var i = 0; i < selectizeOptions.delimiters.length; i++) {
            if (selectizeOptions.delimiters[i] !== selectizeOptions.delimiter) {
              if (i !== 0) {
                arrayDelimiterRegEx += '|';
              }
              arrayDelimiterRegEx += _.escapeRegExp(selectizeOptions.delimiters[i]);

              delimiterRegEx += '|';
              delimiterRegEx += _.escapeRegExp(selectizeOptions.delimiters[i]);
            }
          }
          delimiterRegEx += ']';
          arrayDelimiterRegEx += ']';
          delimiterRegEx = RegExp(delimiterRegEx, 'g');
          arrayDelimiterRegEx = RegExp(arrayDelimiterRegEx, 'g');
        }

        initialInput = selectedOptions[0];
        for (i = 1; i < selectedOptions.length; i++) {
          initialInput += selectizeOptions.delimiter + selectedOptions[i];
        }

        textInput[0].value = (_.isString(initialInput) ? initialInput : '');

        textInput.selectize(selectizeOptions);
      },
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el)
          .find('input')[0]
          .selectize
          .disable();
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el)
          .find('input')[0]
          .selectize
          .enable();
      },
      getFieldValue: function (node) {
        var select = $(node).find('select');

        return {
          name: select[0].getAttribute('name'),
          value: select.val()
        };
      }
    },
    datepicker: {
      template: datePickerTemplate,
      compatibleTypes: ['string'],
      compatibleFormats: ['iso8601-date'],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      fieldtemplate: true,
      inputfield: true,
      isTbTemplate: false,
      onBeforeRender: function (data, node) {
        ASSERT(moment, {msg: 'Moment.js not loaded', code: 2780});
        ASSERT($.fn.hasOwnProperty('datetimepicker'), {msg: 'datetimepicker $ plugin not loaded', code: 2790});
        ASSERT(jfUtils.contains(node.schemaElement.type, 'string'), {msg: 'Invalid schema type', code: 2800});

        if (node.required) {
          // implement timezone check logic
        }
      },
      onInsert: getDateTimePickerOnInsert('YYYY-MM-DD'),
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('readonly', true);
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .prop('readonly', false);
      }
    },
    datetimepicker: {
      template: datePickerTemplate,
      compatibleTypes: ['string'],
      compatibleFormats: ['iso8601-date'],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      fieldtemplate: true,
      inputfield: true,
      isTbTemplate: false,
      onBeforeRender: function (data, node) {
        ASSERT(moment, {msg: 'Moment.js not loaded', code: 2830});
        ASSERT($.fn.hasOwnProperty('datetimepicker'), {msg: 'datetimepicker $ plugin not loaded', code: 2840});
        ASSERT(jfUtils.contains(node.schemaElement.type, 'string'), {msg: 'invalid schema type', code: 2850});

        if (node.required) {
          // implement timezone check logic
        }
      },
      onInsert: getDateTimePickerOnInsert('YYYY-MM-DD HH:mm:ss'),
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('readonly', true);
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .prop('readonly', false);
      }
    },
    timepicker: {
      template: datePickerTemplate,
      compatibleTypes: ['string'],
      compatibleFormats: ['iso8601time'],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      fieldtemplate: true,
      inputfield: true,
      isTbTemplate: false,
      onBeforeRender: function (data, node) {
        ASSERT(moment, {msg: 'Moment.js not loaded', code: 2880});
        ASSERT($.fn.hasOwnProperty('datetimepicker'), {msg: 'datetimepicker $ plugin not loaded', code: 2890});
        ASSERT(jfUtils.contains(node.schemaElement.type, 'string'), {msg: 'invalid schema type', code: 2900});

        if (node.required) {
          // implement timezone check logic
        }
      },
      onInsert: getDateTimePickerOnInsert('HH:mm:ss'),
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('readonly', true);
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .prop('readonly', false);
      }
    },
    radios: {
      template: '' +
      '<div id="<%= node.id %>"><% _.each(node.options, function(key, val) { %>' +
      '<% if (!elt.inline) { %><div class="radio "><label><% } else { %>' +
      '<label class="radio<%= cls.inlineClassSuffix %>"><% } %>' +
      '<input type="radio" <% if (((key instanceof Object) && (node.value === key.value)) || (node.value === key)) { %> checked="checked" <% } %> name="<%= node.name %>" value="<%= (key instanceof Object ? key.value : key) %>"' +
      '<%= (node.disabled? " disabled" : "")%>' +
      '/><span><%= (key instanceof Object ? key.title : key) %></span></label><%= elt.inline ? "" : "</div>" %> <% }); %></div>',
      compatibleTypes: ['array', 'string', 'number', 'integer', 'boolean'],
      compatibleItemTypes: ['string', 'number', 'integer', 'boolean'],
      compatibleFormats: [],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      fieldtemplate: true,
      requiresEnum: true,
      inputfield: true,
      isTbTemplate: false,
      onBeforeRender: function (evt, node) {
        // alter the value descriptions is case a titleMap is defined
        if (node.formElement.titleMap) {
          _.each(node.options, function (key) {
            if (node.formElement.titleMap[key.value]) {
              key.title = node.formElement.titleMap[key.value];
            }
          });
        }
      },
      onInsert: function (evt, node) {
        node.initializeEventHandlers = function () {
          if (node.formElement.toggleNextMap) {
            var valueMapToNext = {};

            for (var value in node.formElement.toggleNextMap) {
              var toggleNext = node.formElement.toggleNextMap[value];
              var nextN = toggleNext === true
                ? 1
                : toggleNext;
              var toggleNextClass = 'tb-jf-toggle-next tb-jf-toggle-next-' + nextN;
              var $next = (nextN === 1)
                ? $(node.el).next()
                : (nextN === 'all'
                  ? $(node.el).nextAll()
                  : $(node.el).nextAll().slice(0, nextN));

              $next.addClass('tb-jf-toggle-next-target');
              valueMapToNext[value] = $next;
            }

            $(node.el)
              .addClass(toggleNextClass)
              .find(':radio')
              .on('change', function () {
                var $this = $(this);
                var val = $this.val();
                var checked = $this.is(':checked');
                var v, $n;

                if (checked) {
                  for (v in valueMapToNext) {
                    $n = valueMapToNext[v];

                    if (v === val) {
                      $n.toggle(checked).toggleClass('tb-jf-visible', checked);
                    } else {
                      $n.toggle(!checked).toggleClass('tb-jf-visible', !checked);
                    }
                  }
                } else {
                  // no option checked yet
                  for (v in valueMapToNext) {
                    $n = valueMapToNext[v];

                    $n
                      .toggle(false)
                      .toggleClass('tb-jf-visible', false);
                  }
                }
              }).change();
          }
        };

        node.initializeEventHandlers();
      },
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('disabled', true);
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .prop('disabled', false);
      },
      getFieldValue: function (node) {
        var options = $(node).find(':input[type=radio]');
        var name = node.getAttribute('name');

        for (var i = 0, j = options.length; i < j; i++) {
          if (options[i].checked) {
            return {
              'name': name,
              'value': options[i].value
            };
          } else if (i === j - 1) {
            return {
              'name': name,
              'value': null
            };
          }
        }
      }
    },
    radiobuttonset: {
      template: '' +
      '<div id="<%= node.id %>"' +
      ' class=" <%= elt.htmlClass ? " " + elt.htmlClass : "" %>' +
      ' <%= node.formElement.vertical ? "btn-group-vertical": "btn-group" %>' +
      ' <%= node.formElement.justified? "btn-group-justified": "btn-group" %>">' +
      '   <% _.each(node.options, function(key, val) {%>' +
      '   <label class="<%= node.formElement.buttonSize %> <%= cls.buttonClass %>">' +
      '     <input type="radio" id="<%= node.id %>" style="position:absolute;left:-9999px;"' +
      '       <%= (node.value === key.value || node.value === key) ? "checked=checked" : "" %>' +
      '       name="<%= node.name %>"' +
      '       value="<%= (key instanceof Object) ? escape(key.value) : escape(key) %>" />' +
      '     <span><%= (key instanceof Object ? key.title : key) %></span>' +
      '   </label>' +
      '<% }); %>' +
      '</div>',
      compatibleTypes: ['array', 'string', 'number', 'integer', 'boolean', 'null'],
      compatibleItemTypes: ['string', 'number', 'integer', 'boolean', 'null'],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      requiresEnum: true,
      compatibleFormats: [],
      fieldtemplate: true,
      inputfield: true,
      isTbTemplate: false,
      onBeforeRender: function (evt, node) {

        if (node.schemaElement.type === 'boolean') {
          ASSERT.isBooleanOrNil(node.value, {code: 2910, msg: 'invalid value type' });
        } else if (node.schemaElement.type === 'string') {
          ASSERT.isStringOrNil(node.value,  {code: 2920, msg: 'invalid value type' });

          if (!_.isNil(node.value)) {
            var isEnumMember = node.schemaElement.enum.indexOf(node.value) >= 0;

            ASSERT(isEnumMember === true, {code: 2930, msg: 'radiobuttonset: the specified value is not a valid type for this field.'});
          }
        } else if (node.schemaElement.type === 'number' || node.schemaElement.type === 'integer') {
          ASSERT.isNumberOrNil(node.value, {code: 2940, msg: 'invalid value type'});
        }

        if (node.formElement.titleMap) {
          _.each(node.options, function (key) {
            if (node.formElement.titleMap[key.value]) {
              key.title = node.formElement.titleMap[key.value];
            }
          });
        }

        switch (node.formElement.buttonSize) {
          case 1:
            node.formElement.buttonSize = 'btn-xs';
            break;
          case 2:
            node.formElement.buttonSize = 'btn-sm';
            break;
          case 4:
            node.formElement.buttonSize = 'btn-lg';
            break;
          default:
            node.formElement.buttonSize = '';
        }
      },
      onInsert: function (evt, node) {
        if (node.formElement.inline) {
          $(node.el).children('.controls').css('display','inline');
        }
        var activeClass = 'active';

        node.initializeEventHandlers = function () {
          $(node.el).find('label.btn')
            .on('click', function (e) {
              var $this = $(this);
              // If node is required or it's a boolean or not currently checked, check it, else uncheck
              var checked = node.required || (node.schemaElement.type === 'boolean') || !$this.hasClass(activeClass);

              // Set correct class and value to the elements
              if (!$this.attr('disabled')) {
                $this
                  .toggleClass(activeClass, checked)
                  .find(':radio')
                  .prop('checked', checked)
                  .end()
                  .parent().find('label.btn').not($this)
                  .prop('checked', false)
                  .removeClass(activeClass);
              }

              $(node.el).trigger('change');

              return false;
            })
            .find(':checked')
            .closest('label')
            .addClass(activeClass);
        };

        node.initializeEventHandlers();
      },
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('.btn-group > label')
          .attr('disabled', true);
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('label')
          .removeAttr('disabled');
      }
    },
    checkboxes: {
      template: '<div id="<%= node.id %>"><%= choiceshtml %><%= children %></div>',
      compatibleTypes: ['array'],
      compatibleItemTypes: ['string', 'number', 'integer', 'boolean'],
      compatibleFormats: [],
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      requiresEnum: true,
      fieldtemplate: true,
      inputfield: true,
      isTbTemplate: false,
      childTemplate: function (inner, node) {
        // non-inline style, we do not wrap it.
        if (!node.formElement.otherField) {
          return inner;
        }
        var template = '';
        if (node.formElement.otherField.asArrayValue) {
          // XXX: for the novalue mode, the checkbox has no value, value is in the input field
          if (node.otherValues) {
            template += '<% value = node.parentNode.otherValues.join(", ") %>';
          }
        }
        template += '<input type="checkbox"<%= value !== undefined && value !== null && value !== "" ? " checked=\'checked\'" : "" %>';
        if ((!node.formElement.otherField.asArrayValue && node.formElement.otherField.novalue !== true) || node.formElement.otherField.novalue === false) {
          template += ' name="' +
            node.key +
            '[' +
            (node.formElement.otherField.idx !== undefined ? node.formElement.otherField.idx : node.formElement.options.length) +
            ']" value="' +
            _.escape(node.formElement.otherField.otherValue || 'OTHER') +
            '"';
        }
        template += '<%= node.disabled? " disabled=\'disabled\'" : "" %>';
        template += '<%= node.formElement.readOnly? " disabled=\'disabled\'" : "" %> />';
        template += '<span><%= node.getTitle() || "Other" %> </span>';
        var otherFieldClass = 'other-field';

        if (node.formElement.otherField.inline) {
          // put the other field just after the checkbox, wrapped in the label tag
          template += '<div class="tb-jf-other-field-content">' + inner + '</div>';
          otherFieldClass = 'tb-jf-inline-' + otherFieldClass;
        }
        if (node.formElement.inline) {
          template = '<label class="' + otherFieldClass + ' checkbox<%= cls.inlineClassSuffix %>">' + template + '</label>';
        } else {
          template = '<div class="' + otherFieldClass + ' checkbox"><label>' + template + '</label></div>';
        }
        if (!node.formElement.otherField.inline) {
          // put the other field just after the checkbox's label/div
          template += '<div class="tb-jf-other-field-content">' + inner + '</div>';
        }
        return template;
      },
      onBeforeRender: function (data, node) {
        // Build up choices from the enumeration/options list
        if (!node || !node.schemaElement || !node.schemaElement.items) {
          return;
        }
        var choices = node.formElement.options;
        if (!choices) {
          return;
        }

        var template = '<input type="checkbox"<%= checked ? " checked=\'checked\'" : "" %>' +
          ' name="<%= name %>" value="<%= escape(value) %>"' +
          ' <%= node.disabled? " disabled=\'disabled\'" : "" %>' +
          ' <%= node.readOnly? " readonly=\'disabled\'" : "" %> />' +
          ' <span><%= title %></span>';

        if (node.formElement.inline) {
          template = '<label class="checkbox' + data.cls.inlineClassSuffix + '">' + template + '</label>';
        } else {
          template = '<div class="checkbox"><label>' + template + '</label></div>';
        }

        var choiceshtml = '';
        if (node.formElement.otherField && node.formElement.otherField.asArrayValue && node.value) {
          var choiceValues = choices.map(function (choice) { return choice.value; });
          // we detect values which are not within our choice values.
          var otherValues = [];
          node.value.forEach(function (val) {
            if (!_.includes(choiceValues, val)) {
              otherValues.push(val);
            }
          });
          if (otherValues.length > 0) {
            node.otherValues = otherValues;
          }
        } else {
          delete node.otherValues;
        }
        _.each(choices, function (choice, idx) {
          if (node.formElement.otherField && choice.value === (node.formElement.otherField.otherValue || 'OTHER')) {
            node.formElement.otherField.idx = idx;

            return;
          }

          var key = node.key + '[' + idx + ']';
          choiceshtml += _template(template, {
            name: key,
            value: choice.value,
            checked: _.includes(node.value, choice.value),
            title: choice.title,
            node: node,
            escape: _.escape
          }, fieldTemplateSettings);

          node.ownerTree.keyToNode[key] = node;
        });

        // the otherField could be?
        // 1. key, then use the key as inputField? wrap or not? type?
        // 2. {key: theKey, inline: boolean} type?
        // 2.1 about the type, can it be text type? if so, it will use the title, the template
        //     etc. it's good, but we do not want the title, then use notitle?
        // 3. {nokey, items: [custom elementes]} type?
        if (node.formElement.otherField) {
          // XXX: other field rendered as child, with its own template? e.g. text input
          // Then what about the "Other" checkbox? there are options:
          // 1. "Other" checkbox was rendered already by the options, then the otherField
          //    will following last checkbox div or label (inline), and we need code to
          //    connect between the checkbox and the input.
          // 2. "Other" checkbox render with the textField together? embed the text field
          //    into the "Other" checkbox's label, but HOW?
          // 2.1 with childTemplate, the child text input field can be wrappered, but what
          //     should be for the checkbox's name, value, disabled, title, checked?
          // 2.1.1 title, checked, disabled === text field title, non-blank, disabled
          //       value can be non-value or some special value
          // 2.2 should the value be collected? and how?
          //     it's better it can be collected as a member of the array, maybe special value
          //     how the checkbox array got result value?
          // 2.2.1 if as_value collect, as it follow the name style here node.key[idx]
          //       its value can be collected.
          //       if as_value===true get value from enum then if it's previous rendered
          //       as the last item of enum, then it can get its value too.
        }

        data.choiceshtml = choiceshtml;
      },
      onInsert: function (evt, node) {
        // FIXME: consider default values?
        function inputHasAnyValue (inputs) {
          var anyValue = false;

          inputs.each(function () {
            var $input = $(this);

            if ($input.is(':checkbox, :radio')) {
              if ($input.prop('checked')) {
                anyValue = true;
                return false;
              }
            }

            if ($input.is('button')) {
              return;
            }

            if ($(this).val() !== '') {
              anyValue = true;
              return false;
            }
          });

          return anyValue;
        }
        var $checkbox = node.formElement.otherField && node.formElement.otherField.inline
          ? $(node.el).find('.tb-jf-inline-other-field :checkbox').first()
          : $(node.el).find('.tb-jf-other-field :checkbox');
        var $inputs = $(node.el).find('.tb-jf-other-field-content :input');

        function otherFieldValueChange () {
          $checkbox.prop('checked', inputHasAnyValue($inputs));
        }
        $inputs.on('keyup', otherFieldValueChange).on('change', otherFieldValueChange).change();

        $checkbox.on('change', function () {
          if (this.checked) {
            this.checked = false;

            $inputs.not(':checkbox, :radio, button').focus();
          } else {
            // FIXME: reset back to default?
            $inputs.filter('input[type=text], textarea').val('');
          }
        });
      },
      onChange: function (evt, node) {
      },
      lock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('disabled', true);
      },
      unlock: function (node) {
        if (node.formElement.enableUndo ||
          node.formElement.enableRedo ||
          node.formElement.enableReset) {
          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .prop('disabled', false);
      },
      getFieldValue: function (node) {
        var options = $(node).find(':input[type=checkbox]');
        var name = node.getAttribute('name');
        var checkboxValues = [];

        for (var i = 0, j = options.length; i < j; i++) {
          if (options[i].checked) {
            checkboxValues.push(options[i].getAttribute('value'));
          }
        }

        if (checkboxValues.length === 0) {
          checkboxValues = null;
        }

        return {
          name: name,
          value: checkboxValues
        };
      }
    },
    array: {
      template: '' +
        '<div data-tb-jf-type="array" name="<%= key %>" id="<%= id %>" class="<%= node.formElement.displayCompact ? `tb-jf-array-compact` : `` %> <%= (node.rowWidth || node.formElement.rowWidth) ? "col" : ""  %> col-sm-<%= node.rowWidth || node.formElement.rowWidth %>">' +
        //'<label style="padding-left: 10px" class="tb-jf-label"><%- node.getTitle() %></label>' +
        '<h4 style="padding-left: 10px"><%= node.getTitle() %></h4>' +
				'<span class="help-block tb-jf-errortext tb-jf-hide"></span>' +
        '<% if (node.formElement.identitySeparator) { %>'    +
          '<div class="tb-jf-parse-box">' +
          '<textarea class="tb-jf-parse-input form-control" placeholder="<%= node.formElement.parseContainerPlaceholder %>"></textarea>' +
          '<span class="tb-jf-parse-errortext help-block tb-jf-errortext tb-jf-hide"></span>' +

          '<div <%= node.formElement.displayCompact ? `style="display:none"` : `` %> >'    +
            '<div class="tb-jf-parse-delimiter-box">' +
            '<span> <%= node.formElement.parseDelimiterLabel %> </span>' +
            '<input class="tb-jf-parse-delimiter-input form-control" value="<%= node.formElement.identitySeparator %>">' +
            '</div>' +
            '<div class="tb-jf-parse-buttons-box">' +
            '<button class="btn tb-jf-parse-append-button">Parse (append)</button>' +
            '<button class="btn tb-jf-parse-replace-button">Parse (replace)</button>' +
            '<button class="btn tb-jf-unparse-button">Un-parse</button>' +
            '</div>' +
            '</div>' +
          '</div>' +

        '<% } %>' +
        '<ul class="tb-jf-array-uli">' +

        '<% if (!node.formElement.showParseboxOnly) { %>'    +

          '<%= children %>' +

          '</ul>' +
          '<% if (!node.isReadOnly()) { %>' +
          '<span class="tb-jf-array-buttons" style="display: inline-flex;">' +
          '<% if (node.formElement.enableAddingItems) { %>' +
          '<a href="" class="<%= cls.buttonClass %> btn-group-justified tb-jf-array-addmore">' +
          '<i class="<%= cls.iconClassPrefix %>-plus-sign" title="Add new"></i> add new</a> ' +
          '<% } %>' +
          '</span>' +
          '<% } %>' +

        '<% } %>' +

        '</div>',
      compatibleItemTypes: ['string', 'number', 'integer', 'boolean', 'numeric'],
      compatibleTypes: ['array'],
      minRowWidth: 'half',
      maxRowWidth: 'full',
      containerField: true,
      compatibleFormats: [],
      fieldtemplate: false,
      array: true,
      isSearchableField: true,
      isArrayContainer: true, // to replace `array` property
      isTbTemplate: false,
      onBeforeRender: function (data, node) {
				if (node.formElement.commentPattern != undefined) {
					ASSERT(!node.formElement.lineSeparatorPattern);
					node.formElement.lineSeparatorPattern = node.formElement.commentPattern;
				}
      },
      getRawParsedValues: function (node) {
        var $nodeid = $(node.el).parent().find('#' + jfUtils.escapeSelector(node.id));

        var delimiter = $nodeid.find('.tb-jf-parse-delimiter-input').val();
        var input = $nodeid.find('.tb-jf-parse-input').val();

        if(!input || /^\s*$/.test(input))
          return [];

				var values = [];
				if (node.formElement.commentPattern != undefined) {
					var lines = input.split('\n');
					for (var line of lines)
					{
						var [first, ...rest] = line.split(node.formElement.commentPattern);
						var lineValues = first.split(delimiter);
        		if (lineValues[lineValues.length - 1] == '') {
              lineValues.pop();
			      }
						values.push(...lineValues, node.formElement.commentPattern + rest.join(node.formElement.commentPattern));
					}
				} else {
        	values = input.split(delimiter);
				}

        if (values[values.length - 1] == '') {
          values.pop();
        }

        return values;
      },
      unparseValuesToTextbox: function (node, values) {
        var $nodeid = $(node.el).parent().find('#' + jfUtils.escapeSelector(node.id));

        var delimiter = $nodeid.find('.tb-jf-parse-delimiter-input').val();
        var $input = $nodeid.find('.tb-jf-parse-input');

        var values = values || node.children.map((child, i) => tbjsonJsonpointer.get(child.getFormValues(), `/${node.key}/${i}${node.formElement.identityTarget || ''}`));

        var unparsed = '';
        for (var i = 0; i < values.length; i++) {
          unparsed += values[i];
          if (i != values.length - 1) {
            unparsed += delimiter;
          }
          if (node.formElement.lineSeparatorPattern && values[i].match(node.formElement.lineSeparatorPattern)) {
            unparsed += '\n';
          }
        }
        $input.val(unparsed);
      },
      showChildError: function (node, childNode) {
        if (node.formElement.showParseboxOnly) {
          var values = node.view.getRawParsedValues(node);

          var $errText = $(node.el).find('.tb-jf-parse-errortext');
          $errText.text('Invalid value: ' + values[childNode.childPos]);
          $errText.show();
          return $errText;
        }
      },
      clearErrors: function(node) {
        var $errText = $(node.el).find('.tb-jf-parse-errortext');
        $errText.hide();
      },
      getFieldValue: function (rootNode, tree) {
        ASSERT(tree);
        var $rootNode = $(rootNode);
        var name = $rootNode.attr('name');

        var node = tree.keyToNode[name];

        if (node.formElement.showParseboxOnly) {
          var value = node.view.getRawParsedValues(node);

          var nChildrenToAdd = value.length - node.children.length;

          for (let i = 0; i < nChildrenToAdd; i++) {
            node.insertArrayItem(node.children.length, undefined, true);
          }

          return {
            name: name,
            value: value
          }
        }

        // @todo todo @momo
        // ( array.childre.length >= 1 || array.key ) && commonParent(node.children)
        // commonParent - в един масив може да се дефинират само ключовете. В този масив не трябва да има деца, които не са siblings
        // дискусия за +-чето
        // дискусия как да направим enum-овете

        if ($(rootNode).find('ul').children('li').length === 0) {
          return {
            'name': name,
            'value': jfUtils.getEmptyArrayValue(node.schemaElement.type, tbjsonJsonpointer.get(tree.formDesc._originalContent, '/' + node.key))
          }
        }
      },
      childTemplate: function (inner, node) {
        var template = '<li class="tb-jf-array-element row" data-idx="<%= node.childPos %>" data-tb-jf-type="array-item">';

        if (!node.isReadOnly() && $('').sortable && node.formElement.enableSorting) {
          template += ' <span class="tb-jf-array-button-group draggable line tb-jf-draggable">';
        } else if (!node.isReadOnly() && node.formElement.enableSorting) {
          template += ' <span class="tb-jf-array-button-group">';
        }

        if (!node.isReadOnly() && node.formElement.enableSorting) {
          if (node.formElement.displayCompact) {
            template += '<i class="<%= cls.iconClassPrefix %>-move" title="move"></i></span>';
          } else {
            template += ' <a class="<%= cls.buttonClass %> tb-jf-array-item-move-up btn-sm"><i class="<%= cls.iconClassPrefix %>-circle-arrow-up" title="Move item up"></i>' +
              '</a>' +
              ' <a class="<%= cls.buttonClass %> tb-jf-array-item-move-down btn-sm"><i class="<%= cls.iconClassPrefix %>-circle-arrow-down" title="Move item down"></i>' +
              '</a>' +
              ' </span>';
          }
        }

        if (!node.isReadOnly() && node.formElement.enableDeletingItems) {
          template += ' <a href="#" class="<%= cls.buttonClass %> tb-jf-array-item-delete btn-xs btn-danger"><i class="<%= cls.iconClassPrefix %>-remove" title="Remove item"></i>' +
            '</a>';
        }

        template += inner +
          '</li>';

        //template += '<% if(node.value && node.formElement.parent.lineSeparatorPattern && node.value.match(node.formElement.parent.lineSeparatorPattern)) { %> <br> <% } %>';

        return template;
      },
      onLayoutUpdate: function (node) {
        for (var child of node.children) {
          $(child.el).css('margin-right', '');
          $(child.el).css('margin-bottom', '');

          if (child.value && child.formElement.parent.lineSeparatorPattern && child.value.match(child.formElement.parent.lineSeparatorPattern)) {
            var parentRect = $(child.el).parent()[0].getBoundingClientRect();
            var elementRect = child.el.getBoundingClientRect();
            $(child.el).css('margin-right', (parentRect.right - elementRect.right - elementRect.width / 2) + 'px');
            $(child.el).css('margin-bottom', '10px');
          }
        }
      },
      onChange: function (e, node) {
        if (node.formElement.showParseboxOnly) {
          return;
        }
        node.view.onLayoutUpdate(node);
      },
      onInsert: function (evt, node) {

        if (node.formElement.showParseboxOnly) {
          node.view.unparseValuesToTextbox(node, node.children.map(c => c.value));
          return;
        }

        var $nodeid = $('#' + jfUtils.escapeSelector(node.id));//$(node.el).find('#' + jfUtils.escapeSelector(node.id));
        //$nodeid = $('#' + jfUtils.escapeSelector(this.id));

        var arrayLimits = node.getArrayLimits();

        // array modification functions
        var moveNodeTo = function (fromIdx, toIdx) {
          // Note "switchValuesWithNode" extracts values from the DOM since field
          // values are not synchronized with the tree data structure, so calls
          // to render are needed at each step to force values down to the DOM
          // before next move.
          // TODO: synchronize field values and data structure completely and
          // call render only once to improve efficiency.
          if (fromIdx === toIdx ||
            node.formElement.enableSorting !== true) {
            return;
          }

          var parentEl = $('> ul', $nodeid);
          var arrayIndexIncrementor = (toIdx > fromIdx)
            ? 1
            : -1;

          for (var i = fromIdx; i !== toIdx; i += arrayIndexIncrementor) {
            node.children[i]
              .switchValuesWithNode(node.children[i + arrayIndexIncrementor]);

            console.info("Calling Render 3: from moveNodeTo of array");
            node.children[i].shouldEnhance = true;
            node.children[i + arrayIndexIncrementor].shouldEnhance = true;
            if (node.children[i].children) {
	      for (var j = 0; j < node.children[i].children.length; j++) {
                node.children[i].children[j].shouldEnhance = true;
	      }
	    }
            if (node.children[i + arrayIndexIncrementor].children) {
	      for (var j = 0; j < node.children[i + arrayIndexIncrementor].children.length; j++) {
                node.children[i + arrayIndexIncrementor].children[j].shouldEnhance = true;
	      }
	    }


            node.children[i].render(parentEl.get(0));
            node.children[i + arrayIndexIncrementor].render(parentEl.get(0));

            node.children[i].markChildEventHandlersForUpdate();
            node.children[i + arrayIndexIncrementor].markChildEventHandlersForUpdate();
          }

          // No simple way to prevent DOM reordering with $ UI Sortable,
          // so we're going to need to move sorted DOM elements back to their
          // origin position in the DOM ourselves (we switched values but not
          // DOM elements)

          var fromEl = $(node.children[fromIdx].el);
          var toEl = $(node.children[toIdx].el);

          fromEl.detach();
          toEl.detach();

          if (fromIdx < toIdx) {
            if (fromIdx === 0) {
              parentEl.prepend(fromEl);
            } else {
              $(node.children[fromIdx - 1].el).after(fromEl);
            }

            $(node.children[toIdx - 1].el).after(toEl);
          } else {
            if (toIdx === 0) {
              parentEl.prepend(toEl);
            } else {
              $(node.children[toIdx - 1].el).after(toEl);
            }

            $(node.children[fromIdx - 1].el).after(fromEl);
          }

          $nodeid.trigger('change');
        };

        var addItem = function (idx) {
          if (node.formElement.enableAddingItems !== true) {
            return;
          }

          if (arrayLimits.maxItems >= 0) {
            var slotNum = arrayLimits.maxItems - node.children.length;

            $nodeid.find('> span > a.tb-jf-array-addmore')
              .toggleClass('disabled', slotNum <= 1);
            if (slotNum < 1) {
              return false;
            }
          }

          node.insertArrayItem(idx, $('> ul', $nodeid).get(0));

          var canDelete = node.children.length > arrayLimits.minItems;
          $nodeid.find('> span > a.tb-jf-array-deletelast')
            .toggleClass('disabled', !canDelete);
          $nodeid.find('> ul > li > a.tb-jf-array-item-delete').toggle(canDelete);

          $nodeid.trigger('change');
        };

        var deleteItem = function (idx) {
          if (node.formElement.enableDeletingItems !== true) {
            return;
          }

          var itemNumCanDelete = node.children.length - Math.max(arrayLimits.minItems, 0);

          $nodeid.find('> span > a.tb-jf-array-deletelast')
            .toggleClass('disabled', itemNumCanDelete <= 1);
          $nodeid.find('> ul > li > a.tb-jf-array-item-delete')
            .toggle(itemNumCanDelete > 1);

          if (itemNumCanDelete < 1) {
            return false;
          }

          node.deleteArrayItem(idx);

          $nodeid.find('> span > a.tb-jf-array-addmore')
            .toggleClass(
              'disabled',
              arrayLimits.maxItems >= 0 && node.children.length >= arrayLimits.maxItems
            );

          $nodeid.trigger('change');
        };

        // user action event handlers
        var addItemEvent = function (item, evt) {
          evt.preventDefault();
          evt.stopPropagation();

          var idx = node.children.length;
          addItem(idx);
        };

        var deleteLastItemEvent = function (item, evt) {
          var idx = node.children.length - 1;
          evt.preventDefault();
          evt.stopPropagation();
          deleteItem(idx);
        };

        var deleteItemByIndexEvent = function (item, evt, idx) {
          deleteItem(idx);
        };

        var moveItemUpEvent = function (item, evt) {
          evt.preventDefault();
          evt.stopPropagation();

          var index = item.parentNode.parentNode.getAttribute('data-idx');

          if (+index - 1 >= 0) {
            moveNodeTo(+index, +index - 1);
          }
        };

        var moveItemDownEvent = function (item, evt) {
          evt.preventDefault();
          evt.stopPropagation();

          var maxIndex = node.children.length - 1;
          var index = item.parentNode.parentNode.getAttribute('data-idx');

          if (+index + 1 <= +maxIndex) {
            moveNodeTo(+index, +index + 1);
          }
        };

        var moveItemToPositionEvent = function (item, evt, ui) {
          var idx = $(ui.item).data('idx');
          var newIdx = $(ui.item).index();
          if (newIdx < 0) {
            return;
          }
          moveNodeTo(idx, newIdx);
        };

        var parseItemsEvent = function (evt, replace) {
          evt.preventDefault();

          var values = node.view.getRawParsedValues(node);

          if (values.length == 0)
            return alert('Parsed 0 values');

          if (replace && !confirm('Are you sure you want to replace all elements?'))
            return;

          if (replace) {
            while (node.children.length > 0) {
              node.removeChild();
            }
          }

          for (var value of values) {
            var idx = node.children.length;
            addItem(idx);
            var child = node.children[idx];
            var values = child.getFormValues();
            tbjsonJsonpointer.set(values, `/${node.key}/${idx}${node.formElement.identityTarget || ''}`, value);
            child.resetValues();
            child.computeInitialValues(values, {enableDefault: true});
            child.shouldEnhanceFunc();
            (function reloadChildren(child) {
              child.children.forEach(function(child) {
                child.alreadyLoaded = false;
                reloadChildren(child);
              });
            })(child);
            child.render();
          }
        };

        var unparseItemsEvent = function (evt) {
          evt.preventDefault();
          node.view.unparseValuesToTextbox(node);
        };

        node.initializeEventHandlers = function () {
          // arrayLimits = this.getArrayLimits();
          // curItems = $('> ul > li', $nodeid).length;
          var itemNumCanDelete = this.children.length - Math.max(arrayLimits.minItems, 0);

          $nodeid.find('> span > a.tb-jf-array-deletelast')
            .toggleClass('disabled', itemNumCanDelete <= 0);

          $nodeid.find('> ul > li > a.tb-jf-array-item-delete')
            .toggle(itemNumCanDelete > 0);

          $nodeid.find('> span > a.tb-jf-array-addmore')
            .toggleClass('disabled', arrayLimits.maxItems >= 0 && this.children.length >= arrayLimits.maxItems);

          // add child element
          $nodeid.on('click', '> span > a.tb-jf-array-addmore', function (evt) {
            ASSERT(node.key !== undefined);

            var event = new CustomEvent('tb_jf_array_item_add', {
              detail: {
                key: node.key.startsWith('/') ? node.key : '/' + node.key,
                idx: node.children.length,
              }
            });

            node.ownerTree.domRoot.dispatchEvent(event);
            addItemEvent(this, evt);
          });

          // delete the last child element
          $nodeid.on('click', '> span > a.tb-jf-array-deletelast', function (evt) {
            deleteLastItemEvent(this, evt);
          });

          // delete clicked child element
					$nodeid.on('click', '> ul > li > a.tb-jf-array-item-delete', function (evt) {
						evt.preventDefault();
						evt.stopPropagation();

						ASSERT(node.key !== undefined);
						var $li = $(evt.currentTarget).parent();

						if ($li.parent().parent().attr('id') !== node.id) {
							return;
						}

						var idx = $li.data('idx');

						var event = new CustomEvent('tb_jf_array_item_delete', {
							detail: {
								key: node.key.startsWith('/') ? node.key : '/' + node.key,
								idx: idx,
							}
						});

						node.ownerTree.domRoot.dispatchEvent(event);

						deleteItemByIndexEvent(this, evt, idx);
					});

          // move child element one position ahead
          $nodeid.on('click', '> ul > li > .tb-jf-array-button-group > a.tb-jf-array-item-move-up', function (evt) {
            moveItemUpEvent(this, evt);
          });

          // move child element one position behind
          $nodeid.on('click', '> ul > li > .tb-jf-array-button-group > a.tb-jf-array-item-move-down', function (evt) {
            moveItemDownEvent(this, evt);
          });

          // Parse (append)
          $nodeid.on('click', '.tb-jf-parse-append-button', function (evt) {
            parseItemsEvent(evt, false);
          });

          // Parse (replace)
          $nodeid.on('click', '.tb-jf-parse-replace-button', function (evt) {
            parseItemsEvent(evt, true);
          });

          // Un-parse
          $nodeid.on('click', '.tb-jf-unparse-button', function (evt) {
            unparseItemsEvent(evt);
          });

          // enable or disable the sorting of array elements
          if (!this.isReadOnly() && $(this.el).sortable && this.formElement.enableSorting) {
            // initialize $-ui sortable
            $('> ul', $nodeid).sortable({
              tolerance: 'pointer',
              change: function (event, ui) {
                node.view.onLayoutUpdate(node);
              }
            });

            // send sortable event to moveNodeTo
            $('> ul', $nodeid).bind('sortstop', function (evt, ui) {
              moveItemToPositionEvent(this, evt, ui);
            });
          }
        };

        // add child elements so that the minItems constraint is satisfied
        if (arrayLimits.minItems > 0) {
          for (var i = node.children.length; i < arrayLimits.minItems; i++) {
            node.insertArrayItem(node.children.length, $nodeid.find('> ul').get(0));
          }
        }

        node.initializeEventHandlers();
      },
      // the elements for the lock and unlock functions cannot be cached
      // as new element can be created and old ones can be deleted by the user
      lock: function (node) {
        $(node.el).find('> div.controls > div > ul.tb-jf-array-ul > .tb-jf-array-element > .tb-jf-array-item-delete')
          .hide();

        $(node.el).find('> div.controls > div > ul.tb-jf-array-ul > .tb-jf-array-element > .tb-jf-array-button-group')
          .hide();

        $(node.el).find('> div.controls > div > ul.tb-jf-array-ul > .tb-jf-array-element > .tb-jf-draggable')
          .hide();

        $(node.el).find('> div.controls > div > span.tb-jf-array-buttons')
          .hide();

        // TODO moving nodes containing drag and drop elements disables the drag & drop property
        // if (!node.isReadOnly() && $(node.el).sortable && node.formElement.enableSorting) {
        //   $(node.el).find('> div.controls > div > ul.tb-jf-array-ul')
        //     .sortable('disable');
        // }
      },
      unlock: function (node) {
        $(node.el).find('> div.controls > div > ul.tb-jf-array-ul > .tb-jf-array-element > .tb-jf-array-item-delete')
          .show();

        $(node.el).find('> div.controls > div > ul.tb-jf-array-ul > .tb-jf-array-element > .tb-jf-array-button-group')
          .show();

        $(node.el).find('> div.controls > div > ul.tb-jf-array-ul > .tb-jf-array-element > .tb-jf-draggable')
          .show();

        $(node.el).find('> div.controls > div > span.tb-jf-array-buttons')
          .show();

        // if (!node.isReadOnly() && $(node.el).sortable && node.formElement.enableSorting) {
        //   $(node.el).find('> div.controls > div > ul.tb-jf-array-ul')
        //     .sortable('enable');
        // }
      }
    },
    alert: {
      template: '<div class=" <%= node.formElement.alertType %>" role="alert">' +
        '<%= node.formElement.alertMessage %>' +
        '</div>',
      isTbTemplate: false,
      minRowWidth: 'quarter',
      maxRowWidth: 'full',
      onBeforeRender: function (data, node) {
        if (!node.formElement.description) {
          ASSERT.isString(node.formElement.title, {msg: 'elementType alert: the alert must have title, description or both.', code: 2960});
        } else {
          ASSERT.isString(node.formElement.description, {msg: 'elementType alert: the alert must have title, description or both.', code: 2970});
        }

        node.formElement.alertMessage = '';

        switch (node.formElement.alertType) {
          case 'success':
            node.formElement.alertType = 'alert alert-success';
            node.formElement.alertMessage = '<i class="glyphicon glyphicon-ok"></i> ';
            break;
          case 'warning':
            node.formElement.alertType = 'alert alert-warning';
            node.formElement.alertMessage = '<i class="glyphicon glyphicon-warning-sign"></i> ';
            break;
          case 'danger':
            node.formElement.alertType = 'alert alert-danger';
            node.formElement.alertMessage = '<i class="glyphicon glyphicon-remove-sign"></i> ';
            break;
          case 'info':
            node.formElement.alertType = 'alert alert-info';
            node.formElement.alertMessage = '<i class="glyphicon glyphicon-info-sign"></i> ';
            break;
          case 'message': default:
            node.formElement.alertType = 'well';
        }

        if (node.getTitle()) {
          node.formElement.alertMessage += '<strong>' +
            node.getTitle() +
            '</strong> </br>';
        }

        node.formElement.alertMessage += node.formElement.description;
      }
    },
    fieldset: {
      template: '<fieldset class="tb-jf-fieldset-header tb-jf-node row ' +
        '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
          '<%= (node.rowWidth || node.formElement.rowWidth) ? "col" : ""  %> col-sm-<%= node.rowWidth || node.formElement.rowWidth %>' +
        '<% if (elt.expandable) { %>expandable<% } %> <%= elt.htmlClass?elt.htmlClass:"" %>" ' +
        '<% if (id) { %> id="<%= id %>"<% } %>' +
        ' data-tb-jf-type="fieldset">' +
        '<% if (node.getTitle() && !elt.notitle) { %><legend class="tb-jf-legend"><%= node.getTitle() %> <span class="tb-jf-enumerate-form"><%= enumerationText %></span></legend><% } %>' +
        '<% if (node.description) { %> <span class="help-block tb-jf-description"><%= node.description %></span><% } %>' +
        '<div style="display: inline-block; width: 100%" class="tb-jf-plain-fieldset myClass123 row' +
        '<% if (elt.expandable) { %>cls.groupClass" hidden <% } else { %> " <% } %> >' +
        '<%= children %>' +
        '</div>' +
        '<span class="help-block tb-jf-errortext tb-jf-hide"></span>' +
        '</fieldset>',
      isTbTemplate: false,
      containerField: true,
      compatibleTypes: ['object'],
      compatibleFormats: [],
      minRowWidth: 'half',
      maxRowWidth: 'full',
      onBeforeRender: function (data, node) {
      }
    },
    submit: {
      template: '<input type="submit" <% if (id) { %> id="<%= id %>" <% } %> class="btn btn-primary <%= elt.htmlClass?elt.htmlClass:"" %> <%= (node.rowWidth || node.formElement.rowWidth) ? "col" : ""  %> col-sm-<%= node.rowWidth || node.formElement.rowWidth %>" value="<%= value || node.getTitle() %>"<%= (node.disabled? " disabled" : "")%>/>',
      isTbTemplate: false,
      minRowWidth: 'full',
      maxRowWidth: 'full',
      compatibleTypes: []
    },
    button: {
      compatibleTypes: [],
      template: '' +
        '<button type="button"  id="<%= id %>" ' +
        '<% if (node.formElement.id) { %> data-id="<%= node.formElement.id %>" <% } %> ' +
        '<% if (node.formElement.classId) { %> data-class-id="<%= node.formElement.classId %>" <% } %> ' +
        '<% if (node.rowWidth) { %>style="float: left;"<% } %>' +
        'class="btn <%= node.formElement.buttonSize %>' +
        '  <%= node.formElement.buttonType %> <%= cls.buttonClass %>' +
        '  <%= elt.htmlClass?elt.htmlClass:"" %> <%= node.formElement.buttonStyle %>">' +
        '<i class="glyphicon glyphicon-<%= node.formElement.buttonIcon %>">' +
        '</i>' +
        ' <%= node.getTitle() %>' +
        '</button> ',
      fieldtemplate: true,
      isTbTemplate: false,
      onBeforeRender: function (data, node) {
        node.formElement.parent = node.parentNode;
        if (!node.formElement.description) {
          ASSERT.isString(node.formElement.title, {msg: 'elementType alert: the alert must have title, description or both.', code: 2980});
        } else {
          ASSERT.isString(node.formElement.description, {msg: 'elementType alert: the alert must have title, description or both.', code: 2990});
        }

        node.formElement.alertMessage = '';

        switch (node.formElement.buttonType) {
          case 'primary':
            node.formElement.buttonType = 'btn-primary';
            node.formElement.buttonIcon = (!_.isNil(node.formElement.buttonIcon))
              ? node.formElement.buttonIcon : 'ok';

            break;
          case 'success':
            node.formElement.buttonType = 'btn-success';
            node.formElement.buttonIcon = (!_.isNil(node.formElement.buttonIcon))
              ? node.formElement.buttonIcon : 'ok';

            break;
          case 'warning':
            node.formElement.buttonType = 'btn-warning';
            node.formElement.buttonIcon = (!_.isNil(node.formElement.buttonIcon))
              ? node.formElement.buttonIcon : 'warning-sign';

            break;
          case 'danger':
            node.formElement.buttonType = 'btn-danger';
            node.formElement.buttonIcon = (!_.isNil(node.formElement.buttonIcon))
              ? node.formElement.buttonIcon : 'remove-sign';

            break;
          case 'info':
            node.formElement.buttonType = 'btn-info';
            node.formElement.buttonIcon = (!_.isNil(node.formElement.buttonIcon))
              ? node.formElement.buttonIcon : 'info-sign';

            break;
          case 'default': default:
            node.formElement.buttonType = 'btn-default';
        }

        switch (node.formElement.buttonSize) {
          case 'big':
            node.formElement.buttonSize = 'btn-xl';
            break;
          case 'small':
            node.formElement.buttonSize = 'btn-sm';
            break;
          case 'very small':
            node.formElement.buttonSize = 'btn-xs';
            break;
          case 'normal': default:
            node.formElement.buttonSize = 'btn';
            break;
        }

        switch (node.formElement.buttonStyle) {
          case 'justified':
            node.formElement.buttonStyle = 'btn-group btn-group-justified';
            break;
          case 'block':
            node.formElement.buttonSize = 'btn-block';
            break;
          case 'normal': default:
            node.formElement.buttonSize = '';
            break;
        }
      },
      lock: function (node) {
        $(node.el)
          .addClass('disabled')
          .prop('disabled', true);
      },
      unlock: function (node) {
        $(node.el)
          .removeClass('disabled')
          .prop('disabled', false);
      },
      minRowWidth: 'sixth',
      maxRowWidth: 'full'
    },
    actions: {
      template: '<div class="form-actions <%= elt.htmlClass?elt.htmlClass:"" %>"><%= children %></div>',
      isTbTemplate: false
    },
    hidden: {
      template: ''
            + '<input type="hidden" id="<%= node.id %>" name="<%= node.name %>" '
            + "value='<% if (_.isPlainObject(node.value) || _.isArray(node.value)) { %> <%= _.escape(JSON.stringify(node.value)) %> <% } else { %> <%= _.escape(node.value) %> <% } %>' />",
      inputfield: true,
      isTbTemplate: false,
      fieldtemplate: true,

      // TODO: when foreign key is selected, make sure it doesnt blow an assert. Fix it so this is useless - hidden should work with EVERYTHING!!!
      isSearchableField: true,

      compatibleTypes: ['string', 'number', 'integer', 'boolean', 'object', 'array'],
      compatibleFormats: [],
      minRowWidth: 'half',
      maxRowWidth: 'full',
      onBeforeRender: function(data, node) {
        if (node.required === true && (node.value === undefined || node.value === null) && (!node.formElement.ignoreHiddenNoValue)) {
          ASSERT_USER(0, {code: 2995, msg: 'The node ' + node.name + ' that is required and hidden should have value in content or default!'}, node.name, node.formElement, node.schemaElement, node.value, node.required);
        }
      },
    },
    optionfieldset: {
      template: '<div class="<%= (node.rowWidth || node.formElement.rowWidth) ? "col" : ""  %> col-sm-<%= node.rowWidth || node.formElement.rowWidth %>"' +
        '<% if (node.id) { %> id="<%= node.id %>"<% } %>' +
        '>' +
        '<%= children %>' +
        '</div>',
      compatibleTypes: ['object'],
      containerField: true,
      minRowWidth: 'half',
      maxRowWidth: 'full',
      isTbTemplate: false
    },
    section: {
      template: '<div' +
        '<% if (node.id) { %> id="<%= node.id %>"<% } %> class="tb-jf-node row <%= (node.rowWidth || node.formElement.rowWidth) ? "col" : ""  %> col-sm-<%= node.rowWidth || node.formElement.rowWidth %>' +
        '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
        ' <%= elt.htmlClass?elt.htmlClass:"" %>"' +
        ' data-tb-jf-type="section"><%= children %></div>',
      compatibleTypes: ['array'],
      compatibleFormats: [],
      containerField: true,
      minRowWidth: 'half',
      maxRowWidth: 'full',
      isTbTemplate: false,
    },
    tablerow: {
      template: '',
        /*'<div' +
        '<% if (node.id) { %> id="<%= node.id %>"<% } %> class="tb-jf-node ' +
        '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
        ' <%= elt.htmlClass?elt.htmlClass:"" %>"' +
        '><%= children %></div>',*/
      compatibleTypes: ['array'],
      compatibleFormats: [],
      containerField: true,
      minRowWidth: 'full',
      maxRowWidth: 'full',
      isTbTemplate: false,
      onBeforeRender: function (data, node) {
        node.key = node.parentNode.key + `[${node.childPos}]`;
        node.selectorKey = jfUtils.escapeId(node.key);

        node.view.template = '<tr data-idx="<%= node.childPos %>" data-tb-jf-type="table-item"' +
          '<% if (node.id) { %> id="<%= node.id %>"<% } %> ' +
          '<%= (node.key) ? ` name="` + node.key + `" ` : "" %>' +
          'class="tb-jf-node ' +
          '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
          ' <%= elt.htmlClass ? elt.htmlClass: "" %>"> ' +
          '<%= children %>';

        if (node.parentNode.formElement.enableDeletingItems ||
          node.parentNode.formElement.enableSorting) {
          node.view.template += '<td width="1%"> ' +
            ' <span class="tb-jf-table-button-group">';
        }

        if (node.parentNode.formElement.enableSorting) {
          node.view.template += ' <a class="<%= cls.buttonClass %> tb-jf-table-row-move-up btn-xs">' +
            '<i class="<%= cls.iconClassPrefix %>-circle-arrow-up" title="move row up"></i>' +
            '</a>' +
            ' <a class="<%= cls.buttonClass %> tb-jf-table-row-move-down btn-xs">' +
            '<i class="<%= cls.iconClassPrefix %>-circle-arrow-down" title="move row down"></i>' +
            '</a>';
        }

        if (node.parentNode.formElement.enableDeletingItems) {
          node.view.template += ' <a href="#" class="<%= cls.buttonClass %> tb-jf-table-row-delete btn-xs btn-danger"><i class="<%= cls.iconClassPrefix %>-remove" title="remove row"></i></a>' +
            ' </span>' +
            ' </td>';
        }

        if (node.parentNode.formElement.enableDeletingItems ||
          node.parentNode.formElement.enableSorting) {
          node.view.template += ' </span>' +
            ' </td>';
        }

        node.view.template += '<td class="tb-jf-errortext tb-jf-hide"></td>';

        node.view.template += '</tr>';

        _.each(node.children, function (child) {
          child.fieldtemplate = false;
          child.view.tablecell = true;
        });
      }
    },
    table: tableAsObject,
    tableobject: tableObjectasObject,


    datatable: {
      template: '<div class="tb-jf-table-container"><table ' +
        'name="<%= node.name %><%= (node.schemaElement && node.schemaElement.type === "array" ? "[]" : "") %>" ' +
        'id="<%= id %>" ' +
        'class="tb-jf-table table table-responsive table-striped table-bordered table-hover <%= (fieldHtmlClass ? " fieldHtmlClass " : "") %> <%= (node.formElement.displayCompressedTables ? " table-sm " : "") %>" ' +
        '<%= (node.disabled || node.readOnly? " disabled" : "")%> ' +
        '>' +
        '<thead><%= node.formElement.thead %></thead>' +
        '<tbody><%= children %></tbody>' +
        // + '<tfoot> <tr> <%= node.formElement.thead %> <tr> </tfoot>'
        '</table>' +
        '</div>',
      fieldtemplate: true,
      containerField: true,
      compatibleTypes: ['array', 'object'],
      compatibleFormats: [],
      minRowWidth: 'half',
      maxRowWidth: 'full',
      isArrayContainer: true, // to replace `array` property
      array: true,
      isTbTemplate: false,
      onBeforeRender: function (data, node) {
        var numeric = [
            {value: '=', descr: '='},
            {value: '<=', descr: 'Less Than'},
            {value: '>=', descr: 'Greater Than'},
            {value: 'between', descr: 'Start//End'},
        ];

        var text = [
            {value: '~', descr: '='},
            {value: 'beg', descr: 'Starts'},
            {value: 'end', descr: 'End'},
            {value: '=', descr: '='},
        ];

        node.columns = [];

        node.formElement.thead = '';
        node.formElement.thead += '<tr>';
        //node.formElement.thead += '<td>';
        //if ( node.formElement.enableAddingItems ){
        //  node.formElement.thead += '<a title="Create new" class="btn btn-sm btn-success fa fa-plus"> </a>';
        //}
        //node.formElement.thead += '</td>';

        _.each(node.formElement.items[0].items, function (col, index) {
          var classForNotSortable = 'not-sortable';

          var sortable = true;
          node.columns.push({data: col.title});
          node.formElement.thead += '<th class="' + (sortable ? '' : classForNotSortable) + '">' + col.getTitle() + '</th>';
        });
        if (node.formElement.enableDeletingItems) {
          node.formElement.thead += '<td></td>';
        }
        node.formElement.thead += '</tr>';

        node.formElement.thead += '<tr>';
        //node.formElement.thead += '<td>';
        //node.formElement.thead += '<a title="Filter" class="btn btn-sm btn-info fa fa-filter"></a>';
        //node.formElement.thead += '</td>';
        _.each(node.formElement.items[0].items, function (col, index) {
          var selectBox = '';
          var inputBox = '';

          if (col.key) {
            var template = [];
            if ( col.numeric ){
              template = _.clone(numeric);
            } else {
              template = _.clone(text);

              if (col.format === 'iso8601datetime') {
                template.push({value: 'month', descr: 'Within a Month'});
              }
            }

            if (template.length > 0) {
              // Adding the search options
              selectBox += '<select class="form-control input-sm">';

              template.forEach(function(val){
                selectBox += '<option value="' + val.value + '">' + val.descr + '</option>';
                inputBox = '<input type="text" size="10" class="form-control">';
              });

              selectBox += '</select>';
            }
          }

          // node.formElement.thead += '<td>' + selectBox + inputBox + '</td>';
        });
        //if (node.formElement.enableDeletingItems) {
        //  node.formElement.thead += '<td></td>';
        //}

        node.formElement.thead += '</tr>';

        _.each(node.children, function (row) {
          _.each(row.children, function (col) {
            col.view.tablecellDatatable = true;
          });
        });
      },
      onInsert: function (evt, node) {

        var URL = "./jsonformsapi";
        var pluginOptions = {
          searching: false,
          responsive: true,
          bSortCellsTop: true,
          // ajax: URL,
          columnDefs: [
            { targets: 'not-sortable', orderable: false }
          ],
          columns: node.columns,
          order: [],
          //scrollX: true,
        };

        //$('#' + node.id).DataTable(pluginOptions);
      }
    },
    datatablerow: {
      compatibleTypes: ['array'],
      compatibleFormats: [],
      containerField: true,
      minRowWidth: 'full',
      maxRowWidth: 'full',
      isTbTemplate: false,
      template: '<tr data-idx="<%= node.childPos %>" data-tb-jf-type="table-item"' +
                  '<% if (node.id) { %> id="<%= node.id %>"<% } %> ' +
                  'class="' +
                  '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
                  ' <%= elt.htmlClass ? elt.htmlClass: "" %>"> ' +
                  '<%= children %>' +
                '</tr>',
      onBeforeRender: function (data, node) {
      }
    },
    questionaryGenerator: {
      compatibleTypes: ['object'],
      compatibleFormats: [],
      containerField: true,
      minRowWidth: 'full',
      maxRowWidth: 'full',
      isTbTemplate: false,
      template: '<div' +
        '<% if (node.id) { %> id="<%= node.id %>"<% } %> class="tb-jf-node row ' +
        '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
        ' <%= elt.htmlClass?elt.htmlClass:"" %>"' +
        ' data-tb-jf-type="section"><%= children %></div>',
      onBeforeBuildFromLayout: function (node, formElement, schemaElement) {
        // ASSERT(schemaElement.properties === undefined, "Questionary generator schema element must not have custom properties");
        // ASSERT(formElement.items === undefined, "Questionary generator form element must not have custom items");

        schemaElement.properties = {
          tabs: {
						type: "array",
            minItems: 1,
            uniqueProp: "title",
						items: {
							type: "object",
              properties: {
                title: { type: "string" },
                questions: {
                  type: "array",
                  minItems: 1,
                  items: {
                    type: "object",
                    properties: {
                      code: { type: "string" },
                      title: { type: "string" },
                      type: { type: "string", enum: Object.keys(QUESTIONARY_TYPES) },
                      values: {
                        type: "array",
                        uniqueProp: "code",
                        items: {
                          type: "object",
                          properties: {
                            code: { title: "Code", type: "string", ordering: 200 },
                            label: { title: "Label", type: "string", ordering: 100 }
                          }
                        },
                        defaultNumberOfItems: 0
                      },
                      required: {
                        type: "boolean"
                      },
                      default: {
                        type: ["string", "null"]
                      },
                      group: {
                        type: "string"
                      }
                    }
                  }
                }
              }
						}
          }
        };

        formElement.items = [
          {
            // title: formElement.title,
            title: "User defined form",
            key: formElement.key + "/tabs",
            type: "tabarray",
            enableSorting: true,
            items: {
              type: "section",
              title: "New tab",
              legend: "{{value}}",
              key: formElement.key + "/tabs[]",
              items: [
                {
                  title: "Tab title",
                  key: formElement.key + "/tabs[]/title",
                  valueInLegend: true
                },
                {
                  type: "array",
                  enableSorting: true,
                  title: "Fields",
                  key: formElement.key + "/tabs[]/questions",
                  items: {
                    legend: "Field {{idx}}",
                    key: formElement.key + "/tabs[]/questions[]",
                    type: "fieldset",
                    items: [
                      {
                        title: "Title",
                        key: formElement.key + "/tabs[]/questions[]/title"
                      },
                      {
                        title: "Code",
                        key: formElement.key + "/tabs[]/questions[]/code"
                      },
                      {
                        title: "Type",
                        key: formElement.key + "/tabs[]/questions[]/type",
                        options: Object.fromEntries(Object.entries(QUESTIONARY_TYPES).map(([key, value]) => [key, value.title]))
                      },
                      /*
                {
                  title: "Is required",
                  key: formElement.key + "/questions[]/required"
                },
                {
                  title: "Default",
                  key: formElement.key + "/questions[]/default"
                },
                */
                      {
                        title: "Values",
                        key: formElement.key + "/tabs[]/questions[]/values",
                        displayCompact: true,
                        enableSorting: true,
                        items: {
                          type: "section",
                          key: formElement.key + "/tabs[]/questions[]/values[]"
                        }
                      }
                    ]
                  }
                }
              ]
            }
          }
        ];

        // workaround for iterateCreateAndAppendChildrenOfObject
        node.children = [];
      },
      getErrors: function (node) {
        var value = tbjsonJsonpointer.get(node.getFormValues(), '/' + node.key);

        var errors = [];
        var alreadyUsedQuestionCodes = {};

        for (var [i, tab] of value.tabs.entries()) {
          for (var [j, question] of tab.questions.entries()) {
            var type = QUESTIONARY_TYPES[question.type];

            if (type && type.hasValues && question.values.length === 0) {
              errors.push({
                msg: 'Must set values for select type',
                dataPath: `${ node.key.replace(/\//g, '.') }.tabs[${i}].questions[${j}].values`
              });
            }


            if (type && !type.hasValues) {
              if (question.values && question.values.length > 0) {
                errors.push({
                  msg: 'Must not set values for non-select type',
                  dataPath: `${ node.key.replace(/\//g, '.') }.tabs[${i}].questions[${j}].values`
                });
              }
            }

            if (alreadyUsedQuestionCodes[question.code]) {
              errors.push({
                msg: `Duplicate code ${question.code}`,
                dataPath: `${ node.key.replace(/\//g, '.') }.tabs[${i}].questions[${j}].code`
              });

              errors.push({
                msg: `Duplicate code ${question.code}`,
                dataPath: alreadyUsedQuestionCodes[question.code]
              });
            }

            alreadyUsedQuestionCodes[question.code] = `${ node.key.replace(/\//g, '.') }.tabs[${i}].questions[${j}].code`;
          }
        }

				return errors.length ? errors : false;
			}
    },
    questionary: {
      compatibleTypes: ['object'],
      compatibleFormats: [],
      containerField: true,
      minRowWidth: 'full',
      maxRowWidth: 'full',
      isTbTemplate: false,
      fieldtemplate: true,
      template: '<div' +
        '<% if (node.id) { %> id="<%= node.id %>"<% } %> class="tb-jf-node row ' +
        '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
        ' <%= elt.htmlClass?elt.htmlClass:"" %>"' +
        ' data-tb-jf-type="section"><p><%= node.helptext %></p><%= children %></div>',
      onBeforeBuildFromLayout: function (node, formElement, schemaElement) {
        var questionaryMeta = node.ownerTree.formDesc.questionaryDescriptors[formElement.key];
        ASSERT(formElement.questionaryClassName, "No questionaryClassName given!");
        node.helptext = '';

        try {
          let UserDefinedFormsMenu = '86.1. User Defined Forms';
          if ( ! ( questionaryMeta && questionaryMeta.tabs ) ) {
            if (node.ownerTree.formDesc.form.fields.length == 1
              && node.ownerTree.formDesc.form.fields[0] !== '*') {
              TB.jfpage = TB.jfpage || {};
              TB.jfpage.hideSubmit = true;
            }

            node.helptext = `No fields defined in User defined form "${questionaryMeta.label}". You can add fields using the menu "${UserDefinedFormsMenu}" with Class label "${questionaryMeta.label}"`;
          }
        } catch (err) {
          // do nothing
        }

        if ( ! (questionaryMeta && questionaryMeta.tabs) ) {
          return;
        }


        // ASSERT(schemaElement.properties === undefined, "Questionary schema element must not have custom properties");
        // ASSERT(formElement.items === undefined, "Questionary form element must not have custom items");

        schemaElement.properties = {};
        for (var question of questionaryMeta.tabs.flatMap(t => t.questions)) {
          var type = QUESTIONARY_TYPES[question.type];
          schemaElement.properties[question.code] = {
            type: question.required ? type.schemaType : [type.schemaType, 'null'],
            default: question.default,
            enum: type.hasValues ? question.values.map(v => v.code) : undefined,
            enumNames: type.hasValues ? question.values.map(v => v.label) : undefined
          };
        }

        var tabobject = {
          type: 'tabobject',
          items: []
        };
        formElement.items = [tabobject];
        var groups = {};
        for (var tab of questionaryMeta.tabs) {
          var group = groups[tab.title] = {
            title: tab.title,
            type: 'section',
            gridLayout: true,
            items: []
          };

          tabobject.items.push(group);
          // --------------------------------------------------------------------
          // This code transposes the usual order of fields in JF Grid Layout
          // so the questions coming in order 1 2 3 4 5 appear like so:
          // 1  4
          // 2  5
          // 3
          // insead of:
          // 1  2
          // 3  4
          // 5
          // ---------------------------------------------------------------------
          var transposedQuestions = [];
          var colLength = tab.questions.length / 2;
          for (var i = 0; i < Math.ceil(colLength); i++) {
            transposedQuestions.push(tab.questions[i]);
            if (i < Math.floor(colLength)) {
              transposedQuestions.push(tab.questions[Math.ceil(colLength) + i]);
            }
          }

          ASSERT(transposedQuestions.length === tab.questions.length);

          for (var question of transposedQuestions) {
            var type = QUESTIONARY_TYPES[question.type];
            group.items.push({
              title: question.title,
              key: formElement.key + "/" + question.code,
              type: type.formType,
              // rowWidth: 'half',
              noGridPadding: true
            });
          }


        // workaround for iterateCreateAndAppendChildrenOfObject
		//iterateCreateAndAppendChildrenOfObject -> TI SI PROBLEMA!
		//getSchemaElement
		//formTree.formDesc.schema

          node.children = [];
        }
      }
    }
  };

  /**
   * Represents a node in the form.
   *
   * Nodes that have an ID are linked to the corresponding DOM element
   * when rendered
   *
   * Note the form element and the schema elements that gave birth to the
   * node may be shared among multiple nodes (in the case of arrays).
   *
   * @class
   */
  var FormNode = function () {
    /**
     * The node's ID (may not be set)
     */
    this.id = null;

    /**
     * The node's key path (may not be set)
     */
    this.key = null;

    /**
     * DOM element associated witht the form element.
     *
     * The DOM element is set when the form element is rendered.
     */
    this.el = null;

    /**
     * Link to the form element that describes the node's layout
     * (note the form element is shared among nodes in arrays)
     */
    this.formElement = null;

    /**
     * Link to the schema element that describes the node's value constraints
     * (note the schema element is shared among nodes in arrays)
     */
    this.schemaElement = null;

    /**
     * Pointer to the "view" associated with the node, typically the right
     * object in jsonform.elementTypes
     */
    this.view = null;

    /**
     * Node's subtree (if one is defined)
     */
    this.children = [];

    /**
     * A pointer to the form tree the node is attached to
     */
    this.ownerTree = null;

    /**
     * A pointer to the parent node of the node in the tree
     */
    this.parentNode = null;

    /**
     * Child template for array-like nodes.
     *
     * The child template gets cloned to create new array items.
     */
    this.childTemplate = null;

    /**
     * Direct children of array-like containers may use the value of a
     * specific input field in their subtree as legend. The link to the
     * legend child is kept here and initialized in computeInitialValues
     * when a child sets "valueInLegend"
     */
    this.legendChild = null;

    /**
     * The path of indexes that lead to the current node when the
     * form element is not at the root array level.
     *
     * Note a form element may well be nested element and still be
     * at the root array level. That's typically the case for "fieldset"
     * elements. An array level only gets created when a form element
     * is of type "array" (or a derivated type such as "tabarray").
     *
     * The array path of a form element linked to the foo[2]/bar/baz[3]/toto
     * element in the submitted values is [2, 3] for instance.
     *
     * The array path is typically used to compute the right ID for input
     * fields. It is also used to update positions when an array item is
     * created, moved around or suppressed.
     *
     * @type {Array(Number)}
     */
    this.arrayPath = [];

      this.objectPath = [];

    /**
     * Position of the node in the list of children of its parents
     */
    this.childPos = 0;

    /**
     * An array containing every value that the node has had in chronological order
     */
    this.valueHistory = [];

    /**
     * The last active valueHistory index. valueHistory does not change when we undo/redo values
     */
    this.activeValueHistoryIdx = null;

    // This is so we dont call enhance muiltiple tiems - should be fixed cause its ugly...
    // @todo - @momo - fix this thingy <3
    this.shouldEnhance = true;
  };

  FormNode.prototype.isScalar = function () {
    if ( ! this.schemaElement ) { return true; }
    return ! ( jfUtils.contains(this.schemaElement.type, 'object') || jfUtils.contains(this.schemaElement.type, 'array') );
  }

  FormNode.prototype.isArray = function () {
    if (this.schemaElement && this.schemaElement.type) {
      return jfUtils.contains(this.schemaElement.type, 'array');
    }
  }

  /**
   * Renders the node.
   *
   * Rendering is done in three steps: HTML generation, DOM element creation
   * and insertion, and an enhance step to bind event handlers.
   *
   * @function
   * @param {Node} el The DOM element where the node is to be rendered. The
   *  node is inserted at the right position based on its "childPos" property.
   */
  FormNode.prototype.render = function (el, shouldFilter) {
    var start_time = Date.now();
    var html = this.getHtml();
    var start_time1 = Date.now();
    console.info("\t\tgetHtml Time taken: " + (start_time1 - start_time) + "ms");
    console.info("\t\t\tgetHtml - getHtml - onbeforerender Time taken: " + (TB.performance.render_tree_get_html_onbeforerender) + "ms");
    console.info("\t\t\tgetHtml - getHtml - childtemplate Time taken: " + (TB.performance.render_tree_get_html_childtemplate) + "ms");
    console.info("\t\t\tgetHtml - getHtml - templating Time taken: " + TB.performance.render_tree_get_html_templating + "ms");

    this.setHtml(html, el);
    var start_time2 = Date.now();
    console.info("\t\tsetHtml Time taken: " + (start_time2 - start_time1) + "ms");

    this.enhance(shouldFilter);
    var start_time3 = Date.now();
    console.info("\t\t\tEnhance OnInsert Time taken: " + (this.ownerTree.performance.onInsertRenderTime) + "ms");
    console.info("\t\tEnhance Time taken: " + (start_time3 - start_time2) + "ms");

    console.info("\t\tFinished rendering. Time taken: " + (start_time3 - start_time) + "ms");
  };

  FormNode.prototype.setValue = function (value) {
    this.value = value;
    this.shouldEnhance = true;

    if (this.formElement.type === 'tabarray') {
      this.currentlySelectedIndex = $(this.el).attr('active-idx');
    }

    console.info("Calling Render 5: from the FormNode.setValue method");
    this.computeInitialValues(value, { computeValues: true });
    this.render();
  };

  FormNode.prototype.setSelectOptions = function (options) {
    // jfUtils.setObjValueByKey(_.get(th is.ownerTree, 'formDesc.form.templateData'), this.key, templateData);

    this.options = options;
    this.shouldEnhanceFunc();
    console.info("Calling Render 6: from the FormNode.setSelectOptions method");
    this.render();
  };

  FormNode.prototype.setTemplateOptions = function (options, templateData) {
    jfUtils.setObjValueByKey(_.get(this.ownerTree, 'formDesc.form.templateData'), this.key, templateData);

    this.formElement.options = options;
    this.options = options;

    this.shouldEnhanceFunc();
    console.info("Calling Render 7: from the FormNode.setTemplateOptions method");
    this.render();
  };

  FormNode.prototype.addTemplateOptions = function (options, templateData) {
    var oldTemplateData = jfUtils.getObjByKey(_.get(this.ownerTree, 'formDesc.form.templateData'), this.key);
    var newTemplateData = oldTemplateData.concat(templateData);
    jfUtils.setObjValueByKey(_.get(this.ownerTree, 'formDesc.form.templateData'), this.key, newTemplateData);

    this.formElement.options = options;
    this.options = options;

    this.shouldEnhanceFunc();
    console.info("Calling Render 8: from the FormNode.addTemplateOptions method");
    this.render();
  };

  FormNode.prototype.getTitle = function() {
    // section has no title!
    // TODO: please fix it @momo
    if (this.formElement && this.formElement.type && this.formElement.type === 'section') {
      //return '';
    }

    if (this.legend) { return this.legend; }
    if (this.formElement && this.formElement.title) { return this.formElement.title; }
    if (this.title) { return this.title; }


    var keyCapitalized = (this.name || _.get(this, 'formElement.name') || '')
        .split('/')
        .map(key =>
          key
            .split('_')
            .map(_.capitalize)
            .join(' ')
        )
        .join('/');

    return keyCapitalized || '';
  }
  FormNode.prototype.translateTitleAndDescription = function () {
      if ( ! this.ownerTree.formDesc.translations ) {
        return;
      }

    var currentLocale = this.ownerTree.formDesc.locale || 'en_GB';

    var currParent = this.formElement.parent;
    while(currParent != null && currParent != undefined && ! currParent.includeForm) {
      currParent = currParent.parent;
    }

    // get translated strings?
    var realTitle = this.getTitle();

    var translationsKey;
    if (currParent) {
      var formKey = currParent.includeForm;
      translationsKey = this.ownerTree.formDesc.form.includedForms[ formKey ].title;
    } else {
      translationsKey = this.ownerTree.formDesc.form.title;
    }
    if(translationsKey == undefined) {
      return;
    }

    translationsKey = translationsKey.replace(/:/g, '_');
    translationsKey = translationsKey.replace(/[()]/g, '_');

    var translations = this.ownerTree.formDesc.translations[ translationsKey ];
    var lowerCaseTitle = realTitle.toLocaleLowerCase();
    if (translations && translations[lowerCaseTitle]) {
      var translationOptions = translations[lowerCaseTitle];

      if (translationOptions[currentLocale]) {
        realTitle = translationOptions[currentLocale][0];
      }
    }

    // use node.getTitle() instead
    this.formElement.title = realTitle;
    this.title = realTitle;

    var realDescription = this.formElement.description;
    if (realDescription !== undefined) {

      if (translations && translations[ realDescription.toLocaleLowerCase() ] ){
        var translationOptions = translations[realDescription.toLocaleLowerCase()];

        if (translationOptions[currentLocale]) {
          realDescription = translationOptions[currentLocale][0];
        }
      }

      if (realDescription.toLowerCase().indexOf('description of') === 0) {
        realDescription = undefined;
      }

      this.formElement.description = realDescription;
    }
  }

  FormNode.prototype.addSelectOptions = function (options) {
    //ASSERT - you should not have anything in the schemaElement, only a null, because we cant validate anything!

    this.options = this.options.concat(options);
    this.shouldEnhanceFunc();
    console.info("Calling Render 9: from the FormNode.addSelectOptions method");
    this.render();
  };


  TB.performance.render_tree_get_html_onbeforerender = TB.performance.render_tree_get_html_onbeforerender || 0;
  TB.performance.render_tree_get_html_childtemplate = TB.performance.render_tree_get_html_childtemplate || 0;

  /**
   * Generates the view's HTML content for the underlying model.
   *
   * @function
   */
  FormNode.prototype.getHtml = function () {
    var html = '';
    var template = null;
    var data = {
      id: this.id,
      key: this.key,
      elt: this.formElement,
      schema: this.schemaElement,
      node: this,
      value: !_.isNil(this.value) ? this.value : '',
      cls: this.ownerTree.defaultClasses,
      escape: _.escape
    };

    // Complete the data context if needed
    if (this.ownerTree.formDesc.onBeforeRender) {
      this.ownerTree.formDesc.onBeforeRender(data, this);
    }

    var start_time1 = Date.now();
    if (this.view.onBeforeRender) {
      this.view.onBeforeRender(data, this);
    }
    var start_time2 = Date.now();
    TB.performance.render_tree_get_html_onbeforerender += (start_time2 - start_time1);

    /**
     * Use the template that 'onBeforeRender' may have set,
     * falling back to that of the form element otherwise
     */
    if (this.template) {
      template = this.template;
    } else if (this.formElement && this.formElement.template) {
      template = this.formElement.template;
    } else {
      template = this.view.template;
    }

    /**
     * Wrap the view template in the generic field template
     * (note the strict equality to 'false', needed as we fallback
     * to the view's setting otherwise)
     */
    if ((this.fieldtemplate !== false) &&
      (this.fieldtemplate || this.view.fieldtemplate)) {
      template = jsonform.fieldTemplate(template);
    } else if (this.tablecell || this.view.tablecell) {
      template = jsonform.tableCellTemplate(template);
    } else if (this.tablecellDatatable || this.view.tablecellDatatable) {
      template = jsonform.dataTableCellTemplate(template);
    }

    // Wrap the content in the child template of its parent if necessary.
    if (this.parentNode &&
      this.parentNode.view &&
      this.parentNode.view.childTemplate) {
      var start_time2 = Date.now();
      template = this.parentNode.view.childTemplate(template, this.parentNode, this);
      var start_time3 = Date.now();
      TB.performance.render_tree_get_html_childtemplate += (start_time3 - start_time2);
    }

    // Prepare the HTML of the children
    var childrenhtml = '';

    _.each(this.children, function (child) {
      childrenhtml += child.getHtml();
    });

    data.children = childrenhtml;

    if (_.isArray(data.node.currentCounterArray)) {

      data.enumerationText = data.node.currentCounterArray.join('.')

    } else {

      data.enumerationText = '';

    }


    data.fieldHtmlClass = '';

    if (this.ownerTree &&
      this.ownerTree.formDesc &&
      this.ownerTree.formDesc.params &&
      this.ownerTree.formDesc.params.fieldHtmlClass) {
      data.fieldHtmlClass = this.ownerTree.formDesc.params.fieldHtmlClass;
    }

    if (this.formElement &&
      (typeof this.formElement.fieldHtmlClass !== 'undefined')) {
      data.fieldHtmlClass = this.formElement.fieldHtmlClass;
    }

    // Apply the HTML template

    var start_time2 = Date.now();
    if (template.indexOf('%') > -1) {
      html = _template(template, data, fieldTemplateSettings);
    } else {
      html = template;
    }
    var start_time3 = Date.now();
    TB.performance.render_tree_get_html_templating += (start_time3 - start_time2);

    return html;
  };

  /**
   * Inserts/Updates the HTML content of the node in the DOM.
   *
   * If the HTML is an update, the new HTML content replaces the old one.
   * The new HTML content is not moved around in the DOM in particular.
   *
   * The HTML is inserted at the right position in its parent's DOM subtree
   * otherwise (well, provided there are enough children, but that should always
   * be the case).
   *
   * @function
   * @param {string} html The HTML content to render
   * @param {Node} parentEl The DOM element that is to contain the DOM node.
   *  This parameter is optional (the node's parent is used otherwise) and
   *  is ignored if the node to render is already in the DOM tree.
   */
  FormNode.prototype.setHtml = function (html, parentEl) {
    var node = $(html);
    var descrNodes = node.find('.tb-jf-description');
    for (var i = 0; i < descrNodes.length; i++ ) {
      var currNode = $( descrNodes[i] );
      var currNodeDescrText = currNode.text();
      if ( currNodeDescrText.indexOf( '\n' ) >= 0 ) {
        currNodeDescrText = currNodeDescrText.replace(/\n/g, "<br />");
        currNode.html( currNodeDescrText );
      }
    }


    var parentNode = parentEl ||
      ((this.parentNode)
        ? this.parentNode.el
        : this.ownerTree.domRoot);
    var nextSibling = $(parentNode).children().get(this.childPos);

    if (this.el) {
      // Replace the contents of the DOM element if the node is already in the tree
      $(this.el).replaceWith(node);
    } else {
      // Insert the node in the DOM if it's not already there
      if (nextSibling) {
        $(nextSibling).before(node);
      } else {
        $(parentNode).append(node);
      }
    }

    // Save the link between the form node and the generated HTML
    this.el = node;

    // Update the node's subtree, extracting DOM elements that match the nodes
    // from the generated HTML
    this.updateDomElementReference(this.el);
  };

  /**
   * Updates the DOM element associated with the node.
   * Only nodes that have ID are directly associated with a DOM element.
   * @function
   */

  FormNode.prototype.updateDomElementReference = function (domNode) {
    if (this.id) {
      this.el = $('#' + jfUtils.escapeSelector(this.id), domNode).get(0) ||
        $('#' + jfUtils.escapeSelector(this.id));

      // array elements do not have schema keys thus they must be treated separetely
      var isArrayItem = this.parentNode &&
        this.parentNode.formElement &&
        jsonform.elementTypes[this.parentNode.formElement.type].array === true;

      if (isArrayItem) {
        var parentType = this.parentNode.formElement.type;

        this.el = this.el.closest('[data-tb-jf-type=' + parentType + '-item]');
      } else {
        this.el = this.el.closest('[data-tb-jf-type]');
      }
    }

    _.each(this.children, function (child) {
      child.updateDomElementReference(domNode || child.el) ;
    });
  };


  /**
   * Helper function
   * to return and validate the schemaDefault
   */
  FormNode.prototype.getSchemaDefault = function () {


    var schemaDefault = this.schemaElement && this.schemaElement.default;

    /**
     * make sure that all default values follow the schema type limitations
     * verify that it is valid before checking the content/value hash to avoid problems of the type
     * a schema is valid when the content/value hash is present but not otherwise
     */
    if (schemaDefault) {
      jsonform.util.validateValueType(
        this.key,
        this.schemaElement,
        this.formElement,
        this.ownerTree.formDesc.form.deprecatedValue,
        schemaDefault,
        true,
        this.ownerTree.formDesc
      );
    }

    return schemaDefault;
  };

  FormNode.prototype.getContentDefault = function (formAndContentValues) {

    var fieldValue = jfUtils.getObjByKey(formAndContentValues, this.key);
    if (fieldValue === undefined) return fieldValue;

    if (!this.ownerTree.formDesc.form.isStrict) {

      fieldValue = jfUtils.forceValueTypes(
        this.ownerTree.formDesc.schema,
        this.schemaElement,
        fieldValue,
        this.key
      );

    } else {
      if ( this.ownerTree.formDesc.skipContentDefaultValidation ) {

      } else if ( _.get(window, 'TB.jfpage.state.disableValidation') ) {

      } else {
        fieldValue = jsonform.util.validateValueType(
          this.key,
          this.schemaElement,
          this.formElement,
          this.ownerTree.formDesc.form.deprecatedValue,
          fieldValue,
          this.ownerTree.formDesc.form.strictNumberTypes,
          this.ownerTree.formDesc
        );
      }
    }


    return fieldValue;
  };


  /**
   * Recursively sets values to all nodes of the current subtree
   * based on previously submitted values, or based on default
   * values when the submitted values are not enough
   *
   * The function should be called once in the lifetime of a node
   * in the tree. It expects its parent's arrayPath to be up to date.
   *
   * Three cases may arise:
   * 1. if the form element is a simple input field, the value is
   * extracted from previously submitted values of from default values
   * defined in the schema.
   * 2. if the form element is an array-like node, the child template
   * is used to create as many children as possible (and at least one).
   * 3. the function simply recurses down the node's subtree otherwise
   * (this happens when the form element is a fieldset-like element).
   *
   * @function
   * @param {Object} values Previously submitted values for the form
   * @param {Boolean} enableDefault override global enableDefault setting.
   * @param {Integer} the top array level of the default value scope, used when
   *  adding new items into an array, at that time won't consider all default values
   *  above the array schema level.
   */
  var totalInAppliyingStuffms = {
    applyArrayPath: 0,
    applyTemplate: 0,
    total: 0,
    first_regex: 0,
    second_regex: 0,
    templating: 0,
    total_foreach_first_regex: 0,
    scary_regex: 0,
    scary_regex_else: 0,
    merge_formdata_and_computecache: 0,
    first_iff: 0,
    '10_has_non_private_check': 0,
    '20_has_input_field': 0,
    '21_has_input_field': 0,
    '211_has_input_field': 0,
    '212_has_input_field': 0,
    '22_has_input_field': 0,
    '23_has_input_field': 0,
    '24_has_input_field': 0,
    '25_has_input_field': 0,
    '30_has_array_field': 0,
    '50_contains': 0,
    '60_compute_rec': 0,
    '70_value_in_legend': 0,
  };

  TB.performance.compute_initial_values_first_part = TB.performance.compute_initial_values_first_part || 0;
  TB.performance.compute_initial_values_second_part = TB.performance.compute_initial_values_second_part || 0;
  TB.performance.compute_initial_values_apply_array_path = TB.performance.compute_initial_values_apply_array_path || 0;
  TB.performance.compute_initial_values_apply_template_to_node = TB.performance.compute_initial_values_apply_template_to_node || 0;
  TB.performance.render_tree_get_html_templating = TB.performance.render_tree_get_html_templating || 0;

  FormNode.prototype.computeInitialValues = function (values, settings) {
    var start_time1 = Date.now();
    var self = this;

    var topDefaultArrayLevel;
    var computeValues;
    var shouldUpdateValueHistory;
    var enableDefault;

    var formData = this.ownerTree.formDesc.tpldata || {};

    if (settings) {
      shouldUpdateValueHistory = settings.shouldUpdateValueHistory !== false;
      topDefaultArrayLevel = settings.topDefaultArrayLevel;
      computeValues = settings.computeValues || false;
	    enableDefault = settings.enableDefault === undefined ? this.ownerTree.formDesc.form.enableDefault : settings.enableDefault;
    }

    if (computeValues) {
      this.children = [];
    }

    // determines the array depth
    topDefaultArrayLevel = topDefaultArrayLevel || 0;

    // Propagate the array path from the parent node
    // (adding the position of the child for nodes that are direct
    // children of array-like nodes)

    if (this.parentNode) {
      this.arrayPath = _.clone(this.parentNode.arrayPath);
      if (this.parentNode.view && this.parentNode.view.array) {
        this.arrayPath.push(this.childPos);
      }
      if (this.parentNode.objectPath.length > this.objectPath.length) {
        this.objectPath = _.clone(this.parentNode.objectPath);
      }
    } else {
      this.arrayPath = [];
      this.objectPath = [];
    }
    // Prepare special data param "idx" for templated values
    // (is is the index of the child in its wrapping array, starting
    // at 1 since that's more human-friendly than a zero-based index)
    formData.idx = (this.arrayPath.length > 0)
      ? this.arrayPath[this.arrayPath.length - 1] + 1
      : this.childPos + 1;

    // if ( this.formElement && this.formElement.__fromTemplateField ) {
    //   formData.dynamicKey = this.formElement.__dynamicKey;
    // }
    if (this.objectPath && this.objectPath.length > 0) {
      formData.dynamicKey = this.objectPath[this.objectPath.length - 1];
    }

    // Prepare special data param "value" for templated values
    formData.value = '';

    // Prepare special function to compute the value of another field
    formData.getValue = function (key) {
      return getInitialValue(
        self.ownerTree.formDesc,
        key,
        self.arrayPath,
        formData,
        !!values
      );
    };

    var start_time;
    var end_time;

    start_time = Date.now();
    TB.performance.compute_initial_values_first_part += (start_time - start_time1);

    if (this.formElement) {
      var start_time2 = Date.now();
      this.applyDynamicPathsToNodeProperties();
      var end_time2 = Date.now();
      TB.performance.compute_initial_values_apply_array_path += (end_time2 - start_time2);

      this.applyTemplateToNodeProperties(formData);
      var final_end_time2 = Date.now();
      TB.performance.compute_initial_values_apply_template_to_node += final_end_time2 - end_time2;
    }
    end_time = Date.now();
    totalInAppliyingStuffms.total += end_time - start_time;
    TB.performance.compute_initial_values_second_part += (end_time - start_time);

    // check if the form contains any values other than the private jsonformVersion and $schemaId
    var hasNonPrivateValues = false;
    _.forEach(values, function(value, key) {
        if (key !== '$schemaId' && key !== 'jsonformVersion' && key !== 'schemaId') {
          hasNonPrivateValues = true;
          return false;
        }
    });
    var end_time2 = Date.now();
    totalInAppliyingStuffms['10_has_non_private_check'] += end_time2 - end_time;

    // Case 1: simple input field
    if (this.view &&
      (this.view.inputfield || this.view.previewField) &&
      this.schemaElement) {
      // the value of fieldValue and schemaDefault is either undefined in case nothing is specified in the content/value object
      // or the value itdelf (note that null is one of the possible values)
      var begin_time_case_1 = Date.now();

      var fieldValue = this.getContentDefault(values);
      var begin_time_case_t_0_0 = Date.now();
      totalInAppliyingStuffms['211_has_input_field'] += begin_time_case_t_0_0 - begin_time_case_1;
      var schemaDefault = this.getSchemaDefault();
      var begin_time_case_t_0_1 = Date.now();
      totalInAppliyingStuffms['212_has_input_field'] += begin_time_case_t_0_1 - begin_time_case_t_0_0;
      var formDefault = this.formElement.default;
      var begin_time_case = Date.now();
      totalInAppliyingStuffms['21_has_input_field'] += begin_time_case - begin_time_case_1;

      // in case the input field is a translatable one and no value is given for the specific locale
      // we must pass it the value of the "unstranslatable" field if such is given
      var parentKey = _.dropRight(this.key.split('/')).join('/');
      var parentSchema = this.parentSchema; // tbjsonAjv2Tb.getSchemaByJsonPointer(this.ownerTree.formDesc.schema, this.formElement.key);

      var begin_time_case_t_1 = Date.now();
      totalInAppliyingStuffms['22_has_input_field'] += begin_time_case_t_1 - begin_time_case;

      // get the key & value of the field before localization (currently under the key "untranslatable")
      var keyBeforeLocalization = parentKey + '/' + this.ownerTree.formDesc.form.originalLocale;
      var valueBeforeLocalization = jfUtils.getObjByKey(values, keyBeforeLocalization);

      var begin_time_case_t_2 = Date.now();
      totalInAppliyingStuffms['23_has_input_field'] += begin_time_case_t_2 - begin_time_case_t_1;

      if (fieldValue !== undefined && fieldValue !== null) {
        this.value = fieldValue;
		this.value = jfUtils.forceValueTypes(this.ownerTree.formDesc.schema, this.schemaElement, this.value, this.key);

        if (shouldUpdateValueHistory) {
          this.updateValueHistory(this.value);
        }
      } else if (parentSchema &&
          parentSchema.isMultilanguage === true &&
          !_.isNil(valueBeforeLocalization)) {
        this.value = valueBeforeLocalization;

        if (shouldUpdateValueHistory) {
          this.updateValueHistory(this.value);
        }
      } else if (!_.isNil(schemaDefault) || !_.isNil(formDefault)) {
        // isValidDefault(this.schemaElement, schemaDefault);

        var schemaDefaultTitle = '';
        if (this.options) {
          var defValue = formDefault || schemaDefault;

          if ( _.isArray(defValue) ) {
            var schemaDefaultTitleValues = [];
            this.options.forEach(function(val) {
              if ( defValue.indexOf(val.value) > -1 ){
                schemaDefaultTitleValues.push(val.title);
              }
            });

            schemaDefaultTitle = schemaDefaultTitleValues.join(', ');
          } else {
            this.options.forEach(function(val) {
              if (val.value == defValue) {
                schemaDefaultTitle = val.title;
              }
            });
          }
        }

        if (enableDefault) {
          this.value = fieldValue || formDefault || schemaDefault;
          this.value = jfUtils.forceValueTypes(this.ownerTree.formDesc.schema, this.schemaElement, this.value, this.key);
        }

        if (_.isString(this.value)) {
          if (this.value.indexOf(regexRepalceComputeInitialValues) !== -1) {
            // This label wants to use the value of another input field.
            // Convert that construct into {{jsonform.getValue(key)}} for
            // Underscore to call the appropriate function of formData
            // when template gets called (note calling a function is not
            // exactly Mustache-friendly but is supported by Underscore).
            this.value = this.value.replace(
              REGEX.MAGIC_REGEX_2,
              '{{getValue("$1")}}');
          } else {
            // Note applying the array path probably doesn't make any sense,
            // but some geek might want to have a label "foo[]/bar[]/baz",
            // with the [] replaced by the appropriate array path.
            this.value = applyArrayPath(this.value, this.arrayPath);
          }
          if (this.value) {
            this.value = _template(this.value, formData, valueTemplateSettings);
          }
        }

        if (shouldUpdateValueHistory) {
          this.updateValueHistory(this.value);
        }

        this.defaultValue = true;
      } else if (this.parentNode.schemaElement &&
        this.parentNode.schemaElement.isMultilanguage) {

        var parentNodeValue = jfUtils.getObjByKey(values, parentKey);
        if (!_.isNil(parentNodeValue)) {
          if (parentNodeValue.constructor !== Object) {
            this.value = parentNodeValue;

            if (shouldUpdateValueHistory) {
              this.updateValueHistory(this.value);
            }
          }
        }
      } else {
        if (shouldUpdateValueHistory) {
          this.updateValueHistory(null);
        }
      }
      var begin_time_case_t_3 = Date.now();
      totalInAppliyingStuffms['24_has_input_field'] += begin_time_case_t_3 - begin_time_case_t_2;

      _.set(this.ownerTree.formDesc.value, this.key, this.value);
      var begin_time_case_t_4 = Date.now();
      totalInAppliyingStuffms['25_has_input_field'] += begin_time_case_t_4 - begin_time_case_t_3;

      var end_time_case_1 = Date.now();
      totalInAppliyingStuffms['20_has_input_field'] += end_time_case_1 - begin_time_case_1;

    // Case 2: array-like node
    } else if (this.view &&
      this.view.array) {
      var begin_time_case_2 = Date.now();

      var nbChildren = this.formElement.defaultNumberOfItems;
      if (this.formElement && this.formElement.enableAddingItems === false) {
        nbChildren = 0;
      }

      if (hasNonPrivateValues) {
        nbChildren = this.getNumberOfItems(values, this.arrayPath);
      }

      // TODO: use default values at the array level when form has not been
      // submitted before. Note it's not that easy because each value may
      // be a complex structure that needs to be pushed down the subtree.
      // The easiest way is probably to generate a "values" object and
      // compute initial values from that object
      // simplified inplementation:
      // else if (this.schemaElement['default']) {
      // nbChildren = this.schemaElement['default'].length;
      // }
      // the commented out implementation above ignores complex structures

      for (var i = 0; i < nbChildren; i++) {
        var childTemplate = this.getChildTemplate(i);
        if (i == 0) {
          childTemplate.currentCounterArray.pop();
        }

        var node = childTemplate.clone();
        if (node.children) {
          fixChildrenPrefix(node);
        }
        this.appendChildNode(node);
      }

      var end_time_case_2 = Date.now();
      totalInAppliyingStuffms['30_has_array_field'] += end_time_case_2 - begin_time_case_2;

      } else if (this.view &&
        this.view.additionalPropertiesSupport &&
        this.getChildTemplate() ) {

        var begin_time_case_2 = Date.now();

        var childTemplate = this.getChildTemplate();
        var keyBeg =  jfUtils.deduceKey(this.formElement, this.currentCounterArray.length); // deduceTopLevel(formElement.items);
        // var keyBeg =  jfUtils.deduceKey(childTemplateFormElement);

        var objectPathPattern = /^(.*?)\{\}/;
        var objectPathIdx = 0;
        var objectPath = this.objectPath;
        while(objectPathIdx < objectPath.length) {
          keyBeg = keyBeg.replace(objectPathPattern, function (match, p1) {
           return p1 + objectPath[objectPathIdx];
          });
          objectPathIdx++;
        }

        var arrayPathPattern = /^(.*)\[.*?\]/;
        var arrayPathIdx = 0;
        var arrayPath = this.arrayPath;
        while(arrayPathIdx < arrayPath.length) {
          keyBeg = keyBeg.replace(arrayPathPattern, function (match, p1) {
            return p1 + '[' + arrayPath[arrayPathIdx] + ']';
          });
          arrayPathIdx++;
        }

        var keyBegMatch = keyBeg.match(objectPathPattern);
        if ( keyBegMatch ) {
          keyBeg = keyBegMatch[1];
        }

        if ( keyBeg.endsWith('/') ) {
          keyBeg = keyBeg.slice(0, -1);
        }

        var schemaForDynamicKeys = getSchemaElement(this.ownerTree.formDesc.schema, {key:keyBeg}, this.ownerTree, this); // this.parentSchema || this.formDesc.schema; // schemaElement || this.formDesc.schema;
        // var contentForDynamicKeys = keyBeg === '' ? values : jfUtils.getObjByKey(values, keyBeg);
        var contentForDynamicKeys = keyBeg === '' ? this.ownerTree.formDesc.content : jfUtils.getObjByKey(this.ownerTree.formDesc.content, keyBeg);

        let dynamicKeys = _.keys(contentForDynamicKeys);
        if (schemaForDynamicKeys.properties) {
          _.remove(dynamicKeys, (contentKey)=>{
            return schemaForDynamicKeys.properties[contentKey]
          });
        }

        dynamicKeys.sort();
        for (var i = 0; i < dynamicKeys.length; i++) {
          var dynamicKey = dynamicKeys[i];

          
          /* from buildFromLayout
          let templateClone = _.cloneDeep(item);
          templateClone.isTemplateField = false;
          templateClone.__fromTemplateField = true;
          templateClone.__dynamicKey = dynamicKey;

          templateClone = jfUtils.replaceInKeysDeep(templateClone, '{}', dynamicKey);	

          templateClone.currentCounterArray = _.clone(node.currentCounterArray);

          if (node.type === 'section' && node.parent && node.parent.type === 'tabobject') {
            // item.currentCounterArray.push(currentCounter);
          } else {
            templateClone.currentCounterArray.push(currentCounter);
          }

          var child = this.buildFromLayout(templateClone, formElement);

          if (child) {
            node.appendChildNode(child);
          }

          currentCounter++;
          */
          this.insertObjectItem(dynamicKey);
        }

    } else if (this.schemaElement &&
      this.formElement &&
      this.formElement.type === 'tableobject' &&
      jfUtils.contains(this.schemaElement.type, 'object')) {

      // TODO REFACTOR; the core of jf should not rely on the names of plugins(tableobject)
      // Case 3: tableobject

      var begin_time_case_3 = Date.now();

      var additionalPropertiesContainer = jfUtils.getObjByKey(values, this.key);

      var sortedadditionalPropertiesContainer = [];
      var propertyKey;
      for (propertyKey in additionalPropertiesContainer) {
        if (additionalPropertiesContainer.hasOwnProperty(propertyKey)) {
          sortedadditionalPropertiesContainer.push([additionalPropertiesContainer[propertyKey], propertyKey]);
        }
      }

      sortedadditionalPropertiesContainer.sort(function (a, b) {
        if (a[0].ordering === b[0].ordering) {
          return (a[1] > b[1]) ? 1 : (a[1] < b[1]) ? -1 : 0;
        } else {
          return (a[0].ordering > b[0].ordering) ? 1 : (a[0].ordering < b[0].ordering) ? -1 : 0;
        }
      });

      for (var idx = 0; idx < sortedadditionalPropertiesContainer.length; idx++) {
        var cloneChildNode = this.children[0].clone();
        propertyKey = sortedadditionalPropertiesContainer[idx][1];

        for (var j = 0; j < cloneChildNode.formElement.items.length; j++) {
          var tableRowItem = cloneChildNode.formElement.items[j];
          tableRowItem.key = replaceCurlyBracesWithData(tableRowItem.key, propertyKey);

          var inputField = cloneChildNode.children[j];
          setDataToField(inputField, propertyKey);

          cloneChildNode.children[j] = inputField;
          cloneChildNode.formElement.items[j] = tableRowItem;
        }

        this.appendChildNode(cloneChildNode);
      }

      this.children.splice(0, 1);

      var end_time_case_3 = Date.now();
      totalInAppliyingStuffms['40_tableobject'] += end_time_case_3 - begin_time_case_3;

    }

    var begin_time_contains = Date.now();
    if (this.schemaElement &&
      jfUtils.contains(this.schemaElement.type, 'boolean') &&
      this.formElement &&
      this.ownerTree.formDesc.form.nullValueTitle &&
      (this.value === undefined || this.value === null)) {
      appendNullOptionIfNotDefined(this.schemaElement, this.formElement, this.ownerTree.formDesc.form.nullValueTitle);
    }
    var end_time_contains = Date.now();
    totalInAppliyingStuffms['50_contains'] += end_time_contains - begin_time_contains;

    var begin_time_rec = Date.now();
    // recurse through the list of children
    for (var i = 0; i < this.children.length; i++) {
      var child = this.children[i];
      child.computeInitialValues(
        values, {
          enableDefault: enableDefault,
          topDefaultArrayLevel: topDefaultArrayLevel
        }
      );
    }
    var end_time_rec = Date.now();
    totalInAppliyingStuffms['60_compute_rec'] = end_time_rec - begin_time_rec;
    var begin_time_value_in_legend = Date.now();

    // If the node's value is to be used as legend for its "container"
    // (typically the array the node belongs to), ensure that the container
    // has a direct link to the node for the corresponding tab.
    if (this.formElement
      && this.formElement.valueInLegend) {

      var isInputField = jsonform.elementTypes[this.formElement.type].inputfield;

      if ( this.formElement.type !== 'preview' ) {
        ASSERT(isInputField, 'Only input fields can have valueInLegend');
      }

      var node = this;

      while (node) {
        if (node.parentNode &&
          node.parentNode.view &&
          (node.parentNode.view.array || true)) {
          node.legendChild = this;

          if (node.formElement &&
            node.formElement.legend) {
            // This whole code is for the legend to be refilled (the named keys to be replaced!)

            node.legend = applyArrayPath(node.formElement.legend, node.arrayPath);

            formData.idx = (node.arrayPath.length > 0)
              ? node.arrayPath[node.arrayPath.length - 1] + 1
              : node.childPos + 1;

            formData.value = !_.isNil(this.value)
              ? this.value
              : '';

            node.legend = _template(node.legend, _.merge(formData, this.ownerTree.formDesc.value, node.ownerTree.formDesc.currentValue), valueTemplateSettings);

            break;
          }
        }

        node = node.parentNode;
      }
    }

    var end_time_value_in_legend = Date.now();
    totalInAppliyingStuffms['70_value_in_legend'] = end_time_value_in_legend - begin_time_value_in_legend;
  };

  /**
   * Returns the structured object that corresponds to the form values entered
   * by the user for the node's subtree.
   *
   * The returned object follows the structure of the JSON schema that gave
   * birth to the form.
   *
   * Obviously, the node must have been rendered before that function may
   * be called.
   *
   * @function
   * @param {Array(Number)} updateArrayPath Array path to use to pretend that
   *  the entered values were actually entered for another item in an array
   *  (this is used to move values around when an item is inserted/removed/moved
   *  in an array)
   * @return {Object} The object that follows the data schema and matches the
   *  values entered by the user.
   */
  FormNode.prototype.getFormValues = function (updateArrayPath, tree) {
    ASSERT(
      this.el,
      {msg: 'FormNode.getFormValues can\'t be called on nodes not associated with the tree', code: 3000}
    );

    var domElement = this.el;
    // The values object that will be returned
    var values = {};
    // Form fields values
    var formArray = getArrayFieldValueHtml(domElement, tree || this.ownerTree);

    if (updateArrayPath) {
      _.each(formArray, function (param) {
        param.origName = param.name
        param.name = applyArrayPath(param.name, updateArrayPath);
      });
    }

    // after the form values are gathered they are mostly strings
    // coercion is handled in part by ajv, however some cases are dealt with in the following array
    for (var i = 0; i < formArray.length; i++) {
      //todo: fix this???
      if (!formArray[i].name) { continue; }
      ASSERT_USER(formArray[i].name, {msg: 'Unknown field name', code: 3030});

      var name = formArray[i].name;
      var eltNode = this.ownerTree.keyToNode[formArray[i].origName || formArray[i].name];
      if ( ! eltNode ) {
        continue;
      }

      var eltSchema = eltNode.schemaElement; //tbjsonAjv2Tb.getSchemaByJsonPointer( this.ownerTree.formDesc.schema, name )

      // name = tbjsonAjv2Tb.generateEscapedKey(name);
      // var eltSchema = _.get(this.ownerTree.formDesc.schema, name);

      if (!eltSchema) {
        continue;
      }

      if (jfUtils.getJsonType(formArray[i]) === 'string') {
        formArray[i].value = _.trim(formArray[i].value);
      }

      if ( ! _.get(window, 'TB.jfpage.state.disableValidation') ) {
       formArray[i].value = jfUtils.forceValueTypes(this.ownerTree.formDesc.schema, eltSchema, formArray[i].value, name, formArray[i].anyOfIds, this, this.formElement);
       // formArray[i].value = jfUtils.forceValueTypes(this.ownerTree.formDesc.schema, eltSchema, formArray[i].value, name, undefined, this, this.formElement);
      }

      if (formArray[i].name) {
        jfUtils.setObjValueByKey(values, formArray[i].name, formArray[i].value);
      }
    }

    // TODO @momo - make delete soemthing else because its slow ...
    if (tree && tree.removeFieldsFromForm) {
      for (var key in tree.removeFieldsFromForm) {
        var obj = jfUtils.getObjByKey(values, key);
        for (var i = 0; i < tree.removeFieldsFromForm[key].length; i++) {
          delete obj[tree.removeFieldsFromForm[key][i]];
        }
      }
    }


    return values;
  };

  FormNode.prototype.getErrors = function() {
      
    if ( _.get(window, 'TB.jfpage.state.disableValidation') ){
      return false;
    }

    if (this.view.getErrors) {
      return this.view.getErrors(this);
    }

    var errors = [];
    for (var child of this.children) {
      var childErrors = child.getErrors();
      if (childErrors) {
        errors.push(...childErrors);
      }
    }
    return errors.length > 0 ? errors : false;
  }

  /**
   * Resets all DOM values in the node's subtree.
   *
   * This operation also drops all array item nodes.
   * Note values are not reset to their default values, they are rather removed!
   *
   * @function
   */
  FormNode.prototype.resetValues = function () {
    var params = null;

    // Reset value
    this.value = null;

    // Propagate the array path from the parent node
    // (adding the position of the child for nodes that are direct
    // children of array-like nodes)
    if (this.parentNode) {
      this.arrayPath = _.clone(this.parentNode.arrayPath);

      if (this.parentNode.view &&
        this.parentNode.view.array) {
        this.arrayPath.push(this.childPos);
      }
    } else {
      this.arrayPath = [];
    }

    if (this.view &&
      this.view.inputfield) {
      // Simple input field, extract the value from the origin,
      // set the target value and reset the origin value

      if (this.el) {
        params = $(':input', this.el).serializeArray();
        _.each(params, function (param) {
          // TODO: check this, there may exist corner cases with this approach
          // (with multiple checkboxes for instance)
          var el = $('[name="' + jfUtils.escapeSelector(param.name) + '"]', $(this.el));
          el.val('');
        }.bind(this));
      }
    } else if (this.view &&
      this.view.array) {
      // The current node is an array, drop all children
      while (this.children.length > 0) {
        this.removeChild();
      }
    }

    // Recurse down the tree
    _.each(this.children, function (child) {
      child.resetValues();
    });
  };

  /**
   * Moves the user entered values set in the current node's subtree to the
   * given node's subtree.
   *
   * The target node must follow the same structure as the current node
   * (typically, they should have been generated from the same node template)
   *
   * The current node MUST be rendered in the DOM.
   *
   * TODO: when current node is not in the DOM, extract values from FormNode.value
   * properties, so that the function be available even when current node is not
   * in the DOM.
   *
   * Moving values around allows to insert/remove array items at arbitrary
   * positions.
   *
   * @function
   * @param {FormNode} node Target node.
   */
  FormNode.prototype.moveValuesToNode = function (node) {
    var values = this.getFormValues(node.arrayPath);
    node.resetValues();

    node.computeInitialValues(
      values, {
        enableDefault: false
      });
  };

  /**
   * Switches nodes user entered values.
   *
   * The target node must follow the same structure as the current node
   * (typically, they should have been generated from the same node template)
   *
   * Both nodes MUST be rendered in the DOM.
   *
   * TODO: update getFormValues to work even if node is not rendered, using
   * FormNode's "value" property.
   *
   * @function
   * @param {FormNode} node Target node
   */
  FormNode.prototype.switchValuesWithNode = function (node) {
    var currentNodeValues = this.getFormValues(node.arrayPath);
    var substituteNodeValues = node.getFormValues(this.arrayPath);

    node.resetValues();
    this.resetValues();

    node.computeInitialValues(
      currentNodeValues, {
        enableDefault: false
      });

    this.computeInitialValues(
      substituteNodeValues, {
        enableDefault: true
      });
  };

  FormNode.prototype.validate = function (value) {
    var validationValue = constructObjectByKey(
      this.formElement.key,
      value
    );

    var self = $(this.ownerTree.domRoot);
    var formTree = self.data('tbJfTree') || self.data('tb-jf-tree') || self.data('jfFormTree');

    var values = jsonform.getFormValue(self);
    var files = jsonform.getFormFiles(self);

    var selectFieldSetData = formTree.selectFieldSetData;
    if (selectFieldSetData) {
      for (var i = 0; i < selectFieldSetData.length; i++) {
        var key = selectFieldSetData[i];
        removeFromContent(formTree.formDesc.content, key);
      }
    }
    var merged = mergeContentAndFormValues(formTree.formDesc.content, values, formTree.formDesc.schema, formTree.formDesc.form);
    jfUtils.removeKeysWithForwardSlash(merged);


    var currentAndParentFormKeys = [];
    var keys = this.formElement.key.split('/');
    var fullKey = '';
    for (var i = 0; i < keys.length; i++) {
      fullKey += keys[i];
      currentAndParentFormKeys.push(fullKey);
      fullKey += '/';
    }
    currentAndParentFormKeys = currentAndParentFormKeys.map(function(item){ return {dataPath: item} });


    $(this.ownerTree).jsonFormClearErrors(currentAndParentFormKeys, {
      scrollIntoView: false,
    });

    this.ownerTree.validate({
      values: merged,
      clearOldErrors: false,
      scrollIntoView: false,
      showErrorsFor: [this.formElement.key.split('/')[0]],
    });
  };

  /**
   * Returns true if the subtree that starts at the current node
   * has some non empty value attached to it
   */
  FormNode.prototype.hasNonDefaultValue = function () {
    // hidden elements don't count because they could make the wrong selectfieldset element active
    if (this.formElement && this.formElement.type === 'hidden') {
      return false;
    }

    if (this.value && !this.defaultValue) {
      return true;
    }
    var child = _.find(this.children, function (child) {
      return child.hasNonDefaultValue();
    });
    return !!child;
  };

  FormNode.prototype.activateValueHistoryEventHandlers = function () {
    if (this.formElement.enableReset || this.formElement.enableUndo || this.formElement.enableRedo) {
      var self = this;
      var valueControls = $(this.el).find('> .controls > .tb-jf-value-history-buttons');

      if (this.formElement.enableReset) {
        var resetButton = valueControls.find('> .tb-jf-value-history-reset');

        ASSERT(resetButton, {msg: 'The reset button for schema element $FORMKEY$ did not render properly.', msgParams: {FORMKEY: this.formElement.key}, code: 3040});

        resetButton.bind('click', function (evt) {
          self.setValueHistoryAbsPos(0);
        });
      }

      if (this.formElement.enableUndo) {
        var undoButton = valueControls.find('> .tb-jf-value-history-undo');

        ASSERT(undoButton, {msg: 'The undo button for schema element $FORMKEY$ did not render properly', msgParams: {FORMKEY: this.formElement.key}, code: 3050});

        undoButton.bind('click', function (evt) {
          self.setValueHistoryRelPos(-1);
        });
      }

      if (this.formElement.enableRedo) {
        var redoButton = valueControls.find('> .tb-jf-value-history-redo');

        ASSERT(redoButton, {msg: 'The redo button for schema element $FORMKEY$ did not render properly', msgParams: {FORMKEY: this.formElement.key}, code: 3060});

        redoButton.bind('click', function (evt) {
          self.setValueHistoryRelPos(1);
        });
      }
    }
  };

  /**
   * Updates the valueHistory array every time a change event is fired
   * on any of the input controls.
   *
   * The function is also responsible for marking input controls as dirty
   * in case their value is different than the one they were initialized with.
   *
   * @function
   * @param {Any} value the new value which will be pushed to valueHistory
   * @param {boolean} when set to false the new values are not validated
   */
  FormNode.prototype.updateValueHistory = function (value, validate) {
    if (value === undefined) {
      value = null;
    }

    // if valueHistory is empty record the current value
    // else if it is an object compare the current and last objects by value (not reference)
    // finally if the value is scalar simply compare if it is equal to the last one
    if (this.valueHistory.length === 0 ||
      (typeof this.valueHistory[this.valueHistory.length - 1] === 'object' &&
        !_.isEqual(value, this.valueHistory[this.valueHistory.length - 1])) ||
      (typeof this.valueHistory[this.valueHistory.length - 1] !== 'object' &&
        value !== this.valueHistory[this.valueHistory.length - 1])) {
      this.activeValueHistoryIdx = this.valueHistory.push(value) - 1;
    }

    if (validate && jsonform.formTree.formDesc.form.liveValidation) {
      this.validate(value, true);
    }

    ASSERT(this.valueHistory.length >= 1, {msg: 'No value given.', code: 3070});
    var element = $(this.el);

    if (this.valueHistory.length === 1) {
      element.addClass('tb-jf-original-value');
    } else {
      element.addClass('tb-jf-dirty-value');

      if (this.valueHistory[0] === value) {
        element.addClass('tb-jf-original-value');
      } else {
        element.removeClass('tb-jf-original-value');
      }
    }
    if (!this.ownerTree.isAlreadyTriggeredChange)
    {
      setTimeout(function() {
        $(this.ownerTree.domRoot).trigger('jsonformsChange');
        this.ownerTree.isAlreadyTriggeredChange = false;
      }.bind(this));
      this.ownerTree.isAlreadyTriggeredChange = true;
    }

    // Stolen from the rc, where it can have a problem to trigger an event on a DOM that is not real
    //$(this.ownerTree.domRoot).trigger('jsonformsChange');
  };

  /**
   * Set the value of a field to a historical value contained in valueHistory
   *
   * @param {number} position the array index of the desired value in valueHistory
   *
   * valueHistory: [1,2,3,4,5]
   * setValueHistoryAbsPos(0) => 1
   * setValueHistoryAbsPos(-1) => 5
   * setValueHistoryAbsPos(2) => 3
   */
  FormNode.prototype.setValueHistoryAbsPos = function (position) {
    ASSERT(_.isInteger(position), {code: 3080, msg: 'setValueHistoryPos: position must be an integer for key $FORMKEY$.', msgParams: {FORMKEY: this.formElement.key}});

    var historicalValue = null;
    var historicalPosition = position;
    var historyMaxIdx = this.valueHistory.length - 1;

    if (historicalPosition < 0) {
      // 1 is added so that setValueHistoryAbsPos(-1) returns the last value not the second to last
      historicalPosition++;

      if (Math.abs(historicalPosition) > historyMaxIdx) {
        historicalPosition = 0;
      } else {
        historicalPosition = historyMaxIdx + historicalPosition;
      }
    } else if (historicalPosition > historyMaxIdx) {
      historicalPosition = historyMaxIdx;
    }

    this.activeValueHistoryIdx = historicalPosition;
    historicalValue = this.valueHistory[historicalPosition];

    var values = constructObjectByKey(
      this.formElement.key,
      historicalValue
    );

    this.computeInitialValues(
      values, {
        enableDefault: false,
        shouldUpdateValueHistory: false
      });

    this.shouldEnhanceFunc();

    console.info("Calling Render 10: from the FormNode.setValueHistoryAbsPos method");
    this.render();
  };

  /**
   * Set the value of a field to a historical value contained in valueHistory
   * according to the position of the currently visible valueHistory index
   *
   * @param {number} position the array index of the desired value in valueHistory
   *
   * valueHistory: [1,2,3,4,5] (stays constant through the following examples)
   * (setValueHistoryRelPos(0), activeValueHistoryIdx: 4) => 5, activeValueHistoryIdx: 4
   * (setValueHistoryRelPos(-1), activeValueHistoryIdx: 4) => 4, activeValueHistoryIdx: 3
   * (setValueHistoryRelPos(-1), activeValueHistoryIdx: 3) => 3, activeValueHistoryIdx: 2
   * (setValueHistoryRelPos(2), activeValueHistoryIdx: 2) => 5, activeValueHistoryIdx: 4
   */
  FormNode.prototype.setValueHistoryRelPos = function (position) {
    ASSERT(_.isInteger(position), {msg: 'setValueHistoryPos: position must be an integer for key $KEY$.', msgParams: {KEY: this.formElement.key}, code: 3090});

    var historicalValue = null;
    var historicalPosition = this.activeValueHistoryIdx + position;
    var historyMaxIdx = this.valueHistory.length - 1;

    if (historicalPosition < 0) {
      historicalPosition = 0;
    } else if (historicalPosition > historyMaxIdx) {
      historicalPosition = historyMaxIdx;
    }


    this.activeValueHistoryIdx = historicalPosition;
    historicalValue = this.valueHistory[historicalPosition];

    var values = constructObjectByKey(
      this.formElement.key,
      historicalValue
    );

    this.computeInitialValues(values, {
      enableDefault: false,
      shouldUpdateValueHistory: false

    });

    console.info("Calling Render 11: from the FormNode.setValueHistoryRelPos method");
    this.render(this.el);
  };

  /**
   * Clones a node
   *
   * @function
   * @param {FormNode} New parent node to attach the node to
   * @return {FormNode} Cloned node
   */
  FormNode.prototype.clone = function (parentNode) {
    this.currentClone = this.currentClone || 1;

    var parentCurrentCounterArray = _.clone(this.currentCounterArray);
    parentCurrentCounterArray.push(this.currentClone);


    var node = new FormNode();
    node.currentCounterArray = parentCurrentCounterArray;
    node.childPos = this.childPos;
    node.arrayPath = _.clone(this.arrayPath);
    node.ownerTree = this.ownerTree;
    node.parentNode = parentNode || this.parentNode;
    node.formElement = _.clone(this.formElement);
    node.schemaElement = this.schemaElement;
    node.view = this.view;
    node.children = _.map(this.children, function (child) {
      return child.clone(node);
    });
    /*  if (this.childTemplate) {
      node.childTemplate = this.childTemplate.clone(node);
    } */

    this.currentClone += 1;
    node.currentClone = this.currentClone;
    return node;
  };

  /**
   * Searches among the children of the current node for
   * elements of a specified key. The search is 1 level deep.
   *
   * getChildNodeByKey('age') => age node
   *
   * @param  {string} key of child element
   * @return {FormNode} child element corresponding to the given key
   */
  FormNode.prototype.getChildNodeByKey = function (key, shouldDie) {
    ASSERT.isString(key, {msg: 'getChildNodeByKey expected key to be a string.', code: 3100});

    shouldDie = _.isUndefined(shouldDie) ? true : shouldDie;

    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].key &&
        key === getInnermostJsonPathKey(this.children[i].key)) {
        return this.children[i];
      }
    }

    ASSERT(!shouldDie, {msg: 'getChildNodeByKey: a node with the given path does not exist.', code: 3110});
  };

  /**
   * Searches among the children of the current node for
   * elements of a specified keyPath.
   *
   * getChildNodeByKeyPath('person/friends[]') => friends node
   *
   * @param  {string} key of child element
   * @return {FormNode} child element corresponding to the given key
   */
  FormNode.prototype.getChildNodeByKeyPath = function (keyPath, shouldDie) {
    shouldDie = _.isUndefined(shouldDie) ? true : shouldDie;

    ASSERT.isString(keyPath, {msg: 'getNodeByKey expected key to be a string.', code: 3120});

    var childNodeKeys = convertJsonPathStringToArray(keyPath);
    var node = this.getChildNodeByKey(childNodeKeys[0], shouldDie);
    if (node === undefined) return;

    for (var i = 1; i < childNodeKeys.length; i++) {
      if ( node === undefined ) {
        // some shit like _JF_content_version etc.
        return node;
      }
      node = node.getChildNodeByKey(childNodeKeys[i], shouldDie);
    }

    return node;
  };

  /**
   * Returns a property value of node, optional look for in parents chain
   *
   * @function
   * @param {String} prop Property name for looking
   * @param {Boolean} searchInParents Search the property in parents chain if not found in current node
   * @return {Any} The property value
   */
  FormNode.prototype.getProperty = function (prop, searchInParents) {
    var value = this[prop];

    if (value !== undefined || !searchInParents || !this.parentNode) {
      return value;
    }

    return this.parentNode.getProperty(prop, true);
  };

  FormNode.prototype.isReadOnly = function () {
    if (_.get(this, 'ownerTree.formDesc.form.preview') === true) {
      return true;
    }

    return this.getProperty('readOnly', true);
  };

  function generateTopLevelItemsFromSchema(node, formElement, schemaElement) {
    ASSERT(schemaElement.items, {msg: `Array schema element ${schemaElement} is missing property "items".`, code: 3210, msgParams: { schemaElement } }); 

    let items = [];

    if ( schemaElement.items.type === 'object' ) {
      ASSERT(schemaElement.items.properties, {msg: `Array schema element with items of type "object" is missing property "items.properties".`, code: 3220, msgParams: { schemaElement }});

      for ( const schemaItemProperty in schemaElement.items.properties ) {
        let item = { key: `${formElement.key}[]/${schemaItemProperty}` };
        items.push(item);
      }

    } else {
      let item = { key: `${formElement.key}[]` };
      items.push(item);  
    }

    let currentCounter = 1;
    for ( let item of items ) {
      item.currentCounterArray = _.clone(node.currentCounterArray);
      item.currentCounterArray.push(currentCounter);

      currentCounter++;
    }

    return items;
  }

  /**
   * Gets the child template node for the current node.
   *
   * The child template node is used to create additional children
   * in an array-like form element. We delay create it when first use.
   *
   * @function
   * @param {FormNode} node The child template node to set
   */
    FormNode.prototype.getChildTemplate = function (currIdx, dynamicKey) {
    currIdx = currIdx || 1;
    if (!this.childTemplate) {
      if (this.view.array || (this.formElement.type && this.formElement.type === 'checkboxes')) {

        let childFormElementTemplate = this.formElement.items[0] || this.formElement.items;
        if ( ! this.formElement.key ) {

          var deducedKey = jfUtils.deduceKey(this.formElement);
          ASSERT(deducedKey != null);

          let reg = /(.*)\[\]/;
          let strippedDeducedKeyMatch = deducedKey.match(reg);
          let strippedDeducedKey = strippedDeducedKeyMatch && strippedDeducedKeyMatch[1];

          if ( strippedDeducedKey ) {
            this.key = strippedDeducedKey;
            this.formElement.key = strippedDeducedKey;
          }
          this.ownerTree.keyToNode[this.key] = this;
          this.schemaElement = getSchemaElement(this.schemaElement, this.formElement, this.ownerTree, this);
        }

        // construct a valid json if just a key string is defined
        if ( _.isString(childFormElementTemplate) ) {
          childFormElementTemplate = {
            key: child
          };
        }

        childFormElementTemplate.currentCounterArray = _.clone(this.currentCounterArray);
        childFormElementTemplate.currentCounterArray.push(currIdx);

        var childNodeTemplate = this.ownerTree.buildFromLayout(childFormElementTemplate, this.formElement);

        if (childNodeTemplate) {
          this.setChildTemplate(childNodeTemplate);
        }

      } else if ( this.view.additionalPropertiesSupport ) {
        var templateFormElement = _.find(this.formElement && this.formElement.items, function (child) {
          return child.isTemplateField;
        });

        if ( templateFormElement ) {
          var templateFormElementClone = _.cloneDeep(templateFormElement);
          templateFormElementClone.isTemplateField = false;

          var child = this.ownerTree.buildFromLayout(templateFormElementClone, this.formElement);
          if (child) {
            child.objectPath = _.clone(this.objectPath) || [];
            this.setChildTemplate(child);
          }
        }
      }
    }

    return this.childTemplate;
  };

  FormNode.prototype.arrayHasMoreThanOneItemInside = function () {
    return this.formElement.items && this.formElement.items.length > 1;
  }



  /**
   * Sets the child template node for the current node.
   *
   * The child template node is used to create additional children
   * in an array-like form element. The template is never rendered.
   *
   * @function
   * @param {FormNode} node The child template node to set
   */
  FormNode.prototype.setChildTemplate = function (node) {
    this.childTemplate = node;
    node.parentNode = this;
  };

    FormNode.prototype.applyDynamicPathsToNodeProperties = function () {
    if (this.formElement.id) {
      this.id = jfUtils.escapeSelector(this.ownerTree.formDesc.form.prefix);
      if (this.view.hasOwnProperty('inputfield') && this.view.inputfield) {
        this.id += '-field-id-';
      } else {
        this.id += '-container-id-';
      }
      this.id += jfUtils.escapeId(applyArrayPath(this.formElement.id, this.arrayPath));
    } else if (this.view &&
        this.view.array) {
      this.id = jfUtils.escapeSelector(this.ownerTree.formDesc.form.prefix) +
        '-elt-counter-' +
        _.uniqueId();
    } else if (this.parentNode &&
        this.parentNode.view &&
        this.parentNode.view.array) {
      // Array items need an array to associate the right DOM element
      // to the form node when the parent is rendered.
      this.id = jfUtils.escapeSelector(this.ownerTree.formDesc.form.prefix) +
        '-elt-counter-' +
        _.uniqueId();
    } else if ((this.formElement.type === 'button') ||
        (this.formElement.type === 'selectfieldset') ||
        (this.formElement.type === 'tabobject') ||
        (this.formElement.type === 'question') ||
        (this.formElement.type === 'buttonquestion')) {
      // Buttons do need an id for "onClick" purpose
      this.id = jfUtils.escapeSelector(this.ownerTree.formDesc.form.prefix) +
        '-elt-counter-' +
        _.uniqueId();
    }

    // Compute the actual key (the form element's key is index-free,
    // i.e. it looks like foo[]/bar/baz[]/truc, so we need to apply
    // the array path of the node to get foo[4]/bar/baz[2]/truc)
    if (this.formElement.key) {
      this.key = applyArrayPath(this.formElement.key, this.arrayPath);
        this.key = applyObjectPath(this.key, this.objectPath);
      this.selectorKey = jfUtils.escapeId(this.key);
    }

    // Same idea for the field's name
    this.name = applyArrayPath(this.formElement.name, this.arrayPath);
      this.name = applyObjectPath(this.name, this.objectPath);
    if ( this.name ) {
      var replacedKey = this.name.replace(/\[(\d+?)\]/g, '/$1');

      this.ownerTree.keyToNode[ this.name ] = this;
      this.ownerTree.keyToNode[ replacedKey ] = this;
    }

    if ( this.formElement.id) {
      this.formElement.id = applyArrayPath(this.formElement.id, this.arrayPath);
      this.formElement.id = applyObjectPath(this.formElement.id, this.objectPath);
      
      var replacedId = this.formElement.id.replace(/\[(\d+?)\]/g, '/$1');

      this.ownerTree.keyIdToNode[ replacedId ] = this;
    }
  };

  TB.performance.compute_initial_values_apply_template_to_node_first_step = TB.performance.compute_initial_values_apply_template_to_node_first_step || 0;
  TB.performance.compute_initial_values_apply_template_to_node_second_step = TB.performance.compute_initial_values_apply_template_to_node_second_step || 0;
  TB.performance.compute_initial_values_apply_template_to_node_third_step = TB.performance.compute_initial_values_apply_template_to_node_third_step || 0;
  TB.performance.compute_initial_values_apply_template_to_node_third_step_some_regex = TB.performance.compute_initial_values_apply_template_to_node_third_step_some_regex || 0;
  TB.performance.compute_initial_values_apply_template_to_node_third_step_some_extend = TB.performance.compute_initial_values_apply_template_to_node_third_step_some_extend || 0;
  TB.performance.compute_initial_values_apply_template_to_node_third_step_some_templating = TB.performance.compute_initial_values_apply_template_to_node_third_step_some_templating || 0;


  FormNode.prototype.applyTemplateToNodeProperties = function (formData) {
    // Consider that label values are template values and apply the
    // form's data appropriately (note we also apply the array path
    // although that probably doesn't make much sense for labels...)
    var end;

    var begin = Date.now();
    for (var key in formData) {
      if (this.ownerTree.computeInitialValuesCacheForFullData[key] === undefined) {
        this.ownerTree.computeInitialValuesCacheForFullData[key] = formData[key];
      }
    }

    var curr;
    if (this.ownerTree.formDesc.tpldata) {
      curr = _.merge(formData, this.ownerTree.computeInitialValuesCacheForFullData);
    } else {
      curr = this.ownerTree.computeInitialValuesCacheForFullData;
      curr.idx = formData.idx;
      curr.value = formData.value;
        curr.dynamicKey = formData.dynamicKey;
    }

    var end_mid_1 = Date.now();
    totalInAppliyingStuffms.merge_formdata_and_computecache += end_mid_1 - begin;
    TB.performance.compute_initial_values_apply_template_to_node_first_step += end_mid_1 - begin;

    _.each([
      'title',
      'legend',
      'description',
      'append',
      'prepend',
      'helpvalue',
      'value',
      'disabled',
      'required',
      'placeholder',
      'readOnly'
    ], function (prop) {
      if (typeof this.formElement[prop] === 'string') {
        // This label wants to use the value of another input field.
        // Convert that construct into {{jsonform.getValue(key)}} for
        // lodash to call the appropriate function of formData
        // when template gets called (note calling a function is not
        // exactly Mustache-friendly but is supported by lodash).
        var begin3 = Date.now();
        if (this.formElement[prop].indexOf(regexRepalceComputeInitialValues) !== -1) {
          var begin2 = Date.now();
          this[prop] = this.formElement[prop].replace(
            REGEX.MAGIC_REGEX_2,
            '{{getValue("$1")}}');
          var end2 = Date.now();
          totalInAppliyingStuffms.scary_regex += end2 - begin2;

          // Note applying the array path probably doesn't make any sense,
          // but some geek might want to have a label "foo[]/bar[]/baz",
	      // with the [] replaced by the appropriate array path.
        } else {
          var begin2 = Date.now();
          this[prop] = applyArrayPath(this.formElement[prop], this.arrayPath);
          var end2 = Date.now();
          totalInAppliyingStuffms.scary_regex_else += end2 - begin2;
        }
        var end3 = Date.now();
        totalInAppliyingStuffms.first_iff += end3 - begin3;

        if (this[prop] && this[prop].indexOf('{{') !== -1) {
          var begin2 = Date.now();
          this[prop] = _template(this[prop], curr, valueTemplateSettings);
          var end2 = Date.now();

          totalInAppliyingStuffms.templating += end2 - begin2;
        }
      } else {
        this[prop] = this.formElement[prop];
      }
    }.bind(this));
    var end_mid_2 = Date.now();
    TB.performance.compute_initial_values_apply_template_to_node_second_step += end_mid_2 - end_mid_1;
    totalInAppliyingStuffms.first_regex += end_mid_2 - begin;


    begin = Date.now();

    // Apply templating to options created with "titleMap" as well
    if (this.formElement.options) {
      this.options = _.map(this.formElement.options, function (option) {
        var title = null;
        if (_.isObject(option) && option.title !== undefined) {
          if (option.value === undefined && option.id !== undefined) {
            option.value = option.id;
          }

          var someRegexTimeBegin = Date.now();
          // See a few lines above for more details about templating
          // preparation here.
          if (option.title.indexOf(regexRepalceComputeInitialValues) !== -1) {
            title = option.title.replace(
              REGEX.MAGIC_REGEX_2,
              '{{getValue("$1")}}');
          } else {
            title = applyArrayPath(option.title, self.arrayPath);
          }
          var someRegexTimeEnd = Date.now();
          TB.performance.compute_initial_values_apply_template_to_node_third_step_some_regex += (someRegexTimeEnd - someRegexTimeBegin);

          var template = title;
          if (template && template.indexOf('{') > -1) {
            // __might__ be template
            template = _template(title, formData, valueTemplateSettings);
          }

          var computeTemplateTime = Date.now();
          TB.performance.compute_initial_values_apply_template_to_node_third_step_some_templating += (computeTemplateTime - someRegexTimeEnd);

          var res =  _.extend({}, option, {
            value: (!_.isNil(option.value) ? option.value : ''),
            title: template,
          });
          var someExtendTimeEnd = Date.now();
          TB.performance.compute_initial_values_apply_template_to_node_third_step_some_extend += (someExtendTimeEnd - computeTemplateTime);

          return res;
        } else {
          return option;
        }
      });
    }
    end = Date.now();

    TB.performance.compute_initial_values_apply_template_to_node_third_step += end - begin;
  };

  /**
   * Attaches a child node to the current node.
   *
   * The child node is appended to the end of the list.
   *
   * @function
   * @param {FormNode} node The child node to append
   * @return {FormNode} The inserted node (same as the one given as parameter)
   */
  FormNode.prototype.appendChildNode = function (node) {
    node.parentNode = this;
    node.childPos = this.children.length;
    this.children.push(node);

    return node;
  };

  /**
   * Removes the last child of the node.
   *
   * @function
   */
  FormNode.prototype.removeChild = function () {
    var child = this.children[this.children.length - 1];
    if (!child) {
      return;
    }

    // Remove the child from the DOM
    $(child.el).remove();
/*
    child.shouldEnhanceFunc();
    console.info("Calling Render 12: from the FormNode.removeChild method");
    child.render(); // TODO marti - why is this called??
*/
    // Remove the child from the array
    this.children.pop();
  };

  /**
   * Returns the number of items that the array node should have based on
   * the values/content object.
   *
   * The difficulty is that values may be hidden deep in the subtree
   * of the node and may actually target different arrays in the JSON schema.
   *
   * @function
   * @param {Object} values Previously submitted values
   * @param {Array(Number)} arrayPath the array path we're interested in
   * @return {Number} The number of items in the array
   */
  FormNode.prototype.getNumberOfItems = function (values, arrayPath) {
    var key = null;
    var arrayValue = null;
    var childNumbers = null;

    if (!values) {
      // No previously submitted values, no need to go any further
      return 0;
    }

    // Case 1: node is a simple input field that links to a key in the schema.
    // The schema key looks typically like:
    //  foo/bar[]/baz/toto[]/truc[]/bidule
    // The goal is to apply the array path and truncate the key to the last
    // array we're interested in, e.g. with an arrayPath [4, 2]:
    //  foo/bar[4]/baz/toto[2]

    if (this.view.inputfield && this.schemaElement) {
      key = truncateToArrayDepth(this.formElement.key, arrayPath.length);
      key = applyArrayPath(key, arrayPath);

      arrayValue = jfUtils.getObjByKey(values, key);
      if (!arrayValue) {
        // No key? That means this field had been left empty
        // in previous submit
        return 0;
      }
      childNumbers = _.map(this.children, function (child) {
        return child.getNumberOfItems(values, arrayPath);
      });

      return _.max([_.max(childNumbers) || 0, arrayValue.length]);
    } else if (this.schemaElement && jfUtils.contains(this.schemaElement.type, 'object') &&
        !this.view.containerField) {
       // Case 2: the node is an object!
        // Ask Ivo about this check, if it's not there, the array goes in, but it should go to the else clause (case4)
      var object = jfUtils.getObjByKey(values, this.key);
      var numberOfItems = 0;
      for (key in object) {
        if (object.hasOwnProperty(key)) {
          numberOfItems += 1;
        }
      }
      return numberOfItems;
    } else if (this.view.array) {
      // Case 3: node is an array-like node, look for input fields
      // in its child template
      return this.getChildTemplate().getNumberOfItems(values, arrayPath);
    } else {
      // Case 4: node is a leaf or a container,
      // recurse through the list of children and return the maximum
      // number of items found in each subtree
      childNumbers = _.map(this.children, function (child) {
        return child.getNumberOfItems(values, arrayPath);
      });

      return _.max(childNumbers) || 0;
    }
  };

  var fixChildrenPrefix = function (node) {
    var stack = _.clone(node.children);

    while(stack.length) {
      var currEl = stack.pop();

      for (var k = 0; k < node.currentCounterArray.length; k++) {
        currEl.currentCounterArray[k] = node.currentCounterArray[k];
      }

      if (currEl.children) {
        for (var i = 0; i < currEl.children.length; i++) {
          stack.push(currEl.children[i]);
        }
      }

      currEl.currentCounterArray.pop();
    }
  };

  /**
   * Inserts an item in the array at the requested position and renders the item.
   *
   * @function
   * @param {Number} idx Insertion index
   */
  FormNode.prototype.insertArrayItem = function (idx, domElement, skipRender) {
    ASSERT.isNumberOrNil(idx, {msg: 'insertArrayItem expected array index to be a number', code: 3130});

    var i = 0;

    // Insert element at the end of the array if index is not given
    if (idx === undefined) {
      idx = this.children.length;
    }

    // Create the additional array item at the end of the list,
    // using the item template created when tree was initialized
    // (the call to resetValues ensures that 'arrayPath' is correctly set)
    var childTemplate = this.getChildTemplate();
    childTemplate.currentClone = idx + 1;
    var child = childTemplate.clone();

    // add the current values to the key2titlepath
    var treeTitlePath = this.ownerTree.keyToTitlePath;
    var searchIdx = idx - 1;
    var titlePathToAppend = {};
    var treeTitlePathKeys = Object.keys(treeTitlePath);
    var regex = new RegExp('^' + this.key + '\\[(' + searchIdx + ')\\](.*)');

    for (var i = 0; i < treeTitlePathKeys.length; i++) {
      var key = treeTitlePathKeys[i];
      var found = key.match(regex);
      if (found) {
        var newKey = this.key + '[' + idx + ']' + found[2];
        var newKeyObj = this.key + '/' + idx + '/' + found[2];
        var newLabel = treeTitlePath[ treeTitlePathKeys[i] ];
        newLabel = newLabel.replace(' ' + idx + '/', ' ' + (idx + 1) + '/');
        titlePathToAppend[ newKey ] = newLabel;
        titlePathToAppend[ newKeyObj ] = newLabel;
      }
    }
    var titlePathToAppendKeys = Object.keys(titlePathToAppend);
    for (var i = 0; i < titlePathToAppendKeys.length; i++) {
      treeTitlePath[ titlePathToAppendKeys[i] ] = titlePathToAppend[ titlePathToAppendKeys[i] ];
    }


    if (child.children) {
      fixChildrenPrefix(child);
    }

    this.appendChildNode(child);
    child.resetValues();

    // To create a blank array item at the requested position,
    // shift values down starting at the requested position
    // one to insert (note we start with the end of the array on purpose)
    for (i = this.children.length - 2; i >= idx; i--) {
      this.children[i]
        .moveValuesToNode(this.children[i + 1]);
    }

    // Initialize the blank node we've created with default values - 20200601 - removing because its maybe useless?
    //this.children[idx]
    //  .resetValues();

    /* 
    this.children[idx]
      .computeInitialValues(null, {
        enableDefault: true,
        topDefaultArrayLevel: this.children[idx].arrayPath.length
      });
    */

    this.children[idx]
      .computeInitialValues(this.ownerTree.formDesc.content, {
        enableDefault: true,
        topDefaultArrayLevel: this.children[idx].arrayPath.length
      });

    if (!skipRender) {
      // Re-render all children that have changed
      for (i = idx; i < this.children.length; i++) {
        this.children[i].shouldEnhanceFunc();
        console.info("Calling Render 13: from the FormNode.insertArrayItem method");

        this.children[i]
          .render(domElement);
      }
    }

    this.ownerTree.setupTitlePaths();
      return this.children[idx];
  };

    FormNode.prototype.insertObjectItem = function (key) {
      ASSERT.isString(key, "Key must be a string"); 

      var childTemplate = this.getChildTemplate();
      var child = childTemplate.clone();

      child.objectPath = _.clone(this.objectPath);
      child.objectPath.push(key);
      child.title = `Tab '${key}'`;

      /*
      // add the current values to the key2titlepath
      var treeTitlePath = this.ownerTree.keyToTitlePath;
      var searchIdx = idx - 1;
      var titlePathToAppend = {};
      var treeTitlePathKeys = Object.keys(treeTitlePath);
      var regex = new RegExp('^' + this.key + '\\[(' + searchIdx + ')\\](.*)');

      for (var i = 0; i < treeTitlePathKeys.length; i++) {
        var key = treeTitlePathKeys[i];
        var found = key.match(regex);
        if (found) {
          var newKey = this.key + '[' + idx + ']' + found[2];
          var newKeyObj = this.key + '/' + idx + '/' + found[2];
          var newLabel = treeTitlePath[ treeTitlePathKeys[i] ];
          newLabel = newLabel.replace(' ' + idx + '/', ' ' + (idx + 1) + '/');
          titlePathToAppend[ newKey ] = newLabel;
          titlePathToAppend[ newKeyObj ] = newLabel;
        }
      }
      var titlePathToAppendKeys = Object.keys(titlePathToAppend);
      for (var i = 0; i < titlePathToAppendKeys.length; i++) {
        treeTitlePath[ titlePathToAppendKeys[i] ] = titlePathToAppend[ titlePathToAppendKeys[i] ];
      }
      */
      

      this.appendChildNode(child);
    }

  /**
   * Remove an item from an array
   *
   * @function
   * @param {Number} idx The index number of the item to remove
   */
  FormNode.prototype.deleteArrayItem = function (idx) {
    ASSERT.isNumberOrNil(idx, {msg: 'insertArrayItem expected array index to be a number', code: 3140});
    var shouldDelete = confirm('Are you sure?');
    if (shouldDelete !== true) {
      return;
    }

    var lastIndex = this.children.length - 1;

    if (idx === undefined ||
      idx > lastIndex) {
      idx = lastIndex;
    }

    // Move the item that is being deleted to the end of the array
    for (var i = idx; i < lastIndex; i++) {
      this.children[i + 1].moveValuesToNode(this.children[i]);
      this.children[i].shouldEnhanceFunc();
      console.info("Calling Render 14: from the FormNode.deleteArrayItem method");
      this.children[i].children.forEach(function(child) {
        child.alreadyLoaded = false;
      });
      this.children[i].render();
    }

    // Remove the last array item from the DOM tree and from the form tree
    this.removeChild();
  };

  /**
   * Returns the minimum/maximum number of items that an array field
   * is allowed to have according to the schema definition of the fields
   * it contains.
   *
   * The function parses the schema definitions of the array items that
   * compose the current "array" node and returns the minimum value of
   * "maxItems" it encounters as the maximum number of items, and the
   * maximum value of "minItems" as the minimum number of items.
   *
   * The function reports a -1 for either of the arrayLimits if the schema
   * does not put any constraint on the number of elements the current
   * array may have of if the current node is not an array.
   *
   * Note that array arrayLimits should be defined in the JSON Schema using
   * "minItems" and "maxItems". The code also supports "minLength" and
   * "maxLength" as a fallback, mostly because it used to by mistake (see #22)
   * and because other people could make the same mistake.
   *
   * @function
   * @return {Object} An object with properties "minItems" and "maxItems"
   *  that reports the corresponding number of items that the array may
   *  have (value is -1 when there is no constraint for that boundary)
   */
  FormNode.prototype.getArrayLimits = function () {
    var arrayLimits = {
      minItems: -1,
      maxItems: -1
    };

    if (!this.view || !this.view.array) {
      return arrayLimits;
    }

    var getNodeArrayLimits = function (node, initialNode) {
      var schemaKey = null;
      var arrayKey = null;
      var arrayLimits = {
        minItems: -1,
        maxItems: -1
      };
      initialNode = initialNode || node;

      if (node.view &&
        node.view.array &&
        (node !== initialNode)) {
        // New array level not linked to an array in the schema,
        // so no size constraints
        return arrayLimits;
      }

      if (node.key) {
        // Note the conversion to target the actual array definition in the
        // schema where minItems/maxItems may be defined. If we're still looking
        // at the initial node, the goal is to convert from:
        //  foo[0].bar[3].baz to foo[]/bar[]/baz
        // If we're not looking at the initial node, the goal is to look at the
        // closest array parent:
        //  foo[0].bar[3].baz to foo[]/bar
        arrayKey = node.key.replace(REGEX.REMOVE_NUMBERS_FROM_ARRAY_INDEX_IN_INPUT_FIELD, '[]');

        if (node !== initialNode) {
          arrayKey = arrayKey.replace(REGEX.GET_CLOSEST_ARRAY_PARENT, '');
        }

        schemaKey = tbjsonAjv2Tb.getSchemaByJsonPointer(
          node.ownerTree.formDesc.schema,
          arrayKey,
          undefined,
          getAnyOfIdsByParentFormElements(node.formElement) || _.cloneDeep(node.anyOfIds)
        );

        if (!schemaKey) {
          return arrayLimits;
        }

        if (schemaKey.minItems >= 0) {
          arrayLimits.minItems = schemaKey.minItems;
        }

        if (schemaKey.maxItems >= 0) {
          arrayLimits.maxItems = schemaKey.maxItems;
        }

        if (schemaKey.enableDeletingItems !== undefined) {
          arrayLimits.enableDeletingItems = schemaKey.enableDeletingItems;
        }

        if (schemaKey.enableAddingItems !== undefined) {
          arrayLimits.enableAddingItems = schemaKey.enableAddingItems;
        }

        if (schemaKey.enableSorting !== undefined) {
          arrayLimits.enableSorting = schemaKey.enableSorting;
        }

        return arrayLimits;
      } else {
        _.each(node.children, function (child) {
          var subArrayLimits = getNodeArrayLimits(child, initialNode);

          if (subArrayLimits.minItems !== -1) {
            if (arrayLimits.minItems !== -1) {
              arrayLimits.minItems = Math.max(
                arrayLimits.minItems,
                subArrayLimits.minItems
              );
            } else {
              arrayLimits.minItems = subArrayLimits.minItems;
            }
          }

          if (subArrayLimits.maxItems !== -1) {
            if (arrayLimits.maxItems !== -1) {
              arrayLimits.maxItems = Math.min(
                arrayLimits.maxItems,
                subArrayLimits.maxItems
              );
            } else {
              arrayLimits.maxItems = subArrayLimits.maxItems;
            }
          }

          if (subArrayLimits.enableDeletingItems !== undefined) {
            arrayLimits.enableDeletingItems = subArrayLimits.enableDeletingItems;
          }

          if (subArrayLimits.enableAddingItems !== undefined) {
            arrayLimits.enableAddingItems = subArrayLimits.enableAddingItems;
          }

          if (subArrayLimits.enableSorting !== undefined) {
            arrayLimits.enableSorting = subArrayLimits.enableSorting;
          }
        });
      }

      return arrayLimits;
    };

    return getNodeArrayLimits(this);
  };


  FormNode.prototype.shouldEnhanceFunc = function() {
    this.shouldEnhance = true;
    _.each(this.children, function (child) {
      child.shouldEnhanceFunc();
    });
  }

  /**
   * Enhances the view with additional logic, binding event handlers
   * in particular.
   *
   * The function also runs the "insert" event handler of the view and
   * form element if they exist (starting with that of the view)
   *
   * @function
   */
  FormNode.prototype.enhance = function (shouldFilter, shouldSkipVisibilityCheck) {
    // console.info("Calling enhance...", this.key);
    if (_.isUndefined(shouldFilter)) {
      shouldFilter = true;
    }
    
    // shouldSkipInsertHandler - should be skipped when the parent is TAB-SHOWN, but the child is TAB-HIDDEN
    if (_.isUndefined(shouldSkipVisibilityCheck)) {
      shouldSkipVisibilityCheck = false;
    }

    if (!this.shouldEnhance) {
      return;
    }

    if (this.ownerTree.documentWasHiddenOnLoad) {
      shouldSkipVisibilityCheck = true;
    } else {
      // document is visible, conditional rendering will apply
      if ( ! this.ownerTree.formDesc.form.render_full_form ) {
        if ( this.el != null && ! $(this.el).is(':visible') ) {
          return;
        }
      }
    }

    this.shouldEnhance = false;

    if ( this.el == null ) {
      this.shouldEnhance = true;
    }

    var node = this;
    var handlers = null;
    var insertHandler = null;
    var formData = _.clone(this.ownerTree.formDesc.tpldata) || {};

    function onLegendChildChange (evt) {
      if (node.formElement &&
        node.formElement.legend &&
        node.parentNode) {
        node.legend = applyArrayPath(node.formElement.legend, node.arrayPath);
        formData.idx = (node.arrayPath.length > 0)
          ? node.arrayPath[node.arrayPath.length - 1] + 1
          : node.childPos + 1;

        formData.value = $(evt.target).val();

        if (node.legendChild && node.legendChild.schemaElement && node.legendChild.schemaElement.enum && node.legendChild.schemaElement.enumNames) {
          var idx = node.legendChild.schemaElement.enum.indexOf(formData.value);
          formData.value = node.legendChild.schemaElement.enumNames[idx];
        } else if (node.legendChild && node.legendChild.options) {
          let currentElementValue = $(evt.target).val();
          let currentElementTitleEl = node.legendChild.options.filter(el => { return el.id == currentElementValue });
          if (currentElementTitleEl && currentElementTitleEl[0] && currentElementTitleEl[0].title) {
            formData.value = currentElementTitleEl[0].title;
          }
        }

        node.legend = _template(node.legend, _.merge(formData, node.ownerTree.formDesc.value, node.ownerTree.formDesc.currentValue), valueTemplateSettings);
        $(node.parentNode.el).trigger('legendUpdated', { childPos: node.childPos, legend: node.legend });
      }
    }

    if (this.formElement) {
      // Check the view associated with the node as it may define an "onInsert"
      // event handler to be run right away
      this.ownerTree.performance.onInsertRenderTime = this.ownerTree.performance.onInsertRenderTime || 0;
      var start_time19 = Date.now();
      if (this.view.onInsert) {
        if ( ! this.ownerTree.formDesc.form.render_full_form ) {
          if ( $(this.el).is(':visible') || shouldSkipVisibilityCheck) {
            this.view.onInsert({ target: $(this.el) }, this);
          } else {
            this.shouldEnhance = true;
          }
        } else {
          this.view.onInsert({ target: $(this.el) }, this);
        }
      }

      var start_time20 = Date.now();
      this.ownerTree.performance.onInsertRenderTime += start_time20 - start_time19;

      // trigger the "insert" event handler
      insertHandler = this.onInsert || this.formElement.onInsert;

      if (insertHandler) {
        insertHandler({ target: $(this.el) }, this);
      }

      // trigger the custom event handler initializer for each node
      // in case it has to be re-initialized
      if (this.mustUpdateEventHandlers) {
        this.mustUpdateEventHandlers = false;

        for (var i = 0; i < this.children.length; i++) {
          this.children[i].mustUpdateEventHandlers = true;
        }

        if (typeof this.initializeEventHandlers === 'function') {
          this.initializeEventHandlers();
          // this.initializeEventHandlers.call(this);
        }
      }

      handlers = this.handlers || this.formElement.handlers;
      if (handlers) {
        _.each(handlers, function (handler, onevent) {
          if (onevent === 'insert') {
            handler({ target: $(this.el) }, this);
          }
        }.bind(this));
      }

      // No way to register event handlers if the DOM element is unknown
      // TODO: find some way to register event handlers even when this.el is not set.
      if (this.el) {
        node.activateValueHistoryEventHandlers();

        //todo: refactor this!!
        // if (node.filtersTree && shouldFilter) {
        //   var select = $(node.el).find('.controls').children().first();
        //   var filterTreeRoot = $(node.filtersTree.root.el);
        //   var firstRowInTable = filterTreeRoot.find('fieldset > div > div').first().children().last();
        //   if (firstRowInTable[0].tagName === 'SELECT') {
        //     firstRowInTable.detach();
        //     firstRowInTable = filterTreeRoot.find('fieldset > div > div').first().children().last();
        //   }

        //   //mark all selects with filterTreeSelect, so we can extract the value in the main schema without too much hasske
        //   //look at the submit form values of the selects for usage of this attribute
        //   filterTreeRoot.find('select').attr('filterTreeSelect', true);

        //   filterTreeRoot.insertBefore(select);
        //   select.insertAfter(firstRowInTable);
        //   select.css('width', '31%')
        //     .css('display', 'inline-block')
        //     .css('margin-left', '10px')
        //     .css('margin-top', '19px');
        // }


        // Register specific event handlers
        // TODO: Add support for other event handlers

        if (this.onChange) {
          $(this.el).bind('change', function (evt) {
            node.onChange(evt, node);
          });
        }
        if (this.view.onChange) {
          $(this.el).bind('change', function (evt) {
            node.view.onChange(evt, node);
          });
        }
        if (this.formElement.onChange) {
          $(this.el).on('change', '#' + node.id, function (evt) {
            node.formElement.onChange(evt, node);
          });
        }

        if (this.onClick) {
          $(this.el).bind('click', function (evt) {
            node.onClick(evt, node);
          });
        }
        if (this.view.onClick) {
          $(this.el).bind('click', function (evt) {
            node.view.onClick(evt, node);
          });
        }
        if (this.formElement.onClick) {
          //@todo : fix this (it shouldnt contaminate global scope,
          //it shouldn't be here, maybe event handler for all of them and then select which one to tigger?)
          if (node.id) {

            $(document).on('click', '#' + node.id, function (evt) {
              if (_.isString(node.formElement.onClick)){

                try {
                  eval(node.formElement.onClick);
                } catch (e) {
                  TRACE("Error when processing the js: ", e.toString());
                  ASSERT(0, {msg: "The function given is uncompilable: $FUNC$", msgParams: {FUNC: node.formElement.onClick}, code: "JFAS777" });
                }

              } else {
                node.formElement.onClick(evt, node);
              }
            });
          } else {
            $(this.el).bind('click', function (evt) {
              node.formElement.onClick(evt, node);
            });
          }
        }

        if (this.onKeyUp) {
          $(this.el).bind('keyup', function (evt) {
            node.onKeyUp(evt, node);
          });
        }
        if (this.view.onKeyUp) {
          $(this.el).bind('keyup', function (evt) {
            node.view.onKeyUp(evt, node);
          });
        }
        if (this.formElement.onKeyUp) {
          $(this.el).bind('keyup', function (evt) {
            node.formElement.onKeyUp(evt, node);
          });
        }


        if (handlers) {
          _.each(handlers, function (handler, onevent) {
            if (onevent !== 'insert') {
              $(this.el).bind(onevent, function (evt) {
                handler(evt, node);
              });
            }
          }.bind(this));
        }

        if (this.schemaElement) {
          $(this.el).on('change', '#' + node.id, function (evt) {


            // update valueHistory for all scalar fields (validate the field)
            //if (jsonform.elementTypes[node.formElement.type].inputfield === true) {
              // blows up, fuck valueHustory, its useless anyway, please fix when the time is right!
              //node.updateValueHistory(nullableValue, true);
            //}

            var ev = new Event('change');
            node.ownerTree.root.el[0].dispatchEvent(ev);
          });

          //$(this.el).bind('jfValChange', onChangeCb);
          //$(this.el).bind('change', onChangeCb);
        }
      }

      // Auto-update legend based on the input field that's associated with it
      if (this.formElement.legend && this.legendChild && this.legendChild.formElement) {
        $(this.legendChild.el).off('keyup');
        $(this.legendChild.el).off('change');

        // The below doesn't work, for some reason
        // $(this.legendChild.el).off('keyup', onLegendChildChange);
        // $(this.legendChild.el).off('change', onLegendChildChange);

        $(this.legendChild.el).on('keyup', onLegendChildChange);
        $(this.legendChild.el).on('change', onLegendChildChange);
      }
    }

    // this.ownerTree.applyGridLayoutRows(this);

    // Recurse down the tree to enhance children
    var length = this.children.length;
    for (var i = 0; i < length; i++) {
      this.children[i].enhance();
    }
  };

  FormNode.prototype.markChildEventHandlersForUpdate = function () {
    ASSERT.isArray(this.children, {msg: 'invalid value type', code: 3150});

    for (var i = 0; i < this.children.length; i++) {
      this.children[i].mustUpdateEventHandlers = true;
    }
  };

  FormNode.prototype.lock = function () {
    if (this.formElement &&
      !this.formElement.readOnly &&
      jsonform.elementTypes[this.formElement.type].lock) {
      this.isLocked = true;
      jsonform.elementTypes[this.formElement.type].lock(this);
    }

    _.each(this.children, function (child) {
      child.lock();
    });
  };

  FormNode.prototype.unlock = function () {
    if (this.formElement &&
      this.isLocked) {
      this.isLocked = false;
      jsonform.elementTypes[this.formElement.type].unlock(this);
    }

    _.each(this.children, function (child) {
      child.unlock();
    });
  };

  FormNode.prototype.checkIfNodeSupportsEnumTemplate = function () {
    return this.formElement.type === 'selecttemplate';
  }

  FormNode.prototype.getForeignKeyData = function (shouldGetFilters) {
    var foreignKeyData = {};

    if (shouldGetFilters) {
      var parsedData = [];

      var data = this.filtersTree.root.getFormValues();

      _.each(data, function (el) {

        //todo: make this better
        //the todo in its essence: Make some way of knowing how to make from
        //the operator a good value (in the like case, put %% around it, in another case, another way!)
        // put it in DB.pm, and not inside jsonforms
        if (el.operator === 'LIKE') {
          el.value = '%' + el.value + '%';
        }

        parsedData.push(el);
      });

      foreignKeyData.filters = parsedData;
      foreignKeyData.filterSchemaId = _.get(this.filtersTree, 'root.ownerTree.formDesc.schema.id', null);
    }

    return _.merge(foreignKeyData, {
      refCol: this.schemaElement.refCol,
      refTable: this.schemaElement.refTable,
      refTableView: this.schemaElement.refTableView || this.schemaElement.refTable,
      pathToField: this.key
    });
  }

  FormNode.prototype.initExpectingSearchValue = function () {
    this.expectingSearchValue = !!this.expectingSearchValue;
  }

  // it should render, but before that it should
  // swap the filtersTree, so that its not destroyed
  FormNode.prototype.smartRender = function () {
    //todo: make it work
    this.render();
  };

  FormNode.prototype.setFkeyValues = function (values, err) {
    if (err) {
      if (this.node.ownerTree.formDesc.form.enableFieldLockOnSearch) {
        this.node.unlock();
      }

      this.node.expectingSearchValue = false;
      this.node.filtersTree.unlock();
      removeLoadingAnimation(this.node.filtersTree.root.el);
      return;
    }

    values = values.result || values;
    var node = this.node;
    var $notFoundSpan = $(node.filtersTree.root.el).find('fieldset > div > span');

    if (_.isUndefined(values[0])) {
      if (node.ownerTree.formDesc.form.enableFieldLockOnSearch) {
        node.unlock();
      }

      node.expectingSearchValue = false;
      node.filtersTree.unlock();
      removeLoadingAnimation(node.filtersTree.root.el);

      node.schemaElement.enum = [];
      node.schemaElement.enumTemplate = [];
      node.ownerTree.formDesc.form.templateData && (node.ownerTree.formDesc.form.templateData[node.formElement.key] = []);

      node.options = [];

      node.smartRender();

      $notFoundSpan.show();
      $notFoundSpan.parent().addClass(jsonform.defaultClasses.groupMarkClassPrefix + 'error');
      return;
    } else {
      $notFoundSpan.hide();
    }

    var getLabel = function (value) {
      return value === null ? this.formDesc.form.nullValueTitle : value.toString();
    };

    var type = node.schemaElement.type;
    var nodeHasTemplate = node.checkIfNodeSupportsEnumTemplate();

    var refCol = this.data.refCol;
    var refColTitle = node.getRefColTitle(values);

    ASSERT(_.isPlainObject(values[0]), {code: 3172, msg: 'Bad input: Expected String or Integer, got $PARAM$', msgParams: {PARAM: typeof values[0] }});

    ASSERT(!_.isUndefined(refColTitle) || !nodeHasTemplate, { code: 3175, msg: 'Unable to find ref column title in input values! Please check you\'r schema and data if refColTitle is present and if yes, if refColTitle key has value equal to key in the data object'});

    ASSERT((jfUtils.contains(this.node.schemaElement.type, 'number') || jfUtils.contains(this.node.schemaElement.type, 'integer'))
        && _.isInteger(values[0][refCol])
        || jfUtils.contains(this.node.schemaElement.type, 'string') && _.isString(values[0][refCol]),
      { code: 3178, msg: 'Unable to find ref column title in input values! Please check your schema and data if refColTitle is present and if yes, if refColTitle key has value equal to key in the data object'});

    var enumValues = values.map( function (value) {
      return value[refCol];
    });

    var enumTitles = values.map( function (value) {
      return value[refColTitle];
    });

    var keys = values.map(function (value) {
      return {
        value: value[refCol],
        title: value[refColTitle]
      }
    });

    node.schemaElement.enum = enumValues;

    if (nodeHasTemplate) {
      node.ownerTree.formDesc.form.templateData = node.ownerTree.formDesc.form.templateData || {};
      node.ownerTree.formDesc.form.templateData[node.formElement.key] = values;

    } else {
      node.schemaElement.enumNames = enumTitles;
    }

    node.options = keys;

    if (node.ownerTree.formDesc.form.enableFieldLockOnSearch) {
      node.unlock();
    }

    node.expectingSearchValue = false;
    node.filtersTree.unlock();
    removeLoadingAnimation(node.filtersTree.root.el);

    node.smartRender();

    if (nodeHasTemplate) {
      var $element = $(node.el);
      $element.find('select:not([filtertreeselect])')[0].selectize.addItem(enumValues[0]);
    }

    var schema = node.ownerTree.formDesc.schema;
    var validator = node.ownerTree.formDesc.validator;

    validator.removeSchema(schema.id);
    validator.compile(schema, schema.id);
  };

  FormNode.prototype.getRefColTitle = function ( values ) {
    if ( this.schemaElement.refColTitle ) {
      var refColTitleKeyCandidate = [this.schemaElement.refColTitle]
    } else {
      var refColTitleKeyCandidate = this.formElement.defaultRefColTitleKeys;
    }

    var refColTitleKey = undefined;
    for (var i = refColTitleKeyCandidate.length - 1; i >= 0; i--) {
      if (values[0].hasOwnProperty(refColTitleKeyCandidate[i])){
        refColTitleKey = refColTitleKeyCandidate[i];
        break;
      }
    }

    return refColTitleKey;
  };

  FormNode.prototype.sendForeignKeyEvent = function () {
    var data = this.getForeignKeyData(false);
    var addForeignKeyEvent = new CustomEvent('jf_addFKey', {
        detail: {
          data: data,
          node: this
        }
      }
    );
    jsonform.formTree.domRoot.dispatchEvent(addForeignKeyEvent);
  };

  var changeForeignKeySearchOptions = function (domElement, node, currentNode) {
    var selectedValue = domElement.value;

    var selectedValueType = node.foreignKeyData.keys[selectedValue];
    var selectedValueTypeDefault = node.foreignKeyData.typeDefaultValues && node.foreignKeyData.typeDefaultValues[selectedValueType];
    var selectedValueTypeDefaultTitle = node.foreignKeyData.typeDefaultValues && node.foreignKeyData.typeDefaultValuesTitles[selectedValueType];
    var permitedOperators = node.foreignKeyData.operators[selectedValueType];
    var permitedOperatorsTitles = node.foreignKeyData.operatorNames[selectedValueType];

    var changedKey = currentNode.key.split('/')[0];
    var schema = node.filtersTree.formDesc.schema;
    var form = node.filtersTree.formDesc.form;
    schema.properties[changedKey] = node.createNewItem(selectedValueType, permitedOperators, permitedOperatorsTitles, selectedValueTypeDefault, selectedValueTypeDefaultTitle);

    var values = node.filtersTree.root.getFormValues();

    //todo - probably make a smarter way to check whether the value should be changed?
    _.forEach(values, function(el) {
      if (el.value === 'true' || el.value === 'false') {
        el.value = '';
      }
    });


    node.filtersTree.createAndAppendNewFiltersTree(schema, form, values, node, true);
  };

  var handleFKeyDelete = function (domElement, node, currentNode) {
    if (node.foreignKeyData.currentNumberOfRows === 1) {
      return;
    }

    var schema = node.filtersTree.formDesc.schema;
    var form = node.filtersTree.formDesc.form;
    var validator = new tbjsonAjv2Tb.getAjv2tbInstance();
    var currentRowKey = currentNode.parent.key;

    var deleteIndex = 0;
    _.each(form.fields[0].items, function (el, idx) {
      if (el.key === currentRowKey) {
        deleteIndex = idx;
      }
    });

    if (deleteIndex === 0) {
      _.each(form.fields[0].items[1].items, function (el) {
        el.notitle = false;
      });
    }

    form.fields[0].items.splice(deleteIndex, 1);
    delete schema.properties[currentRowKey];
    validator.compile(schema);

    var values = node.filtersTree.root.getFormValues();

    node.filtersTree.createAndAppendNewFiltersTree(schema, form, values, node, true);

    node.foreignKeyData.currentNumberOfRows -= 1;
  };

  FormNode.prototype.handleFKeyNewRow = function (shouldAddNewRow) {
    this.foreignKeyData.currentIndex += 1;
    this.foreignKeyData.currentNumberOfRows += 1;

    var values = this.filtersTree.root.getFormValues();
    var newRowIndex = this.foreignKeyData.currentIndex;
    var schema = this.filtersTree.formDesc.schema;
    var form = this.filtersTree.formDesc.form;

    if (_.isUndefined(shouldAddNewRow) || (_.isUndefined(shouldAddNewRow) && shouldAddNewRow ) ) {
      schema.properties['filtersArray' + newRowIndex] = this.createNewItem();
      form.fields[0].items.push(this.createNewFormItem());
    }

    this.filtersTree.createAndAppendNewFiltersTree(schema, form, values, this, true);
  };

  FormNode.prototype.handleFkeySearch = function () {
    this.initExpectingSearchValue();
    ASSERT(this.expectingSearchValue === false, {msg: 'Another foreign key search is in progress.', code: 3160});

    var result = this.filtersTree.validate({
      values: this.filtersTree.root.getFormValues(),
      clearOldErrors: true,
    });

    if (result.errors || _.isEmpty(result.values)) {
      this.expectingSearchValue = false;
      return;
    }

    this.expectingSearchValue = true;
    var data = this.getForeignKeyData(true);

    displayLoadingAnimation(this.filtersTree.root.el);
    this.filtersTree.lock();

    var searchEvent = new CustomEvent('jf_specialSearch', {
        detail: {
          data: data,
          node: this,
          cb: this.setFkeyValues
        }
      }
    );

    if (this.ownerTree.formDesc.form.enableFieldLockOnSearch) {
      this.lock();
    }

    jsonform.formTree.domRoot.dispatchEvent(searchEvent);
  };

  var getNonNullType = function (types) {
    return types.filter( function (el) {
      return el !== 'null';
    })[0];
  };

  var createForeignKeySchemaFromSchema = function (rootSchema, schema, elementTitle, node) {
    if (schema.$ref) {
      schema = jfUtils.resolveRefs(rootSchema, schema, true);
    }

    node.foreignKeyData = {
      operators: {
        string: ['=', 'LIKE'],
        boolean: ['='],
        number: ['<', '>', '=', '>=', '<=']
      },
      operatorNames: {
        string:  ['equals', 'contains'],
        boolean: ['equals'],
        number:  ['less than', 'more than', 'equals', 'more than or equals', 'less than or equals'],
      },
      typeDefaultValuesTitles: {
        boolean: ['YES', 'NO'],
      },
      typeDefaultValues: {
        boolean: [true, false],
      },
      currentIndex: 0,
      currentNumberOfRows: 1,
      keys: {}
    };

    var filteredProperties = []

    var idx = 0;
    _.forOwn(schema.properties, function(val, key) {
      val = tbjsonAjv2Tb.getSchemaByJsonPointer(schema, key);

      if (val.searchBy) {
        filteredProperties[idx] = {key: key, o: val.ordering || Infinity};
        node.foreignKeyData.keys[key] = _.isArray(val.type) ? getNonNullType(val.type) : val.type;
        idx += 1;
      }
    });
    var orderedProperties = _.sortBy(filteredProperties, ['o']);

    var orderedPropertiesKeys = _.map(orderedProperties, function(el) {
      return el.key;
    });

    if (!orderedPropertiesKeys.length) {
      return null;
    }

    node.foreignKeyData.filterEnum = orderedPropertiesKeys;
    node.foreignKeyData.title = elementTitle;

    var augmentedSchema = {
      id: schema.id,
      type: 'object',
      properties: {}
    };

    augmentedSchema.properties['filtersArray' + node.foreignKeyData.currentIndex] = node.createNewItem();

    return augmentedSchema;
  };

  var createForeignKeyForm = function (schemaId, node, title) {
    var item = node.createNewFormItem(node.foreignKeyData.currentIndex);

    return {
      $schemaId: schemaId,
      gridLayout: true,
      strictNumberTypes: false,
      isStrict: false,
      jsonformVersion: '2.0',
      fields: [
        {
          type: 'fieldset',
          expandable: false,
          title: 'Search For ' + title,
          // rowWidth: 'full',
          items: [
            item,
          ]
        }
      ]
    }
  };

  FormNode.prototype.createNewItem = function (type, operators, operatorTitles, typeDefaultValues, typeDefaultValuesTitles) {
    var returnObject = {
      type: 'object',
      title: 'filters for ' + this.foreignKeyData.title,
      properties: {
        filter: {
          type: 'string',
          title: 'filter',
          enum: this.foreignKeyData.filterEnum,
        },
        operator: {
          type: 'string',
          title: 'operator',
        },
        value: {
          type: 'string',
          title: 'search value',
        }
      }
    };

    if (type) {
      returnObject.properties.value.type         = type;
    }

    if (typeDefaultValues) {
      returnObject.properties.value.enum = typeDefaultValues;
      returnObject.properties.value.enumNames = typeDefaultValuesTitles;
    } else {
      delete returnObject.properties.value.enum;
      delete returnObject.properties.value.enumNames;
    }

    if (operators) {
      returnObject.properties.operator.enum      = operators;
      returnObject.properties.operator.enumNames = operatorTitles;
    } else {
      returnObject.properties.operator.enum      = this.foreignKeyData.operators.string;
      returnObject.properties.operator.enumNames = this.foreignKeyData.operatorNames.string;
    }

    return returnObject;
  };

  FormNode.prototype.createNewFormItem = function () {
    var node = this;
    var idx = this.foreignKeyData.currentIndex;

    var containerParentKey = 'filtersArray' + idx;
    var filterKey = containerParentKey + '/filter';
    var operatorKey = containerParentKey + '/operator';
    var valueKey = containerParentKey + '/value';

    var a = {
      key: containerParentKey,
      title: "My inside object",
      type: "section",
      // rowWidth: 'full',
      items: [
        // {
        //   type: 'button',
        //   title: '',
        //   buttonSize: 'small',
        //   buttonIcon: 'plus',
        //   rowWidth: 'sixth',
        //   onClick: function () {
        //     node.handleFKeyNewRow();
        //   }
        // },
        {
          title: 'Filter name',
          notitle: ( idx === 0 || node.foreignKeyData.currentNumberOfRows === 1) ? false : true,
          ordering: 103,
          key: filterKey,
          type: 'select',
          // rowWidth: 'sixth',
          onChange: function (e) {
            changeForeignKeySearchOptions(e.target, node, this);
          }
        },
        {
          title: 'Operator',
          key: operatorKey,
          notitle: ( idx === 0 || node.foreignKeyData.currentNumberOfRows === 1) ? false : true,
          ordering: 102,
          type: 'select',
          // rowWidth: 'sixth',
        },
        {
          title: 'Search value',
          ordering: 101,
          key: valueKey,
          notitle: ( idx === 0 || node.foreignKeyData.currentNumberOfRows === 1) ? false : true,
          // rowWidth: 'quarter',
        },
        {
          type: 'button',
          title: 'Search',
          ordering: 104,
          // rowWidth: 'sixth',
          onClick: function () {
            node.handleFkeySearch();
          }
        },
        // {
        //   type: 'button',
        //   title: 'Delete Filter',
        //   ordering: 104,
        //   rowWidth: 'sixth',
        //   onClick: function ( e ) {
        //     handleFKeyDelete(e.target, node, this);
        //   }
        // },
      ],
    };

    return a;
  };

  /**
   * Form tree class.
   *
   * Holds the internal representation of the form.
   * The tree is always in sync with the rendered form, this allows to parse
   * it easily.
   *
   * @class
   */
  var FormTree = function (formDesc, preserveParentSchema) {
    this.eventhandlers = [];
    this.root = null;
    this.formDesc = null;
    this.performance = this.performance || {};

    this.keyToNode = {};
    this.keyIdToNode = {};

    //long term TODO
    this.modifiedSchema = {};
    this.keyToTitle = {};

    // this property gives all of the changed fields
    // (schema keys!)
    this.changedFields = {};

	  this.insertedArrayItems = {};
    this.deletedArrayItems = {};
    this.foreignKeysData = {};
    this.enumNamesData = {};
    this.enumData = {};
    if (document && document.visibilityState && document.visibilityState != 'visible') {
      // document is not visible, render everything!
      this.documentWasHiddenOnLoad = true;
    }
      

    this.keyToInitialValue = {};
    this.keyToCurrentValue = {};
    this.keyToTitlePath = {};
    this.keyToSchemaTitle = {};
    this.initialize(formDesc, preserveParentSchema);
    this.postInitialization();

    this.formDesc.resources = this.formDesc.resources || {};
  };

  jsonform.FormTree = FormTree;

  jsonform.fillGarbage = function () {
    $('input, textarea').each( function(el) {
      let $this = $(this);
      try {
        if ($this.val() === '') {
          $this.val('123');
        }
      } catch (e) {
        console.log(e);
      }
    });

    $('select').each( function(el) {
      let $this = $(this);
      try {
        if ($this.val() === '' || $this.val() === null || $this.val() === 'null') {
          let option = $this.find('option:not([disabled])').first();
          if (option) {
            let $option = $(option);
            console.log("HERE!", $option);
            $this.val( $option.attr('value') );
          }
        }
      } catch (e) {
        console.log(e);
      }
    });
  }

  /**
   * Initializes the form tree structure from the JSONForm object
   *
   * This function is the main entry point of the JSONForm library.
   *
   * Initialization steps:
   * 1. the internal tree structure that matches the JSONForm object
   *  gets created (call to buildTree)
   * 2. initial values are computed from the content/value object
   *  or from the default values defined in the JSON schema.
   *
   * When the function returns, the tree is ready to be rendered through
   * a call to "render".
   *
   * @function
   */
  FormTree.prototype.titlePathRecurseItems = function (rootItemsNode, formItem, currentTitlePath) {
    currentTitlePath = currentTitlePath || [];
    currentTitlePath = currentTitlePath.slice();

    var currentFormTitle = formItem.legend || formItem.title || ''; // maybe there are more?
    currentTitlePath.push(currentFormTitle);

    if (typeof formItem === 'string') {
      formItem = {
        key: formItem,
      };
    }

    if (formItem.key) {
      if (true) { // isScalar check?
        if ( ! currentFormTitle ) {
          currentTitlePath.push(this.keyToSchemaTitle[formItem.key]);
        }

        this.keyToTitlePath[formItem.key] = currentTitlePath.filter(x => x !== '' ).join('/');
      }
    }

    if (formItem.items && formItem.items.length > 0) {
      for (var i = 0; i < formItem.items.length; i++) {
        this.titlePathRecurseItems(rootItemsNode, formItem.items[i], currentTitlePath);
      }
    }
  }

  FormTree.prototype.titlePathRecurse = function (node, currentTitlePath, isParentArray, arrayIdx) {
    currentTitlePath = currentTitlePath || [];
    currentTitlePath = currentTitlePath.slice();

    currentTitlePath.push(node.getTitle());
    if (isParentArray) {
      currentTitlePath.push("Element " + (arrayIdx + 1));
    }

    var nodeKey = node.key || (node.formElement && node.formElement.key);

      if ( node.objectPath && node.parentNode && node.parentNode.objectPath && node.parentNode.objectPath.length < node.objectPath.length ||
           node.objectPath && !node.parentNode && node.objectPath.length > 0) {
        // currebtTitlePath.push(node.title);
        currentTitlePath.push(`Dynamic Key ${node.objectPath[node.objectPath.length - 1]}`);
      }
    if (nodeKey) {
      // this makes 'g_json/test/arrai[0]/asdf' -> 'g_json/test/arrai/0/asdf'
      this.keyToTitlePath[nodeKey] = currentTitlePath.filter(x => x !== '' ).join('/');
      this.keyToTitlePath[nodeKey.replace(/\[(\d+)\]/g, '/$1')] = this.keyToTitlePath[nodeKey];
    }

    for (var i = 0; i < node.children.length; i++) {
      this.titlePathRecurse(node.children[i], currentTitlePath, node.isArray(), i);
    }

    if ( node.children.length === 0 ) {
      // most probably empty arrays come here, should check tho... #TODO
      if (node.formElement && node.formElement.items && node.formElement.items.length > 0) {
        for (var i = 0; i < node.formElement.items.length; i++) {
          this.titlePathRecurseItems(node, node.formElement.items[i], currentTitlePath);
        }
      }
    }
  }
  FormTree.prototype.setupTitlePaths = function () {
    this.titlePathRecurse(this.root);
  }

  // Remove all the MERGEs in the schema, so its only ONCE!
  FormTree.prototype.normalizeSchemaMerges = function () {
    TB.schemaCache = {}; // clear the tbjsonAjv2Tb cache, should be a function
    var propertiesKeys = Object.keys(this.formDesc.schema.properties);
    for (var i = 0; i < propertiesKeys.length; i++) {
      var propertyKey = propertiesKeys[i];

      if (_.isPlainObject(this.formDesc.schema.properties[ propertyKey ]) 
        && this.formDesc.schema.properties[ propertyKey ].$merge) {
    
        this.formDesc.schema.properties[ propertyKey ] = tbjsonAjv2Tb.getSchemaByJsonPointer(this.formDesc.schema, '/' + propertyKey);
      }
    }
  }

  FormTree.prototype.initialize = function (formDesc, preserveParentSchema) {

    var start_time600 = Date.now();
    formDesc = formDesc || {};

    formDesc.currentValue = {};

    if (!preserveParentSchema) {
      jsonform.value = formDesc.value;
      jsonform.schema = formDesc.schema;
    }

    /**
     * parse the fields array and transform all shorthand notations
     * (string keys) to objects with a key property
     */
    _.each(formDesc.form.fields, function (element, index) {
      if (typeof element === 'string' && element !== '*') {
        formDesc.form.fields.splice(index, 1, {'key': element});
      }
    });

    // Keep a pointer to the initial JSONForm
    // (note clone returns a shallow copy, only first-level is cloned)
    this.formDesc = _.clone(formDesc);
    //todo
    this.formDesc.cache = {};

    jsonform.defaultClasses = getDefaultClasses(this.formDesc.form.cssFramework ||
      jsonform.cssFramework);
    this.defaultClasses = _.clone(jsonform.defaultClasses);

    if (this.formDesc.form.defaultClasses) {
      _.extend(this.defaultClasses, this.formDesc.form.defaultClasses);
    }

    // Compute form prefix if no prefix is given.
    this.formDesc.form.prefix = this.formDesc.form.prefix ||
      'tb-jf-' + _.uniqueId();

    // JSON schema shorthand
    if (this.formDesc.schema && !this.formDesc.schema.properties) {
      this.formDesc.schema = formDesc.schema;
    }

    this.formDesc._originalContent = _.cloneDeep(this.formDesc.content);

    this.formDesc._originalSchema = this.formDesc.schema;
    this.formDesc.schema = _.cloneDeep(this.formDesc.schema);

    this.normalizeSchemaMerges();

    TB.schemaCache[ this.formDesc.schema['$schemaId'] ] = {};

    // Ensure layout is set
    this.formDesc.form.fields = this.formDesc.form.fields || [ '*' ];

    // Purposefully commented out ASSERT
    // ASSERT.isArray(this.formDesc.form.fields, {msg: 'The form fields property must be an array.', code: 3170});
    if ( _.isPlainObject(this.formDesc.form.fields) ) {
      var tempArray = [];
      for (var key in this.formDesc.form.fields) {
        if(this.formDesc.form.fields.hasOwnProperty(key)){
          // Making the hash an array
          tempArray.push(this.formDesc.form.fields[key]);
        }
      }

      // And sort by ordering
      tempArray.sort(function(a, b){ return a.ordering > b.ordering ? 1 : -1; });

      this.formDesc.form.fields = tempArray;
    }


    this.formDesc.params = this.formDesc.params || {};

    // Create the root of the tree
    this.root = new FormNode();
    this.root.ownerTree = this;
    this.root.isRoot = true;
    this.root.view = jsonform.elementTypes['root'];

    // Generate the modified schema
    // todo
    this.modifySchema();

    var start_time = Date.now();
    console.info("\t\tFormTree.initialize: Begin stuff: Time taken: " + (start_time - start_time600) + "ms");
    // Generate the tree from the form description
    this.buildTree();
    var end_time = Date.now();
    console.info("\t\tFormTree.initialize: FormTree.buildTree() called! Time taken: " + (end_time - start_time) + "ms");

    // this.computeGridLayoutWidth();
    this.initializeValidator();

    start_time = Date.now();
    // Compute the values associated with each node
    // (for arrays, the computation actually creates the form nodes)
    var mergedData = _.merge(this.formDesc.value, this.formDesc.currentValue);
    end_time = Date.now();
    console.info("\t\tFormTree.initialize: Merge of val and currentval called! Time taken: " + (end_time - start_time) + "ms");
    start_time = Date.now();
    this.computeInitialValuesCacheForFullData = _.cloneDeep(mergedData);
    end_time = Date.now();
    console.info("\t\tFormTree.initialize: cloneDeep called! Time taken: " + (end_time - start_time) + "ms");
    start_time = Date.now();

    this.computeInitialValues();
    end_time = Date.now();
    console.info("\t\tFormTree.initialize: FormTree.computeInitialValues() called! Time taken: " + (end_time - start_time) + "ms");
    console.info("\t\t\tFormTree.initialize: FormTree.computeInitialValues() First steps Time taken: " + TB.performance.compute_initial_values_first_part + "ms");
    console.info("\t\t\tFormTree.initialize: FormTree.computeInitialValues() Second steps Time taken: " + TB.performance.compute_initial_values_second_part + "ms");
    console.info("\t\t\t\tFormTree.initialize: FormTree.computeInitialValues() Second steps - apply array path  Time taken: " + TB.performance.compute_initial_values_apply_array_path + "ms");
    console.info("\t\t\t\tFormTree.initialize: FormTree.computeInitialValues() Second steps - apply template to node Time taken: " + TB.performance.compute_initial_values_apply_template_to_node + "ms");
    console.info("\t\t\t\t\tFormTree.initialize: FormTree.computeInitialValues() Second steps - apply template to node - first step Time taken: " + TB.performance.compute_initial_values_apply_template_to_node_first_step + "ms");
    console.info("\t\t\t\t\tFormTree.initialize: FormTree.computeInitialValues() Second steps - apply template to node - second step Time taken: " + TB.performance.compute_initial_values_apply_template_to_node_second_step + "ms");
    console.info("\t\t\t\t\tFormTree.initialize: FormTree.computeInitialValues() Second steps - apply template to node - third step Time taken: " + TB.performance.compute_initial_values_apply_template_to_node_third_step + "ms");
    console.info("\t\t\t\t\t\tFormTree.initialize: FormTree.computeInitialValues() Second steps - apply template to node - third step - regex Time taken: " + TB.performance.compute_initial_values_apply_template_to_node_third_step_some_regex + "ms");
    console.info("\t\t\t\t\t\tFormTree.initialize: FormTree.computeInitialValues() Second steps - apply template to node - third step - extend Time taken: " + TB.performance.compute_initial_values_apply_template_to_node_third_step_some_extend + "ms");
    console.info("\t\t\t\t\t\tFormTree.initialize: FormTree.computeInitialValues() Second steps - apply template to node - third step - templating Time taken: " + TB.performance.compute_initial_values_apply_template_to_node_third_step_some_templating + "ms");

    console.info("\t\tFormTree.initialize: FormTree.computeInitialValuesApplying: Time taken: ", totalInAppliyingStuffms, "ms");
    start_time = Date.now();
    this.setupTitlePaths();
    end_time = Date.now();
    console.info("\t\tFormTree.initialize: FormTree.setupTitlePaths() called! Time taken: " + (end_time - start_time) + "ms");
  };


  FormTree.prototype.modifySchema = function () {
    //Make the new modified schema
    //setMultilanguageField -> schemaElement properties!
    //updateRequiredProperties -> слага required
    // ако има merge -> трябва да ни даде новия обект в схемата!
    // ако има ref -> resolve, и ако стигне до безкрайна рекурсия -> връща се едно ниво назад, и я прави (ако не сработи, просто заеби, ще сложим лимити)

    // var schema = this.formDesc.schema;
    //@todo for a galaxy far far away!

  };

  FormTree.prototype.postInitialization = function () {
  };

  /**
   * Constructs the tree from the form description.
   *
   * The function must be called once when the tree is first created.
   *
   * @function
   */

  var defaultForm = {
    form: {
        gridLayout: false,
        required: false,
        validate: true,
        liveValidation: false,
        hideErrors: false,
        enableReset: false,
        enableUndo: false,
        enableRedo: false,
        preview: false,
        readOnly: false,
        useTitleAsPlaceholder: false,
        isSearchable: false,
        isMultilanguage: false,
        isTranslatable: false,
        isStrict: true,
        isDebug: false,
        textareaLengthLimit: 1000000,
        maxLength: 10000,
        minLength: 0,
        minItems: 0,
        maxItems: 1000000,
        searchableLimit: 100,
        minimum: Number.MIN_SAFE_INTEGER,         // Number.MIN_VALUE is the closes number to 0
        maximum: Number.MAX_SAFE_INTEGER,
        exclusiveMinimum: false,
        exclusiveMaximum: false,
        deprecatedValue: '! ',
        maxDate: '2100-01-19T03:14:07',
        minDate: '0000-01-01T00:00:00',
        minTime: 'T00:00:00',
        maxTime: 'T23:59:59',
        localeTabs: true,
        enableSorting: false,
        enableAddingItems: true,
        enableDeletingItems: true,
        enableFieldLockOnSearch: true,
        uniqueItems: true,
        displaySystemButtonsLabels: true,
        displayCompressedTables: false,
        filePreviewHeight: 200,
        filePreviewWidth: 200,
        maximumFilePreviewHeight: 2000,
        maximumFilePreviewWidth: 2000,
        titleImagePreviewDefault: 'imageTitle',
        thumbnailImageDefault: 'thumbnail',
        redirectImageDefault: 'fullImage',
        oldPasswordTitle: 'Old Password',
        newPasswordTitle: 'New Password',
        confirmNewPasswordTitle: 'Confirm New Password',
        nullValueTitle: 'none',
        maxValuesToVisualise: 10,
        defaultRefColTitleKeys: ['name', 'fullDescr', 'full_descr'],
        expectingSearchValue: false,
        identitySeparator: undefined,
        identityTarget: '',
        lineSeparatorPattern: undefined,
				commentPattern: undefined,
        lineSeparatorTarget: '',
        parseContainerPlaceholder: 'Something to parse...',
        parseDelimiterLabel: 'delimiter:',
        displayCompact: false,
        showParseboxOnly: false,
        extraUnits: false,
        buttonFloat: 'left',
        noGridPadding: false,
        defaultNumberOfItems: 1
    },
    // locales: [this.formDesc.originalLocale]
  };

    //todo @momo rename schema to align with standart (tbjson convention)
    var jfDescriptorSchema = {
      type: 'object',
      id: 'http://jschemas.tbpro.com/tblib/metaschema',
      $schemaId: 'http://jschemas.tbpro.com/tblib/metaschema',
      definitions: {
        unique: {
          uniqueItems: true
        },
        array: {
          type: 'array'
        },
        boolean: {
          type: 'boolean',
          constraintMsg: 'Invalid form property: $DATA_PATH$'
        },
        string: {
          type: 'string'
        },
        number: {
          type: 'number'
        },
        positiveNumber: {
          type: 'number',
          minimum: 0
        },
        object: {
          type: 'object'
        },
        dataRef: {
          type: 'object',
          properties: {
            $data: {
              type: 'string'
            }
          }
        },
        numberOrDataRef: {
          constraintMsg: 'Invalid form property: $DATA_PATH$',
          oneOf: [
            {
              $ref: '#/definitions/number'
            },
            {
              $ref: '#/definitions/dataRef'
            }
          ]
        },
        positiveNumOrDataRef: {
          constraintMsg: 'Invalid form property: $DATA_PATH$',
          oneOf: [
            {
              $ref: '#/definitions/positiveNumber'
            },
            {
              $ref: '#/definitions/dataRef'
            }
          ]
        },
        booleanOrDataRef: {
          constraintMsg: 'Invalid form property: $DATA_PATH$',
          oneOf: [
            {
              $ref: '#/definitions/boolean'
            },
            {
              $ref: '#/definitions/dataRef'
            }
          ]
        },
        uniqueArray: {
          constraintMsg: 'Invalid form property: $DATA_PATH$',
          type: 'array',
          uniqueItems: true
          /* $merge: {
             source: { $ref: '#/definitions/array' },
             with:   { $ref: '#/definitions/unique', },
           }, */
        },
        uniqueStringArray: {
          constraintMsg: 'Invalid form property: $DATA_PATH$',
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string'
          } /*
          $merge: {
            source: { $ref: '#/definitions/uniqueArray' },
            with:   { items: {type: 'string' }, },
          } */
        },
        objectArray: {
          constraintMsg: 'Invalid form property: $DATA_PATH$',
          type: 'array',
          items: {
            type: 'object'
          } /*
          $merge: {
            source: {$ref: '#/definitions/array',},
            with:   {items: { type: 'object', },},
          } */
        },
        ArrayOfStrings: {
          constraintMsg: 'Invalid form property: $DATA_PATH$',
          /* $merge: {
            source: {$ref: '#/definitions/array',},
            with:   {items: { type: 'string' }},
          } */
          type: 'array',
          items: {
            type: 'string'
          }
        },
        ArrayOfStringsOrStringOrBoolean: {
          constraintMsg: 'Invalid form property: $DATA_PATH$',
          oneOf: [
            {
              type: 'array',
              items: {
                type: 'string'
              }
              // $ref: '#/definitions/ArrayOfStrings',
            },
            {
              type: 'boolean'
              // $ref: '#/definitions/boolean',
            }, {
              type: 'string'
              // $ref: '#/definitions/string',
            }
          ]
        }
      },

      required: ['jsonformVersion', '$schemaId'],
      properties: {
        hideErrors: { $ref: '#/definitions/boolean' },
        gridLayout: { $ref: '#/definitions/boolean' },
        validate: { $ref: '#/definitions/boolean' },
        liveValidation: { $ref: '#/definitions/boolean' },
        preview: { $ref: '#/definitions/boolean' },
        readOnly: { $ref: '#/definitions/boolean' },
        isSearchable: { $ref: '#/definitions/boolean' },
        isMultilanguage: { $ref: '#/definitions/boolean' },
        useTitleAsPlaceholder: { $ref: '#/definitions/boolean' },
        isTranslatable: { $ref: '#/definitions/boolean' },
        isStrict: { $ref: '#/definitions/boolean' },
        isDebug: { $ref: '#/definitions/boolean' },
        enableAddingItems: { $ref: '#/definitions/boolean' },
        enableDeletingItems: { $ref: '#/definitions/boolean' },
        uniqueItems: { $ref: '#/definitions/boolean' },
        enableReset: { $ref: '#/definitions/boolean' },
        enableUndo: { $ref: '#/definitions/boolean' },
        enableRedo: { $ref: '#/definitions/boolean' },
        enableFieldLockOnSearch: { $ref: '#/definitions/boolean' },
        displaySystemButtonsLabels: { $ref: '#/definitions/boolean' },
        displayCompressedTables: { $ref: '#/definitions/boolean' },
        localeTabs: { $ref: '#/definitions/boolean' },
        enableSorting: { $ref: '#/definitions/boolean' },
        inline: { $ref: '#/definitions/boolean' },

        deprecatedValue: { $ref: '#/definitions/string' },
        maxDate: { $ref: '#/definitions/string' },
        minDate: { $ref: '#/definitions/string' },
        oldPasswordTitle: { $ref: '#/definitions/string' },
        newPasswordTitle: { $ref: '#/definitions/string' },
        $schemaId: { $ref: '#/definitions/string' },
        confirmPasswordTitle: { $ref: '#/definitions/string' },
        key: { $ref: '#/definitions/string' },
        jsonformVersion: { $ref: '#/definitions/string' },
        content: { $ref: '#/definitions/string' },
        description: { $ref: '#/definitions/string' },
        inlinetitle: { $ref: '#/definitions/string' },
        type: { $ref: '#/definitions/string' },
        nullValueTitle: { $ref: '#/definitions/string' },

        locales: { $ref: '#/definitions/uniqueArray' },

        searchableLimit: { $ref: '#/definitions/positiveNumber' },

        minItems: { $ref: '#/definitions/positiveNumOrDataRef' },
        maxItems: { $ref: '#/definitions/positiveNumOrDataRef' },
        minLength: { $ref: '#/definitions/positiveNumOrDataRef' },

        maxLength: { $ref: '#/definitions/numberOrDataRef' },
        minimum: { $ref: '#/definitions/numberOrDataRef' },
        maximum: { $ref: '#/definitions/numberOrDataRef' },

        exclusiveMinimum: { $ref: '#/definitions/booleanOrDataRef' },
        exclusiveMaximum: { $ref: '#/definitions/booleanOrDataRef' },

        enum: { $ref: '#/definitions/ArrayOfStrings' },
        required: { $ref: '#/definitions/ArrayOfStringsOrStringOrBoolean' },

        pluginOptions: { $ref: '#/definitions/object' },
        toggleNextMap: { $ref: '#/definitions/object' },
        titleMap: { $ref: '#/definitions/object' },
        options: { $ref: '#/definitions/object' },
        templateData: { $ref: '#/definitions/object' },

        fields: {
          $ref: '#/definitions/array',
          items: {
             /* $merge: {
               source: { $ref: '#', },
               with:   { required: null, },
             }, */
            oneOf: [
              {
                $ref: '#/definitions/string'
              }, {
                $ref: '#/propertiesNotRoot'
              }
            ]
          }
        }
      },
      propertiesNotRoot: {
        properties: {
          hideErrors: { $ref: '#/definitions/boolean' },
          gridLayout: { $ref: '#/definitions/boolean' },
          validate: { $ref: '#/definitions/boolean' },
          liveValidation: { $ref: '#/definitions/boolean' },
          preview: { $ref: '#/definitions/boolean' },
          readOnly: { $ref: '#/definitions/boolean' },
          isSearchable: { $ref: '#/definitions/boolean' },
          isMultilanguage: { $ref: '#/definitions/boolean' },
          useTitleAsPlaceholder: { $ref: '#/definitions/boolean' },
          isTranslatable: { $ref: '#/definitions/boolean' },
          isStrict: { $ref: '#/definitions/boolean' },
          isDebug: { $ref: '#/definitions/boolean' },
          enableAddingItems: { $ref: '#/definitions/boolean' },
          enableDeletingItems: { $ref: '#/definitions/boolean' },
          uniqueItems: { $ref: '#/definitions/boolean' },
          enableReset: { $ref: '#/definitions/boolean' },
          enableUndo: { $ref: '#/definitions/boolean' },
          enableRedo: { $ref: '#/definitions/boolean' },
          enableFieldLockOnSearch: { $ref: '#/definitions/boolean' },
          displaySystemButtonsLabels: { $ref: '#/definitions/boolean' },
          displayCompressedTables: { $ref: '#/definitions/boolean' },
          localeTabs: { $ref: '#/definitions/boolean' },
          enableSorting: { $ref: '#/definitions/boolean' },
          inline: { $ref: '#/definitions/boolean' },

          deprecatedValue: { $ref: '#/definitions/string' },
          maxDate: { $ref: '#/definitions/string' },
          minDate: { $ref: '#/definitions/string' },
          oldPasswordTitle: { $ref: '#/definitions/string' },
          newPasswordTitle: { $ref: '#/definitions/string' },
          $schemaId: { $ref: '#/definitions/string' },
          confirmPasswordTitle: { $ref: '#/definitions/string' },
          key: { $ref: '#/definitions/string' },
          jsonformVersion: { $ref: '#/definitions/string' },
          content: { $ref: '#/definitions/string' },
          description: { $ref: '#/definitions/string' },
          inlinetitle: { $ref: '#/definitions/string' },
          type: { $ref: '#/definitions/string' },
          nullValueTitle: { $ref: '#/definitions/string' },

          locales: { $ref: '#/definitions/uniqueArray' },

          searchableLimit: { $ref: '#/definitions/positiveNumber' },

          minItems: { $ref: '#/definitions/positiveNumOrDataRef' },
          maxItems: { $ref: '#/definitions/positiveNumOrDataRef' },
          minLength: { $ref: '#/definitions/positiveNumOrDataRef' },

          maxLength: { $ref: '#/definitions/numberOrDataRef' },
          minimum: { $ref: '#/definitions/numberOrDataRef' },
          maximum: { $ref: '#/definitions/numberOrDataRef' },

          exclusiveMinimum: { $ref: '#/definitions/booleanOrDataRef' },
          exclusiveMaximum: { $ref: '#/definitions/booleanOrDataRef' },

          enum: { $ref: '#/definitions/ArrayOfStrings' },

          required: { $ref: '#/definitions/ArrayOfStringsOrStringOrBoolean' },

          pluginOptions: { $ref: '#/definitions/object' },
          toggleNextMap: { $ref: '#/definitions/object' },
          titleMap: { $ref: '#/definitions/object' },
          options: { $ref: '#/definitions/object' },
          templateData: { $ref: '#/definitions/object' },

          fields: {
            $ref: '#/definitions/array',
            items: {
               /* $merge: {
                 source: { $ref: '#', },
                 with:   { required: null, },
               }, */
              oneOf: [
                {
                  $ref: '#/definitions/string'
                }, {
                  $ref: '#/propertiesNotRoot'
                }
              ]
            }
          }
        }
      }
    };

  FormTree.prototype.buildTree = function () {
    var start_time = Date.now();

    // declare global defaults if none are specified
    this.formDesc.form.originalLocale = this.formDesc.form.originalLocale || 'multilanguage_default';
    defaultForm.locales = this.formDesc.locales || [this.formDesc.originalLocale || this.formDesc.locale];

    var formDescDefault = _.cloneDeep(defaultForm);
    this.formDesc = _.merge(formDescDefault, this.formDesc);


    this.formDesc.validator.compile(jfDescriptorSchema);
    if (!this.formDesc.validator.validate(jfDescriptorSchema, this.formDesc.form)) {
      var resultString = '\n';
      for (var i = 0; i < this.formDesc.validator.ajv.errors.length; i++) {
        resultString += 'problem area->' + (this.formDesc.validator.ajv.errors[i].dataPath ? this.formDesc.validator.ajv.errors[i].dataPath : '/') + ' \nReason: ' + this.formDesc.validator.ajv.errors[i].message + '\n\n';
      }

      ASSERT_USER(0, {msg: resultString, code: 3180});
    }

    ASSERT(_.isString(this.formDesc.form.nullValueTitle), {msg: 'Invalid nullValueTitle', code: 3535});

    var start_time1 = Date.now();

    console.log("\t\t\tbuildTree: misc: Time taken: " + (start_time1 - start_time) + "ms");

    var buildFromLayoutTime = 0;
    var appendChildNodeTime = 0;

    var currentCounter = 1;
    // Parse and generate the form structure based on the elements encountered
    _.each(this.formDesc.form.fields, function (formElement) {
      ASSERT(!_.isUndefined(formElement));
      // construct a form using every single schema element except
      // the private properties jsonformVersion and id
      // and any non-default form items (only used for the "other" field in the checkbox element type)
      var child = null;

      if (formElement === '*') {
        // make sure that the keys are in alphabetical order to guarantee the same ordering every time.
        // This is needed as the order of elements is not guaranteed in objects/hashes.
        // If a specific order must be used the form.fields array must specify it.
        _.each(getSortedPropertyKeys(this.formDesc.schema.properties), function (key) {
          if (key === 'jsonformVersion' ||
            key === 'id' ||
            (this.formDesc.form.nonDefaultFormItems &&
              this.formDesc.form.nonDefaultFormItems.indexOf(key) >= 0)) {
            return;
          }
          if (key == '*') {
            return;
          }


          child = this.buildFromLayout({
            key: key,
            currentCounterArray: [ currentCounter ]
          });
          if (child) {
            this.root.appendChildNode(child);
          }

          currentCounter += 1;
        }.bind(this));
      } else {
        // convert all strings to valid form members
        // form ['schemaKey'] => form [{key: 'schemaKey'}]
        if (_.isString(formElement)) {
          formElement = {
            key: formElement,
          };
        }

        formElement.currentCounterArray = [ currentCounter ];
        var start_time_bfl = Date.now();
        child = this.buildFromLayout(formElement);
        var start_time_bfl1 = Date.now();
        buildFromLayoutTime += start_time_bfl1 - start_time_bfl;

        if (child) {
          var start_time_acn = Date.now();
          this.root.appendChildNode(child);
          var start_time_acn1 = Date.now();

          appendChildNodeTime += (start_time_acn1 - start_time_acn);
        }

        currentCounter += 1;
      }
    }.bind(this));
    
    // this.formDesc.schema = this.root.

    var start_time2 = Date.now();
    console.log("\t\t\tbuildTree: foreachField: Time taken: " + (start_time2 - start_time1) + "ms");
    console.log("\t\t\tbuildTree: buildFromLayout Time taken: " + buildFromLayoutTime + "ms");
    console.log("\t\t\t\tbuidTreeBuildFromLayout: firstPath Time taken: " + this.performance.fieldPropertiesAndIncludedFormTimeTaken + "ms");
    console.log("\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty Time taken: " + this.performance.buildFromLayoutOnKeydProperty + "ms");
    console.log("\t\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty: GetSchema1  Time taken: " + this.performance.buildFromLayoutOnKeydPropertyGetSchema + "ms");
    console.log("\t\t\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty: GetSchema1 jsonformPointerToJsonPointer Time taken: " + TB.performance.tbjson_ajv2tb_getSchemaByJsonPointer_jsonformPointerToJsonPointer + "ms");
    console.log("\t\t\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty: GetSchema1 getNewSchemaResolver Time taken: " + TB.performance.tbjson_ajv2tb_getSchemaByJsonPointer_getNewSchemaResolver + "ms");
    console.log("\t\t\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty: GetSchema1 SchemaResolver.getByPointer Time taken: " + TB.performance.tbjson_ajv2tb_getSchemaByJsonPointer_schemaResolver_getByPointer + "ms");
    console.log("\t\t\t\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty: GetSchema1 SchemaResolver.getByPointer ParsePointer Time taken: " + TB.performance.tbjson_schemaResolver_parse_pointer_and_assign + "ms");
    console.log("\t\t\t\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty: GetSchema1 SchemaResolver.getByPointer Looping Time taken: " + TB.performance.tbjson_schemaResolver_looping_stuff + "ms");
    console.log("\t\t\t\t\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty: GetSchema1 SchemaResolver.getByPointer Looping Resolve1  Time taken: " + TB.performance.tbjson_schemaResolver_loop_resolve_schema + "ms");
    console.log("\t\t\t\t\t\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty: GetSchema1 SchemaResolver.getByPointer Looping Resolve1 ResolveRefs Time taken: " + TB.performance.tbjson_schemaResolver_resolve_refs + "ms");
    console.log("\t\t\t\t\t\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty: GetSchema1 SchemaResolver.getByPointer Looping Resolve1 ResolveMerge Time taken: " + TB.performance.tbjson_schemaResolver_resolve_merge + "ms");
    console.log("\t\t\t\t\t\t\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty: GetSchema1 SchemaResolver.getByPointer Looping Resolve1 ResolveMerge LodashMerge Time taken: " + TB.performance.tbjson_schemaResolver_resolve_merge_lodash_merge + "ms");
    console.log("\t\t\t\t\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty: GetSchema1 SchemaResolver.getByPointer Looping AnyOneOf Time taken: " + TB.performance.tbjson_schemaResolver_loop_searchOneAnyOf + "ms");
    console.log("\t\t\t\t\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty: GetSchema1 SchemaResolver.getByPointer Looping ObjArray Time taken: " + TB.performance.tbjson_schemaResolver_loop_in_arr + "ms");
    console.log("\t\t\t\t\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty: GetSchema1 SchemaResolver.getByPointer Looping final AnyOf Time taken: " + TB.performance.tbjson_schemaResolver_loop_inAnyOf + "ms");
    console.log("\t\t\t\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty: GetSchema1 SchemaResolver.getByPointer ResolveSchema Time taken: " + TB.performance.tbjson_schemaResolver_resolve_schema + "ms");
    console.log("\t\t\t\t\tbuidTreeBuildFromLayout: buildFromLayoutOnKeydProperty: GetParentSchema1 Time taken: " + this.performance.buildFromLayoutOnKeydPropertyParentSchema + "ms");
    console.log("\t\t\tbuildTree: appendChildNodeTime Time taken: " + appendChildNodeTime + "ms");

    // if (this.formDesc.form.gridLayout === true &&
    //   this.root.children.length > 0) {
    //   this.computeGridLayoutWidth(this.root.children, this.root);
    // }
    
    var start_time3 = Date.now();
    console.log("\t\t\tbuildTree: computeGridLayoutWidth: Time taken: " + (start_time3 - start_time2) + "ms");
  };

  function hasAtleastOneProperty (schemaElement) {
    return (schemaElement.properties && Object.keys(schemaElement.properties).length > 1) ||
       (schemaElement.additionalProperties && Object.keys(schemaElement.additionalProperties).length > 1);
  }

  function isForeignKeyField (schemaElement) {
    return (schemaElement.refCol && schemaElement.refTable)
      || (schemaElement.items && isForeignKeyField( schemaElement.items ));
  }

  function getForeignKeyFields (self, schemaElement, formElement) {
    ASSERT(isForeignKeyField( schemaElement), { msg: "Key should be fkey..." });

    var lookUpInItems = false;
    if ( schemaElement.items && ! schemaElement.refCol ) {
      lookUpInItems = true;
    }

    var foreignData = {};

    var refColTitle;
    var refCol;
    var refTable;
    var refTableView;

    if ( lookUpInItems ) {
      refColTitle = schemaElement.items.refColTitle;
      refCol = schemaElement.items.refCol;
      refTable = schemaElement.items.refTable;
      refTableView = schemaElement.items.refTableView || refTable;
    } else {
      refColTitle = schemaElement.refColTitle;
      refCol = schemaElement.refCol;
      refTable = schemaElement.refTable;
      refTable = schemaElement.refTable;
      refTableView = schemaElement.refTableView || refTable;
    }

    if ( refColTitle === undefined ) {
/*
      var currentResources = self.formDesc.resources[ refTableView ].records;
      var resource = currentResources[0] || {};
      if ( refColTitle === undefined ) {
        _.each(formElement.defaultRefColTitleKeys, function(refColKeyCandidate){
          if ( resource[refColKeyCandidate] !== undefined ) {
            refColTitle = refColKeyCandidate;
            return false;
          }
        });

      }
*/
      // fallback mechanism
      if ( refColTitle === undefined ) { refColTitle = refCol; }
    }


    return { refCol: refCol, refColTitle: refColTitle, refTable: refTable, lookUpInItems: lookUpInItems, refTableView: refTableView };
  }

  function isParentElementMultilanguage (parentSchema, formElementParent) {
    // TODO: make a decision regarding the inheritance of limits & options, who defines the input type ...
    /*
     * the locale fields which were generated from the additional properties object of their parentSchema
     * have an empty formElement. They will inherit the global defaults, but other properties can be set
     * in the additionalProperties object of the translatable field.
     */
    return parentSchema && parentSchema.isMultilanguage === true && formElementParent;
  }

  function isElementMultilanguage (schemaElement) {
    /*
    * Expand the schema element of multilanguage fields
    */
    return schemaElement.isMultilanguage === true;
  }

  function checkValidMinMaxDates (formElement) {
    var minDateTimestamp = Date.parse(TB.normalizeDate(formElement.minDate));
    var maxDateTimestamp = Date.parse(TB.normalizeDate(formElement.maxDate));

    // if both dates cannot be converted to unix time
    // it possibly consists of no date part and a time part (T10:04:45)
    if (moment) {
      if (isNaN(minDateTimestamp) && isNaN(maxDateTimestamp)) {
        minDateTimestamp = moment(formElement.minDate);
      }

      if (isNaN(minDateTimestamp)) {
        maxDateTimestamp = moment(formElement.maxDate);
      }
    }

    ASSERT(isNaN(maxDateTimestamp) === false, {msg: 'Error while building form: maxDate is not a valid date.', code: 3740});
    ASSERT(isNaN(minDateTimestamp) === false, {msg: 'Error while building form: minDate is not a valid date.', code: 3750});
    ASSERT(maxDateTimestamp >= minDateTimestamp, {msg: 'Error while building form: maxDate cannot be smaller than formElement.minDate.', code: 3760});
  }

  function filterOptionsToArray(filterOptions) {

    var result = [];
    if (filterOptions) {
      var sortedPropertyKeys = getSortedPropertyKeys(filterOptions);

      for (var i = 0; i < sortedPropertyKeys.length; i++) {
        var schemaObj = filterOptions[ sortedPropertyKeys[i] ];
        if (schemaObj.searchBy) {
          result.push( {title: schemaObj.title, id: sortedPropertyKeys[i], type: schemaObj.type});
        }
      }
    }

    return result;
  }

  function setForeignKeyField (node, schemaElement, formElement, formTree) {
    var currSchemaElement = schemaElement;
    if (schemaElement.refCol == null && schemaElement.items && schemaElement.items.refCol != null) {
      // this means the foreign key is inside the key. JF wants it this way ;) # TODO - make it don't, if we can.
      currSchemaElement = currSchemaElement.items;
    }

    ASSERT.isStringOrNil(
      currSchemaElement.refCol, {code: 3850, msg: 'Error while building form: refCol is of unrecognized type for schema key $KEY$', msgParams: {KEY: formElement.key} });
    ASSERT.isStringOrNil(
      currSchemaElement.refTable,
      { code: 3855, msg: 'Error while building form: refTable is of unrecognized type for schema key $KEY$', msgParams: {KEY: formElement.key}});
    ASSERT.isStringOrNil(
      currSchemaElement.refColTitle,
      { code: 3857, msg: 'Error while building form: refColTitle is of unrecognized type for schema key $KEY$', msgParams: {KEY: formElement.key}});
    ASSERT.isNumber(formElement.searchableLimit, {code: 3860, msg: 'Error while building form: searchableLimit is of unrecognized type for schema key $KEY$', msgParams: {KEY: formElement.key}});

    ASSERT(
      jsonform.elementTypes[formElement.type].isSearchableField === true,
      {msg: 'Error while building form: foreign key field $KEY$ has an invalid schema type $TYPE$ (only select-like fields are valid)',
        msgParams: {KEY: formElement.key, TYPE: formElement.type},
        code: 3870}
    );

    // Maybe fix this so its an ASSERT?
    // if(!formElement.filterForm) return;

    // var resolvedSchema = jfUtils.resolveRefs(formTree.formDesc.schema, currSchemaElement.filterSchema, true);

    // ASSERT.isPlainObject(schemaElement.filterSchema, {msg: 'Error while building form: filterSchema is of unrecognized type for schema key $KEY$', msgParams: {KEY: formElement.key}, code: 3880});

    //ASSERT(
    //  !_.isEmpty(schemaElement.filterSchema),
    //  {code: 3890, msg: 'Error while building form: filterSchema is empty schema key $KEY$', msgParams: {KEY: formElement.key}}
    //);

    //ASSERT.isArrayOrNil(schemaElement.searchableValues, {msg: 'Error while building form: searchableValues is of unrecognized type for schema key $KEY$', msgParams: {KEY: formElement.key}, code: 3900});
  }

  function appendNoResultSpan ($filtersTreeElem) {
    var $span = $('<span></span>');

    //Todo: probably put it out of the code and into the data? todo
    // translations need it to be in the schema
    $span.text('No results found!');
    $span.css('color', '#be495f');
    $span.css('display', 'none');

    $filtersTreeElem.find('fieldset > div').append($span);
  }


  function setMultilanguageParentField (parentSchema, formElementParent, schemaElement, formElement, formTree) {
      // some formElement properties should not be inherited (id, name...) therefore we whitelist only the ones we need
      var propertyArray = [
        'title', 'legend', 'description',
        'append', 'prepend', 'helpvalue', 'placeholder',
        'required', 'readOnly', 'preview', 'textareaLengthLimit',
        'minLength', 'maxLength', 'minDate', 'maxDate', 'format', 'formatMinimum', 'formatMaximum', 'formatExclusiveMaximum', 'formatExclusiveMinimum'
      ];

      if (jfUtils.contains(schemaElement.type, 'number') ||
        jfUtils.contains(schemaElement.type, 'integer')) {
        propertyArray.splice(0, 0, 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum');
      }

      // in case no "type" is specified in the additionalProperties object in the form
      // use the type of the parent element
      if (formElementParent.additionalProperties &&
        !_.isNil(formElementParent.additionalProperties.type)) {
        propertyArray.splice(0, 0, 'type');
      } else {
        // TODO deprecate and rely only on additionalProperties
        formElement.type = formElementParent.parentType;
      }

      _.each(propertyArray, function (property) {
        if (formTree.formDesc && !_.isNil(formTree.formDesc[property])) {
          formElement[property] = formTree.formDesc[property];
        } else if (parentSchema.additionalProperties[property]) {
          formElement[property] = parentSchema.additionalProperties[property];
        } else {
          formElement[property] = undefined;
        }

        if (formElementParent.additionalProperties &&
          !_.isNil(formElementParent.additionalProperties[property])) {
          formElement[property] = formElementParent.additionalProperties[property] ||
            formElement[property];
        }
      });

      // check this!
      // console.info(formElementParent.localeTabs);
      // if (!formElementParent.localeTabs) {

      // use node.getTitle() instead
      // formElement.title = (_.isUndefined(formElement.title) ? '' : formElement.title + ' ') + schemaElement.legend;


      // formElement.title = formElement.title + ' ' + schemaElement.legend; -> if the formElement is undefined?

      // }
  }

  function setMultilanguageField (schemaElement, formElement, formTree) {
    formElement.localeTabs = !_.isNil(formElement.localeTabs) ? formElement.localeTabs : formTree.formDesc.form.localeTabs;

    ASSERT(jfUtils.contains(schemaElement.type, 'object'), {msg: 'Only objects with child templates specified in additionalProperties can become translatable fields. Form Key: $FORM_KEY$', msgParams: { FORM_KEY: formElement.key }, code: 3780});
    ASSERT.isBoolean(formElement.localeTabs, {msg: 'formElement.localeTabs is not valid.', code: 3790});

    schemaElement.properties = {};
    var localeName;
    for (var i = 0, j = formTree.formDesc.locales.length - 1; i <= j; i++) {

      if (_.isString(formTree.formDesc.locales[i])) {
        localeName = formTree.formDesc.locales[i];
      } else if (_.isPlainObject(formTree.formDesc.locales[i]) &&
        formTree.formDesc.locales[i].hasOwnProperty('locale') &&
        _.isString(formTree.formDesc.locales[i].locale)) {
        localeName = formTree.formDesc.locales[i].locale;
      } else {
        ASSERT(false, {msg: 'Invalid locale definition for array element locales[$INDEX$]', msgParams: {INDEX: i}, code: 3800});
      }

      schemaElement.properties[localeName] = _.clone(schemaElement.additionalProperties, true);

      // Uncommenct this if you want the title in the localename
      // var legendName = (schemaElement.additionalProperties.title || formElement.title || schemaElement.title) + ' ' + localeName;
      var legendName = localeName;

      schemaElement.properties[localeName].legend = legendName;
      schemaElement.properties[localeName].title  = legendName;
    }


    // if a type is specified for the parent element keep it and use it for its' children
    formElement.parentType = formElement.type;

    // TODO this shouldn't be here
    // TODO @momo защо? какво е това?
    if (formElement.localeTabs) {
      formElement.type = 'tabobject';
    } else {
      formElement.type = 'fieldset';
    }
  }

  function getAnyOfIdsByParentFormElements (formElement) {
    var current = formElement;
    let anyOfIds = [];
    while (current) {
      if (current.anyOfId) {
        anyOfIds.unshift(current.anyOfId);
      }
      current = current.parent;
    }
    return anyOfIds.length ? anyOfIds : undefined;
  }

  function getSchemaElement (schemaElement, formElement, formTree, node) {
    // var inCreation = node.ownerTree == null; // questionable
    // if (inCreation) simoCurrent = null;

    var schemaEl = schemaElement || tbjsonAjv2Tb.getSchemaByJsonPointer( formTree.formDesc.schema, formElement.key, undefined, getAnyOfIdsByParentFormElements(formElement) || _.cloneDeep(node.anyOfIds));
    if (formTree.formDesc.ignore_missing_check 
        && ! schemaEl ) {
      return {
        "title": "MISSING_IGNORE",
        "type": ["string", "null", "object", "array"],
      };
    }

    ASSERT(schemaEl, { code: 3540,
        msg: 'The form element ' + formElement.title + ' references the schema key ' + formElement.key + ' but that key does not exist in the JSON schema',
    });

    return schemaEl;
  }

  var getFormElementType = function (formElement, schemaElement) {
    var eltype = formElement.type || guessFormPlugin(schemaElement, formElement);
    let acceptedElementTypes = Object.keys( jsonform.elementTypes );

    let assertSecondParam = {
        msg: 'The JSONForm contains an unknown form type $TYPE$ for schema key $KEY$',
        code: 3920,
        msgParams: {
            TYPE: formElement.type, 
            KEY: formElement.key,
            type: eltype, 
            formEl: formElement, 
            schemaEl: schemaElement,
            acceptedTypes: acceptedElementTypes,
        },
    };

    ASSERT( jsonform.elementTypes[eltype], assertSecondParam);
    ASSERT( jsonform.elementTypes[formElement.type], assertSecondParam);

    return eltype;
  };

  var hasParentSchema = function (schemaElement) {
    return schemaElement ? true : false;
  };

  var formElementHasInputField = function (type) {
    return jsonform.elementTypes[type].inputfield;
  };

  var addValueHistoryButtons = function (node, formElement) {
    // TODO extend a local object and call _.defaults only once per input
    // not once for each form property

    var globalHistoryControls = {
      enableReset: node.formDesc.form.enableReset,
      enableRedo: node.formDesc.form.enableRedo,
      enableUndo: node.formDesc.form.enableUndo
    };

    _.defaults(formElement, globalHistoryControls, formElement);
  };

  var isObjectWithoutItems = function (schemaElement, formElement) {
    return  jfUtils.contains(schemaElement.type, 'object') &&
          (!formElement.items || formElement.items.length === 0) &&
          schemaElement.type !== 'helptext';
  };

  var iterateCreateAndAppendChildrenOfObject = function (schemaElement, formElement, formTree, formNode) {
    /**
     * If the form element targets an "object" in the JSON schema,
     * we need to recurse through the list of children to create an
     * input field per child property of the object in the JSON schema
     */

    var alphaKeys = getSortedPropertyKeys(schemaElement.properties);


    var currentCounter = 1;
    _.each(alphaKeys, function (propName) {
      var key = formElement.key + '/' + propName;
      var childFormElement = {
        key: key,
        currentCounterArray: _.clone(formNode.currentCounterArray)
      };
      childFormElement.currentCounterArray.push(currentCounter);


      if (formTree.formDesc.form.nonDefaultFormItems &&
        formTree.formDesc.form.nonDefaultFormItems.indexOf(key) >= 0) {
        return;
      }

      var childSchema = schemaElement.properties[propName];

      // TODO @momo, @suricactus това е временно тук, трябва да се разкара ASAP!
      if(Object.keys(childSchema).length === 1 && !childSchema.type) {
        return;
      }

      var child = formTree.buildFromLayout(childFormElement, formElement, childSchema);

      if (child) {
        currentCounter++;

        formNode.appendChildNode(child);
      }

    }.bind(formTree));

  };

  var isAnyOfWithoutItems = function (schemaElement, formElement) {
    return schemaElement.anyOf &&
      (!formElement.items || formElement.items.length === 0) &&
      schemaElement.type !== 'helptext';
  }

  var getAnyOfId = function (alternative) {
    ASSERT(
      alternative &&
      alternative.properties &&
      alternative.properties.anyOfId &&
      alternative.properties.anyOfId.enum &&
      alternative.properties.anyOfId.enum.length === 1,
      'anyOf alternatives must have anyOfId property with one possible value', {alternative}
    );

    return alternative.properties.anyOfId.enum[0];
  }

  var iterateCreateAndAppendChildrenOfAnyOf = function (schemaElement, formElement, formTree, formNode) {
    var currentCounter = 1;
    _.each(schemaElement.anyOf, function (alternative) {
      var key = formElement.key;
      var childFormElement = {
        type: 'section',
        key: key,
        anyOfId: getAnyOfId(alternative),
        currentCounterArray: _.clone(formNode.currentCounterArray),
        items: []
      };

      childFormElement.currentCounterArray.push(currentCounter);

      var alphaKeys = getSortedPropertyKeys(alternative.properties);

      _.each(alphaKeys, function (propName, propIndex) {
        if (propName === 'anyOfId') {
          return;
        }

        if (formTree.formDesc.form.nonDefaultFormItems &&
          formTree.formDesc.form.nonDefaultFormItems.indexOf(key) >= 0) {
          return;
        }
        
//        if(formTree && formTree.formDesc && formTree.formDesc.content && formTree.formDesc.content[key] && formTree.formDesc.content[key][propName]){
//            formNode.activeChildIdx = propIndex;
//        }

        childFormElement.items.push({ key: formElement.key + '/' + propName });
      })

      var child = formTree.buildFromLayout(childFormElement, formElement, alternative);

      if (child) {
        currentCounter++;
        formNode.appendChildNode(child);
      }
    }.bind(formTree));
  };

  var isMultipleCheckboxes = function (schemaElement, formElement) {
    return (formElement.type === 'checkboxes' || formElement.type === 'checkboxbuttons') &&
        schemaElement.items
  };

  var updateRequiredProperties = function (schemaElement, parentSchema, formElement) {
    /**
     * add the required formElements to the required fields in the schema
     * this guarantees that the elements will be present in the final json
     */
    var propertyKey = formElement.key.split('/').pop();

    if (formElement.required && !schemaElement.readOnly) {
      if (parentSchema.required && _.isArray(parentSchema.required)) {
        if (parentSchema.required.indexOf(propertyKey) === -1) {
          parentSchema.required.push(propertyKey);
        }
      } else {
        parentSchema.required = [propertyKey];
      }
    } else {
      if (parentSchema.required && _.isArray(parentSchema.required)) {
        if (parentSchema.required.indexOf(propertyKey) >= 0) {
          parentSchema.required.pop(propertyKey);

          /**
           * according to json schema required must be an array with at least one element
           * therefore remove it if it has no elements
           */
          if (parentSchema.required.length === 0) {
            delete parentSchema.required;
          }
        }
      }
    }

  };

  var validateEnums = function (enums, schemaElement, formElement, deprecatedValue, formDesc) {

    _.each(enums, function (value) {
      jsonform.util.validateValueType(
        formElement.key,
        schemaElement,
        formElement,
        deprecatedValue,
        value,
        true,
        formDesc
      );
    });
  }

  var validateEnumNames = function (schemaElement) {
    ASSERT(
      schemaElement['enum'].length === schemaElement['enumNames'].length,
      {
        msg: 'Schema enum and enumNames must have the same length for $SCHEMAELEMENT$',
        msgParams: {SCHEMAELEMENT: schemaElement},
        code: 3950
      }
    );
  }

  var guessFormPlugin = function (schemaElement, formElement) {
    // TODO @momo идеята на това е да стане глобална настройка на JF какъв плъгин искаш да се ползва при определени условия. Превръщаме кода в данни :)
    var defaults111 = {
      guessedPlugins: {
        IS_FOREIGN_KEY: 'select',
        FORMAT_COLOR: 'color',
        FORMAT_PASSWORD: 'changepassword',
        FORMAT_DATE: 'datepicker',
        FORMAT_DATETIME: 'datetimepicker',
        FORMAT_TIME: 'timepicker',
        FORMAT_BASE64FILE: 'base64file',
        FORMAT_FILE: 'file',
        LONG_TEXT: 'textarea',
        TEXT: 'text',
        NUMBER: 'number',
        INTEGER: 'number',
        BOOLEAN_VISUALISOR: 'select',
        TAB_OBJECT: 'tabobject',
        FIELD_SET: 'fieldset',
        SELECT_FIELD_SET: 'selectfieldset',
        LONG_TEXT_OBJECT: 'textarea',
        MULTIPLE_SELECT: 'multipleselect',
        SELECT: 'select',
        CONTAINS_ARRAY: 'array',
        CONTAINS_TEXT: 'text',
        CONTAINS_NUMBER: 'number',
        FORMAT_GENERIC_HTML: 'genericHTML',
        PREVIEW_IMAGE: 'imagepreview',
        FORMAT_HTML: 'tinymce',
      }
    };

    var guessFormPluginsRules = {
      IS_FOREIGN_KEY:      { o: 100,  check: function (s, f) { return s['refCol'] && s['refTable'] } },
      PREVIEW_IMAGE:       { o: 250,  format: 'imagePreview' },
      FORMAT_HTML:         { o: 400,  format: 'html' },
      FORMAT_GENERIC_HTML: { o: 500,  format: 'genericHTML' },
      FORMAT_COLOR:        { o: 1000, type: 'string', format: 'color' },
      FORMAT_PASSWORD:     { o: 2000, type: 'string', format: 'changepassword' },
      FORMAT_DATE:         { o: 3000, type: 'string', format: ['iso8601date', 'date'] },
      FORMAT_DATETIME:     { o: 4000, type: 'string', format: ['iso8601datetime', 'date-time'] },
      FORMAT_TIME:         { o: 5000, type: 'string', format: ['iso8601time', 'time'] },
      FORMAT_BASE64FILE:   { o: 6000, type: 'string', format: 'base64file' },
      FORMAT_FILE:         { o: 7000, type: 'string', format: 'file' },
      LONG_TEXT:           { o: 8000, type: 'string', check: function (s, f) { return s.maxLength > s.textareaLengthLimit; } },
      TEXT:                { o: 9000, type: 'string', check: function (s, f) { return !s['enum']; } },
      NUMBER:              { o: 10000, type: 'number', check: function (s, f) { return !s['enum']; } },
      INTEGER:             { o: 11000, type: 'integer', check: function (s, f) { return !s['enum']; } },
      BOOLEAN_VISUALISOR:  { o: 12000, type: 'boolean' },

      SELECT_FIELD_SET:    { o: 12500, check: function (s, f) { return !_.isUndefined(s.anyOf); } },
      TAB_OBJECT:          { o: 13000, type: 'object', check: function (s, f) { return hasAtleastOneProperty(s); } },
      FIELD_SET:           { o: 14000, type: 'object', check: function (s, f) { return !hasAtleastOneProperty(s); } },
      LONG_TEXT_OBJECT:    { o: 15000, type: 'object', check: function (s, f) { return !s.properties; } },

      MULTIPLE_SELECT:     { o: 16000, type: 'array', check: function (s, f) { return s.items && ( !_.isUndefined(s.items['enum']) || isForeignKeyField(s) ); } },
      SELECT:              { o: 17000, check: function (s, f) { return !_.isUndefined(s['enum']); } },

      CONTAINS_ARRAY:      { o: 18000, check: function (s, f) { return _.isArray(s.type) && jfUtils.contains(s.type, 'array'); } },
      CONTAINS_TEXT:       { o: 19000, check: function (s, f) { return _.isArray(s.type) && jfUtils.contains(s.type, 'string'); } },
      CONTAINS_NUMBER:     { o: 20000, check: function (s, f) { return _.isArray(s.type) && (jfUtils.contains(s.type, 'number') || jfUtils.contains(s.type, 'integer')); } },
    };

    if (!formElement.type) {
      var arr = [];
      for (var key in guessFormPluginsRules) {
        arr.push({
          'key': key,
          'order': guessFormPluginsRules[key].o
        });
      }
      arr.sort(function (first, second) {
        return first.order - second.order;
      });

      var i, j;
      for (i = 0, j = arr.length; i < j; i++) {
        var rule = guessFormPluginsRules[ arr[i].key ];

        if (rule.type && !jfUtils.contains(schemaElement.type, rule.type)) continue;
        if (rule.format && !jfUtils.contains(rule.format, schemaElement.format)) continue;
        if (rule.check && !rule.check(schemaElement, formElement)) continue;

        formElement.type = defaults111.guessedPlugins[ arr[i].key ];
        break;
      }
    }

    if (!formElement.type) {
      if (_.isString(schemaElement.type)) {
        formElement.type = schemaElement.type;
      } else if (_.isArray(schemaElement.type)) {
        formElement.type = schemaElement.type[0];
      }
    }

    return formElement.type;
  };

  // check extendFormElementProps() for more explanation for this format

  /**
  * @typedef {Object.<String, formEnhancerRuleEntry>} formEnhancerRule
  */

  /**
  * @typedef {Object} formEnhancerRuleEntry
  * @property {String} [alts[].prop]
  * @property {String} [type]
  * @property {Boolean} [req]
  * @property {Boolean} [$data]
  * @property {Boolean} [escape]
  * @property {Boolean} [modSchema]
  * @property {Array<Object>} [alts]
  * @property {String} [alts[].src] source object. Possible values:
    - f  - search the property in the current formElement (plain json defintion)
    - p  - search the property somewhere in the ascendants of the formElement
    - ff - search the property in the form root
    - s  - search the property in the current schema element
    - sp - search the property in the schema parent element
  * @property {String} [alts[].prop] the key of the source object

  */

  /**
  * @type {Object.<String, formEnhancerRule>}
  */
  var rules = {
    common: {
      name: { alts: [{ src: 'f', prop: 'key' }], escape: true, type: 'string', req: true },
      title: { alts: [{ src: 's' }, { src: 'f'/*, prop: 'name'*/ }], /*escape: true, */ type: 'string' },
      description: { alts: [{ src: 's' }], escape: true, type: 'string' },
      legend: { escape: true, type: 'string' },
      placeholder: { escape: true, type: 'string' },
      oldPasswordTitle: { alts: [{ src: 'ff' }], escape: true, type: 'string', req: true },
      newPasswordTitle: { alts: [{ src: 'ff' }], escape: true, type: 'string', req: true },
      confirmNewPasswordTitle: { alts: [{ src: 'ff' }], escape: true, type: 'string', req: true },
      isSearchable: { alts: [{ src: 'ff' }], type: 'boolean', req: true },
      searchableLimit: { alts: [{ src: 'ff' }], type: 'integer', req: true },
      displaySystemButtonsLabels: { alts: [{ src: 'ff' }], type: 'boolean', req: true },
      useTitleAsPlaceholder: { alts: [{ src: 'ff' }], type: 'boolean', req: true },
      minDate:  { alts: [{ src: 's' }, { src: 'ff' }], type: 'string', req: true },
      maxDate:  { alts: [{ src: 's' }, { src: 'ff' }], type: 'string', req: true },
      minTime:  { alts: [{ src: 's' }, { src: 'ff' }], type: 'string', req: true },
      maxTime:  { alts: [{ src: 's' }, { src: 'ff' }], type: 'string', req: true },
      readOnly: { alts: [{ src: 's' }, { src: 'p' },  { src: 'sp' }, { src: 'ff' }, { src: 'f', prop: 'preview' }], type: 'boolean', $data: true, req: false },
      preview:  { alts: [{ src: 's' }, { src: 'fp' }, { src: 'ff' }], type: 'boolean', $data: true, req: true },
      expectingSearchValue:   { alts: [{ src: 'ff' }] , type: 'boolean', req: true },
      defaultRefColTitleKeys: { alts: [{ src: 'ff' }] , type: 'array',   req: true },
      expandedIncludedKeys: { alts: [{ src: 'p' }], type: 'boolean' },
      buttonFloat:  { alts: [{ src: 'f' }, { src: 'p' }, { src: 'ff'}], type: 'string', $data: true, req: true},
      noGridPadding:  { alts: [{ src: 'ff' }, { src: 'f' }], type: 'boolean', $data: true, req: true}
    },
    string: {
      minLength: { alts: [{ src: 's' }, { src: 'ff' }], type: 'integer', modSchema: true, $data: true, req: true },
      maxLength: { alts: [{ src: 's' }, { src: 's', prop: 'fileMaxSize' },  { src: 'ff', prop: 'textareaLengthLimit' }, { src: 'ff' }], type: 'integer', modSchema: true, $data: true, req: true },
      textareaLengthLimit: { alts: [{ src: 's' }, { src: 'ff' }], type: 'integer', req: true },
    },
    number: {
      minimum: { alts: [{ src: 's' }, { src: 'ff' }], type: 'integer', modSchema: true, $data: true, req: true },
      maximum: { alts: [{ src: 's' }, { src: 'ff' }], type: 'integer', modSchema: true, $data: true, req: true },
      exclusiveMinimum: { alts: [{ src: 's' }, { src: 'ff' }], type: 'boolean', modSchema: true, $data: true, req: true },
      exclusiveMaximum: { alts: [{ src: 's' }, { src: 'ff' }], type: 'boolean', modSchema: true, $data: true, req: true },
      extraUnits: { alts: [{ src: 'f' }], type: ['boolean', 'array'], $data: true}
    },
    array: {
      minItems: { alts: [{ src: 's' }, { src: 'ff' }], type: 'integer', $data: true, req: true },
      maxItems: { alts: [{ src: 's' }, { src: 'ff' }], type: 'integer', $data: true, req: true },
      enableAddingItems: { alts: [{ src: 's' }, { src: 'ff' }], type: 'boolean', $data: true, req: true },
      enableDeletingItems: { alts: [{ src: 's' }, { src: 'ff' }], type: 'boolean', $data: true, req: true },
      enableSorting: { alts: [{ src: 's' }, { src: 'ff' }], type: 'boolean', $data: true, req: true },
      uniqueItems: { alts: [{ src: 's' }, { src: 'ff' }], type: 'boolean', $data: true, req: true },
      identityTarget: { alts: [{ src: 'ff' }], escape: true, type: 'string', req: true },
      lineSeparatorPattern: { alts: [{ src: 'ff' }], type: 'string' },
      commentPattern: { alts: [{ src: 'ff' }], type: 'string' },
      lineSeparatorTarget: { alts: [{ src: 'ff' }], escape: true, type: 'string', req: true },
      parseContainerPlaceholder: { alts: [{ src: 'ff' }], escape: true, type: 'string', req: true },
      parseDelimiterLabel: { alts: [{ src: 'ff' }], escape: true, type: 'string', req: true },
      displayCompact: { alts: [{ src: 's' }, { src: 'ff' }], type: 'boolean', $data: true, req: true },
      showParseboxOnly: { alts: [{ src: 's' }, { src: 'ff' }], type: 'boolean', $data: true, req: true },
      defaultNumberOfItems: { alts: [{ src: 's' }, { src: 'ff' }], type: 'integer', $data: true, req: true },
    }
  };

  /**
   * Looks in different sources to set the properties of form element
   * @param  {Object} rules Hash containing all the rules to be applied for each property
   * @param  {Object} s     Schema element
   * @param  {Object} f     Form element
   * @param  {Object} ff    Root form element
   * @return {Object}       Form element
   * @example
   *     // alts -> alternatives to look in case not found in formElement hash, ordered by priority starting from most important
   *     // alts.src -> source where to merge from: f (FormElement), s (SchemaElement), ff (RootForm), fp (formElementParent)
   *     // alts.prop -> name of the property to use from src. By default is current property name.
   *     // req -> required property
   *     // $data -> allow value to be JSONSchema $data
   *     // type -> allowed types of property value
   *     var rules {
   *       name: { alts: [{ src: 's', prop: 'key'}], escape: true, type: 'string', req: true },
   *     };
   */

  var extendFormElementProps = function (rules, s, f, ff, fp, sp) {
    /** @var {String} prop Property name (title, minItems etc) */
    for (var prop in rules) {
      var rule = rules[ prop ];
      var val = f[ prop ];

      // value is the final value of the property. If it's not defined, look for an alternative
      if (_.isNil(val) && rule.alts) {
        for (var i = 0, l = rule.alts.length; i < l; i++) {
          var propAlt = rule.alts[ i ];

          if (propAlt.src === 'f') { // formElement
            val = f[ propAlt.prop || prop ];
          } else if (propAlt.src === 'p') { // Some parent

            var current = f.parent;
            while( current ) {

              val = current[ propAlt.prop || prop ];
              if (!_.isNil(val)) break;
              current = current.parent;

            }

          } else if (propAlt.src === 's') { // schemaElement
            val = s[ propAlt.prop || prop ];
          } else if (propAlt.src === 'ff') { // rootForm
            val = ff[ propAlt.prop || prop ];
          } else if (propAlt.src === 'fp') { // parentForm
            val = fp[ propAlt.prop || prop ];
          } else if (propAlt.src === 'sp') { // parentSchema
            val = sp[ propAlt.prop || prop ];
          } else {
            ASSERT(0, { code: 3600, msg: 'Unknown source given $src$ on rule $rule$', msgParams: { src: propAlt.src, rule: rule } });
          }

          // if value found, stop looking for an alternative
          if (!_.isNil(val)) break;
        }
      }

      // some properties like titles, description etc should be escaped
      if (!_.isNil(val) && rule.escape) {
        val = _.escape(val);
      }

      // some properties are required
      if (rule.req) {
        ASSERT.isNotNil(val, { code: 3610, msg: 'Missing required property $prop$. Check msgParams for additional data.', msgParams: { prop: prop, rule: rule, formElement: f } });
      }

      // check property type equals to any of json types
      if (!_.isNil(val) && rule.type) {
        var typeRecognizedFromValue = jfUtils.getJsonType(val, true);
        var valid = jfUtils.contains(rule.type, typeRecognizedFromValue);

        // check json schema $data property for more info
        if (!valid && rule.$data) {
          valid = _.isPlainObject(val) && val.$data;
        }

        //ASSERT(0, { code: 3620, msg: 'Property $prop$ does not have proper type. Prop definition says $rule$ but $val$ given', msgParams: { prop: prop, val: val, rule: rule, formElement: f } });
        ASSERT(valid, { code: 3620, msg: 'Property $prop$ does not have proper type. Prop definition says $rule$ but $val$ given', msgParams: { prop: prop, val: val, rule: rule, formElement: f } });
      }

      f[ prop ] = val;

      // some rules want to update schema with value found
      if (rule.modSchema) {
        s[ prop ] = val;
      }
    }
  };

  /**
   * Builds the internal form tree representation from the requested layout.
   *
   * The function is recursive, generating the node children as necessary.
   * The function extracts the values from the previously submitted values
   * (this.formDesc.value) or from default values defined in the schema.
   *
   * @function
   * @param {Object} formElement JSONForm element to render
   * @param {Object} the parents' form element
   * @return {Object} The node that matches the element.
   */
  FormTree.prototype.buildFromLayout = function (formElement, formElementParent, schemaElement) {
    // todo: find a reasonable way to check if key is present.
    // ASSERT_PEER(this.keyToNode[formElement.key] == null, {msg: 'Duplicate fields with matching keys detected.', msgParams: {duplicateKey: formElement.key}, code: 1010});

    if (formElement.isTemplateField) {
      return;
    }

    var node = new FormNode();
    node.currentCounterArray = _.clone(formElement.currentCounterArray);
    formElement.parent = formElementParent;

    ASSERT(formElement.key === undefined || !formElement.key.match(/~[^013467]/), 'JF no longer supports "~", please use "~0".');

    this.performance.fieldPropertiesAndIncludedFormTimeTaken = this.performance.fieldPropertiesAndIncludedFormTimeTaken || 0;
    this.performance.buildFromLayoutOnKeydProperty = this.performance.buildFromLayoutOnKeydProperty || 0;
    this.performance.buildFromLayoutOnKeydPropertyGetSchema = this.performance.buildFromLayoutOnKeydPropertyGetSchema || 0;
    this.performance.buildFromLayoutOnKeydPropertyParentSchema = this.performance.buildFromLayoutOnKeydPropertyParentSchema || 0;

    var start_time = Date.now();

    if (this.formDesc.form.fieldProperties && this.formDesc.form.fieldProperties[formElement.key]) {
      var tmpObject = {};
      var extension = this.formDesc.form.fieldProperties[formElement.key];

      var originalAnyOfId = formElement.anyOfId;
      var parentsAnyOfIds = getAnyOfIdsByParentFormElements(formElementParent);
      var currentElementAnyOfId = formElement.anyOfId || (parentsAnyOfIds ? parentsAnyOfIds[0] : null);

      if (extension.anyOfs) {
        extension = extension.anyOfs[currentElementAnyOfId];
      }

      if (_.isUndefined(extension.anyOfId) || (extension.anyOfId === currentElementAnyOfId)) {
        // The form extension should have priority over the one defined in the real form!
        _.merge(tmpObject, formElement, extension);
        formElement = tmpObject;
        formElement.anyOfId = originalAnyOfId;
      }
    }

    if ( formElement.includeForm && (_.isUndefined(formElement.parent) || !formElement.parent.expandedIncludedKeys)) {
      formElement.expandedIncludedKeys = true;

      var keyContext = formElement.key;
      var foreignFormId = formElement.includeForm;

      // cloneDeep because we need a brand new foreign form
      var clonedForeignForms = _.cloneDeep(this.formDesc.form.includedForms);

      jfUtils.prependFormKeysWithString(clonedForeignForms[foreignFormId], keyContext + '/', clonedForeignForms);
      formElement.items = clonedForeignForms[foreignFormId].fields;
      formElement.type = 'section';
    }

    if (formElementParent) {
      node.parent = formElementParent;
    } else {
      node.parent = this.root;
    }

    /**
     * The form element parameter directly comes from the initial
     * JSONForm object. We'll make a shallow copy of it and of its children
     * not to pollute the original object.
     * (note JSON.parse(JSON.stringify()) cannot be used since there may be
     * event handlers in there!)
     */
    formElement = _.clone(formElement);
    if (formElement.items) {
      if (_.isArray(formElement.items)) {
        formElement.items = _.map(formElement.items, _.clone);
      } else {
        formElement.items = [_.clone(formElement.items)];
      }
    }

    if(formElement && formElement.type && formElement.type === 'tabobject') {
      //ASSERT(_.isArray(formElement.items), "FormElement items must be defined: " + formElement.title + formElement.key + formElement.legend + (schemaElement ? schemaElement.legend : '' ) + (schemaElement ? schemaElement.title : '' ) + (schemaElement ? schemaElement.key : '' ), "JFASS666");
      //ASSERT(formElement.items.length > 0, "FormElement items must not be empty: " + formElement.title + formElement.key + formElement.legend + (schemaElement ? schemaElement.legend : '' ) + (schemaElement ? schemaElement.title : '' ) + (schemaElement ? schemaElement.key : '' ), "JFASS777");
    }

    var start_time1 = Date.now();
    this.performance.fieldPropertiesAndIncludedFormTimeTaken += (start_time1 - start_time);

    /**
     * The form element is directly linked to an element in the JSON
     * schema. The properties of the form element override those of the
     * element in the JSON schema. Properties from the JSON schema complete
     * those of the form element otherwise.
     */
    if (formElement.key && formElement.type !== 'helptext') {
      var start_time2 = Date.now();

      this.keyToNode[ formElement.key ] = node;

      var anyOfIdsWithKeys = [];
      var currentAnyOfIdHolder = formElement;
      while (currentAnyOfIdHolder != undefined) {
        if (currentAnyOfIdHolder.anyOfId) {
          let anyOfIdKey = currentAnyOfIdHolder.key || currentAnyOfIdHolder.parent.key;
          let anyOfIdKeyArr = anyOfIdKey.split('/');
          anyOfIdKey = anyOfIdKeyArr.filter(keyItem=>keyItem).join('/');

          anyOfIdsWithKeys.push({
            anyOfId: currentAnyOfIdHolder.anyOfId,
            key: anyOfIdKey
          });
        }
        currentAnyOfIdHolder = currentAnyOfIdHolder.parent;
      }

      if ( anyOfIdsWithKeys.length ) {
        node.anyOfIds = anyOfIdsWithKeys.map((anyOfIdWithKey)=>anyOfIdWithKey.anyOfId);
      }
      
      // TODO maybe move this code out of here?
      if (formElement.anyOfId) {
        // TODO for this to work with nested anyOfs it should be an array of ids, and push and pop it
        // this.anyOfIds = [formElement.anyOfId]; // = anyOfIdParent;
        var start_time21 = Date.now();
        schemaElement = getSchemaElement(schemaElement, formElement, this, node);
        if (schemaElement) {
          this.keyToSchemaTitle[formElement.key] = schemaElement.legend || schemaElement.title;
        }
        var start_time22 = Date.now();

        if (!formElement.items) {
          formElement.items = [];

          for (var propName in schemaElement.properties) {
            if (propName == 'anyOfId') {
              continue;
            }

            formElement.items.push({key: formElement.key + '/' + propName});
          }
        }

        formElement.items.push({
          type: 'hidden',
          key: formElement.key + '/anyOfId',
          ignoreHiddenNoValue: true // workaround so jf doesnt complain about a hidden field with no value when enableDefault is false
        });
      } else {
        var start_time21 = Date.now();
        schemaElement = getSchemaElement(schemaElement, formElement, this, node);
        if (schemaElement) {
          this.keyToSchemaTitle[formElement.key] = schemaElement.legend || schemaElement.title;
        }
        var start_time22 = Date.now();

      }

      this.performance.buildFromLayoutOnKeydPropertyGetSchema += start_time22 - start_time21;

      var parentSchema = getParentSchemaByKey(this.formDesc, formElement.key, this, node, formElement);

      this.parentSchema = parentSchema;
      if (this.parentSchema && this.parentSchema.required && _.isArray(this.parentSchema.required)) {
        for (var i = 0; i < this.parentSchema.required.length; i++)  {
          var requiredField = this.parentSchema.required[i];
          if (schemaElement.readOnly && requiredField === formElement.key) {
            ASSERT(0, "SchemaElement \"" + formElement.key + "\" can not be both REQUIRED and READONLY, because it will not be validated correctly and stuff like that", formElement, schemaElement);
          }
        }
      }

      if (schemaElement && schemaElement.isUIHidden === true) {
        return;
      }

      var start_time23 = Date.now();
      this.performance.buildFromLayoutOnKeydPropertyParentSchema += start_time23 - start_time22;


      if ( isParentElementMultilanguage(parentSchema, formElementParent) ) {
        setMultilanguageParentField(parentSchema, formElementParent, schemaElement, formElement, this);
      }

      var ff = this.formDesc.form;
      formElementParent = formElementParent || {};
      parentSchema = formElementParent || {};

      extendFormElementProps(rules.common, schemaElement, formElement, ff, formElementParent, parentSchema);

      formElement.placeholder = formElement.placeholder || (formElement.useTitleAsPlaceholder ? formElement.title : undefined);

      if (formElement.rowWidth != null) {
        ASSERT(formElement.rowWidth > 0, {msg: "Form Field rowWidth must be at least 1.", code: 3640}, formElement);
        ASSERT(formElement.rowWidth < 13, {msg: "Form Field rowWidth must be at most 12.", code: 3650}, formElement);
      }

      // elements with no title - title will get generated in node.getTitle()
      // ASSERT(formElement.title.length >= 1, {msg: 'Every field must have a title, but schema element $KEY$ does not have one.', msgParams: {KEY: formElement.key}, code: 3560});

      if (jfUtils.contains(schemaElement.type, 'string')) {
        // non-null fields must have strings of lenght higher than 0
        if (!jfUtils.contains(schemaElement.type, 'null')) {
          formElement.minLength = 1;
        }

        extendFormElementProps(rules.string, schemaElement, formElement, ff);
      } else if (jfUtils.contains(schemaElement.type, ['integer', 'number'])) {
        extendFormElementProps(rules.number, schemaElement, formElement, ff);
      } else if (jfUtils.contains(schemaElement.type, 'array')) {
        extendFormElementProps(rules.array, schemaElement, formElement, ff);
      }

      checkValidMinMaxDates(formElement);

      if ( isElementMultilanguage(schemaElement) ) {
        schemaElement= _.cloneDeep(schemaElement);
        setMultilanguageField(schemaElement, formElement, this);
      }

      // TODO @momo: put this in the imagePreview контролка, and not in the core of the library
      if (schemaElement.format === 'imagePreview') {
        ASSERT(schemaElement.readOnly, {msg: "Image Preview should have readOnly set to true!", code: 3805});
      }

      var schemaType = _.isArray(schemaElement.type) ? schemaElement.type : [schemaElement.type];
      formElement.required = _.isEmpty(_.intersection(schemaType, ['array', 'object', 'null']));
      if (
        _.isEmpty(_.intersection(schemaType, ['null'])) && 
        ! _.isEmpty(_.intersection(schemaType, ['object'])) &&
        formElement.type === "jsoneditor"
      ) {
        formElement.required = true; // uf
      }

      if (schemaType.includes('array') && schemaElement.minItems != undefined && schemaElement.minItems > 0) {
        formElement.required = true;
      }

      if (hasParentSchema(parentSchema)) {
        updateRequiredProperties(schemaElement, parentSchema, formElement);
      }

      // json schema version 4
      if (_.isArray(formElement.required)) {
        ASSERT(!_.isEmpty(formElement.required), {msg: 'Error while building form: required must be a non-empty array.', code: 3830});
      } else {
        ASSERT.isBoolean(formElement.required, {msg: 'Error while building form: required must be a boolean.', code: 3840});
      }

      formElement.type = getFormElementType(formElement, schemaElement);
      if (formElement.type === 'selectfieldset') {
        this.selectFieldSetData = this.selectFieldSetData || [];

        if (formElement && formElement.key) {
          this.selectFieldSetData.push(formElement.key);
        }
      }

      if ( isForeignKeyField(schemaElement) ) {
        setForeignKeyField(node, schemaElement, formElement, this);
      }

      if (formElementHasInputField(formElement.type)) {
        addValueHistoryButtons(this, formElement);
      }

      // Compute the ID of the input field
      formElement.id = formElement.id || formElement.key;

      if ( anyOfIdsWithKeys.length > 0 ) {
        for (const {anyOfId, key} of anyOfIdsWithKeys) {
          formElement.id = formElement.id.replace(key, `${key}|||${anyOfId}`);
        }
      }

      this.keyIdToNode[ formElement.id ] = node;

      if (formElement.preview &&
        jsonform.elementTypes[formElement.type].inputfield) {
        formElement.type = 'preview';
      }

      // Unless overridden in the definition of the form element (or unless
      // there's a titleMap defined), use the enumeration list defined in
      // the schema
      if (
        formElement.options ||
        (formElement.type === 'select' && schemaElement && isForeignKeyField(schemaElement))
      ) {
        // FIXME: be careful certain type of form elements may have special format for options
        formElement.options = formElement.options || [];
        prepareOptions(schemaElement, formElement, this.formDesc.form.nullValueTitle);
      } else if ( ! schemaElement.isIncluded && (
					schemaElement['enum'] ||
        	(schemaElement.items && schemaElement.items['enum']) ||
        	jfUtils.contains(schemaElement.type, 'boolean')
				)
			) {

        var schemaEnum = null;
        var itemsEnum = null;

        if (schemaElement.enum) {
          schemaEnum = schemaElement.enum;

          validateEnums(schemaEnum, schemaElement, formElement, this.formDesc.form.deprecatedValue, this.formDesc);

          if (schemaElement.enumNames) {
            validateEnumNames(schemaElement);
          }

        }

        if (schemaElement.items && schemaElement.items.enum) {
          itemsEnum = schemaElement.items.enum;

          validateEnums(itemsEnum, schemaElement.items, formElement, this.formDesc.form.deprecatedValue, this.formDesc);

          if (schemaElement.items.enumNames) {
            validateEnumNames(schemaElement.items);
          }
        }

        ASSERT(
          Boolean(schemaEnum && itemsEnum) === false, { code: 3970, msg: 'Invalid Schema: Schema elements cannot have more than 1 enum. A schema element  with key $KEY$ contains enums in its body and in its items object', msgParams: {KEY: formElement.key} }
        );

        var enumValues = schemaEnum || itemsEnum;
        if (!enumValues) {
          //NEED: if the need arises for a third option, put it here!
          schemaElement.enumNames = ['YES', 'NO'];
          schemaElement.enum =  [true, false];
          enumValues = [true, false];
        }

        prepareOptions(schemaElement, formElement, this.formDesc.form.nullValueTitle, enumValues);
      }

      if (jfUtils.contains(schemaElement.type, 'null')) {
        if (schemaElement.enum && !schemaElement.enum.includes(null)) {
          schemaElement.enum.unshift(null);
          if (schemaElement.enumNames != null) {
            schemaElement.enumNames.unshift(this.formDesc.form.nullValueTitle);
          }
        }
      }

      // TODO: fix it
      if (formElement.options && jfUtils.contains(schemaElement.type, 'null') && (formElement.type !== 'orderedselect')) {
        appendNullOptionIfNotDefined(schemaElement, formElement, this.formDesc.form.nullValueTitle);
      }

      if( isMultipleCheckboxes(formElement, schemaElement) ) {

        var theItem = (_.isArray(schemaElement.items))
          ? schemaElement.items[0]
          : schemaElement.items;

        if (formElement.options) {
          // options only but no enum mode, since no enum, we can use only the value mode
          prepareOptions(schemaElement, formElement, this.formDesc.form.nullValueTitle);
          theItem._jsonform_checkboxes_as_array = 'value';
        } else {
          enumValues = theItem['enum'];

          if (enumValues) {
            prepareOptions(schemaElement, formElement, this.formDesc.form.nullValueTitle, enumValues);
            theItem._jsonform_checkboxes_as_array = (formElement.type === 'checkboxes')
              ? true
              : 'value';
          }
        }
      }

      // This shouldn't be here
      if (formElement.getValue === 'tagsinput') {
        schemaElement._jsonform_get_value_by_tagsinput = 'tagsinput';
      }

      if (isObjectWithoutItems(schemaElement, formElement) && !formElement.anyOfId) {
        if (schemaElement.properties) {
            iterateCreateAndAppendChildrenOfObject(schemaElement, formElement, this, node);
        }
      }

      if (isAnyOfWithoutItems(schemaElement, formElement)) {
        iterateCreateAndAppendChildrenOfAnyOf(schemaElement, formElement, this, node);
      }

      if (schemaElement.enumNames !== undefined) {
        this.enumNamesData[ formElement.key ] = schemaElement.enumNames;
        this.enumData[ formElement.key ] = schemaElement.enum;
      }

      if (schemaElement.items && schemaElement.items.enumNames !== undefined) {
        this.enumNamesData[ formElement.key ] = schemaElement.items.enumNames;
        this.enumData[ formElement.key ] = schemaElement.items.enum;
      }

      var start_time3 = Date.now();
      this.performance.buildFromLayoutOnKeydProperty += (start_time3 - start_time2);
    } else {

      ASSERT(formElement.type, {code: 4660, msg: 'The form element must have key or type, please add one!'});

			// TODO check what this array does (maybe for elements without key)
      var props = ['preview', 'enableSorting', 'enableAddingItems', 'enableDeletingItems', 'displaySystemButtonsLabels', 'locales', 'localeTabs', 'gridLayout', 'noGridPadding'];
      for (var i = 0; i < props.length; i++) {
        formElement[props[i]] = (!_.isNil(formElement[props[i]]))
        ? formElement[props[i]]
        : this.formDesc.form[props[i]];
      }

      if (formElement.type === 'table') {
        formElement.displayCompressedTables = (!_.isNil(formElement.displayCompressedTables))
          ? formElement.displayCompressedTables
          : this.formDesc.form.displayCompressedTables;

        ASSERT.isBoolean(formElement.displayCompressedTables, { msg: 'Invalid value type for displayCompressedTables' });
      }

      ASSERT.isArray(this.formDesc.locales, {msg: 'Invalid value type for form.locales', code: 3990});
      ASSERT(this.formDesc.locales.length === _.uniq(this.formDesc.locales).length, {msg: 'All members of locales must be unique.', code: 4000});
      ASSERT.isBoolean(this.formDesc.form.localeTabs, {msg: 'Invalid value type for form.localeTabs', code: 4010});
      ASSERT.isBoolean(this.formDesc.form.enableSorting, {msg: 'Invalid valueType for form.enableSorting', code: 4020});
      ASSERT(jsonform.elementTypes[formElement.type], {msg: 'The JSONForm contains an element whose type is unknown: $TYPE$', msgParams: {TYPE: formElement.type}, code: 4030});

      /* The form element is not linked to an element in the schema.
       * This means the form element must be a "container" element,
       * and must not define an input field.
       * selectfieldset is an exception because it has an inputfield but it does not return its value
       * it is used just for selecting the right element in the container
       */
      // TODO use a property from the element definition instead (allowed schema types)
      var isInputField = jsonform.elementTypes[formElement.type].inputfield &&
        (formElement.type !== 'selectfieldset');

      // convert undefined and null values to false to match the strict equality (===) of the assert
      isInputField = (isInputField) || false;

      ASSERT(isInputField === false, { code: 4040, msg: 'The JsonForm defines an element of type $TYPE$ but no "key" property to link the input field to the JSON schema.', msgParams: { TYPE: formElement.type } });
    }

    if (!formElement.type) {
      formElement.type = 'text';
    }

    var plugDef = jsonform.elementTypes[formElement.type];

    ASSERT(plugDef, { code: 4050, msg: 'Form plugin is set to values that is unknown: $TYPE$', msgParams: { TYPE: formElement.type } });

    if (plugDef.compatibleTypes.indexOf('array') === -1 && node.parent && node.parent.items && node.parent.items.length === 1) {
      // level with only 1 option ...
      node.currentCounterArray.pop();
    }


    /**
     * make sure that the schema type is supported by the plugin which visualize it
     */
    if (schemaElement) {
      ASSERT(_.intersection(plugDef.compatibleTypes, _.flatten([schemaElement.type])), { code: 4060, msg: 'no compatibleTypes for form: $TYPE$ with key $KEY$', msgParams: {TYPE: formElement.type, KEY: formElement.key} });
    }

    // A few characters need to be escaped to use the ID as $ selector
    formElement.iddot = jfUtils.escapeSelector(formElement.id || '');

    // Initialize the form node from the form element and schema element
    node.formElement = formElement;
    node.schemaElement = schemaElement;
    node.view = plugDef;
    node.ownerTree = this;

    // Set event handlers
    if (!formElement.handlers) {
      formElement.handlers = {};
    }

    if (node.view.onBeforeBuildFromLayout) {
      node.view.onBeforeBuildFromLayout(node, formElement, schemaElement);
    }

    if ( node.view.array && !formElement.items  ) {
      formElement.items = generateTopLevelItemsFromSchema(node, formElement, schemaElement);
    }

    // Parse children recursively
    if (node.view.array) {
      // Do not create childTemplate until we first use it.
    } else if (formElement.items) {
      var currentCounter = 1;
      // The form element defines children elements
			for (var i = 0; i < formElement.items.length; i++) {
        var item = formElement.items[i];
        ASSERT(item != null, '69234', formElement);

        // if the form element is defined as a schema key string
        // construct a valid json
        if (_.isString(item)) {
          item = { key: item };
        }

        item.currentCounterArray = _.clone(node.currentCounterArray);
        //if (node.view.skipNumeration !== true) {
          // item.currentCounterArray.push(currentCounter);
        //}
        if (node.type === 'section' && node.parent && node.parent.type === 'tabobject') {
          // item.currentCounterArray.push(currentCounter);
        } else {
          item.currentCounterArray.push(currentCounter);
        }

        var child = this.buildFromLayout(item, formElement);

        if (child) {
          node.appendChildNode(child);
        }

        currentCounter++;
      }

    } else if (formElement.otherField) {
      // in case the element is a checkbox with a otherField property
      // construct a valid json form and build the form element
      var item = formElement.otherField;

      if (_.isString(item)) {
        item = formElement.otherField = { key: item, notitle: true };
      } else if (item.notitle === undefined) {
        item.notitle = true;
      }

      if (item.inline === undefined) {
        item.inline = formElement.inline;
      }

      var child = this.buildFromLayout(item, formElement);
      if (child) {
        node.appendChildNode(child);
      }
    }

    // TODO delete this
    /*
    if (formElement.anyOfId !== undefined) {

      node.appendChildNode(this.buildFromLayout({
        type: 'hidden',
        key: formElement.key + '/anyOfId',
        ignoreHiddenNoValue: true // workaround so jf doesnt complain about a hidden field with no value when enableDefault is false
      }, formElement, schemaElement.properties.anyOfId));
    }
    */

      // if ( this.shouldComputeGridLayout(node)) {
      //   this.computeGridLayoutWidth(node.children, node);
      // }

    node.translateTitleAndDescription();
    return node;
  };

  var appendNullOptionIfNotDefined = function (schemaElement, formElement, nullLabel) {
    if ( jsonform.elementTypes[formElement.type].appendNull === false ) {
      return;
    }

    var hasNullOption = false;

    _.each(formElement.options, function (option) {
      if (option.value === null || _.trim(option.value) === '') {
        hasNullOption = true;
      }
    });

    if (!hasNullOption && ! schemaElement.isIncluded) {
      formElement.options.push({
        title: nullLabel,
        value: null
      });
    }
  };

  var prepareOptions = function (schemaElement, formElement, nullLabel, enumValues) {
    var getLabel = function (value) {
      return value === null ? nullLabel : value.toString();
    };

    if (formElement.options) {
      if (_.isArray(formElement.options)) {
        formElement.options = formElement.options.map(function (value) {
          return _.has(value, 'value') ? value : {
            value: value,
            title: getLabel(value)
          };
        });
      } else if (typeof formElement.options === 'object') {
         // titleMap like options
        formElement.options = Object.keys(formElement.options).map(function (value) {
          return {
            value: value,
            title: getLabel(formElement.options[value])
          };
        });
      }
    } else if (formElement.titleMap) {
      formElement.options = _.map(enumValues, function (value) {
        return {
          value: value,
          title: (value !== null) && _.has(formElement.titleMap, value)
                  ? formElement.titleMap[value]
                  : getLabel(value)
        };
      });
    } else if (schemaElement.enumNames ||
      (schemaElement.items && schemaElement.items.enumNames)) {
      var enumNames = schemaElement.enumNames ||
         (schemaElement.items && schemaElement.items.enumNames);

      ASSERT(
          enumNames.length === enumValues.length,
          {msg: 'Schema enum and enumNames must have the same length for $SCHEMAELEMENT$', msgParams: {SCHEMAELEMENT: schemaElement}, code: 3930}
      );

      formElement.options = _.map(enumValues, function (value, index) {
        var title = enumNames[index];

        if (_.isNumber(title)) {
          title = title.toString();
        }

        ASSERT.isString(title, {msg: 'Invalid enumNames $TITLE$', msgParams: {TITLE: title}, code: 3940});

        return {
          value: value,
          title: title
        };
      });

      // If there is an enum, its select, and its not nullable - add a nullable field
    } else {
      formElement.options = enumValues.map(function (value) {
        return {
          value: value,
          title: getLabel(value)
        };
      });
    }

    if ( formElement.type === 'select' && !jfUtils.contains(schemaElement.type, 'null')) {
      formElement.options.unshift({
        value: '',
        title: '--- Please select ---',
        disabled: true,
      });
    }
  };

  var getValuePreventArrayDiff = function (value, node) {
    ASSERT(jfUtils.contains(schema.type, 'array'), 'This function is for array elements only');

    var originalValue = jfUtils.getObjByKey(_.get(node.ownerTree, 'formDesc._originalContent'), node.key);
    if (jfUtils.contains(schema.type, 'null')) {

    }
  }

  FormTree.prototype.initializeValidator = function () {
    this.formDesc.validator.removeSchema(this.formDesc.schema.id);
    this.formDesc.validator.compile(this.formDesc.schema);
  };

  FormTree.prototype.displayErrors = function (errors, settings) {
    var clearOldErrors = settings.clearOldErrors || false;
    var hideErrors = settings.hideErrors || false;

    if (errors && !hideErrors) {
      if (this.formDesc.displayErrors) {
        this.formDesc.displayErrors(errors, this.domRoot);
      } else {
        $(this.domRoot).jsonFormErrors(errors, _.assign(settings, {'clearOldErrors': clearOldErrors}));
      }
    }
  }

	// TODO: simplify this function
  FormTree.prototype.validate = function (settings) {
    var values = settings.values;
    var files = settings.files;

    var clearOldErrors = settings.clearOldErrors || false;
    var showErrorsFor = settings.showErrorsFor || [];
    var options = this.formDesc;
    var errors = false;

    if (options.form.validate !== false) {
      var validator = options.validator;

      // clear all errors from the previous validation
      $(this.domRoot).jsonFormErrors(null, {'clearOldErrors': clearOldErrors});


      // get custom control errors
      errors = this.root.getErrors() || [];

      var valid = validator.validate(this.formDesc.schema.id || values.schemaId || values.$schemaId || this.formDesc.schema, values, files);

      if ( valid && valid.tbData && valid.tbData.validationErrors ) {
        valid.tbData.validationErrors = valid.tbData.validationErrors.filter((err) => {
          return err.tbData.debug.ajvErr.schemaPath.indexOf('anyOf') === -1
        });

        if (valid.tbData.validationErrors && valid.tbData.validationErrors.length === 0) {

        } else {
          errors = [...errors, ...valid.tbData.validationErrors]
        }
      }
    }

    if (errors.length > 0) {
      this.displayErrors(errors, settings);
    } else if (errors.length === 0) {
      errors = false;
    }

    return {'errors': errors, 'values': values};
  };

  /**
   * Computes the values associated with each input field in the tree based
   * on previously submitted values or default values in the JSON schema.
   *
   * For arrays, the function actually creates and inserts additional
   * nodes in the tree based on previously submitted values (also ensuring
   * that the array has at least one item).
   *
   * The function sets the array path on all nodes.
   * It should be called once in the lifetime of a form tree right after
   * the tree structure has been created.
   *
   * @function
   */
  FormTree.prototype.computeInitialValues = function () {
    this.root.computeInitialValues(this.formDesc.value);
  };


  /**
   * Renders the form tree
   *
   * @function
   * @param {Node} domRoot The "form" element in the DOM tree that serves as
   *  root for the form
   */
  FormTree.prototype.render = function (domRoot) {
    if (!domRoot) {
      return;
    }

    this.domRoot = domRoot;
    console.info("Calling Render 1: from the FormTree render");
    this.root.render();

    // If the schema defines required fields, flag the form with the
    // "tb-jf-hasrequired" class for styling purpose
    // (typically so that users may display a legend)
    if (this.hasRequiredField()) {
      $(domRoot).addClass('tb-jf-hasrequired');
    }
    $(domRoot).addClass('tb-jf-root');

    if (this.formDesc.form.isDebug) {
      var debugSchema = {
        locales: this.formDesc.locales,
        schema: this.formDesc.schema,
        form: this.formDesc.form,
        content: this.formDesc.value
      };

      $(domRoot).find('> div ').prepend(
        '<fieldset class="tb-jf-fieldset-header expandable">' +
        '<legend class="tb-jf-legend">' +
        'view source' +
        '</legend>' +
        '<div class="tb-jf-plain-fieldset row tb-jf-hide" hidden="hidden">' +
        '<textarea rows="30" class="tb-jf-debug-container">' +
        JSON.stringify(debugSchema, null, 2) +
        '</textarea>' +
        '</div>' +
        '</fieldset>'
      );
    }

		// make sure there is always a form element wrapping the elements
		var $root = $(domRoot);
    if ($root.get(0).tagName !== 'FORM') {
      var $form = $root.find('form');
      if ($form.length > 0) {
        ASSERT($form.length === 1);
      } else {
				var $children = $root.children();
        var $form = $('<form></form>');
				$children.appendTo($form);
        $root.append($form);
      }
    }

  };

  FormTree.prototype.lock = function () {
    _.each(this.root.children, function (child) {
      child.lock();
    });
  };

  FormTree.prototype.unlock = function () {
    _.each(this.root.children, function (child) {
      child.unlock();
    });
  };

  FormTree.prototype.submit = function (evt) {
    this.lock();

    var self = this;

    var values = jsonform.getFormValue(this.domRoot, this);
    var files = jsonform.getFormFiles(this.domRoot);

    jfUtils.escapeContentKeys(values);

    var options = this.formDesc;

    var shouldBreak = false;

    var domRoot = $(this.domRoot);
    var overlay = createOverlay( domRoot );
    $('body').append(overlay);

    var stopEvent = function (evt) {
      if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
      }

      self.unlock();
      overlay.remove();

      return false;
    };

    this.forEachElement(function (elt) {
      if (shouldBreak) {
        return;
      }
      if (elt.view.onSubmit) {
        shouldBreak = !elt.view.onSubmit(evt, elt); // may be called multiple times!!
      }
    });

    if (shouldBreak) {
      return stopEvent(evt);
    }

    // todo - make it smarter - this is for the selectfieldset and its multiple values. This should be out of the game
    // because we can use tabarray with checkbox/radiobutton instead!
    var selectFieldSetData = this.selectFieldSetData;
    if (selectFieldSetData) {
      for (var i = 0; i < selectFieldSetData.length; i++) {
        var key = selectFieldSetData[i];
        removeFromContent(jsonform.value, key);
      }
    }



    // ponqkoga garmi ajv
    var merged = mergeContentAndFormValues(this.formDesc.content, values, this.formDesc.schema);
    jfUtils.removeKeysWithForwardSlash(merged);

    var validated = {};
    try {
      validated = this.validate({
        values: merged,
        files: files,
        hideErrors: this.formDesc.form.hideErrors,
        clearOldErrors: true
      });
    } catch (e) {
      stopEvent(evt);
      throw e;
    }

    if (options.onSubmit && !options.onSubmit(validated.errors, merged)) {
      return stopEvent(evt);
    }

    if (validated.errors) {
      return stopEvent(evt);
    }

    if (options.onSubmitValid && !options.onSubmitValid(merged)) {
      return stopEvent(evt);
    }

    self.unlock();
    overlay.remove();
    return false;
  };

  /**
   * Returns true if the form displays a "required" field.
   *
   * To keep things simple, the function just return true if detect any
   * jsonform-required class in the form dom.
   *
   * @function
   * @return {boolean} True when the form has some required field,
   *  false otherwise.
   */
  FormTree.prototype.hasRequiredField = function () {
    return $(this.domRoot).find('.tb-jf-required').length > 0;
  };

  /**
   * Walks down the element tree with a callback
   *
   * @function
   * @param {Function} callback The callback to call on each element
   */
  FormTree.prototype.forEachElement = function (callback) {
    var f = function (root) {
      for (var i = 0; i < root.children.length; i++) {
        callback(root.children[i]);
        f(root.children[i]);
      }
    };

    f(this.root);
  };

  /**
   * @function
   * @param {object} schema The schema of the filtersTree
   * @param {string} formElementTitle the title of the form element
   * @param {object} node the node to which we append certain event handlers
   * @return {object} the newly created filters tree
   */
  FormTree.prototype.createFiltersTree = function (schema, formElementTitle, node) {
    var augmentedSchema = createForeignKeySchemaFromSchema(this.formDesc.schema, schema, formElementTitle, node);
    if (!augmentedSchema) {
      return;
    }

    var customFiltersForm = createForeignKeyForm(augmentedSchema, node, formElementTitle);

    return this.createAndAppendNewFiltersTree(augmentedSchema, customFiltersForm);
  };

  FormTree.prototype.createAndAppendNewFiltersTree = function (newSchema, newForm, values, node, isUpdateOnFiltersTree) {
    var validator = new tbjsonAjv2Tb.getAjv2tbInstance({dropTheKeywords: true});
    validator.compile(newSchema);

    var filterFormTree = new FormTree({
      schema: newSchema,
      form: newForm,
      validator: validator,
      value: values
    }, true);

    var newTree = $('<div class="filterTree"></div>')
    if (isUpdateOnFiltersTree) {
      var oldTree = $(node.filtersTree.root.el);
      var outsideSelect = oldTree.find('select:not("[filterTreeSelect]")').clone();

      node.filtersTree = filterFormTree;
      node.filtersTree.render(newTree);
      newTree.find('select').attr('filterTreeSelect', true);

      newTree.children().first().addClass('tb-jf-filters');
      var firstRowLastColumnOfTable = newTree.find('fieldset > div > div').first().children().last();
      outsideSelect.insertAfter(firstRowLastColumnOfTable);
      appendNoResultSpan(newTree);

      newTree.find('fieldset > div').children().first().find('button').css('margin-top', '19px');
      newTree.find('fieldset > div > div').not(newTree.find('fieldset > div > div').eq(0)).each(function (idx, el) {
        $(el).children().first().hide(); //.css('visibility', 'hidden');
        $(el).children().last( ).hide(); //.css('visibility', 'hidden');
      });

      oldTree.replaceWith(newTree.children()[0]);
    } else {
      filterFormTree.render(newTree);
      var $filterFormTreeEl = $(filterFormTree.root.el);
      $filterFormTreeEl.addClass('tb-jf-filters');

      appendNoResultSpan($filterFormTreeEl);

      $filterFormTreeEl.find('fieldset > div').children().first().find('button').css('margin-top', '19px');

      return filterFormTree;
    }

  }

  jsonform.cssFramework = 'bootstrap3';

  /**
   * create a generic schema by the given form descriptor
   */
  jsonform.generateSchema = function (descriptor) {
    /**
     * append the given schemaElement to its place in the schema.
     * Resolve (/) and ([]) accessor operators if any.
     */
    var appendSchemaElement = function (parentSchema, elementKey, schemaElement) {
      var keyPath = elementKey.split('/');
      var parentObject = parentSchema;
      /**
       * json schema defines mandatory properties such as 'properties' or 'items'
       * depending on the parent json type
       */
      for (var i = 0, j = keyPath.length - 1; i <= j; i++) {
        if (keyPath[i].slice(-2) === '[]') {
          keyPath[i] = keyPath[i].slice(0, -2);
        }

        if (i === j) {
          parentObject[keyPath[i]] = schemaElement;
        } else {
          var newParentObject = jfUtils.getObjByKey(parentObject, keyPath[i]);

          if (newParentObject === undefined) {
            newParentObject = { type: 'object', properties: {} }; // assume object if it has nested properties
            parentObject[keyPath[i]] = newParentObject;
            parentObject = newParentObject;
          }


          if (parentObject.type === 'object') {
            parentObject = jfUtils.getObjByKey(parentObject, 'properties');
          } else if (parentObject.type === 'array') {
            parentObject = jfUtils.getObjByKey(parentObject, 'items');

            // in case the array is a complex one access the properties object
            if (parentObject.properties) {
              parentObject = jfUtils.getObjByKey(parentObject, 'properties');
            }
          }
        }

        ASSERT(parentObject, {msg: 'The specified path for key $KEY$ does not exist.', msgParams: {KEY: elementKey}, code: 4170});
      }
    };

    /**
     * create a generic schema by the given form descriptor
     */
    var generateSchemaFromForm = function (form) {
      ASSERT(form.$schemaId, {msg: 'To generate a schema $schemaId must be defined in the form object.', code: 4180});
      ASSERT(form.jsonformVersion, {msg: 'To generate a schema jsonformVersion must be defined in the form object.', code: 4190});

      /**
       * create initial schema object with all requied properties
       */
      var schema = {
        id: form.$schemaId,
        type: 'object',
        properties: {}
      };

      /**
       * generate the schema for all scalar fields - either string, number, integer or boolean
       */
      function generateScalar (parentSchema, formElement, elementType, schemaElement) {
        ASSERT.isString(formElement.key, {msg: 'Every element in the form must have a key.', code: 4200});
        ASSERT.isArray(elementType.compatibleTypes, {msg: 'The form element does not specify the types it supports.', code: 4210});

        /**
         * approximate the schema type by the given form element.
         * Use the first specified element in compatibleTypes as it is always the most generic one.
         */
        schemaElement.type = elementType.compatibleTypes[0];

        if (elementType.requiresEnum === true || elementType.acceptsEnum === true) {
          if (elementType.requiresEnum === true) {
            ASSERT.isPlainObject(formElement.titleMap, {msg: 'To auto-generate a schema for a field requiring an enum a titleMap object is required.', code: 4220});
          }

          if (schemaElement.type === 'array') {
            schemaElement.items = {
              type: elementType.compatibleItemTypes[0]
            };

            if (formElement.titleMap) {
              schemaElement.items.enum = Object.keys(formElement.titleMap);
            }
          } else {
            if (formElement.titleMap) {
              schemaElement.enum = Object.keys(formElement.titleMap);
            }
          }
        }

        return schemaElement;
      }

      /**
       * generate the schema for all object fields and iterate through their children
       */
      function generateObject (parentSchema, formElement, elementType, schemaElement) {
        /**
         * placeholder fields such as fieldset, section, tablerow do not have to have a schema key
         */
        if (elementType.fieldtemplate) {
          ASSERT.isString(formElement.key, {msg: 'Every element in the form must have a key. No key given for the following formElement: $FORMELEMENT$', msgParams: {FORMELEMENT: formElement}, code: 4230});

          schemaElement.properties = {};
          appendSchemaElement(parentSchema, formElement.key, schemaElement);
        }

        if (formElement.items) {
          for (var i = 0, j = formElement.items.length; i < j; i++) {
            generateSchemaElement(parentSchema, formElement.items[i]);
          }
        }
      }

      /**
       * generate the schema for all array fields and iterate through their children
       */
      function generateArray (parentSchema, formElement, elementType, schemaElement) {
        var i, j;
        if (elementType.fieldtemplate) {
          ASSERT(formElement.items.items.length >= 0, {msg: 'Arrays must have at least one element.', code: 4240});

          schemaElement.items = {};

          /**
           * complex arrays (containing more than one type of field) are represented as  arrays of objects.
           * Therefore the items object must be of type object and the form fields must be present
           * in the properties object.
           */
          if (formElement.items.items.length === 1) {
            var childSchemaElement = {};
            var childFormElement = formElement.items.items[0];
            elementType = jsonform.elementTypes[childFormElement.type];

            ASSERT.isString(childFormElement.key, {msg: 'Every element in the form must have a key.', code: 4250});
            ASSERT.isArray(elementType.compatibleTypes, {msg: 'The form element does not specify the types it supports.', code: 4260});

            schemaElement.items = generateScalar(parentSchema, childFormElement, elementType, childSchemaElement);
            appendSchemaElement(parentSchema, formElement.items.items[0].key, schemaElement);
          } else {
            ASSERT.isString(formElement.key, {msg: 'Every element in the form must have a key. No key given for the following formElement: $FORMELEMENT$', msgParams: {FORMELEMENT: formElement}, code: 4270});

            schemaElement.items.type = 'object';
            schemaElement.items.properties = {};

            appendSchemaElement(parentSchema, formElement.key, schemaElement);

            for (i = 0, j = formElement.items.items.length; i < j; i++) {
              generateSchemaElement(parentSchema, formElement.items.items[i]);
            }
          }
        } else {
          for (i = 0, j = formElement.items.length; i < j; i++) {
            generateSchemaElement(parentSchema, formElement.items[i]);
          }
        }
      }

      /**
       * recurse through the given formElement and generate the schema all its children
       * using the generateScalar, generateObject and generateArray functions
       */
      function generateSchemaElement (parentSchema, formElement) {
        ASSERT(formElement.type, {msg: 'Every form element must have a type', code: 4280});
        ASSERT(jsonform.elementTypes[formElement.type], {msg: 'JsonForm does not support this element type.', code: 4290});

        var schemaElement = {};
        var elementType = jsonform.elementTypes[formElement.type];

        if (elementType.inputfield || elementType.previewField) {
          schemaElement = generateScalar(parentSchema, formElement, elementType, schemaElement);

          appendSchemaElement(parentSchema, formElement.key, schemaElement);
        } else if (elementType.containerField) {
          ASSERT.isArray(elementType.compatibleTypes, {msg: 'The form element does not specify the types it supports.', code: 4300});
          schemaElement.type = elementType.compatibleTypes[0];

          if (schemaElement.type === 'array') {
            generateArray(parentSchema, formElement, elementType, schemaElement);
          } else if (schemaElement.type === 'object') {
            generateObject(parentSchema, formElement, elementType, schemaElement);
          }
        }
      }

      /**
       * add a schema element for each form element
       */
      for (var i = 0; i < form.fields.length; i++) {
        /**
         * generate full formElement definition from its schorthand notation
         * 'id' => {key: 'id', type: 'text', title: 'id'}
         */
        if (typeof form.fields[i] === 'string') {
          form.fields[i] = {
            key: form.fields[i],
            title: form.fields[i],
            type: 'text'
          };
        }

        generateSchemaElement(schema.properties, form.fields[i]);
      }

      return schema;
    };

    /**
     * create a generic schema by the given content descriptor
     */
    var generateSchemaFromContent = function (descriptor) {
      var content = descriptor.content;

      ASSERT(descriptor.form.$schemaId, {msg: 'To generate a schema $schemaId must be defined in the form object.', code: 4310});

      /**
       * create initial schema object with all requied properties
       */
      var schema = {
        id: descriptor.form.$schemaId,
        type: 'object',
        properties: {}
      };

      /**
       * generate the schema for all scalar fields - either string, number, integer or boolean
       */
      function generateScalar (parentSchema, value, schemaElement) {
        if (jfUtils.getJsonType(value) === 'number') {
          schemaElement.type = 'number';
        } else if (value === null) {
          schemaElement.type = 'string';
        } else {
          schemaElement.type = jfUtils.getJsonType(value);
        }

        ASSERT(['string', 'number', 'boolean', 'null'].indexOf(schemaElement.type) >= 0, {msg: 'Invalid value type while generating schemaElement from content', code: 4320});
        ASSERT(['object', 'array'].indexOf(schemaElement.type) < 0, {msg: 'Error while generating schema from content: scalar type expected, given $TYPE$', msgParams: {TYPE: schemaElement.type}, code: 4330});

        return schemaElement;
      }

      /**
       * generate the schema for all object fields and iterate through their children
       */
      function generateObject (parentSchema, key, value, schemaElement) {
        var objectKeys = Object.keys(value);

        schemaElement.properties = {};
        appendSchemaElement(parentSchema, key, schemaElement);

        for (var i = 0, j = objectKeys.length; i < j; i++) {
          generateSchemaElement(parentSchema, objectKeys[i], value[objectKeys[i]], key);
        }
      }

      /**
       * generate the schema for all array fields and iterate through their children
       */
      function generateArray (parentSchema, key, value, schemaElement) {
        ASSERT(value.length >= 0, {msg: 'Error while generating schema from content: Arrays must have at least one element.', code: 4340});

        schemaElement.items = {};

        /**
         * complex arrays (containing more than one type of field) are represented as  arrays of objects.
         * Therefore the "items" object must be of type object and the form fields must be present
         * in the "properties" object.
         */

        if (typeof value[0] !== 'object') {
          var childSchemaElement = {};

          schemaElement.items = generateScalar(parentSchema, value[0], childSchemaElement);

          if (!schemaElement.items.title &&
            !schemaElement.items.enum) {
            schemaElement.items.title = schemaElement.items.type;
          }

          appendSchemaElement(parentSchema, key, schemaElement);
        } else {
          schemaElement.items.type = 'object';
          schemaElement.items.properties = {};
          appendSchemaElement(parentSchema, key, schemaElement);

          generateObject(parentSchema, key, value[0], schemaElement);
        }
      }

      /**
       * recurse through the content and generate the schema all its children
       * using the generateScalar, generateObject and generateArray functions
       */
      function generateSchemaElement (parentSchema, key, value, parentKey) {
        ASSERT(key, {msg: 'Error while generating schema from content: Every content element must have a key.', code: 4350});
        ASSERT(value !== undefined, {msg: 'Error while generating schema from content: Every content element must have a value.', code: 4360});

        /**
         * follow the path of parent objects while generating the schema
         */
        if (parentKey) {
          key = parentKey + '/' + key;
        }

        var schemaElement = {
          title: key.split('/').pop()
        };

        if (!_.isArray(value) && !_.isObject(value)) {
          schemaElement = generateScalar(parentSchema, value, schemaElement);

          appendSchemaElement(parentSchema, key, schemaElement);
        } else {
          if (_.isArray(value)) {
            schemaElement.type = 'array';

            generateArray(parentSchema, key, value, schemaElement);
          } else if (_.isObject(value)) {
            schemaElement.type = 'object';

            generateObject(parentSchema, key, value, schemaElement);
          }
        }
      }

      var contentKeys = Object.keys(content);

      /**
       * add a schema element for each content element other than the private properties
       */
      for (var i = 0; i < contentKeys.length; i++) {
        if (['$schemaId', 'jsonformVersion'].indexOf(contentKeys[i]) < 0) {
          generateSchemaElement(schema.properties, contentKeys[i], content[contentKeys[i]]);
        }
      }

      return schema;
    };

    if (!descriptor.form.isStrict) {
      if (descriptor.form && descriptor.form.fields) {
        descriptor.schema = generateSchemaFromForm(descriptor.form);
      } else if (descriptor.content) {
        descriptor.schema = generateSchemaFromContent(descriptor);
      }
    } else {
      ASSERT(
        descriptor.form.isStrict === false,
        {msg: 'Invalid schema. Auto-generating schemas is supported only in unstrict mode.', code: 4370}
      );
    }

    return descriptor.schema;
  };

  /**
   * parse all schema elements and create a form descriptor for each one
   */
  jsonform.generateForm = function (descriptor) {
    if (!descriptor.form.isStrict) {
      descriptor.form.fields = [];

      /**
       * make sure that when generating a form using the schema all elements
       * are sorted alphabetically. This guarantees that the same form will
       * be generated on every run (js objects and hashes in general do not
       * guarantee the order of their elements)
       */
      var alphaKeys = getSortedPropertyKeys(descriptor.schema.properties);

      _.each(alphaKeys, function (key) {
        descriptor.form.fields.push({'key': jfUtils.escapeKey(key)});
      });
    } else {
      ASSERT(
        descriptor.form.isStrict === false,
        {msg: 'Invalid schema. Auto-generating forms is supported only in unstrict mode.', code: 4380}
      );
    }

    return descriptor.form;
  };

 	function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], {type: mimeString});
  }

  jsonform.getFormFiles = function (formelt) {
    var $rootEl = $(formelt);
    var $allFileInputs = $rootEl.find('input[data-tb-jf-type="file"]');
    var resultValue = {};

    $allFileInputs.each(function (idx, el) {
      if (el.files.length > 0) {
        resultValue[el.name] = {
          name: [],
          file: []
        };

        for (var i = 0; i < el.files.length; i++) {

          resultValue[el.name]['name'][i] = el.files[i].name;
          resultValue[el.name]['file'][i] = el.files[i];
        }
      }
    });

    var tree = $rootEl.data('tb-jf-tree');

    // images have higher priority than files
    var $allImageInputs = $rootEl.find('.tb-jf-file-image-input');
    $allImageInputs.each(function (idx, el) {
      var drawingCanvas = $(el).data('drawing-canvas');
      var name = $(el).data('name');
      var base64 = drawingCanvas.fCanvas.toDataURL({ format:  tree.keyToNode[name].schemaElement.imageFormat, quality: tree.keyToNode[name].schemaElement.imageQuality });

      if (base64 == null) {
        return;
      }
      var blob = dataURItoBlob(base64);

      resultValue[name] = {
        name: [],
        file: []
      };

      resultValue[name]['name'][0] = 'TODO - marti :)'; // TODO set some name in content too
      resultValue[name]['file'][0] = blob;
    });

    return resultValue;
  };

  /**
   * Returns the structured object that corresponds to the form values entered
   * by the use for the given form.
   *
   * The form must have been previously rendered through a call to jsonform.
   *
   * @function
   * @param {Node} The <form> tag in the DOM
   * @return {Object} The object that follows the data schema and matches the
   *  values entered by the user.
   */
  jsonform.getFormValue = function (formelt) {
    var form = null;

    if (formelt) {
      form = $(formelt).data('tb-jf-tree');
    } else {
      form = $(jsonform.formTree.domRoot).data('tb-jf-tree');
    }

    if (!form) {
      return null;
    }

    var value = form.root.getFormValues();

    return value;
  };

  // TODO: all of the below functions should be like RemoteAPI - one liners from the main functions!

  /**
   * Generates the HTML form from the given JSON Form object and renders the form.
   *
   * Main entry point of the library. Defined as a $ function that typically
   * needs to be applied to a <form> element in the document.
   *
   * The function handles the following properties for the JSON Form object it
   * receives as parameter:
   * - schema (required): The JSON Schema that describes the form to render
   * - form: The options form layout description, overrides default layout
   * - prefix: String to use to prefix computed IDs. Default is an empty string.
   *  Use this option if JSON Form is used multiple times in an application with
   *  schemas that have overlapping parameter names to avoid running into multiple
   *  IDs issues. Default value is "jsonform-[counter]".
   * - validate: Validates form against schema upon submission. Uses the value
   * of the "validate" property as validator if it is an object.
   * - displayErrors: Function to call with errors upon form submission.
   *  Default is to render the errors next to the input fields.
   * - submitEvent: Name of the form submission event to bind to.
   *  Default is "submit". Set this option to false to avoid event binding.
   * - onSubmit: Callback function to call when form is submitted
   * - onSubmitValid: Callback function to call when form is submitted without
   *  errors.
   *
   * @function
   * @param {Object} options The JSON Form object to use as basis for the form
   */
  $ = $ || window.jQuery;
  $.fn.jsonForm = function (options) {
    var start_time = Date.now();
    var self = this;
    $(this).trigger('jfloadBegin');
    displayLoadingAnimation(this);

    ASSERT.isPlainObject(options, {msg: 'JsonForm did not receive any json descriptors.', code: 4390});
    ASSERT.isPlainObject(options.form, {msg: 'JsonSchema requires a form.', code: 4400});
    if(options.isStrict){
      ASSERT.isString(options.form.jsonformVersion, {msg: 'The form must specify its jsonformVersion.', code: 4410});
      ASSERT.isString(options.form.$schemaId, {msg: 'Every form must have a $schemaId.', code: 4420});
    } else {
      options.form.jsonformVersion = options.form.jsonformVersion || '2.0';
      options.form.$schemaId = options.form.$schemaId || 'http://telebid-pro.com/auto-generated-fake-schema';
    }

    if (!options.locales) {
        options.locales = ['C'];
    }

    if (options.schema) {
      tbjsonTraverseSchema(options.schema, function (element, _1, _2, _3, _4, parentSchema) {
        if (!arguments[0].id) {
          // ASSERT(arguments[0].title, {msg: 'Every field must have a title!', code: 4425});
        }

        if ( parentSchema && parentSchema.anyOf && element.properties && element.properties.anyOfId ) {
          element.id = '#' + getAnyOfId(element);
        }
      });
    }

    var start_time1 = Date.now()
    console.info("\tTraversed the schema! Time taken: " + (start_time1 - start_time) + "ms");

    removeCustomSchemaFromSchemaDefinitions(options.schema);

    /**
      * auto-generate the form or the schema in case one of them is missing and the form is in unstrict mode
      */
    if (options.form.hasOwnProperty('isStrict') &&
      options.form.isStrict === false &&
      (!options.schema ||
      !options.schema.properties ||
      Object.keys(options.schema.properties).length === 0)) {
      options.schema = jsonform.generateSchema(options);
    }

    if (!options.form ||
      !options.form.fields ||
      options.form.fields === null ||
      options.form.fields.length === 0) {
      options.form = jsonform.generateForm(options);
    }

    //@todo alert дали не сме в прод да си оправят схемите хората
    options.form.$schemaId = options.form.$schemaId || options.form.schemaId;

    ASSERT.isPlainObject(options.schema, {msg: 'JsonForm requires a schema.', code: 4430});
    options.schema.type = options.schema.type || 'object';
    ASSERT( jfUtils.contains(options.schema.type, 'object'), {msg: 'The schema must be of type object.', code: 4440});
    ASSERT(!_.isEmpty(options.schema.properties), {msg: 'Schema properties cannot be empty.', code: 4450});

    options.schema.id = options.schema.id || options.schema.$id;
    ASSERT.isString(options.schema.id, {msg: 'Every schema must have an id.', code: 4460});
    ASSERT(options.schema.id === options.form.$schemaId, {msg: 'The id of the schema and the $schemaId from the form must match', code: 4470});

    if (!options.validator) {
      options.validator = tbjsonAjv2Tb.getAjv2tbInstance();
    }

    // make sure that the schema is valid
    var validSchema = false;

    var start_time13 = Date.now()
    console.info("\tUtils before! Time taken: " + (start_time13 - start_time1) + "ms");
    try {
      options.validator.compile(options.schema);
      validSchema = true;
    } catch (e) {
      TRACE('Sorry mr programmer, but your schema is invalid, there is a list of your errors: ', { "ajv": options.validator.ajv, "e": e});
      let extraData = (options.validator.ajv || []).length;
      let extraData2 = (options.validator.ajv || [])[0];

      ASSERT(validSchema === true, {msg: 'The json schema is invalid.', code: 4480, data3: e, data4: extraData, data5: extraData2, schema: options.schema});
    }

    var start_time2 = Date.now()
    console.info("\tCompile the schema! Time taken: " + (start_time2 - start_time13) + "ms");

    if (options.content) {
      var validContent = false;
      try {
        options.validator.validate(options.schema, options.content);
        validContent = true;
      } catch (e) {
        TRACE('Form content is INVALID!\nList of errors: ', options.validator.ajv, ' and the error itself', e);
        ASSERT(validContent === true, {msg: 'The form content is invalid.', code: 4485});
      }
    }

    var start_time3 = Date.now()
    console.info("\tValidated the schema! Time taken: " + (start_time3 - start_time2) + "ms");

    /**
      * remove the cached schema as it is possible that it will be modified before validation
      * possible modifications include escaping schema keys, changing schema restrictions in
      * unstrict mode and others
      */

      //    options.validator.ajv.removeSchema(options.schema.id);
    // options.validator = tbjsonAjv2Tb.getAjv2tbInstance();

    /**
      * backwards compatibility with TbJsonForms - content is alias for value
      */
    if (!_.isNil(options.content)) {
      if (options.form.isStrict) {
        ASSERT(options.schema.id === options.content.$schemaId, {msg: 'The id of the schema and the $schemaId from the content must match', code: 4490});
      }

      if (_.isNil(options.value)) {
        options.value = options.content;
      } else {
        ASSERT(
          !options.value,
          {msg: 'JsonForm cannot have content and value hash at the same time. Use only content instead.', code: 4500}
        );
      }
    }

    if (!options.hasOwnProperty('value')) {
      options.value = {};
      options.value.$schemaId = options.schema.id;
    } else {
      if (options.form.isStrict) {
        ASSERT.isString(options.value.$schemaId, {msg: 'Every content must have a $schemaId.', code: 4510});
      }
    }

    /**
      * initialize the FormTree class
      */
    var formElt = this;

    options = _.defaults(
      {},
      options,
      {submitEvent: 'submit'}
    );

    var start_time4 = Date.now()
    console.info("\tMisc stuff. Shouldnt be too slow! Time taken: " + (start_time4 - start_time3) + "ms");

    options.skipContentDefaultValidation = true;
    var formTree = new FormTree(options);
    formTree.skipContentDefaultValidation = false;
    jsonform.formTree = formTree;

    var start_time5 = Date.now()
    console.info("\tCreating the new form tree! Time taken: " + (start_time5 - start_time4) + "ms");

    // TODO: MOMO PLESASE FIX THIS SO ITS ONLY ONE KEY!!!
    formElt.data('jfFormTree', formTree);
    formElt.data('tb-jf-tree', formTree);
    formElt.data('tbJfTree', formTree);

    jsonform.value = options.value;


    formTree.render(formElt.get(0));
    var start_time6 = Date.now();
    console.info("\tRendering the new form tree! Time taken: " + (start_time6 - start_time5) + "ms");

    removeLoadingAnimation(this);
    jsonform.value = options.value;

    /**
      * Keep a direct pointer to the JSON schema for form submission purpose
      */
    if (options.submitEvent) {
      formElt.unbind((options.submitEvent) + '.tb-jf');

      formElt.bind((options.submitEvent) + '.tb-jf', function (evt) {
        // evt.preventDefault();
        console.log('before submit event no preventDefault');
        $(self).jsonFormValue();
        console.log('after submit event no preventDefault');
      });
    }

    /**
      * Initialize tabs sections, if any
      */
    // initializeTabs(formElt);
    // now is in tab controls js
    // ASSERT(window.TAB_CONTROL_JS_INCLUDED, 'tab-controls.js not included');

    var start_time7 = Date.now();
    console.info("\tInitialized all the tabs! Time taken: " + (start_time7 - start_time6) + "ms");


    /**
      * Initialize expandable sections, if any
      */
    $('.expandable > div, .expandable > fieldset', formElt).hide();
    formElt.on('click', '.expandable > legend', function () {
      var parent = $(this).parent();

      parent.toggleClass('expanded');
      $('> div', parent).slideToggle(100);
    });

    var start_time8 = Date.now()
    console.info("\tintialized all the expandable sections! Time taken: " + (start_time8 - start_time7) + "ms");


    $(this).on('tb_jf_array_item_add', function(e) {
      if (e.originalEvent) { e = e.originalEvent; }
      ASSERT(e.detail.key, "Most probably missing key in an array property...");
      ASSERT(e.detail.idx !== undefined);

      formTree.insertedArrayItems[ e.detail.key ] = formTree.insertedArrayItems[ e.detail.key ] || {};
      formTree.insertedArrayItems[ e.detail.key ][ e.detail.idx ] = 1;
    });

	$(this).on('tb_jf_array_item_delete', function(e) {
      if (e.originalEvent) { e = e.originalEvent; }
      ASSERT(e.detail.key, "Most probably missing key in an array property...");
      ASSERT(e.detail.idx !== undefined);

      formTree.deletedArrayItems[ e.detail.key ] = formTree.deletedArrayItems[ e.detail.key ] || {};
      formTree.deletedArrayItems[ e.detail.key ][ e.detail.idx ] = 1;
    });

    $(this).on('focusin', function(e) {
      var key = $(e.target).attr('name');
      if (key) {
        var formTree = $(this).data('tb-jf-tree');
        var node = formTree.keyToNode[key];

        // alarm: 26612 - somehow we get the focusin event on the multipleselect control. 
        // I don't know how, so we should just accept it as possible part of life and move on
        if (node) {
          ASSERT(node, key, Object.keys(formTree.keyToNode), e.target);
          formTree.lastChangedInputNode = node;
        }
      }
    });

    // prevent form submit on enter
    $(this).on('keydown', e => {
      if (e.keyCode == 13) {
        if (
            (e.originalEvent && e.originalEvent.path && e.originalEvent.path[0] && e.originalEvent.path[0].type && e.originalEvent.path[0].type === 'textarea') ||
            (e.target && e.target.type && e.target.type == 'textarea')
        ) {

		} else {
          e.preventDefault();
	      return false;
		}
      }
    });

    var start_time9 = Date.now();
    $(this).trigger('jfload');
    var start_time10 = Date.now();
    console.info("\tjfload trigger Time taken: " + (start_time10 - start_time9) + "ms");

    console.info("\tTotal Time taken: " + (start_time10 - start_time) + "ms");

    return $(this);
  };

  $.fn.jsonFormClearErrors = function (errors, settings) {
    settings = settings || {};

    var fullSettings = {};
    _.assign(fullSettings, {
      clearSelectedErrors: true
    }, settings);

    // clear all error messages
    if (errors === '*') {
      fullSettings.clearOldErrors = true;
    }

    this.jsonFormErrors(errors, fullSettings);
  };

  $.fn.jsonFormTinyGenerateForm = function () {
    var $cont = $('<div></div>');

    var extractHtml = function (el) {
      var $el = $(el);
      var elId = el.id || '';
      var name = 'tb-jft-' + el.name || '';
      var msgId = elId.replace(/tb-jf-(\d+)-field-(.*)/, 'tb-jft-$1-msg-$2');
      var reqId = elId.replace(/tb-jf-(\d+)-field-(.*)/, 'tb-jft-$1-req-$2');
      var inputId = elId.replace(/tb-jf-(\d+)-field-(.*)/, 'tb-jft-$1-field-$2');
      var labelId = elId.replace(/tb-jf-(\d+)-field-(.*)/, 'tb-jft-$1-label-$2');
      var descrId = elId.replace(/tb-jf-(\d+)-field-(.*)/, 'tb-jft-$1-descr-$2');
      var msgHtml = '<div class="tb-jft-msg" id="' + msgId + '" data-tb-jft-name="' + name + '"></div>';
      var reqHtml = '<label class="tb-jft-req" id="' + reqId + '" for="' + inputId + '" data-tb-jft-name="' + name + '"></label>';
      var labelHtml = '<label class="tb-jft-label" id="' + labelId + '" for="' + inputId + '" data-tb-jft-name="' + name + '"></label>';
      var descrHtml = '<label class="tb-jft-descr" id="' + descrId + '" for="' + inputId + '" data-tb-jft-name="' + name + '"></label>';
      var readonlyHtml = '<div class="tb-jft-content tb-jft-field" id="' + inputId + '" data-tb-jft-name="' + name + '"></div>';
      var $wrapper = $('<div></div>');

      $el = $el.clone();

      $wrapper.append(msgHtml + labelHtml + descrHtml + reqHtml);

      if (el.readOnly) {
        $wrapper.append(readonlyHtml);
      } else {
        if (el.type !== 'checkbox' && el.type !== 'radio' && el.type !== 'file') {
          $el.attr('value', '');
        }

        if (el.type !== 'select-one') {
          $el.attr('type', el.type);
        }

        if ($(el).next().is('.input-file')) {
          $el.attr('type', 'file');
        }

        $el
        .attr('id', inputId)
        .addClass('tb-jft-field')
        .appendTo($wrapper);

        if ($el.is('select')) {
          $el.html('');
        }
      }

      $el.removeClass('form-control input-file tb-jf-password-field');

      return $wrapper;
    };

    $(this).find(':input')
        .filter('[name]')
        .each(function (i, el) {
          var $res = $(el)
            .map(function (i, el) {
              var $el = $(el);

              if ($el.is('.tb-jf-password-field')) {
                var $inputs = $el.closest('.tb-jf-password-container').find('input');

                var a = $inputs.map(function (k, el) {
                  return extractHtml(el);
                })
                    .get();

                return a;
              }

              return extractHtml(el);
            })
            .get();

          $cont.append($res);
        });

    return $cont.wrapInner('<form class="tb-jft-form"></form>').html();
  };

  $.fn.jsonFormGetDistanceFromTop = function () {
      var offsetFromTop = 50;
      var distanceToTop = this.offset().top;

      return distanceToTop - offsetFromTop;
  }

  $.fn.jsonFormGetDistanceFromLeft = function () {
      var offsetFromLeft = 50;
      var distanceToLeft = this.offset().left;

      return distanceToLeft - offsetFromLeft;
  }

  /**
   * Highlights errors reported by the JSON schema validator in the document.
   *
   * @function
   * @param {Object} errors List of errors reported by the JSON schema validator
   * @param {Object} settings
   *        clearOldErrors - clears all currently active erros messages
   *        clearSelectedErrors - clears the errors of the nodes whose path
   *          is provided in the errors string/array
   */
   //TODO: refactor this hell
  $.fn.jsonFormErrors = function (errors, settings) {
    var clearOldErrors;
    settings = settings || {};
    var clearSelectedErrors = settings.clearSelectedErrors || false;
    var scrollIntoView = settings.scrollIntoView;
    var showErrorsFor = settings.showErrorsFor || [];
    if ( scrollIntoView === undefined ) {
      scrollIntoView = true;
    }

    // you can always access form by getting data property 'tb-jf-tree'
    // var form = $(this.domRoot).data('tb-jf-tree');
    var self = this;
    //var domRoot = self[0].domRoot;
    var domRoot = self[0];
    if (settings.fromLiveValidation) {
      ASSERT(settings.liveValidationElement);
      domRoot = liveValidationElement;
    }

    if (settings && settings.clearOldErrors) {
      clearOldErrors = settings.clearOldErrors;
    } else {
      clearOldErrors = false;
    }

    /**
     * clear all old errors by removing the error/warning class
     * and hiding the previous error text
     */

     //todo: make it work for multiple jsonforms on 1 screen - now all the errors will be hidden, we should make it work!
    if (clearOldErrors) {
      $('.' + jsonform.defaultClasses.groupMarkClassPrefix + 'error', domRoot)
        .removeClass(jsonform.defaultClasses.groupMarkClassPrefix + 'error');
      $('.' + jsonform.defaultClasses.groupMarkClassPrefix + 'warning', domRoot)
        .removeClass(jsonform.defaultClasses.groupMarkClassPrefix + 'warning');
      $('.tb-jf-errortext', domRoot).addClass('tb-jf-hide');

      (function traverse(node) {
        if (node.view.clearErrors) {
          node.view.clearErrors(node);
        }
        for (var child of node.children) {
          traverse(child);
        }
      })(this.data('tb-jf-tree').root);
    }

    if (!errors) {
      return;
    } else if (!_.isArray(errors) &&
      typeof errors === 'object') {
      errors = [errors];
    }

    var errorDataPaths = errors
      .map(e => e.dataPath || e.data_path)
      .map(tbjsonAjv2Tb.dotNotationToJsonPointerNotation);

    var errorSelectors = [];
    var $errorSelectors = $(errorSelectors.join(','), domRoot);
    /**
     * Compute the address of the input field in the form from the URI
     * returned by the JSON schema validator.
     */
    for (var i = 0; i < errors.length; i++) {
      let error = errors[i];
      let limitConstraintErrorPath = _.get(error, 'data_path') || _.get(error, 'dataPath') || _.get(error, 'tbData.details.data_path') || _.get(error, 'tbData.details.dataPath');

      ASSERT(limitConstraintErrorPath, { code: 4520, msg: 'Every error must declare the path to its field. $ERROR$', msgParams: {ERROR: error} });
      ASSERT(error.msg, { code: 4530, msg: 'Every error must declare an error message that will be shown.' });

      var key = tbjsonAjv2Tb.dotNotationToJsonPointerNotation(limitConstraintErrorPath);
      ASSERT.isString(key, { code: 4540, msg: 'An error occured but its location is unknown' });

      // todo make it an object...
      // show only some errors
      // put it in the above, pre-iteration step!
      if (showErrorsFor.length > 0) {
        var shouldSkip = false;
        for(var j = 0; j < showErrorsFor.length; j++) {
          if (key.split('.')[1] !== showErrorsFor[j]) {
            // break parent for loop
            shouldSkip = true;
          }
        }

        if (shouldSkip) {
          continue;
        }
      }

      var keyPath = key.split('/').filter(el => el);
      if (error.col_name && keyPath[0] != error.col_name) {
        keyPath.unshift( error.col_name );
      }


      var escapedKey = jfUtils.escapeId(keyPath.join('/'));

      var errorClass = '.tb-jf-error-' + escapedKey;
      var $node = $(errorClass, domRoot);
      if ($node.length === 0) {
        // get parent...
        var pathStringParentArr = _.cloneDeep(keyPath);
        pathStringParentArr.pop();
        var pathStringParent = pathStringParentArr.join('/');
        errorClass = '.tb-jf-error-' + jfUtils.escapeId(pathStringParent);
        $node = $(errorClass, domRoot);
      }

      if (error.domErrorContext) {
        $node = $node.filter(function (i, elem) { return $.contains(error.domErrorContext, elem) });
      }

      $errorSelectors = $errorSelectors.add($node);

      if (!clearSelectedErrors) {
        $node.addClass(jsonform.defaultClasses.groupMarkClassPrefix + 'error');
      }
      var node = $node.find('> div > .tb-jf-errortext, > .tb-jf-errortext');

      // display all error messages
      if (!clearSelectedErrors) {
        node.text(error.msg)
          .removeClass('tb-jf-hide')
          .show();
      } else {
        // remove all error messages and warning classes from the specified paths
        var parent = node.closest('[data-tb-jf-type]');

        node.text('').addClass('tb-jf-hide');
        parent.removeClass(jsonform.defaultClasses.groupMarkClassPrefix + 'error');
        node.removeClass(jsonform.defaultClasses.groupMarkClassPrefix + 'error');
        parent.removeClass(jsonform.defaultClasses.groupMarkClassPrefix + 'warning');
      }
    }

    /**
     * Look for the first error in the DOM and ensure the element
     * is visible so that the user understands that something went wrong
     */

    function getNodeTreePath(tree, target) {
      if (tree == target) {
        return [target];
      }
      for (var child of tree.children) {
        var path = getNodeTreePath(child, target);
        if (path) {
          return [tree, ...path];
        }
      }
      return null;
    }

    function commonPrefixLen(p1, p2) {
      for (var i = 0; i < p1.length; i++) {
        if (p1[i] !== p2[i]) {
          return i
        }
      }
      return p1.length;
    }

    var tree = this.data('tb-jf-tree');

    var errorToShowIdx = 0;
    if ($errorSelectors.filter(':visible').get(0)) {
      errorToShowIdx = -1;
    } else if (tree.lastChangedInputNode) {
      var target = tree.lastChangedInputNode.key;
      var maxIdx = errorDataPaths.reduce((a, e, i) => commonPrefixLen(e, target) > commonPrefixLen(errorDataPaths[a], target) ? i : a, 0);
      errorToShowIdx = maxIdx;
    }

    for (var i = 0; i < errorDataPaths.length; i++) {
      var pathString = errorDataPaths[i];
      let originalError = errors[i];

      var node = originalError.errorNode || tree.keyToNode[pathString];
      if ( node === undefined ) {
        // get parent...\
        var pathStringParentArr = pathString.split('/');
        pathStringParentArr.pop();
        var pathStringParent = pathStringParentArr.join('/');
        node = tree.keyToNode[ pathStringParent ];
      }

      var path = getNodeTreePath(tree.root, node);
      if (path) {
        for (var j = 0; j < path.length - 1; j++) {
          var currNode = path[j];
          if (currNode.view.showChildError) {
            var childNode = path[j + 1];
            var $errText = currNode.view.showChildError(currNode, childNode);
            if ($errText) {
              $errorSelectors = $errorSelectors.add($errText);
            }
          }

          // show children of the first error only
          if (i == errorToShowIdx && currNode.view.showChild) {
            var childNode = path[j + 1];
            currNode.view.showChild(currNode, childNode);
          }
        }
      }
    }

    var firstVisibleError = $errorSelectors.filter(':visible').get(0);

    // if the root is hidden then we assume error can be hidden too
    if (!firstVisibleError && $(this.data('tb-jf-tree').domRoot).is(':visible')) {
      ASSERT(firstVisibleError, 'Error did not become visible', errors, tree.formDesc);
    }

    $('html,body').animate({
      scrollTop: $(firstVisibleError).jsonFormGetDistanceFromTop(),
      scrollLeft: $(firstVisibleError).jsonFormGetDistanceFromLeft()
    }, 500);
  };

  var labelizeTree = function labelizeTree(subTree, keyToTitle, labelsTree, currKey) {
    currKey = currKey || '';
    labelsTree = labelsTree || {};

    var keys = Object.keys(subTree);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];

      if ( _.isPlainObject(subTree[key]) ) {
        if ( ! isNaN(Number(key)) ) {
          var title = keyToTitle[currKey + key];
          labelsTree[currKey + key] = title;
          labelizeTree(subTree[key], keyToTitle, labelsTree, currKey.slice(0, -1) + '[' + key + ']/');
        } else {
          var title = keyToTitle[currKey + key];
          var maxIterations = 50;

          var fullMaybeKey = currKey + key;
          while ( ! title ) {
            if (maxIterations <= 0) { break; }
            maxIterations -= 1;

            fullMaybeKey = fullMaybeKey.replace(/\[(\d+)\]/, '/$1');
            title = keyToTitle[fullMaybeKey];
          }
          labelsTree[currKey + key] = title;
          labelizeTree(subTree[key], keyToTitle, labelsTree, currKey + key + '/');
        }
      } else {
        var title = keyToTitle[currKey + key];

        var maxIterations = 10;

        var fullMaybeKey = currKey + key;
        while ( ! title ) {
          if (maxIterations <= 0) { break; }
          if ( ! /\[(\d+)\]/.test(fullMaybeKey) ) { break; }
          maxIterations -= 1;

          fullMaybeKey = fullMaybeKey.replace(/\[(\d+)\]/, '/$1');
          title = keyToTitle[fullMaybeKey];
        }

        labelsTree[title] = subTree[key];
        labelsTree[currKey + key] = title;
      }

    }

    return labelsTree;
  }

  /**
   * Retrieves the structured values object generated from the values
   * entered by the user and the data schema that gave birth to the form.
   *
   * Defined as a $ function that typically needs to be applied to
   * a <form> element whose content has previously been generated by a
   * call to "jsonForm".
   *
   * Unless explicitly disabled, the values are automatically validated
   * against the constraints expressed in the schema.
   *
   * @function
   * @return {Object} Structured values object that matches the user inputs
   *  and the data schema.
   */
  $.fn.jsonFormValue = function ( enforceNonValidationVisualization ) {
    // If this is true, we should skip the visualization of the validation
    if ( enforceNonValidationVisualization === undefined ) {
      enforceNonValidationVisualization = false;
    }
    // TODO: MOMO PLEASE FIX THIS SO ITS ONLY ONE KEY!!!!!!!!!!!!!!!!!!!!!!
    var formTree = this.data('tbJfTree') || this.data('tb-jf-tree') || this.data('jfFormTree');

      if ( ! _.get(window, 'TB.jfpage.state.disableValidation') ) {
    // clear all errors from the previous validation
    $(formTree.domRoot).jsonFormErrors(null, {'clearOldErrors': !enforceNonValidationVisualization});
      }

    var values = jsonform.getFormValue(this, formTree);
    var files = jsonform.getFormFiles(this);

    var selectFieldSetData = formTree.selectFieldSetData;
    if (selectFieldSetData) {
      for (var i = 0; i < selectFieldSetData.length; i++) {
        var key = selectFieldSetData[i];
        removeFromContent(formTree.formDesc.content, key);
      }
    }


    jfUtils.removeKeysWithForwardSlash(formTree.formDesc.content);
    jfUtils.forceValueTypes(formTree.formDesc.schema, formTree.formDesc.schema, values);
    var clientData = tbjsonGenerateSubtree(formTree.formDesc._originalContent, values, formTree.formDesc);

    if ( formTree.formDesc.form.includedFields ) {        
      for (const includedField of formTree.formDesc.form.includedFields) {
        if ( ! formTree.formDesc.schema.properties[ includedField.key ] || formTree.formDesc.schema.properties[ includedField.key ].isIncluded) {
          delete clientData[includedField.key];
        }
      }
    }

    var clientDataLabels = labelizeTree(clientData, formTree.keyToTitlePath);
    clientDataLabels.foreign_key_data = formTree.foreignKeysData;
    clientDataLabels.enum_names_data = formTree.enumNamesData;
    clientDataLabels.enum_data = formTree.enumData;


    var merged = mergeContentAndFormValues(formTree.formDesc.content, values, formTree.formDesc.schema, formTree.formDesc.form);

    delete merged['full_descr'];

    var validated = {};

    if ( ! _.get(window, 'TB.jfpage.state.disableValidation') && formTree.formDesc.form.validate) {
      validated = formTree.validate({
        values: merged,
        files: files,
        clearOldErrors: !enforceNonValidationVisualization,
        hideErrors: enforceNonValidationVisualization,
      });
    }

    if (validated.errors) {
      ASSERT_USER(0, { msg: 'Invalid data', code: 'JF/6001' });
    }

    validated.values = merged;
    validated.files = files;
    validated.clientData = clientData;
    validated.clientDataLabels = clientDataLabels;
    validated.insertedArrayItems = formTree.insertedArrayItems;
    validated.deletedArrayItems = formTree.deletedArrayItems;

    return validated;
  };

	$.fn.getFormValue = function () {
    var formTree = this.data('tbJfTree') || this.data('tb-jf-tree') || this.data('jfFormTree');
    return jsonform.getFormValue(this, formTree);
	}

  $.fn.jsonFormSetValue = function (path, value, shouldDie) {
    ASSERT.isString(path, {msg: 'jsonFormSetValue: the first argument must be a valid json path string.', code: 4560});
    ASSERT(path !== undefined, {msg: 'jsonFormSetValue: the second argument must be defined.', code: 4570});

    if (window.isSimoDebugging){
        var formTree = this.data('tbJfTree') || this.data('tb-jf-tree') || this.data('jfFormTree');
        var node = formTree.keyToNode[path];
        if (node === undefined) return;
        node.setValue(value);
        return;
    }

    var node = jsonform.formTree.keyToNode[ path ];
    if (node === undefined) return;
    node.setValue(value);
  };

  $.fn.jsonFormSetOptions = function (path, options) {
    ASSERT.isString(path, {msg: 'jsonFormSetValue: the first argument must be a valid json path string.', code: 4560});
    ASSERT(path !== undefined, {msg: 'jsonFormSetValue: the second argument must be defined.', code: 4570});
    ASSERT(_.isArray(options), {msg: 'Options must be an array!', code: 5100});

    var node = jsonform.formTree.root.getChildNodeByKeyPath(path);
    node.setSelectOptions(options);
  };

  $.fn.jsonFormAddSelectOptions = function (path, options) {
    ASSERT.isString(path, {msg: 'jsonFormSetValue: the first argument must be a valid json path string.', code: 4560});
    ASSERT(path !== undefined, {msg: 'jsonFormSetValue: the second argument must be defined.', code: 4570});
    ASSERT(_.isArray(options), {msg: 'Options must be an array!', code: 5100});

    var node = jsonform.formTree.root.getChildNodeByKeyPath(path);
    node.addSelectOptions(options);
  };

  $.fn.jsonFormSetTemplateData = function (path, options, templateData) {
    ASSERT.isString(path, {msg: 'jsonFormSetValue: the first argument must be a valid json path string.', code: 4560});
    ASSERT(path !== undefined, {msg: 'jsonFormSetValue: the second argument must be defined.', code: 4570});
    ASSERT(_.isArray(options), {msg: 'Options must be an array!', code: 5100});

    var node = jsonform.formTree.root.getChildNodeByKeyPath(path);
    node.setTemplateOptions(options, templateData);
  };

  $.fn.jsonFormAddTemplateData = function (path, options, templateData) {
    ASSERT.isString(path,   {msg: 'jsonFormAddTemplateData: the json path to the value must be a string!', code: 4560});
    ASSERT.isArray(options, {msg: 'jsonFormAddTemplateData: the second argument must be an array of title and value.', code: 4570});
    ASSERT(_.isArray(options), {msg: 'Options must be an array!', code: 5100});

    var node = jsonform.formTree.root.getChildNodeByKeyPath(path);
    node.addTemplateOptions(options, templateData);
  };

  $.fn.setOrigContent = function (content) {
    var formTree = this.data('tbJfTree') || this.data('tb-jf-tree') || this.data('jfFormTree');
    formTree.formDesc.content = content;
  };

  $.fn.jsonFormPlugin = function (options) {
    return this.each(function () {
      var $this = $(this);

      if (!$this.is(':input:hidden')) {
        return $this.jsonForm(options);
      } else {
        var $form = $('<div id="tb-jf-form-hidden"></div>');
        var inlineOpts = $this.data('jsonform-inline');
        // var value = JSON.parse($this.val());
        //
        TRACE(inlineOpts);

        $this.data('tb-jf-has-error', 0);
        $this.after($form);

        $form.on('jsonformsChange', function(e, options)  {
          var jsonformValue = $form.jsonFormValue( true );

          if ($form && jsonformValue.errors instanceof Array && jsonformValue.errors.length > 0) {
            $this.data('tb-jf-has-error', 1);
            console.info("JF2 validation errors: ", jsonformValue.errors);

            if ( inlineOpts.form.liveValidation || (options && ( options.from_submit ) ) ) {
              $form.jsonFormErrors(jsonformValue.errors, {'clearOldErrors': true, 'scrollIntoView': true});
            } else {
              $form.jsonFormErrors(jsonformValue.errors, {'clearOldErrors': true, 'scrollIntoView': false});
            }

            return;
          }

          $form.jsonFormErrors([], {'clearOldErrors': true, 'scrollIntoView': true});
          $this.data('tb-jf-has-error', 0);
          $this.val(JSON.stringify({ sp: inlineOpts.sp, content: jsonformValue.values, files: jsonformValue.files }));

        });

        $.extend(true, inlineOpts, options);

        // missing schema fix
        if(inlineOpts.content.$schemaId === undefined && inlineOpts.form.$schemaId === inlineOpts.schema.id) {
            inlineOpts.content.$schemaId = inlineOpts.form.$schemaId;
            $this.val(JSON.stringify(inlineOpts.content));
        }

        if ($form) {
          if (inlineOpts && inlineOpts.content && inlineOpts.content.content) {
            inlineOpts.content = inlineOpts.content.content;
          }

          TRACE('Initialized JF2 by input hidden', inlineOpts);
          $form.jsonForm(inlineOpts);
        }
      }
    });
  };

  function addPlugin(pluginName, pluginDef) {
    ASSERT.isNil(this.plugins[ pluginName ], { msg: 'Plugin $pluginName$ already defined, please use another name or extend current plugin', msgParams: { pluginName: pluginName } });

    this.plugins[ pluginName ] = pluginDef;
  }

  /**
   * Expose the getFormValue method to the global object
   * (other methods exposed as $ functions)
   */
  return jsonform;
});



