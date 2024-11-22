(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('tb.xerrors'), require('lodash'), require('tbjson.ajv2tb'));
  } else if (typeof define === 'function' && define.amd) {
    define(['tb.xerrors', 'lodash', 'tbjson.ajv2tb'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    global.TB = global.TB || {};
    global.TB.jf = global.TB.jf || {};
    global.TB.jf.utils = factory(global.TB, global._, global.TB.tbjson.ajv2tb);
  }
})(this, function (TB, _, tbjsonAjv2tb) {
  'use strict';

  var reArray = /\[([0-9]*)\](?=\[|\/|$)/g;

  var CONSTANT_CRUSH = '#';

  var REGEX = {
    ESCAPE_SELECTOR: /([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g,
  };


  /**
  * Escapes selector name for use with jQuery
  *
  * All meta-characters listed in jQuery doc are escaped:
  * http://api.jquery.com/category/selectors/
  *
  * @function
  * @param {String} selector The jQuery selector to escape
  * @return {String} The escaped selector.
  */
  var escapeSelector = function (selector) {
    return selector
      .replace(REGEX.ESCAPE_SELECTOR, '\\$1');
  };

  // var xerr = TB.XErrors({
  //   msgPrefix: 'JF/utils/',
  // });

  /*
   * Given an object and a key it checks whether the key contains
   * a ~ or . and in case it does the key is deleted and a new one
   * with escaped characters is created
   *
   * @function
   * @param {Object} the object whose key may be replaced
   * @param {oldKey} the key which may contains a ~ or .
   */
  var replaceUnescapedKey = function (collection, oldKey) {
    if (String(oldKey).match(/\.|\~|\/|#/)) {
      var key = escapeKey(String(oldKey));
      // if (key in collection) {
      //   replaceUnescapedKey(collection, key);
      // }
      collection[key] = collection[oldKey];
      delete collection[oldKey];
    }
  };

  /*
   * Parse the schema and rename the keys containg . or ~
   *
   * @function
   * @param {Object} the object whose key may be replaced
   * @param {oldKey} the key which may contains a ~9 or ~0
   */
  var escapeSchemaKeys = function (schema) {
    // TRACE('escapeSchemaKeys %s', arguments);

    _.each(schema, function (value, key, collection) {
      if (typeof value === 'object') {
        replaceUnescapedKey(schema, key);
        escapeSchemaKeys(value);
      }

      if (key === 'required' && _.isArray(value)) {
        _.each(value, function (requiredSchemaKey) {
          var unescapedKeyIndex = collection.required.indexOf(requiredSchemaKey);
          var escapedKey = escapeKey(String(requiredSchemaKey));

          // remove the unescaped key and add the escaped one
          collection.required.splice(unescapedKeyIndex, 1, escapedKey);
        });
      }
    });
  };

  /**
   * Create a valid id from the given schema path
   *
   * @function
   * @param {String} selector
   * @return {String} The escaped selector.
   */
  var escapeId = function (path) {
    var normalizedPath = path.replace(/\[(\d+?)\]/g, '/$1');
    return btoa(encodeURIComponent(normalizedPath))
      .replace(/_/g, '_0')
      .replace(/=/g, '_1')
      .replace(/\+/g, '_2')
      .replace(/\//g, '_3');
  };

  var unescapeId = function (path) {
    path = path
      .replace(/_0/g, '_')
      .replace(/_1/g, '=')
      .replace(/_2/g, '+')
      .replace(/_3/g, '/');

    return decodeURIComponent(atob(path));
  };

  var escapeKey = function (key) {
    return key
      .replace(/\~/g, '~0')
      .replace(/\//g, '~1')
      .replace(/\{/g, '~3')
      .replace(/\}/g, '~4')
      .replace(/\[/g, '~6')
      .replace(/\]/g, '~7');
  };

  var unescapeKey = function (key) {
    return key
      .replace(/~0/g, '~')
      .replace(/~1/g, '/')
      .replace(/~3/g, '{')
      .replace(/~4/g, '}')
      .replace(/~6/g, '[')
      .replace(/~7/g, ']');
  };

  var escapeContentKeys = function (content) {
    for (var k in content) {
      if (!content.hasOwnProperty(k)) {
        continue;
      }

      var oldVal = content[k];
      var escapedKey = unescapeKey(k);
      delete content[k];
      content[escapedKey] = oldVal;

      if (_.isPlainObject(oldVal)) {
        escapeContentKeys(oldVal);
      }

    }
  };


  /**
  * Returns the schema default of the key - the key has array indexes in its path
  * @function
  * @param {object} rootSchema The root schema from which we search
  * @param {String} key The path to the schema element
  * @return {Object} the default value of the schema
  */
  var getSchemaDefaultByJsonPointer = function ( rootSchema, key ) {
    var schema = tbjsonAjv2tb.getSchemaByJsonPointer(rootSchema, key);
    return schema && schema.default;
  }

  /**
   * Retrieves the key identified by a path selector in the structured object.
   *
   * Levels in the path are separated by a dot. Array items are marked
   * with [x]. For instance:
   *  foo/bar[3]/baz
   *
   * @function
   * @param {Object} obj Structured object to parse
   * @param {String} key Path to the key to retrieve
   * @return {Object} The key's value or undefined.
   */
  var getObjByKey = function (obj, key) {
    return tbjsonAjv2tb.getObjByKey(obj, key);
  };

  var getContentValueByFormId = function (content, formId) {
    return tbjsonAjv2tb.getContentValueByFormId(content, formId);
  };

  var resolveSchema = function (rootSchema, parentSchema) {
    return tbjsonAjv2tb.resolveSchema(rootSchema, parentSchema);
  };

  var resolveRefs = function (rootSchema, parentSchema, resolveInnerRefs, refPaths) {
    return tbjsonAjv2tb.resolveRefs(rootSchema, parentSchema, resolveInnerRefs, refPaths);
  };

  /**
   * Sets the key identified by a path selector to the given value.
   *
   * Levels in the path are separated by a /. Array items are marked
   * with [x]. For instance:
   *  foo/bar[3]/baz
   *
   * The hierarchy is automatically created if it does not exist yet.
   *
   * @function
   * @param {Object} obj The object to build
   * @param {String} key The path to the key to set where each level
   *  is separated by a dot, and array items are flagged with [x].
   * @param {Object} value The value to set, may be of any type.
   */
  var setObjValueByKey = function (obj, key, value) {
    // TRACE('jsonform.util.setObjValueByKey %s', arguments);

    var innerobj = obj;
    var keyparts = key.split('/');
    var subkey = null;
    var arrayMatch = null;
    var prop = null;

    for (var i = 0; i < keyparts.length - 1; i++) {
      subkey = keyparts[i];
      if ( subkey === '' ) {
        continue;
      }
      prop = subkey.replace(reArray, '');
      prop = unescapeKey(prop);
      reArray.lastIndex = 0;
      arrayMatch = reArray.exec(subkey);
      if (arrayMatch) {
        // Subkey is part of an array
        while (true) {
          if (!_.isArray(innerobj[prop])) {
            innerobj[prop] = [];
          }
          innerobj = innerobj[prop];
          prop = parseInt(arrayMatch[1], 10);
          arrayMatch = reArray.exec(subkey);
          if (!arrayMatch) {
            break;
          }
        }
        if ((typeof innerobj[prop] !== 'object') ||
          (innerobj[prop] === null)) {
          innerobj[prop] = {};
        }
        innerobj = innerobj[prop];
      } else {
        // "Normal" subkey
        if ((typeof innerobj[prop] !== 'object') ||
          (innerobj[prop] === null)) {
          innerobj[prop] = {};
        }
        innerobj = innerobj[prop];
      }
    }

    // Set the final value
    subkey = keyparts[keyparts.length - 1];
    prop = subkey.replace(reArray, '');
    prop = unescapeKey(prop);
    reArray.lastIndex = 0;
    arrayMatch = reArray.exec(subkey);
    if (arrayMatch) {
      while (true) {
        if (!_.isArray(innerobj[prop])) {
          innerobj[prop] = [];
        }
        innerobj = innerobj[prop];
        prop = parseInt(arrayMatch[1], 10);
        arrayMatch = reArray.exec(subkey);
        if (!arrayMatch) {
          break;
        }
      }
      innerobj[prop] = value;
    } else {
      innerobj[prop] = value;
    }
  };

  var contains = function (target, properties) {

    if (Array.isArray(target)) {
      if (Array.isArray(properties)) {
        for (var i = 0, j = properties.length; i < j; i++) {
          if (target.indexOf(properties[i]) < 0) {
            return false;
          }
        }
      } else {
        if (target.indexOf(properties) < 0) {
          return false;
        }
      }

      return true;
    } else if (typeof target === 'string') {
      if (Array.isArray(properties)) {
        return properties.indexOf(target) > -1;
      }
      return target === properties;
    }

    return false;
  };


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


  // nodeValue is input. output is this value but forced to the type, defined by the schema ("0" -> 0, "" -> null, etc.)
  var forceValueTypes = function (rootSchema, schema, nodeValue, rootKey, anyOfIds, node, formElement) {
    if (schema.isIncluded) {
      return nodeValue;
    }

    rootKey = rootKey || '';
    if (schema.$ref || schema.$merge) {
      // TODO: refactor, how should it work?
      // context: we have anyOfIds as param, formElement getAnyOf, and node.anyOfIds. And we also have the anyOfId from the CONTENT itself, as in already selected, because we have the submitted (current) value
      schema = tbjsonAjv2tb.getSchemaByJsonPointer(rootSchema, rootKey, undefined, getAnyOfIdsByParentFormElements(formElement) || (node ? _.cloneDeep(node.anyOfIds) : undefined) );
    }

    if (Object.keys(schema).length === 0) {
      return nodeValue;
    }

    ASSERT_PEER(schema.hasOwnProperty('type'), {msg: 'The schema has no type $SCHEMA$', msgParams: {SCHEMA: schema}, code: 2010});

    // TODO: is this logic valid @suricactus (shouldn't we check about the type in the schema - if its nullable or not?)
    var value = nodeValue;
    if (TB.typeof(value) === 'string') {
      value = _.trim(value);

      if (value === '') {
        value = null;
      }
   	}
    if (contains(schema.type, 'string')
      && schema.format === 'numeric'
      && TB.typeof(value) === 'number') {
      value = String(value);
    }

    if ( contains(schema.type, 'string') 
      && TB.typeof(value) === 'number') {
      value = String(value);
    }


    if ((contains(schema.type, 'number') || contains(schema.type, 'integer'))
      && Number(value) === Number(value)
      && value !== null) {
      // NaN is the only "number" not equal to itself; check if the value is a valid number

      value = Number(value);
    }

    if (contains(schema.type, 'object')
      && _.isString(value)) {
      if (value === 'null' || value === '') {
        value = null;
      }

      if (value.substring(0, 1) === '{') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          if ( ! _.get(window, 'TB.jfpage.state.disableValidation')  ) {
            ASSERT_USER.isPlainObject(value, {msg: 'The schema element set to object but its value is not a valid object', code: 2020});
          }
        }
      }
    }

    if (contains(schema.type, 'array') && _.isString(value)) {
      if (value.substring(0, 1) === '[') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          if ( ! _.get(window, 'TB.jfpage.state.disableValidation')  ) {
            ASSERT_USER.isArray(value, {msg: 'The schema element set to object but its value is not a valid object', code: 2030});
          }
        }
      } else {
        value = null;
      }
    }


    if (contains(schema.type, 'array')) {
      _.each(_.keys(value), function (idx) {
        value[idx] = forceValueTypes(rootSchema, schema.items, value[idx], rootKey + '[' + idx + ']', anyOfIds);
      });
    }

    if (contains(schema.type, 'array') && contains(schema.type, 'null')) {
      if (value === null || value === undefined/* || value.length === 0*/) {
        value = null;
      }
    }

    if (contains(schema.type, 'object')) {
      if (_.isPlainObject(value) || _.isNil(value)) {
        ASSERT_PEER.isPlainObjectOrNil(value, {msg: 'Invalid value type', code: 2040});

        _.each(_.keys(value), function (_key) {

          if (schema.properties && schema.properties.hasOwnProperty(_key)) {
            var fullKey = rootKey + '/' + escapeKey(_key);
            var currValue = value[_key];
            if (currValue && currValue.anyOfId) {
              anyOfIds = [currValue.anyOfId];
            }

			var subSchema;
            if ( ! node ) {
              // workaround...
              schema.definitions = rootSchema.definitions;
			  subSchema = tbjsonAjv2tb.getSchemaByJsonPointer(schema, escapeKey(_key), undefined, anyOfIds);
			  // subSchema = tbjsonAjv2tb.getSchemaByJsonPointer(rootSchema, rootKey, undefined);
            } else {
			  subSchema = tbjsonAjv2tb.getSchemaByJsonPointer(rootSchema, fullKey, undefined, getAnyOfIdsByParentFormElements(formElement) || _.cloneDeep(node.anyOfIds));
			  // subSchema = tbjsonAjv2tb.getSchemaByJsonPointer(rootSchema, rootKey, undefined, getAnyOfIdsByParentFormElements(formElement) || _.cloneDeep(node.anyOfIds));
            }
            value[_key] = forceValueTypes(rootSchema, subSchema, value[_key], fullKey, anyOfIds);
          } else if (schema.additionalProperties) {
            // var fullKey = rootKey + '/' + _key;
            var fullKey = rootKey + '{' + _key + '}';
            // TODO
            // var fullKey = (rootKey === '') ? `{${_key}}` : `${rootKey}/${_key}`

            value[_key] = forceValueTypes(rootSchema, schema.additionalProperties, value[_key], fullKey, anyOfIds);
          }
        });
      }
    }

    if (contains(schema.type, 'boolean')) {
      if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (value === null || value === '') {
        value = null;
      } else if (value === '0') {
        value = false;
      } else if (value === '1') {
        value = true;
      } else {
        value = Boolean(value);
      }
    }

    return value;
  };

  function getJsonType (val, allowInt) {
    if (val === null) {
      return 'null';
    } else if (_.isString(val)) {
      return 'string';
    } else if (_.isArray(val)) {
      return 'array';
    } else if (_.isBoolean(val)) {
      return 'boolean';
    } else if (allowInt && _.isInteger(val)) {
      return 'integer';
    } else if (_.isNumber(val) && _.isFinite(val)) {
      return 'number';
    } else if (_.isPlainObject) {
      return 'object';
    } else {
      return undefined;
    }
  }

  function hasValidJsonType (validTypes, val) {
    validTypes = _.isString(validTypes) ? [validTypes] : validTypes;
    var valType = getJsonType(val, _.includes(validTypes, 'integer'));
    if (_.includes(validTypes, 'boolean') 
        && (valType == 'number' || valType == 'integer')
        && (val == 0 || val == 1)
    ) {
      // special case: if the schemaType is boolean, accept 0/1 values!
      return true;  
    }



    return _.includes(validTypes, valType);
  }

  function getValidator (settings) {
    var validator = tbjsonAjv2tb.Ajv2tb.getAjv2tbInstance();

    return validator;
  }

  /**
   * Custom value merge function, which recursively merges the values of all passed objects.
   * The rightmost parameter with non-undefined value is returned.
   * The function is not recursive for arrays (examples 2 & 3), where the rightmost value is returned every time.
   *
   * Examples:
   * (1) mergeValues({a:1, d:12}, {a:{b:1,c:[1,2,3]}}) => {a:{b:1,c:[1,2,3]}, d:12}
   * (2) mergeValues({a:1, f:[1,2,3]}, {a:{b:1,c:[1,2,3]}}) => {a:{b:1,c:[1,2,3]}, f:[1,2,3]}
   * (3) mergeValues({a:1, f:[1,2,3]}, {a:{b:1,c:[1,2,3]}, f:[]}) => {a:{b:1,c:[1,2,3]}, f:[]}
   */
  function mergeValues (contentValues, formValues, fullForm) {
    function customArrayMerge (currentDestinationValue, currentSourceValue, key, fullDestination, fullSource) {

      // if ( key !== '$schemaId' && _.isUndefined( currentDestinationValue ) ) {
      //   return currentDestinationValue;
      // }

      if (_.isArray(currentDestinationValue) || _.isArray(currentSourceValue)) {
        if (_.isUndefined(currentSourceValue)) {
          currentSourceValue = [];
        }
        return currentSourceValue;
      }

      if (isJSONEditor(key, fullForm)) {
        return currentSourceValue;
      }

    }

    return _.mergeWith({}, contentValues, formValues, customArrayMerge);
  }

  function isJSONEditor(key, form) {
    if ( ! form || ! form.fields ) {
      return false;
    }

    for (var i = 0; i < form.fields.length; i++) {
      if (_.isPlainObject(form.fields[i]) && form.fields[i].key == key) {
        if (form.fields[i].type === 'jsoneditor') {
          return true;
        } else {
          return false;
        }
      }
    }

    return false;
  }

  // prependFormKeysWithString is not a correct name - it makes a lot more stuff!
  function prependFormKeysWithString (form, string, includedForms, parent) {
    if (form['includeForm']) {
        form.items = (includedForms[form['includeForm']]).fields;
    }

    _.each(form, function(value, key, collection) {
      if (_.isPlainObject(value)) {
        if (collection['key']) {
          // prependFormKeysWithString(value, string + collection['key'] + '/', includedForms, collection);
          prependFormKeysWithString(value, string, includedForms, collection);
        } else {
          prependFormKeysWithString(value, string, includedForms, collection);
        }
      }

      if (_.isArray(value)) {
        if (collection['key']) {
          // prependFormKeysWithString(value, string + collection['key'] + '/', includedForms, collection);
          prependFormKeysWithString(value, string, includedForms, collection);
        } else {
          prependFormKeysWithString(value, string, includedForms, collection);
        }
      }

      // This is a super buggy check, please remove by not using non-explicit keys anywhere!
      if (_.isString(value) && _.isInteger(key)){
        collection[key] = string + value;
      }

      if (key === 'key') {
        collection.key = string + value;
      }
    });
  }

  function removeKeysWithForwardSlash( dataObj ) {
    if ( _.isPlainObject(dataObj) ) {
      for (var key in dataObj) {
        if ( ! dataObj.hasOwnProperty(key)) {
          continue;
        }

        if (key.indexOf('/') >= 0) {
          delete dataObj[key];
        } else if ( _.isPlainObject(dataObj[ key ]) ) {
          removeKeysWithForwardSlash(dataObj[key]);
        }

      }
    }

  }

  function getEmptyArrayValue(type, originalValue) {
    var type = Array.isArray(type) ? type : [type];
    if (type.includes('null')) {
      return originalValue == null ? null : [];
    } else {
      return [];
    }
  }

  function prepareFormFields(resp, context){

    let fields = [];
    let orderingCounter = 0;

    function setFieldOrdering(field){
      if (context == 'list') {
        field.ordering = field.crudOrdering || field.ordering || orderingCounter;
        field.crudOrdering = field.ordering;
      } else {
        field.ordering = field.ordering || orderingCounter;
        field.crudOrdering = field.ordering;
        field.crudOrdering = field.crudOrdering || field.ordering;
      }
    }

    // let schemaFields = false;
    for (const field of resp.form.fields) {
      if (typeof field === 'string') {
        const key = field;
        if (key === '*') {
          // schemaFields = true;
          for (const schemaKey of Object.keys(resp.schema.properties).sort()) {
            let schemaElement = resp.schema.properties[schemaKey];
            let fieldObj = {key: schemaKey, ordering: schemaElement.ordering};
            setFieldOrdering(fieldObj);
            fields.push(fieldObj);
            orderingCounter += 100;
          }
        } else {
          let fieldObj = {key: field};
          setFieldOrdering(fieldObj);
          fields.push(fieldObj);
        }
      } else {
        setFieldOrdering(field);
        fields.push(field);
      }
      orderingCounter += 100;
    }

    if (resp.form.includedFields) {
      resp.form.includedFieldsAppendToSchema = resp.form.includedFieldsAppendToSchema || {};

      if (Array.isArray(resp.form.includedFields)) {
        for (const field of resp.form.includedFields) {
          if (field.key) {
            resp.form.includedFieldsAppendToSchema[ field.key ] = field;
          }

          if (field[context]) {
            if (context === 'edit' || context === 'insert') {
              field.type = 'preview';
            } else {
              field.schemaType = field.type;
              field.type = 'preview'; 
            }

            field.isIncludedField = true;

            if (field[context + "TopLevel"] !== false) {
              setFieldOrdering(field);
              fields.push(field);
            }
          }
          orderingCounter += 100;
        }
      }

    }

    if (resp.form.fieldProperties) {
      for (const key in resp.form.fieldProperties) {
        for (let i = 0; i < fields.length; i++) {
          if (fields[i].key == key) {
            fields[i] = {...fields[i], ...resp.form.fieldProperties[key]};
          }
        }
      }
    }

    _.sortBy(fields, ["crudOrdering"]);

    resp.form.excludedFields ||= [];
    resp.form.fields = fields;
    return resp;
  }

  function prepareFormFieldsWithContext(context){
    return (resp)=>prepareFormFields(resp, context);
  }

  function getTopLevelFields(form, schema, context) {
    ASSERT(context === 'list' || context === 'insert' || context === 'edit');
    ASSERT(form, 'Form is missing');

    var fields = form.fields;

    const excludedKeys = {};
    if (Array.isArray(form.excludedFields)) {
      for (const field of form.excludedFields) {
        if (field[context]) {
          excludedKeys[field.key] = true;
        }
      }
    }

    if ( context === 'list' )
    {
      fields = fields.filter(f => f.key != null);
    }

    fields = fields.filter(f => !excludedKeys[f.key]);
    // if (schemaFields) {
      fields = fields.sort((a, b) => {
        var aOrdering = context == 'list' ? a.crudOrdering ?? a.ordering : a.ordering;
        var bOrdering = context == 'list' ? b.crudOrdering ?? b.ordering : b.ordering;
        if (aOrdering != undefined && bOrdering == undefined) {
          return -1;
        } else if (bOrdering != undefined && aOrdering == undefined) {
          return 1;
        } else if (bOrdering != undefined && aOrdering != undefined) {
          return aOrdering - bOrdering;
        } else {
          return (a.key || '').localeCompare(b.key || '');
        }
      });
    // }

    form.fields = fields;
    return fields;
  }

  function modifySchemaAddMisingFormFields(schema, fields, form) {
    ASSERT(form != null);

    if ( form.includedFieldsAppendToSchema ) {
      var keys = Object.keys(form.includedFieldsAppendToSchema);
      for (const key of keys) {
        var field = form.includedFieldsAppendToSchema[ key ];
        schema.properties[field.key] ||= { type: ['null', 'string', 'number', 'boolean', 'array', 'object'], isIncluded: true, };

        if (!field.type && field.imageBasePath != undefined) {
          field.type = 'imagepreview';
          schema.properties[field.key].imageBasePath = field.imageBasePath;
        }
      }
    }

    if ( form.includedFields ) {
      for (const field of form.includedFields) {
        schema.properties[field.key] ||= { type: ['null', 'string', 'number', 'boolean', 'array', 'object'], isIncluded: true, };

        if (!field.type && field.imageBasePath != undefined) {
          field.type = 'imagepreview';
          schema.properties[field.key].imageBasePath = field.imageBasePath;
        }
      }
    }
  }

  function replaceInKeysDeep(formElement, keySubstring, substringReplacement, doReplaceAll, parentKey) {
    return _.transform(formElement, function (res, val, key) {

      if ( (key === 'key' || (parentKey === 'items' && _.isString(val)) ) && doReplaceAll ) {
        val = val.replaceAll(keySubstring, substringReplacement);
      }

      if ( (key === 'key' || (parentKey === 'items' && _.isString(val)) ) && ! doReplaceAll ) {
        val = val.replace(keySubstring, substringReplacement);
      }

      res[key] = _.isObject(val) ? replaceInKeysDeep(val, keySubstring, substringReplacement, doReplaceAll, key) : val;
    });
  }

  function longestCommonPrefix(arr) {

    ASSERT(_.isArray(arr), 'longestCommonPrefix accepts only array');

    if (arr.length === 0) {
      return '';
    }

    let keysCopy = _.clone(arr);
    keysCopy.sort();

    let headKey = keysCopy[0];
    let tailKey = keysCopy[keysCopy.length - 1];

    headKey = headKey.split('/');
    tailKey  = tailKey.split('/');

    let prefixCursor = 0;
    while (headKey && tailKey && prefixCursor < headKey.length && prefixCursor < tailKey.length && headKey[prefixCursor] === tailKey[prefixCursor]) {
      prefixCursor++;
    }

    let commonPrefix = headKey.slice(0, prefixCursor);
    commonPrefix= commonPrefix.join('/');

    return commonPrefix;
  }

  function samePrefix(a, b) {
    let prefix = (a.length < b.length) ? a : b;
    let word   = (a.length > b.length) ? a : b;

    return word.startsWith(prefix);
  }

  let deducedKeysLevels = {};
  function isSpecialKeyValid(deducedKey, level) {

    let prefixAlreadySeen = _.find(deducedKeysLevels, (prevLevel, prevKey) => {
      return samePrefix(deducedKey, prevKey) && prevLevel <= level; // counterArray same prefix
    });

    return deducedKeysLevels[deducedKey] || !prefixAlreadySeen;
  }


  function deduceKey(formField, level) {

    if (formField.key) {
      return formField.key;
    }

    if ( level == null ) {
      level = 0;
    }

    ASSERT(formField, "formField is null");

    let deducedKey;
    let currentLevelKeys = [];

    let internalNodes = _.filter(formField.items, 'items');

    for (let internalNode of internalNodes) {
      /*if ( ! internalNode.key ) {
        internalNode.key = deduceKey(internalNode, level + 1);
      }*/
      if ( internalNode.key ) {
        currentLevelKeys.push(internalNode.key);
      } else {
        currentLevelKeys.push(deduceKey(internalNode, level + 1));
      }
    }

    let leafNodes = _.reject(formField.items, 'items');

    // let internalKeys = _.map(internalNodes, 'key');
    let leafKeys = _.map(leafNodes, (node) => { return _.isString(node) ? node : node.key; });
    // let currentLevelKeys = [...internalKeys, ...leafKeys];
    currentLevelKeys.push(...leafKeys);

    deducedKey = longestCommonPrefix(currentLevelKeys);

    if ( deducedKey.indexOf('[') !== -1 ) {
      if (!deducedKeysLevels[deducedKey]){
        deducedKeysLevels[deducedKey] = level;
      }
    }

    if (deducedKey.endsWith('/')){
      deducedKey = deducedKey.slice(0, -1);
    }

    return deducedKey;

  }

  return {
    reArray: reArray,
    replaceUnescapedKey: replaceUnescapedKey,
    escapeSchemaKeys: escapeSchemaKeys,
    escapeId: escapeId,
    unescapeId: unescapeId,
    escapeKey: escapeKey,
    unescapeKey: unescapeKey,
    getObjByKey: getObjByKey,
    getContentValueByFormId: getContentValueByFormId,
    resolveSchema: resolveSchema,
    setObjValueByKey: setObjValueByKey,
    contains: contains,
    getJsonType: getJsonType,
    hasValidJsonType: hasValidJsonType,
    forceValueTypes: forceValueTypes,
    mergeValues: mergeValues,
    getValidator: getValidator,
    getSchemaDefaultByJsonPointer: getSchemaDefaultByJsonPointer,
    resolveRefs: resolveRefs,
    escapeContentKeys: escapeContentKeys,
    prependFormKeysWithString: prependFormKeysWithString,
    removeKeysWithForwardSlash: removeKeysWithForwardSlash,
    escapeSelector: escapeSelector,
    getEmptyArrayValue: getEmptyArrayValue,
    getTopLevelFields: getTopLevelFields,
    prepareFormFields: prepareFormFields,
    modifySchemaAddMisingFormFields: modifySchemaAddMisingFormFields,
    replaceInKeysDeep: replaceInKeysDeep,
    deduceKey: deduceKey
  };
});
