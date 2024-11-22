/* Copyright (c) 2012 Joshfire - MIT license */
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

 /*global window*/

//TODO array reordering DOM parents
;(function(serverside, global, $, _, JSON) {
  'use strict';

  //TODO find a better place for this (use URL params?)
  TB.CONFIG.XERRORS_LOG_CONSOLE = false;

  /**
   * The jsonform object whose methods will be exposed to the window object
   */
  var jsonform = {util:{}};


  /**
   * Template settings for form views
   */
  var fieldTemplateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g
  };

  /**
   * Template settings for value replacement
   */
  var valueTemplateSettings = {
    evaluate    : /\{\[([\s\S]+?)\]\}/g,
    interpolate : /\{\{([\s\S]+?)\}\}/g
  };

  var _template = (typeof _.template('', {}) === 'string')
    ? _.template
    : function(tmpl, data, opts) {
      if (data
        && data.node
        && data.node.view.template
        && data.node.isTbTemplate === true) {

        // return TB.Template.render(tmpl);
        return _.template(tmpl, opts)(data);
      } else {

        return _.template(tmpl, opts)(data);
      }
    };



  /**
   * Regular expressions used to extract array indexes in input field names
   */
  var reArray = /\[([0-9]*)\](?=\[|\/|$)/g;

  /**
   * Returns true if given value is neither "undefined" nor null
   */
  var isSet = function (value) {
    // TRACE('isSet %s', arguments);

    return !(_.isUndefined(value) || _.isNull(value));
  };

  /**
   * helper function to check whether an array contains a certain value
   */
  var contains = function(target, properties) {
    ASSERT.ofTbType(target, 'array|string', 'The variable %s is neither a string nor an array.', target);

    if (Array.isArray(target)) {
      if (Array.isArray(properties)) {
        for (var i = 0, j = properties.length; i < j; i++) {
          if (target.indexOf(properties[i]) < 0) {
            return false;
          }
        };
      } else {
        if (target.indexOf(properties) < 0) {
          return false;
        }
      }

      return true;
    } else if (typeof target === 'string') {
      return target === properties;
    }

    return false;
  };

  /**
   * recursively compares two objects by value NOT reference
   */
  var areObjectsEqual = function(a, b) {
    var areEqual = true;

    if (a && b) {
      _.each(_.keys(a), function(key) {
        if (b[key]
          && (jsonform.util.typeof(a[key]) === 'object'
            || jsonform.util.typeof(a[key]) === 'array')) {

          areEqual = areObjectsEqual(a[key], b[key]);
        } else if (b[key] === undefined
          || a[key] !== b[key]) {

          areEqual = false;
        }

        if (!areEqual) {
          // breaks out of the _.each loop does not exit areObjectsEqual
          return;
        }
      });
    } else {
      areEqual = false;
    };

    return areEqual;
  };

  /**
   * create a json object of the format key: value
   * containing the latest value for the current element
   *
   * for nested objects include only the property which is
   * goingto be validated
   */
  var constructObjectByKey = function(key, val) {
    ASSERT.ofTbType(key, 'string', 'constructObjectByKey: given invalid value for key %s.', key);

    var valuePrepend = '{';
    var valueAppend = '}';
    var keyPath = key
      .replace('/', '.')
      .split('.');

    for (var i = 0, j = keyPath.length; i < j; i++) {
      valuePrepend += '"' + keyPath[i] + '"';

      if (i !== j - 1) {
        valuePrepend += ': {';
        valueAppend += '}';
      } else {
        valuePrepend += ':';
      }
    };

    return JSON.parse('' + valuePrepend + JSON.stringify(val) + valueAppend);
  }

  /**
   * Merges the value of the form after submission together with
   * the value/content object used to initialize the form. The goal
   * is to allow the transfer of "hidden" values that are not used for
   * any visible fields.
   * All formValues are kept the same, hidden fields are added to the object.
   *
   * @function
   * @param {Object} form values after the submit event
   * @param {Object} values used at the initialization.
   *   Part of either the value or content global option in the json
   * @param {Bool} flag which disables the transfer of non-form values.
   * @return (Object) the merged values of the two objects
   */
  var mergeValues = function(initialValues, formValues, disableMergeing) {
    // TRACE('mergeValues %s', arguments);

    var mergedValues = {};

    if (!disableMergeing) {
      // overwrite all initial values which have been changed in the form
      // leaving the non-form values
      jsonform.util.extend(mergedValues, initialValues, formValues);

      unescapeValueKeys(mergedValues)
      localStorage.setItem('mergedValues', JSON.stringify(mergedValues));
      return mergedValues;
      // in case disableMergeing is set to true just return the form values
    } else {
      return unescapeValueKeys(formValues);
    }
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
  var escapeSelector = function(selector) {
    return selector
      .replace(/([ \!\"\#\$\%\&\'\(\)\*\+\,\.\/\:\;<\=\>\?\@\[\\\]\^\`\{\|\}\~])/g, '\\$1');
  };

  /**
   * Create a valid id from the given schema path
   *
   * @function
   * @param {String} selector
   * @return {String} The escaped selector.
   */
  var escapeId = function(path) {
    return path
      .replace(/\~/g, '_')
      .replace(/]\/|\//g, '-')
      .replace(/\[/g, '-arrIdx')
      .replace(/\]/g, '');
  };

  var escapeKey = function(key) {
    return key
      .replace(/\~/g, '~0')
      .replace(/\//g, '~1')
      .replace(/\[/g, '~6')
      .replace(/\]/g, '~7')
      .replace(/\#/g, '~8')
      .replace(/\./g, '~9');
  };

  var unescapeKey = function(key) {
    return key
      .replace(/\~0/g, '~')
      .replace(/\~1/g, '/')
      .replace(/\~6/g, '[')
      .replace(/\~7/g, ']')
      .replace(/\~8/g, '#')
      .replace(/\~9/g, '.');
  };

  /*
   * Given an object and a key it checks whether the key contains
   * a ~ or . and in case it does the key is deleted and a new one
   * with escaped characters is created
   *
   * @function
   * @param {Object} the object whose key may be replaced
   * @param {oldKey} the key which may contains a ~ or .
   */
  var replaceUnescapedKey = function(collection, oldKey) {
    if (String(oldKey).match(/\.|\~|\/|\#/)) {
      var key = escapeKey(String(oldKey));

      collection[key] = collection[oldKey];
      delete collection[oldKey];
    }
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
  var replaceEscapedKey = function(collection, oldKey) {
    if (String(oldKey).match(/\.|\~|\/|\#/)) {
      var key = unescapeKey(String(oldKey));

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
  var escapeSchemaKeys = function(schema) {
    // TRACE('escapeSchemaKeys %s', arguments);

    _.each(schema, function(value, key, collection) {
      if (typeof value === 'object') {
        replaceUnescapedKey(schema, key)
        escapeSchemaKeys(value);
      }

      if (key === 'required' && _.isArray(value)) {
        _.each(value, function(requiredSchemaKey) {
          var unescapedKeyIndex = collection.required.indexOf(requiredSchemaKey);
          var escapedKey = escapeKey(String(requiredSchemaKey));

          // remove the unescaped key and add the escaped one
          collection.required.splice(unescapedKeyIndex, 1, escapedKey);
        })
      }
    })
  };

  /*
   * Parse the content/value and rename the keys containg . or ~
   *
   * @function
   * @param {Object} the object whose key may be replaced
   * @param {oldKey} the key which may contain a ~9, ~1 or ~0
   */
  var escapeValueKeys = function(content) {
    // TRACE('escapeValueKeys %s', arguments);

    _.each(content, function(value, key) {
      replaceUnescapedKey(content, key)
      if (typeof value === 'object') {
        escapeValueKeys(value);
      }
    })
  };

  /**
   * Parse the content/value and rename the keys containg . or ~
   *
   * @function
   * @param {Object} the object whose key may be replaced
   * @param {oldKey} the key which may contain ~9, ~1 or ~0
   */
  var unescapeValueKeys = function(content) {
    // TRACE('unescapeValueKeys %s', arguments);

    _.each(content, function(value, key) {
      replaceEscapedKey(content, key)
      if (typeof value === 'object') {
        unescapeValueKeys(value);
      }
    })
  };



  /**
   * getInnermostJsonPathKey( form/element1/subproperty ) => subproperty
   * getInnermostJsonPathKey( form/element1/arrSubproperty[] ) => arrSubproperty
   */
  var getInnermostJsonPathKey = function(key) {
    var childKeysArray = convertJsonPathStringToArray(key);
    var innermostChild = "";

    for (var i = childKeysArray.length - 1; i => 0; i--) {
      innermostChild = childKeysArray[i];

      if (innermostChild !== "") {
        break;
      }
    }

    if (innermostChild.slice(-2) === '[]') {
      innermostChild = innermostChild.slice(0, -2);
    }

    return innermostChild;
  }

  var convertJsonPathStringToArray = function(path) {
    return path.split('/');
  }

  var convertJsonPathArrayToString = function(path) {
    return path.join('/');
  }



  /**
   * resolve the referrence and return the correspoding schema
   *
   * @param  {Object} schema    the schema object containing all sub-schemas
   * @param  {Object} schemaDef the object which contains the $ref
   * @param  {String} key       schema key
   * @return {Object}           the resolved referrence schema
   */
  var resolveRefs = function(schema, schemaDef, key) {
    // TRACE('resolveRefs %s', arguments);

    var initialRef = schemaDef['$ref'];

    // ASSERT(Object.keys(schemaDef).length === 1, 'If a $ref is defined no other properties can appear in the object (no type, title, format, etc.) for schema key %s', key);
    ASSERT_PEER(
      TB.typeof(schemaDef.$ref),
      'string',
      'All schema refferences must be of type string. Key %s has value %s.',
      key,
      schemaDef.$ref
    );

    var refSchema = schemaDef.$ref;
    var refPath = "";


    if (refSchema.indexOf('#') >= -1) {
      refPath = schemaDef.$ref.split('#');

      refSchema = refPath[0];
      refPath = refPath[1];
    }

    var escapedRefSchema = escapeKey(refSchema);

    /**
     * case 1: the $ref points to the current schema. Examples:
     * $ref: "#"
     * $ref: "#properties/field1"
     * $ref: "schemaId#properties/field1" where schemaId is the id of the current schema
     */
    if (refSchema === ''
      || refSchema === schema.id) {

      schemaDef = schema;
    }
    // TODO remove when all schemas are updated
    else if (!schema.definitions || !schema.definitions[escapedRefSchema]) {
      schemaDef = {
        type: "string",
        format: "name_lat_t"
      }
    }
    /**
     * case 2: the $ref points to the a schema described in definitions. Examples:
     * $ref: "externalSchemaId"
     * $ref: "externalSchemaId#"
     * $ref: "externalSchemaId#/field1" where schemaId is the id of the current schema
     */
    else {
      ASSERT_PEER(TB.typeof(schema.definitions), 'object', 'The refference %s described in schema key %s points to an external schema. All external schemas must be described in the object schema.definitions.', schemaDef.$ref, key);

      //TODO in order for this to work all schema keys in definitions must be the same as their corresponding schema ids. Is this really needed?
      ASSERT_PEER(schema.definitions[escapedRefSchema], 'The refference %s described in schema key %s points to an external schema. The external schema must have an id %s but no such schema was found.', schemaDef.$ref, key, refSchema);

      schemaDef = schema.definitions[escapedRefSchema];
    };

    if (refPath && refPath.length > 0) {
      var schemaDef = jsonform.util.getObjByKey(schemaDef, refPath, true);
    }

    if (schemaDef && schemaDef['$ref']) {
      ASSERT_PEER(initialRef !== schemaDef['$ref'], 'Recursive referrence: $refs cannot point to themselves.');
    }

    return schemaDef;
  };

  /**
   * Retrieves the key definition from the given schema.
   *
   * The key is identified by the path that leads to the key in the
   * structured object that the schema would generate. Each level is
   * separated by a '.'. Array levels are marked with []. For instance:
   * foo/bar[]/baz
   * ... to retrieve the definition of the key at the following location
   * in the JSON schema (using a dotted path notation):
   *  foo/properties/bar/items/properties/baz
   *
   * @function
   * @param {Object} schema The JSON schema to retrieve the key from
   * @param {String} key The path to the key, each level being separated
   *  by a dot and array items being flagged with [].
   * @return {Object} The key definition in the schema, null if not found.
   */
  var getSchemaByKey = function(schema, key) {
    // TRACE('getSchemaByKey %s', arguments);

    ASSERT.ofTbType(
      schema,
      'object',
      'getSchemaByKey expected schema to be an object, was given %s %s instead',
      jsonform.util.typeof(schema),
      schema
    );

    ASSERT.ofTbType(
      key,
      'string',
      'getSchemaByKey expected key to be a string, was given %s %s instead',
      jsonform.util.typeof(key),
      key
    );

    /**
     * jsonform allows specifying unstrict schema paths
     * for example person/age instead of person/properties/age
     * additionally array accessors must be resolved according to their depth
     *
     * $refs do not support this unstrict syntax
     */
    var schemaKey = key
      .split('#');

    // negative lookahead to replace all non-filterSchema properties
    schemaKey[0] = schemaKey[0]
      .replace(/\/(?!filterSchema)/g, '/properties/')
      .replace(/\[[0-9]*\]/g, '/items');

    schemaKey = schemaKey.join('#');

    var schemaDef = jsonform.util.getObjByKey(schema.properties, schemaKey, true);

    ASSERT.ofTbType(schemaDef, 'object|undefined', 'getSchemaByKey expected got unexpected schemaDef');

    if (schemaDef && schemaDef.$ref) {
      schemaDef = resolveRefs(schema, schemaDef, key);
    };

    return schemaDef;
  };

  /**
   * Get the schema element with the specified key
   *
   * @function
   * @param {Object} the whole schema object
   * @param {String} schema key
   * @return {Object} The schema definition of the keys' parent.
   */
  var getParentSchemaByKey = function(formDesc, key) {
    // TRACE('getParentSchemaByKey %s', arguments);

    ASSERT.hasPropertyOfTbType(formDesc, 'schema', 'object', 'getParentSchemaByKey expected schema to be an object, was given %s %s instead', typeof formDesc.schema, formDesc.schema);
    ASSERT.ofTbType(key, 'string', 'getParentSchemaByKey expected key to be a string, was given %s %s instead', typeof key, key);

    var parentSchema = formDesc;
    var parentKey = key.split('/').slice(0, -1).join('/');

    if (parentKey.slice(-2) === '[]') {
      parentKey = parentKey.slice(0, -2);
    }

    if (parentKey) {
      parentSchema = getSchemaByKey(formDesc.schema, parentKey);
    } else {
      parentSchema = formDesc.schema;
    }

    ASSERT.ofTbType(parentSchema, 'object', 'getParentSchemaByKey expected parentSchema for key %s to be an object, was given %s %s instead', parentKey, typeof parentSchema, parentSchema);

    if (parentSchema && parentSchema.$ref) {
      parentSchema = resolveRefs(formDesc, parentSchema, key);
    }

    return parentSchema;
  };



  /**
   * Retrieves the key default value from the given schema.
   *
   * The key is identified by the path that leads to the key in the
   * structured object that the schema would generate. Each level is
   * separated by a '/'. Array levels are marked with [idx]. For instance:
   *  foo/bar[3]/baz
   * ... to retrieve the definition of the key at the following location
   * in the JSON schema (using a dotted path notation):
   *  foo/properties/bar/items/properties/baz
   *
   * @function
   * @param {Object} schema The top level JSON schema to retrieve the key from
   * @param {String} key The path to the key, each level being separated
   *  by a dot and array items being flagged with [idx].
   * @param {Number} top array level of schema within it we search the default.
   * @return {Object} The key definition in the schema, undefined if not found.
   */
  var getSchemaDefaultByKeyWithArrayIdx = function(schema, key, topDefaultArrayLevel) {
    // TRACE('getSchemaDefaultByKeyWithArrayIdx %s', arguments);

    var defaultValue = undefined;
    topDefaultArrayLevel = topDefaultArrayLevel || 0;

    if (schema && schema.$ref) {
      schema = resolveRefs(jsonform.schema, schema, key);
    }

    if (!isSet(key) || key === '') {
      if (topDefaultArrayLevel == 0) {
        defaultValue = schema.default;
      }
    } else if (schema.default && topDefaultArrayLevel == 0) {
      defaultValue = jsonform.util.getObjByKeyEx(schema.default, key);
    } else {

      var m = key.match(/^((([^\\\[\/]|\\.)+)|\[(\d+)\])\/?(.*)$/);

      ASSERT(m, 'bad format key: %s', key);

      if (typeof m[2] === 'string' && m[2].length > 0) {
        schema = schema.properties[m[2]];
      } else if (typeof m[4] === 'string' && m[4].length > 0) {
        schema = schema.items;
        if (topDefaultArrayLevel > 0) {
          --topDefaultArrayLevel;
        }
      } else {
        throw new Error('impossible reach here');
      }

      if (schema) {
        if (schema.default && topDefaultArrayLevel == 0) {
          defaultValue = jsonform.util.getObjByKeyEx(schema.default, m[5]);
        } else {
          defaultValue = getSchemaDefaultByKeyWithArrayIdx(schema, m[5], topDefaultArrayLevel);
        }
      }
    }
    return defaultValue;
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
  var truncateToArrayDepth = function(key, arrayDepth) {
    // TRACE('truncateToArrayDepth %s', arguments);

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
  var applyArrayPath = function(key, arrayPath) {
    // TRACE('applyArrayPath %s', arguments);

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
      if (isSet(arrayPath[depth])) {
        newIndex = '[' + arrayPath[depth] + ']';
      }
      depth += 1;
      return newIndex;
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
  var getInitialValue = function(formObject, key, arrayPath, tpldata, usePreviousValues) {
    // TRACE('getInitialValue %s', arguments);

    var value = null;

    // Complete template data for template function
    tpldata = tpldata || {};
    tpldata.idx = tpldata.idx ||
      (arrayPath ? arrayPath[arrayPath.length-1] : 1);
    tpldata.value = isSet(tpldata.value) ? tpldata.value : '';
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
    var schemaElement = getSchemaByKey(formObject.schema, key);

    if (usePreviousValues && formObject.value) {
      // If values were previously submitted, use them directly if defined
      value = jsonform.util.getObjByKey(formObject.value, applyArrayPath(key, arrayPath));
    }

    if (!isSet(value)) {
      if (formElement
        && (typeof formElement['value'] !== 'undefined')) {

        // Extract the definition of the form field associated with
        // the key as it may override the schema's default value
        // (note a "null" value overrides a schema default value as well)
        value = formElement['value'];
      } else if (schemaElement) {
        // Simply extract the default value from the schema
        if (isSet(schemaElement['default'])) {
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
          /\{\{values\/([^\}]+)\}\}/g,
          '{{getValue("$1")}}');
      }
      if (value) {
        value = _template(value, tpldata, valueTemplateSettings);
      }
    }

    // TODO: handle on the formElement.options, because user can setup it too.
    // Apply titleMap if needed
    if (isSet(value) && formElement && _.has(formElement.titleMap, value)) {
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

    if (!isSet(value)) {
      return null;
    } else {
      return value;
    }
  };

  // schema v4 required
  var isRequiredField = function(keyPath, parentSchema) {
    // TRACE('isRequiredField %s', arguments);

    var required = null;

    if (keyPath) {
      var key = keyPath
        .split('/')
        .slice(-1)[0];
    }

    if (parentSchema) {
      if (_.isArray(parentSchema.required)) {
        required = parentSchema.required.indexOf(key) >= 0;
      } else {
        if (parentSchema.properties && _.isArray(parentSchema.properties.required)) {
          required = parentSchema.properties.required.indexOf(key) >= 0;
        };
      }
    }

    return required;
  };



  var getDefaultClasses = function(cssFramework) {
    // TRACE('getDefaultClasses %s', arguments);

    switch(cssFramework) {
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
          textualInputClass: 'form-control',
          prependClass: 'input-group',
          appendClass: 'input-group',
          addonClass: 'input-group-addon',
          buttonAddonClass: 'input-group-btn',
          inlineClassSuffix: '-inline'
        };
      default:
        THROW('Unknown cssFramework: ', cssFramework);
    }
  };

  /**
   * Initializes tabular sections in forms. Such sections are generated by the
   * 'selectfieldset' type of elements in JSON Form.
   *
   * Input fields that are not visible are automatically disabled
   * not to appear in the submitted form. That's on purpose, as tabs
   * are meant to convey an alternative (and not a sequence of steps).
   *
   * The tabs menu is not rendered as tabs but rather as a select field because
   * it's easier to grasp that it's an alternative.
   *
   * Code based on bootstrap-tabs.js, updated to:
   * - react to option selection instead of tab click
   * - disable input fields in non visible tabs
   * - disable the possibility to have dropdown menus (no meaning here)
   * - act as a regular function instead of as a jQuery plug-in.
   *
   * @function
   * @param {Object} tabs jQuery object that contains the tabular sections
   *  to initialize. The object may reference more than one element.
   */
  var initializeTabs = function(tabs) {
    // TRACE('initializeTabs %s', arguments);

    var activate = function (element, container) {
      container
        .find('> .active')
        .removeClass('active')
        .removeClass('in');

      element.addClass('active');

      setTimeout(function() {
        element.addClass('in');
      }, 0);
    };

    var enableFields = function ($target, targetIndex) {
      // Enable all fields in the targeted tab
      $target.find('input, textarea, select').removeAttr('disabled');

      // Disable all fields in other tabs
      $target.parent()
        .children(':not([data-idx=' + targetIndex + '])')
        .find('input, textarea, select')
        .attr('disabled', 'disabled');
    };

    var optionSelected = function (e) {
      var $option = $("option:selected", $(this)),
        $select = $(this),
        // do not use .attr() as it sometimes unexplicably fails
        targetIdx = $option.get(0).getAttribute('data-idx') || $option.attr('value'),
        $target;

      e.preventDefault();
      if ($option.hasClass('active')) {
        return;
      }

      $target = $(this).parents('.tabbable').eq(0).find('> .tab-content > [data-idx=' + targetIdx + ']');

      activate($option, $select);
      activate($target, $target.parent());
      enableFields($target, targetIdx);
    };

    var tabClicked = function (e) {
      var $a = $('a', $(this));
      var $content = $(this).parents('.tabbable').first()
        .find('.tab-content').first();
      var targetIdx = $(this).index();
      var $target = $content.find('> .tab-pane[data-idx=' + targetIdx + ']');
      // var $firstTab = $target.find('> [data-idx=' + targetIdx + ']');

      e.preventDefault();
      activate($(this), $(this).parent());
      activate($target, $target.parent());
      // activate($firstTab, $firstTab.parent());
      if ($(this).parent().hasClass('tb-jf-alternative')) {
        enableFields($target, targetIdx);
      }
    };

    tabs.each(function () {
      $(this).delegate('select.nav', 'change', optionSelected);
      $(this).find('select.nav').each(function () {
        $(this).val($(this).find('.active').attr('value'));
        // do not use .attr() as it sometimes unexplicably fails
        var targetIdx = $(this).find('option:selected').get(0).getAttribute('data-idx') ||
          $(this).find('option:selected').attr('value');
        var $target = $(this).parents('.tabbable').eq(0).find('> .tab-content > [data-idx=' + targetIdx + ']');
        enableFields($target, targetIdx);
      });

      $(this).on('click', 'ul.nav li', tabClicked);
      $(this).find('ul.nav li.active').click();
    });
  };

  /**
   * displays a loading bar on the given DOM element and display a custom
   * loading message
   */
  var displayLoadingAnimation = function(el, message) {
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
    var overlay = $('<div>')
      .addClass('tb-jf-overlay')
      .height(el.height() + 10)
      .width(el.width() + 20)
      .offset({
        left: 20
      });

    $(el.height).on('change', function() {
      overlay.height = el.height + 20;
    });

    $(el.width).on('change', function() {
      overlay.width = el.width + 20;
    });

    // render transparent overlay
    $(el).append(overlay);
  }

  /**
   * removes the loading animation from the given DOM element
   */
  var removeLoadingAnimation = function(el) {
    $(el).find('> .tb-jf-loading')
      .remove();

    $(el).find('> .tb-jf-overlay')
      .remove();
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
   * @param {boolean} ignoreArrays True to use first element in an array when
   *   stucked on a property. This parameter is basically only useful when
   *   parsing a JSON schema for which the "items" property may either be an
   *   object or an array with one object (only one because JSON form does not
   *   support mix of items for arrays).
   * @return {Object} The key's value or undefined.
   */
  jsonform.util.getObjByKey = function(obj, key, ignoreArrays) {
    // TRACE('jsonform.util.getObjByKey %s', arguments);

    var keyparts = key.split('/');
    var innerobj = obj;
    var prop = null;
    var subkey = null;
    var arrayMatch = null;

    /**
     * leading and ending slashes in json pointers are removed
     * /person/age or person/age/ both become person/age
     */
    if (keyparts[keyparts.length - 1] === '') {
      keyparts.pop();
    };

    if (keyparts[0] === '') {
      keyparts.shift();
    };

    for (var i = 0; i < keyparts.length; i++) {
      if ((innerobj === null)
        || (typeof innerobj !== "object")) {

        return undefined;
      }

      subkey = keyparts[i];
      prop = subkey.replace(reArray, '');
      reArray.lastIndex = 0;
      arrayMatch = reArray.exec(subkey);

      if (arrayMatch) {
        if (innerobj && innerobj.$ref) {
          innerobj = resolveRefs(jsonform.schema, innerobj, key);
        }

        innerobj = innerobj[prop];
        while (true) {
          if (!_.isArray(innerobj)) {
            return undefined;
          }

          innerobj = innerobj[parseInt(arrayMatch[1], 10)];
          arrayMatch = reArray.exec(subkey);
          if (!arrayMatch) {
            break;
          }
        }
      } else if (ignoreArrays
        && !innerobj[prop]
        && _.isArray(innerobj)
        && innerobj[0]) {

        if (innerobj[0] && innerobj[0].$ref) {
          innerobj[0] = resolveRefs(jsonform.schema, innerobj[0], key);
        }

        innerobj = innerobj[0][prop];
      } else {
        if (innerobj && innerobj.$ref) {
          innerobj = resolveRefs(jsonform.schema, innerobj, key);
        }

        innerobj = innerobj[prop];
      }
    }

    if (ignoreArrays
      && _.isArray(innerobj)
      && innerobj[0]) {

      if (innerobj[0] && innerobj[0].$ref) {
        innerobj[0] = resolveRefs(jsonform.schema, innerobj[0], key);
      }

      return innerobj[0];
    } else {

      if (innerobj && innerobj.$ref) {
        innerobj = resolveRefs(jsonform.schema, innerobj, key);
      }

      return innerobj;
    }
  };

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
  jsonform.util.getObjByKeyEx = function(obj, key, objKey) {
    // TRACE('jsonform.util.getObjByKeyEx %s', arguments);

    ASSERT.ofTbType(key, 'string|undefined', 'getObjByKeyEx received unexpected input.')

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

    var m = key.match(/^((([^\\\[\/]|\\.)+)|\[(\d+)\])\/?(.*)$/);

    if (!m) {
      throw new Error('bad format key: ' + key);
    }

    if (typeof m[2] === 'string' && m[2].length > 0) {
      innerobj = innerobj[m[2]];
    } else if (typeof m[4] === 'string' && m[4].length > 0) {
      innerobj = innerobj[Number(m[4])];
    } else {
      throw new Error('impossible reach here');
    }

    if (innerobj && m[5].length > 0) {
      innerobj = this.getObjByKeyEx(innerobj, m[5]);
    }

    if (innerobj && innerobj.$ref) {
      innerobj = resolveRefs(jsonform.schema, innerobj, key);
    }

    return innerobj;
  };

  /**
   * Sets the key identified by a path selector to the given value.
   *
   * Levels in the path are separated by a dot. Array items are marked
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
  jsonform.util.setObjValueByKey = function(obj, key, value) {
    // TRACE('jsonform.util.setObjValueByKey %s', arguments);

    var innerobj = obj;
    var keyparts = key.split("/");
    var subkey = null;
    var arrayMatch = null;
    var prop = null;

    for (var i = 0; i < keyparts.length-1; i++) {
      subkey = keyparts[i];
      prop = subkey.replace(reArray, '');
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


  /**
   * Merge the values of two or more objects and return the result.
   * Unlike JQuery.extend null values are not ignored
   *
   * @function
   * @param {Boolean} flag defining whether the a deep copy should be made
   * @param {Object} the target which will store the cloned values of the following object
   * @param {Object} an arbytrary number of object all of which will be cloned
   *    and assigned to the target
   */
  jsonform.util.extend = function() {
    // TRACE('jsonform.util.extend %s', arguments);

    var options;
    var name;
    var src;
    var copy;
    var copyIsArray;
    var clone;
    var target = arguments[ 0 ] || {};
    var i = 1;
    var length = arguments.length;
    var deep = false;

    // Handle a deep copy situation
    if (typeof target === "boolean") {
      deep = target;

      // Skip the boolean and the target
      target = arguments[i] || {};
      i++;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== "object" && !jQuery.isFunction(target)) {
      target = {};
    }

    if (i === length) {
      throw new Error('JSONForm extend requires more than 1 argument');
    }

    for (; i < length; i++) {

      // Only deal with non-null/undefined values
      if ((options = arguments[i]) !== undefined) {

        // Extend the base object
        for (name in options) {
          src = target[name];
          copy = options[name];

          // Prevent never-ending loop
          if (target === copy) {
            continue;
          }

          // Recurse if we're merging plain objects or arrays
          if (deep
            && (copy !== undefined)
            && ((jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy))))) {

            if (copyIsArray) {
              copyIsArray = false;
              clone = src && jQuery.isArray(src) ? src : [];

            } else {
              clone = src && jQuery.isPlainObject(src) ? src : {};
            }

            // Never move original objects, clone them
            target[name] = jQuery.extend(deep, clone, copy);

          // Don't bring in undefined values
          } else if (copy !== undefined) {
            target[name] = copy;
          }
        }
      }
    }

    // Return the modified object
    return target;
  };

  /**
   * nonstandard typeof function which takes care of arrays and integers
   *
   * @function
   * @param {any} the value whose type is in question
   * @param {Boolean} flag which determines whether integer is a valid return value
   */
  jsonform.util.typeof = function(value, allowInteger) {
    // TRACE('jsonform.util.typeof %s', arguments);

    if (allowInteger && _.isInteger(value)) {
      return 'integer';
    } else {
      return TB.typeof(value);
    }
  };

  /**
   * Validate the given value against the schema type and make surethat they match.
   * Two validation modes are available: strict and not strict. In strict mode every error triggers an assert.
   * In the unstrict mode the schema is modified so that the given values are valid. This should be used
   * only for backwards compatibility with the values submitted from old schemas.
   *
   * @param  {[Object]} object which contains the schemaElement
   * @param  {Boolean|String|Number|Object|Array|null} the value which will be compared against the schema type
   * @param  {[Boolean]} strict validation or not
   */
  jsonform.util.validateValueType = function(key, schemaElement, formElement, deprecatedValue, value, isStrict) {
    // TRACE('jsonform.util.validateValueType %s', arguments);

    // handle the integer type separately as it is not a normal js type and neither
    // typeof not TB.typesof takes care of it
    var valueType = jsonform.util.typeof(value, contains(schemaElement.type, 'integer'));
    // ASSERT expects a string of one or more value types separated by a pipe
    var validTypes = schemaElement.type;

    if (jsonform.util.typeof(validTypes) === 'array') {
      validTypes = validTypes.join('|');
    }

    /**
     * in strict mode an assert fires in case the value does not obey the schema type constraint
     */
    if (isStrict) {
      switch (valueType) {
        case 'null':
          break;
        case 'boolean':
        case 'string':
        case 'number':
        case 'integer':
          ASSERT_PEER(contains(schemaElement.type, valueType), 'Invalid value: The value of schema key %s with allowed schema types %s is of type %s.', key, schemaElement.type, valueType);
          break;
        case 'object':
          ASSERT_PEER(contains(schemaElement.type, valueType), 'Invalid value: The value of schema key %s with allowed schema types %s is of type %s.', key, schemaElement.type, valueType);

          // TRACE('Object value %s', schemaElement.type);
          break;
        case 'array':
          ASSERT_PEER(contains(schemaElement.type, valueType), 'Invalid value: The value of schema key %s with allowed schema types %s is of type %s.', key, schemaElement.type, valueType);
          ASSERT_PEER(schemaElement.items, 'Invalid Schema: no items descriptor defined for this array.');

          /**
           * if the instance is a complex array (array of objects) each of the object properties
           * will be validated when the appropriate key is reached
           * otherwise iterate through all values and make sure they are valid
           */
          if (!contains(schemaElement.items.type, 'object')) {

            _.each(value, function(value, index) {
              var valueType = jsonform.util.typeof(value, contains(schemaElement.items.type, 'integer'));
              ASSERT_PEER(contains(schemaElement.items.type, valueType), 'Invalid value: The value of schema.items for key %s with allowed schema types %s is of type %s.', key, schemaElement.items.type, valueType);
            });
          }

          /**
           * in case the form element requires an enum check whether the schema is valid
           */
          if (jsonform.elementTypes[formElement.type].requiresEnum) {
            ASSERT_PEER(schemaElement.items.enum);
          };

          break;
        default:
          ASSERT_PEER.ofTbType(schemaElement.type, 'boolean|string|number|integer|object|array|null', 'Invalid Schema: The schema element with key %s is of unrecognized type %s', key, schemaElement.type);
          break;
      }
    /**
     * unstrict mode does not assert type mismatches instead it changes the schema so that
     * it fits the data. All modified schemas are given the isDeprecated: true flag and
     * their corresponding values are prepended by the deprecatedValue global constant.
     */
    } else {
      switch (valueType) {
        case 'null':
          break;
        case 'boolean':
          var oldValue = value;

          try {
            value = Boolean(value);
          } catch (e) {
            ASSERT_PEER(false, 'The value %s for %s is invalid.', oldValue, key);7121
          }

          break;
        case 'string':
          var oldValue = value;

          try {
            value = String(value);
          } catch (e) {
            ASSERT_PEER(false, 'The value %s for %s is invalid.', oldValue, key);
          }

          break;
        case 'number':
          var oldValue = value;

          try {
            value = Number(value);
          } catch (e) {
            ASSERT_PEER(false, 'The value %s for %s is invalid.', oldValue, key);
          }

          break;
        case 'integer':

          var oldValue = value;

          try {
            value = Math.floor(Number(value));
          } catch (e) {
            ASSERT_PEER(false, 'The value %s for %s is invalid.', oldValue, key);
          }

          break;
        case 'object':
          // TRACE('Object value %s', schemaElement.type);
          break;
        case 'array':
          ASSERT_PEER.ofTbType(value, 'array', 'Invalid Schema: The value of schema key %s isn\'t of type array as specified in the schema.', key, schemaElement.type);
          ASSERT_PEER(schemaElement.items, 'Invalid Schema: no items descriptor defined for this array.');
          ASSERT_PEER(false, 'Invalid array structure for key %s', key);
          /**
           * in case the form element requires an enum but none is defined create one in the schema
           */
          if (jsonform.elementTypes[formElement.type].requiresEnum && !schemaElement.items.enum) {
            schemaElement.items.enum = [];
          };

          _.each(value, function(value, index) {
            var valueType = jsonform.util.typeof(value);

            if (!contains(schemaElement.items.type, valueType) && valueType !== 'null') {
              if (!contains(schemaElement.items.type, valueType)) {
                if (Array.isArray(schemaElement.items.type)) {
                  schemaElement.items.type.push('string');
                } else {
                  schemaElement.items.type = ['string', schemaElement.type];
                }
              }

              schemaElement.isDeprecated = true;
              value = value;
            }

            /**
             * in case the form element requires an enum create one in the schema
             */
            if (jsonform.elementTypes[formElement.type].requiresEnum) {
              schemaElement.items.enum.push(value);
            };
          });

          break;
        default:
          ASSERT_PEER.ofTbType(schemaElement.type, 'boolean|string|number|integer|object|array|null', 'Invalid Schema: The schema element with key %s is of unrecognized type', key);
          break;
      }
    }

    return value;
  };



  // Standard input template
  jsonform.fieldTemplate = function(inner) {
    // TRACE('jsonform.fieldTemplate %s', arguments);

    return '<div class="<%= cls.groupClass %> tb-jf-node col-sm-<%= node.rowWidth %>' +
      '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
      '<%= elt.htmlClass ? " " + elt.htmlClass : "" %>' +
      '<%= (node.formElement && node.formElement.required && (node.formElement.type !== "checkbox") ? " tb-jf-required" : "") %>' +
      '<%= (node.isReadOnly() ? " tb-jf-readonly" : "") %>' +
      '<%= (node.disabled ? " tb-jf-disabled" : "") %>"' +
      ' data-tb-jf-type="<%= node.formElement.type %>">' +
      '<% if (node.title && !elt.notitle) { %>' +
        '<label class="<%= cls.labelClass %> tb-jf-clear-margins" for="<%= node.id %>"><%= node.title %> </label>' +
        // '<% if (node.characterCounter) { %>' +
        //   '<span class="label label-primary tb-jf-character-counter">' +
        //   '<span class="tb-jf-characters-used">10</span>' +
        //   ' / <span class="tb-jf-characters-limit">100</span>' +
        //   '</span>' +
        // '<% } %>' +
      '<% } %>' +

      '<div class="<%= cls.controlClass %>">' +
        '<% if (node.description) { %>' +
          '<span class="help-block tb-jf-description tb-jf-clear-margins"><%= node.description %></span>' +
        '<% } %>' +

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
      '</div></div>';
  };

  // Table cell template
  jsonform.tableCellTemplate = function(inner) {
    // TRACE('jsonform.tableCellTemplate %s', arguments);

    return '<td class="<%= cls.groupClass %> tb-jf-tablecell tb-jf-node ' +
      '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
      '<%= elt.htmlClass ? " " + elt.htmlClass : "" %>' +
      '<%= (node.formElement && node.formElement.required && (node.formElement.type !== "checkbox") ? " tb-jf-required" : "") %>' +
      '<%= (node.isReadOnly() ? " tb-jf-readonly" : "") %>' +
      '<%= (node.disabled ? " tb-jf-disabled" : "") %>' +
      '" data-tb-jf-type="<%= node.formElement.type %>">' +

      '<div class="<%= cls.controlClass %>">' +
        '<% if (node.description) { %>' +
          '<span class="help-block tb-jf-description tb-jf-clear-margins"><%= node.description %></span>' +
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

  var inputFieldTemplate = function(type, isTextualInput, extraOpts) {
    // TRACE('inputFieldTemplate %s', arguments);

    var templ = {
      'template': '<input ' +
        'class="<%= cls.textualInputClass %> <%= fieldHtmlClass %>" ' +
        'name="<%= node.name %>" value="<%= _.escape(value) %>" id="<%= id %>"' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '<%= node.readOnly %>' +
        '<%= node.placeholder %>' +
        ' />',
      'compatibleTypes': ['string', 'number', 'integer'],
      'compatibleFormats': [],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      'inputfield': true,
      isTbTemplate: false,
      'onBeforeRender': function (data, node) {
        node.readOnly = node.isReadOnly()
          ? ' readonly="readonly"'
          : ' ';

        node.placeholder = (node.placeholder)
          ? ' placeholder="' + _.escape(node.placeholder) + '"'
          : ' ';

        node.characterCounter = true;
      },
      'onInsert': function(evt, node) {
        if (node.formElement.align !== undefined) {
          ASSERT_PEER(['left', 'right', 'center'].indexOf(node.formElement.align) >= 0, 'input field: the align property must be either left, right or center.')

          $(node.el).find('input').css("text-align", node.formElement.align);
        }

        if (node.formElement && node.formElement.autocomplete) {
          var $input = $(node.el).find('input');
          if ($input.autocomplete) {
            $input.autocomplete(node.formElement.autocomplete);
          }
        }
        if (node.formElement
          && (node.formElement.tagsinput || node.formElement.getValue === 'tagsvalue')) {

          if (!$.fn.tagsinput) {
            throw new Error('tagsinput is not found');
          }
          var $input = $(node.el).find('input');
          var isArray = Array.isArray(node.value);
          if (isArray) {
            $input.attr('value', '').val('');
          }
          $input.tagsinput(node.formElement ? (node.formElement.tagsinput || {}) : {});
          if (isArray) {
            node.value.forEach(function(value) {
              $input.tagsinput('add', value);
            });
          }
        }
        if (node.formElement && node.formElement.typeahead) {
          var $input = $(node.el).find('input');
          if ($input.typeahead) {
            if (Array.isArray(node.formElement.typeahead)) {
              for (var i = 1; i < node.formElement.typeahead.length; ++i) {
                var dataset = node.formElement.typeahead[i];
                if (dataset.source && Array.isArray(dataset.source)) {
                  var source = dataset.source;
                  dataset.source = function(query, cb) {
                    var lq = query.toLowerCase();
                    cb(source.filter(function(v) {
                      return v.toLowerCase().indexOf(lq) >= 0;
                    }).map(function(v) {
                      return (typeof v === 'string') ? {value: v} : v;
                    }));
                  }
                }
              }
              $.fn.typeahead.apply($input, node.formElement.typeahead);
            } else {
              $input.typeahead(node.formElement.typeahead);
            }
          }
        }
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {


          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('readonly', true);
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .removeProp('readonly');
      }
    }
    if (extraOpts) {
      templ = _.extend(templ, extraOpts);
    }
    return templ;
  };

  var numberFieldTemplate = function(type, isTextualInput) {
    // TRACE('numberFieldTemplate %s', arguments);

    return {
      'template': '<input ' +
        'class="<%= cls.textualInputClass %> <%= fieldHtmlClass %>" ' +
        'name="<%= node.name %>" value="<%= _.escape(value) %>" id="<%= id %>"' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '<%= node.readOnly %>' +
        '<%= node.step %>' +
        '<%= node.placeholder %>' +
        ' />',
      'fieldtemplate': true,
      'inputfield': true,
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      isTbTemplate: false,
      'compatibleTypes': ['number', 'integer'],
      'compatibleFormats': [],
      'onBeforeRender': function (data, node) {
        node.step = (node.range && node.range.step !== undefined)
          ? ' step="' + range.step + '"'
          : ' ';

        node.readOnly = node.isReadOnly()
          ? ' readonly="readonly"'
          : ' ';

        node.placeholder = (node.placeholder)
          ? ' placeholder="' + _.escape(node.placeholder) + '"'
          : ' ';

        data.range = {
          step: 1
        };

        if (type == 'range') {
          data.range.min = 1;
          data.range.max = 100;
        }

        if (!node || !node.schemaElement) {
          return;
        }

        if (node.formElement && node.formElement.step) {
          data.range.step = node.formElement.step;
        } else if (node.schemaElement.type == 'number') {
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
      'onInsert': function(evt, node) {
        if (node.formElement.align !== undefined) {
          ASSERT_PEER(['left', 'right', 'center'].indexOf(node.formElement.align) >= 0, 'input field: the align property must be either left, right or center.')

          $(node.el).find('input').css("text-align", node.formElement.align);
        }
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('readonly', true);
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .removeProp('readonly');
      }
    };
  };

  var selectFieldTemplate = ''
    + '<select name="<%= node.name %>" id="<%= id %>"'
    + 'class="<%= cls.textualInputClass %> <%= fieldHtmlClass %>" '
    + '<%= (node.disabled? " disabled" : "")%>'
    + '<%= (node.readOnly ? " readonly=\'readonly\' disabled=\'disabled\'" : "") %>'
    + '> '
    + '<% _.each(node.options, function(key, val) { if (key instanceof Object) { '
    + 'if (value === key.value) { %> '
    + '<option selected value="<%= key.value %>"><%= key.title %></option> '
    + '<% } else { %> '
    + '<option value="<%= key.value %>"><%= key.title %></option> '
    + '<% }} else { if (value === key) { %> '
    + '<option selected value="<%= key %>"><%= key %></option> '
    + '<% } else { %> '
    + '<option value="<%= key %>"><%= key %></option> <% }}}); %> '
    + '</select>';

  var datePickerTemplate = ''
    + '<div id="<%= id %>" class="row"><span class="col-md-5"><input name="<%= node.name %>" '
    + 'class="<%= cls.textualInputClass %> <%= fieldHtmlClass %>" '
    + '<%= (node.disabled? " disabled" : "")%>'
    + '<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>'
    + '<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>'
    + 'value="" /> </span></div>';

  jsonform.elementTypes = {
    'none': {
      'template': ''
    },
    'root': {
      'template': '<div class="row"><%= children %></div>'
    },
    'text': inputFieldTemplate('text', true),
    'password': inputFieldTemplate('password', true),
    'date': inputFieldTemplate('date', true, {
      'onInsert': function(evt, node) {
        if (window.Modernizr && window.Modernizr.inputtypes && !window.Modernizr.inputtypes.date) {
          var $input = $(node.el).find('input');
          if ($input.datepicker) {
            var opt = {dateFormat: "yy-mm-dd"};
            if (node.formElement && node.formElement.datepicker && typeof node.formElement.datepicker === 'object') {
              _.extend(opt, node.formElement.datepicker);
            }
            $input.datepicker(opt);
          }
        }
      }
    }),
    'datetime': inputFieldTemplate('datetime', true),
    'datetime-local': inputFieldTemplate('datetime-local', true, {
      'onBeforeRender': function (data, node) {
        if (data.value && data.value.getTime) {
          data.value = new Date(data.value.getTime() - data.value.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, -1);
        }
      }
    }),
    'email': inputFieldTemplate('email', true),
    'month': inputFieldTemplate('month', true),
    'number': numberFieldTemplate('number', true),
    'search': inputFieldTemplate('search', true),
    'tel': inputFieldTemplate('tel', true),
    'time': inputFieldTemplate('time', true),
    'url': inputFieldTemplate('url', true),
    'week': inputFieldTemplate('week', true),
    'range': numberFieldTemplate('range'),
    'color': {
      'template':'<input type="text" ' +
        '<%= (fieldHtmlClass ? "class=\'" + fieldHtmlClass + "\' " : "") %>' +
        'name="<%= node.name %>" value="<%= escape(value) %>" id="<%= id %>"' +
        '<%= (node.formElement.readOnly? " disabled=\'disabled\'" : "")%>' +
        '<%= (node.required ? " required=\'required\'" : "") %>' +
        ' />',
      'compatibleTypes': ['string'],
      'compatibleFormats': ['color'],
      'fieldtemplate': true,
      'inputfield': true,
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      isTbTemplate: false,
      'onInsert': function(evt, node) {
        $(node.el).find('#' + escapeSelector(node.id)).spectrum({
          preferredFormat: "hex",
          showInput: true
        });
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('disabled', 'disabled');

        $(node.el).find('.sp-replacer')
          .addClass('sp-disabled');
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .removeProp('disabled');

        $(node.el).find('.sp-replacer')
          .removeClass('sp-disabled');
      }
    },
    'textarea': {
      'template':'<textarea id="<%= id %>" name="<%= node.name %>" ' +
        'class="<%= cls.textualInputClass %> <%= fieldHtmlClass %>" ' +
        'style="<%= elt.height ? "height:" + elt.height + ";" : "" %>width:<%= elt.width || "100%" %>;"' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
        '<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
        '><%= value %></textarea>',
      'compatibleTypes': ['string', 'number', 'integer'],
      'compatibleFormats': [],
      'fieldtemplate': true,
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'inputfield': true,
      isTbTemplate: false,
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }


        $(node.el).find('textarea')
          .prop('readonly', true);
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('textarea')
          .removeProp('readonly');
      }
    },
    'preview': {
      'template':'<div id="<%= id %>" name="<%= node.name %>" '
      + 'class="<%= fieldHtmlClass %> tb-jf-preview" '
      // + '<button type="button" class="btn btn-xs btn-info tb-jf-description tb-jf-info-button" data-toggle="tooltip" data-placement="top" title="<%= node.description %>"><span>?</span></button>'
      + '<span class="tb-jf-title"> <%= node.title %>: </span> '
      + '<span class="tb-jf-value"> <%= node.previewValue %> </span>'
      + '</div>',
      'compatibleTypes': ['string', 'number', 'integer', 'boolean', 'array'],
      'compatibleFormats': [],
      'previewField': true,
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      isTbTemplate: false,
      'onBeforeRender': function(data, node) {
        var nodeKeyPath = node.formElement.key.split('/');

        node.title = node.title || nodeKeyPath[nodeKeyPath.length - 1].split('[')[0];

        // console.log(node);
        if (node.value === null || node.value === undefined || _.trim(node.value) === '') {
          node.previewValue = ' - ';
        } else {
          node.previewValue = node.value;
        }
      },
      'onInsert': function (evt, node) {
      }
    },
    'tinymce': {
      'template':'<textarea id="<%= id %>" name="<%= node.name %>" ' +
        'class="<%= cls.textualInputClass %> <%= fieldHtmlClass %>" ' +
        'style="<%= elt.height ? "height:" + elt.height + ";" : "" %>width:<%= elt.width || "100%" %>;"' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '<%= (node.readOnly? " disabled" : "")%>' +
        '<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
        '><%= value %></textarea>',
      'compatibleTypes': ['string', 'number', 'integer'],
      'compatibleFormats': ['html'],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      'inputfield': true,
      isTbTemplate: false,
      'onBeforeRender': function (data, node) {
      },
      'onInsert': function (evt, node) {
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
          'base64image', 'example', 'legacyoutput', 'save', 'wordcount',
          'bbcode', 'example_dependency', 'link', 'searchreplace',
          'fullpage', 'lists', 'spellchecker',
          'charmap', 'fullscreen', 'tabfocus',
          'code', 'hr', 'nonbreaking', 'table', 'fontselect', 'fontsize'
        ]
        var pluginOptions = node.formElement.pluginOptions || {};

        pluginOptions.selector = '#' + node.id;
        pluginOptions.readonly = node.isReadOnly() || node.disabled;

        if (pluginOptions.height !== undefined) {
          ASSERT_PEER.ofTbType(pluginOptions.height, 'number');
          ASSERT_PEER(pluginOptions.height > 0);
        } else {
          pluginOptions.height = 150;
        }

        if (pluginOptions.max_height !== undefined) {
          ASSERT_PEER(pluginOptions.max_height >= pluginOptions.height, 'TinyMCE: pluginOptions.max_height %s must be greater or equal to pluginOptions.height %s.', pluginOptions.max_height, pluginOptions.height);
        }

        if (pluginOptions.min_height !== undefined) {
          ASSERT_PEER(pluginOptions.min_height <= pluginOptions.height, 'TinyMCE: pluginOptions.min_height %s must be less or equal to pluginOptions.height %s.', pluginOptions.min_height, pluginOptions.height);
        }

        if (pluginOptions.width !== undefined) {
          ASSERT_PEER.ofTbType(pluginOptions.width, 'number');
          ASSERT_PEER(pluginOptions.width > 0);
        }

        if (pluginOptions.max_width !== undefined) {
          ASSERT_PEER.ofTbType(pluginOptions.max_width, 'number');
          if (pluginOptions.width !== undefined) {
            ASSERT_PEER(pluginOptions.max_width >= pluginOptions.width, 'TinyMCE: pluginOptions.max_width %s must be greater or equal to pluginOptions.width %s.', pluginOptions.max_width, pluginOptions.width);
          }
        }

        if (pluginOptions.min_width !== undefined) {
          ASSERT_PEER.ofTbType(pluginOptions.min_width, 'number');
          if (pluginOptions.width !== undefined) {
            ASSERT_PEER(pluginOptions.min_width <= pluginOptions.width, 'TinyMCE: pluginOptions.min_width %s must be less or equal to pluginOptions.width %s.', pluginOptions.min_width, pluginOptions.width);
          }
        }

        if (pluginOptions.theme !== undefined) {
          ASSERT_PEER.ofTbType(pluginOptions.theme, 'string');
          ASSERT_PEER(supportedThemes.indexOf(pluginOptions.theme) >= 0, 'TinyMCE: pluginOptions.theme contains a theme that does not exist: %s.', pluginOptions.theme);
        } else {
          pluginOptions.theme = 'modern';
        }

        if (pluginOptions.skin !== undefined) {
          ASSERT_PEER.ofTbType(pluginOptions.skin, 'string');
          ASSERT_PEER(supportedSkins.indexOf(pluginOptions.skin) >= 0, 'TinyMCE: pluginOptions.skin contains a skin that does not exist: %s.', pluginOptions.skin);
        } else {
          pluginOptions.skin = 'lightgray-gradient';
        }

        if (pluginOptions.plugins !== undefined && pluginOptions.plugins.length) {
          ASSERT_PEER(_.isArray(pluginOptions.plugins) === true, 'TinyMCE: pluginOptions.plugins must be an array.');

          for (var i = 0, j = pluginOptions.plugins.length; i < j; i++) {
            ASSERT_PEER(supportedPlugins.indexOf(pluginOptions.plugins[i]) >= 0, 'TinyMCE: pluginOptions.plugins contains a plugin that does not exist: %s', pluginOptions.plugins[i]);
          }

          if(pluginOptions.plugins.indexOf('base64image') < 0) {
            pluginOptions.plugins.push('base64image');
          }
        } else {
          pluginOptions.plugins = ['base64image'];
        }

        // images cannot be added in inline mode
        if (pluginOptions.inline !== undefined) {
        //   ASSERT_PEER.ofTbType(pluginOptions.inline, 'boolean', 'TinyMCE: pluginOptions.inline %s must be a boolean', pluginOptions.inline);
        // } else {
          pluginOptions.inline = false;
        }

        if (pluginOptions.image_advtab !== undefined) {
          ASSERT_PEER.ofTbType(pluginOptions.image_advtab, 'boolean', 'TinyMCE: pluginOptions.inline %s must be a boolean', pluginOptions.image_advtab);
        } else {
          pluginOptions.image_advtab = false;
        }

        if (pluginOptions.resize !== undefined) {
          if (typeof pluginOptions.resize !== 'string') {
            ASSERT_PEER.ofTbType(pluginOptions.resize, 'boolean', 'TinyMCE: pluginOptions.resize %s must be a boolean or the string "both"', pluginOptions.resize);
          } else {
            ASSERT_PEER(pluginOptions.resize === 'both', 'TinyMCE: pluginOptions.resize %s must be a boolean or the string "both"', pluginOptions.resize);
          }
        } else {
          pluginOptions.resize = true;
        }

        if (pluginOptions.paste_data_images !== undefined) {
          ASSERT_PEER.ofTbType(pluginOptions.paste_data_images, 'boolean', 'TinyMCE: pluginOptions.resize %s must be a boolean', pluginOptions.paste_data_images);
        } else {
          pluginOptions.paste_data_images = true;
        }

        if (pluginOptions.max_image_count !== undefined) {
          ASSERT_PEER.ofTbType(pluginOptions.max_image_count, 'number', 'TinyMCE: pluginOptions.max_image_count %s must be a number', pluginOptions.max_image_count);
        } else {
          pluginOptions.max_image_count = 10;
        }

        if (pluginOptions.max_image_size !== undefined) {
          ASSERT_PEER.ofTbType(pluginOptions.max_image_size, 'number', 'TinyMCE: pluginOptions.max_image_size %s must be a number', pluginOptions.max_image_size);
        } else {
          // default is 500kb
          pluginOptions.max_image_size = 512000;
        }

        if (pluginOptions.max_image_height !== undefined) {
          ASSERT_PEER.ofTbType(pluginOptions.max_image_height, 'number', 'TinyMCE: pluginOptions.max_image_height %s must be a number', pluginOptions.max_image_height);
        } else {
          pluginOptions.max_image_height = 1024;
        }

        if (pluginOptions.max_image_width !== undefined) {
          ASSERT_PEER.ofTbType(pluginOptions.max_image_width, 'number', 'TinyMCE: pluginOptions.max_image_width %s must be a number', pluginOptions.max_image_width);
        } else {
          pluginOptions.max_image_width = 1024;
        }

        pluginOptions.toolbar1 = 'undo redo | base64image styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent | link image | forecolor backcolor | preview print';

        if (pluginOptions.readonly !== undefined) {
          ASSERT_PEER.ofTbType(pluginOptions.readonly, 'boolean', 'TinyMCE: pluginOptions.readonly %s must be a boolean', pluginOptions.readonly);
          if (pluginOptions.readonly) {
            pluginOptions.toolbar1 = '';
          }
        }

        /**
         * TimyMCE exists in an iframe so change evnts do not bubble to the tb-jf-root
         * detect all change events and apply them to the textbox which keeps
         * the value of the TinyMCE instance
         */
        pluginOptions.setup = function(editor) {
          editor.on('change', function(e) {
            $(pluginOptions.selector).trigger('change');
          });
        }

        tinymce.init(pluginOptions);
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        tinyMCE.get('' + node.id).setMode('readonly');
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        tinyMCE.get('' + node.id).setMode('edit');
      }
    },
    'ace': {
      'template':'<div id="<%= id %>" style="position:relative;height:<%= elt.height || "300px" %>;"><div id="<%= id %>__ace" style="width:<%= elt.width || "100%" %>;height:<%= elt.height || "300px" %>;"></div><input type="hidden" name="<%= node.name %>" id="<%= id %>__hidden" value="<%= escape(value) %>"/></div>',
      'compatibleTypes': ['string', 'number', 'integer'],
      'compatibleFormats': [],
      'fieldtemplate': true,
      'inputfield': true,
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      isTbTemplate: false,
      'onBeforeRender': function (data, node) {
        if (data.value && typeof data.value == 'object' || Array.isArray(data.value)) {
          data.value = JSON.stringify(data.value, null, 2);
        }
      },
      'onInsert': function (evt, node) {
        var setup = function () {
          var formElement = node.formElement || {};
          var ace = window.ace;
          var editor = ace.edit($(node.el).find('#' + escapeSelector(node.id) + '__ace').get(0));
          var idSelector = '#' + escapeSelector(node.id) + '__hidden';
          // Force editor to use "\n" for new lines, not to bump into ACE "\r" conversion issue
          // (ACE is ok with "\r" on pasting but fails to return "\r" when value is extracted)
          editor.getSession().setNewLineMode('unix');
          editor.renderer.setShowPrintMargin(false);
          editor.setTheme("ace/theme/"+(formElement.aceTheme||"twilight"));

          if (formElement.aceMode) {
            editor.getSession().setMode("ace/mode/"+formElement.aceMode);
          }
          editor.getSession().setTabSize(2);

          // Set the contents of the initial manifest file
          var valueStr = node.value;
          if (valueStr === null || valueStr === undefined) {
            valueStr = '';
          } else if (typeof valueStr == 'object' || Array.isArray(valueStr)) {
            valueStr = JSON.stringify(valueStr, null, 2);
          }
          editor.getSession().setValue(valueStr);

          //TODO this is clearly sub-optimal
          // 'Lazily' bind to the onchange 'ace' event to give
          // priority to user edits
          var lazyChanged = _.debounce(function () {
            $(node.el).find(idSelector).val(editor.getSession().getValue());
            $(node.el).find(idSelector).change();
          }, 600);
          editor.getSession().on('change', lazyChanged);

          editor.on('blur', function() {
            $(node.el).find(idSelector).change();
            $(node.el).find(idSelector).trigger("blur");
          });
          editor.on('focus', function() {
            $(node.el).find(idSelector).trigger("focus");
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
        var itv = window.setInterval(function() {
          if (window.ace) {
            window.clearInterval(itv);
            setup();
          }
        }, 1000);
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        ace.edit($(node.el).find('#' + escapeSelector(node.id) + '__ace').get(0))
          .setReadOnly(true);
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        ace.edit($(node.el).find('#' + escapeSelector(node.id) + '__ace').get(0))
          .setReadOnly(false);
      }
    },
    'checkbox': {
      'template': '<div class="checkbox styled"><input type="checkbox" id="<%= id %>" '
      + 'name="<%= node.name %>" value="1" <% if (value) {%>checked<% } %>'
      + '<%= (node.disabled? " disabled=\'disabled\'" : "")%>'
      + '<%= (node.readOnly? " disabled=\'disabled\'" : "")%>'
      + ' />'
      + '<label class="tb-jf-checkbox-label" for="<%= id %>">'
      + '<%= (node.inlinetitle === true ? node.title : node.inlinetitle) || "" %>'
      + '</label>'
      + '</div>',
      'compatibleTypes': ['boolean'],
      'compatibleFormats': [],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      'inputfield': true,
      isTbTemplate: false,
      onBeforeRender: function(evt, node) {
        node.inlinetitle = node.title;
        node.title = undefined;

        node.isTbTemplate = false;
      },
      'onInsert': function (evt, node) {
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
            .on('change', function() {
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
      'getElement': function (el) {
        return $(el).parent().parent().get(0);
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }


        $(node.el).find('input')
          .prop('disabled', true);
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .removeProp('disabled');
      }
    },
    'file': {
      'template':'<input class="input-file" id="{{id}}" name="{{node.name}}" type="file" ' +
        '{{#node.required}} required="required" {{/node.required}}' +
        '/>',
      'compatibleTypes': ['string'],
      'compatibleFormats': ['base64'],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      isTbTemplate: false,
      'inputfield': true
    },
    'select': {
      'template': selectFieldTemplate,
      'compatibleTypes': ['string', 'number', 'integer', 'boolean'],
      'compatibleFormats': [],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      'inputfield': true,
      'isSearchableField': true,
      'requiresEnum': true,
      isTbTemplate: false,
      onBeforeRender: function(evt, node) {
        // add the null option as a possible choice if the field is NOT required
        // or if it is a boolean without a specified value
        if (!node.required || (node.schemaElement.type === 'boolean' && !_.isBoolean(node.value))) {
          var hasNull = 0;

          // if an option already has a null or empty string value do not add a new null value
          for (var i = 0, j = node.options.length - 1; i <= j; i++) {
            if (node.options.value === null || _.trim(node.options.value) === '') {
              hasNull++;
              break;
            }
          };

          if (!hasNull) {
            node.options.push({
              title: '',
              value: null,
            });
          }

          if (node.schemaElement.type === 'boolean') {
            node.value = (_.isBoolean( node.value )) ? node.value : null;
          }
        }

        if (node.formElement.titleMap) {
          _.each(node.options, function(key) {
            if (node.formElement.titleMap[key.value]) {
              key.title = node.formElement.titleMap[key.value];
            }
          });
        }
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {


          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('select')
          .prop('disabled', true);
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('select')
          .removeProp('disabled');
      }
    },
    'selectize': {
      'template': ''
        + '<select name="<%= node.name %>" '
        + ' <%= (node.schemaElement.type === "array" ? "multiple=\'multiple\'" : "") %>'
        + ' id="<%= id %>"'
        + ' <%= (fieldHtmlClass ? " class=\'" + fieldHtmlClass + "\'" : "") %>'
        + ' <%= (node.disabled? " disabled" : "")%>'
        + '> '
        + ' <% _.each(node.options, function(key, val) { %>'
        + '   <option <%= (value === key.value || (value.indexOf(key.value) >= 0)) ? "selected" : "" %> value="<%= key.value %>">'
        + '       <%= key.title %>'
        + '   </option>'
        + ' <% }) %>'
        + '</select>',
      'compatibleTypes': ['string', 'number', 'integer', 'boolean'],
      'compatibleFormats': [],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      'requiresEnum': true,
      'inputfield': true,
      'isSearchableField': true,
      isTbTemplate: false,
      'onInsert': function(evt, node) {
        var options = {};

        if (node.formElement.pluginOptions) {
          options = node.formElement.pluginOptions;
        }

        $('#' + node.id).selectize(options);
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('select')[0]
          .selectize.disable();
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('select')[0]
          .selectize.enable();
      }
    },
    'selecttemplate': {
      'template': ''
        + '<select name="<%= node.name %>" '
        + ' <%= (node.schemaElement.type === "array" ? "multiple=\'multiple\'" : "") %>'
        + ' id="<%= id %>"'
        + ' <%= (fieldHtmlClass ? " class=\'" + fieldHtmlClass + "\'" : "") %>'
        + ' <%= (node.disabled? " disabled" : "")%>'
        + ' <%= (node.readOnly? " readonly" : "")%>'
        + ' <%= (node.schemaElement && node.schemaElement.required ? " required=\'required\'" : "") %>'
        + '> '
        + '</select>',
      'compatibleTypes': ['string', 'number', 'integer', 'object'],
      'compatibleFormats': [],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      'inputfield': true,
      'requiresEnum': true,
      'isSearchableField': true,
      isTbTemplate: false,
      'onBeforeRender': function(data, node) {
        ASSERT(TB.Template)
        ASSERT_PEER.ofTbType(node.formElement.pluginOptions, 'object', 'selecttemplate: no pluginOptions object.');
        ASSERT_PEER.ofTbType(node.formElement.pluginOptions.valueField, 'string', 'selecttemplate: no valueField speciefied.');

        if (!node.formElement.pluginOptions.optionTemplate) {
          node.formElement.pluginOptions.optionTemplate = '<tr>'
            +'<td>{{name}}</td> '
            +'<td>{{email}}</td>'
            +'<td>{{city}}, {{country}}</tr>';
        };

        ASSERT_PEER.ofTbType(node.formElement.pluginOptions.optionTemplate, 'string', 'selecttemplate: no optionTemplate specified.');

        /**
         * in order to validate the results we need to find the type of the returned field
         * and construct an enum of all the calues contained in the original enum
         */
        node.schemaElement._originalType = node.schemaElement.type;
        node.schemaElement._originalEnum = _.clone(node.schemaElement.enum);

        node.schemaElement.type = typeof node.schemaElement.enum[0][node.formElement.pluginOptions.valueField];
        node.schemaElement.enum = [];

        _.each(node.schemaElement._originalEnum, function(value, index) {
          node.schemaElement.enum.push(value[node.formElement.pluginOptions.valueField]);
        });

        /**
         * in case selecttemplate is loaded with values from the schema send them to the selectize plugin
         * and apply the appropriate template
         */
        if (node.schemaElement._originalEnum) {
          node.formElement.pluginOptions.options = node.schemaElement._originalEnum;

          node.formElement.pluginOptions.render = {
            option: function(data, escape) {
              return TB.Template.render(node.formElement.pluginOptions.optionTemplate, data);
            },
            item: function(data, escape) {
              if (node.formElement.pluginOptions.itemTemplate) {
                return TB.Template.render(node.formElement.pluginOptions.itemTemplate, data);
              } else {
                return TB.Template.render(node.formElement.pluginOptions.optionTemplate, data);
              }
            }
          }
        }

        /**
         * selectize expects an array of properties which will be searchable by the user.
         * If none are specified the array is filled with the valueField (the returned field)
         * and all properties from the enum if it exists.
         */
        if (!node.formElement.pluginOptions.searchField) {
          node.formElement.pluginOptions.searchField = [node.formElement.pluginOptions.valueField];

          if (node.schemaElement._originalEnum) {
            _.each(_.keys(node.formElement.pluginOptions.options[0]), function(value) {
              node.formElement.pluginOptions.searchField.push(value);
            });
          }
        }

        /**
         * when the user types in the selectize field a search event is passed.
         * The event contains information about the node and a callback function which expects
         * an array of object which will be rendered by TB.Template when the callback is executed.
         */
        node.formElement.pluginOptions.load = function(query, callback) {
          /**
           * @options  array of objects whose properties will be used by TB.Template
           */
          function updateOptions(options) {
            ASSERT_PEER.ofTbType(options, 'array', 'selecttemplate: the callback expected an array of options');

            /**
             * verify that all of the newly recieved objects follow the specified constraints
             */
            _.each(options, function(value, index) {
              var valueField = value[node.formElement.pluginOptions.valueField];

              jsonform.util.validateValueType(
                node.key,
                node.schemaElement,
                node.formElement,
                node.ownerTree.formDesc.form.deprecatedValue,
                valueField,
                true
              );

              node.schemaElement.enum.push(valueField);
            });

            callback(options);
          }

          if (query.length) {
            $(node.el).trigger('search', {
              'node': node,
              'callback': updateOptions
            });
          }
        }
      },
      'onInsert': function(evt, node) {
        var element = $('#' + node.id);

        element.selectize(node.formElement.pluginOptions);

        // console.log(element.parent().find('.selectize-dropdown-content'))
        element.parent().find('.selectize-dropdown-content')
          .prepend('<tr><td>name</td> '
            + '<td>email</td>'
            + '<td>location</td>'
            + '</tr>');

        if (node.readOnly) {
          element[0].selectize.disable();
        }

        if (node.value) {
          var isValidValue = false;

          _.each(node.schemaElement.enum, function(value) {
            if (value === node.value) {
              isValidValue = true;
            }
          })

          ASSERT_PEER(isValidValue === true, 'selecttemplate: The value does not appear in the schema enum.');

          element[0].selectize.addItem(node.value)
        }

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
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('select')[0]
          .selectize.disable();
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('select')[0]
          .selectize.enable();
      }
    },
    'nativemultipleselect': {
      'template':'<select name="<%= node.name %><%= (node.schemaElement && node.schemaElement.type === "array" ? "[]" : "") %>" <%= (node.schemaElement && node.schemaElement.type === "array" ? "multiple" : "") %> id="<%= id %>"' +
        '<%= (fieldHtmlClass ? " class=\'" + fieldHtmlClass + "\'" : "") %>' +
        '<%= (node.disabled || node.readOnly? " disabled" : "")%>' +
        '> ' +
       '<% _.each(node.options, function(key, val) { if(key instanceof Object) { if (node.value && node.value.indexOf(String(key.value)) >= 0) { %> <option selected value="<%= key.value %>"><%= key.title %></option> <% } else { %> <option value="<%= key.value %>"><%= key.title %></option> <% }}}); %> ' +
      '</select>',
      'compatibleTypes': ['array'],
      'compatibleItemTypes': ['string', 'number', 'integer', 'boolean'],
      'compatibleFormats': [],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      'isSearchableField': true,
      'requiresEnum': true,
      'inputfield': true,
      isTbTemplate: false,
      'onBeforeRender': function (data, node) {
        node.options = [];

        _.each(node.schemaElement.items.enum, function(key, val) {
          node.options.push({
            title: key,
            value: key,
          })
        });

        if (node.formElement.titleMap) {
          _.each(node.options, function(key) {
            if (node.formElement.titleMap[key.value]) {
              key.title = node.formElement.titleMap[key.value];
            }
          });
        }
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('select')
          .prop('disabled', true);
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('select')
          .removeProp('disabled');
      }
    },
    'multipleselect': {
      'template':'<select name="<%= node.name %><%= (node.schemaElement && node.schemaElement.type === "array" ? "[]" : "") %>" <%= (node.schemaElement && node.schemaElement.type === "array" ? "multiple" : "") %> id="<%= id %>"' +
        '<%= (fieldHtmlClass ? " class=\'" + fieldHtmlClass + "\'" : "") %>' +
        '<%= (node.disabled || node.readOnly? " disabled" : "")%>' +
        '> ' +
       '<% /*alert(JSON.stringify(node.options,null,2));*/ _.each(node.options, function(key, val) { if(key instanceof Object) { if (node.value && node.value.indexOf(String(key.value)) >= 0) { %> <option selected value="<%= key.value %>"><%= key.title %></option> <% } else { %> <option value="<%= key.value %>"><%= key.title %></option> <% }}}); %> ' +
      '</select>',
      'compatibleTypes': ['array'],
      'compatibleItemTypes': ['string', 'number', 'integer', 'boolean'],
      'compatibleFormats': [],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      'requiresEnum': true,
      'inputfield': true,
      'isSearchableField': true,
      isTbTemplate: false,
      'onBeforeRender': function (data, node) {
        node.options = [];

        _.each(node.schemaElement.items.enum, function(key, val) {
          node.options.push({
            title: key,
            value: key,
          })
        });

        if (node.formElement.titleMap) {
          _.each(node.options, function(key) {
            if (node.formElement.titleMap[key.value]) {
              key.title = node.formElement.titleMap[key.value];
            }
          });
        }
      },
      'onInsert': function(evt, node) {
        var defaultOptions = {
          sortable: false,
          animate: true
        };

        var options = _.extend(defaultOptions, node.formElement.multipleselectOptions);

        $('#' + node.id).orderedSelect(options);
      }
    },
    'orderedselect': {
      'template':'<select name="<%= node.name %><%= (node.schemaElement && node.schemaElement.type === "array" ? "[]" : "") %>" <%= (node.schemaElement && node.schemaElement.type === "array" ? "multiple" : "") %> id="<%= id %>"' +
        '<%= (fieldHtmlClass ? " class=\'" + fieldHtmlClass + "\'" : "") %>' +
        '<%= (node.disabled || node.readOnly? " disabled" : "")%>' +
        '> ' +
       '<% _.each(node.options, function(key, val) { if(key instanceof Object) { if (node.value && node.value.indexOf(String(key.value)) >= 0) { %> <option selected value="<%= key.value %>"><%= key.title %></option> <% } else { %> <option value="<%= key.value %>"><%= key.title %></option> <% }}}); %> ' +
      '</select>',
      'compatibleTypes': ['array'],
      'compatibleItemTypes': ['string', 'number', 'integer', 'boolean'],
      'compatibleFormats': [],
      'minRowWidth': 'half',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      'requiresEnum': true,
      'inputfield': true,
      'isSearchableField': true,
      isTbTemplate: false,
      'onBeforeRender': function (data, node) {
        node.options = [];

        _.each(node.schemaElement.items.enum, function(key, val) {
          node.options.push({
            title: key,
            value: key,
          })
        });

        if (node.formElement.titleMap) {
          _.each(node.options, function(key) {
            if (node.formElement.titleMap[key.value]) {
              key.title = node.formElement.titleMap[key.value];
            }
          });
        }
      },
      'onInsert': function(evt, node) {
        var defaultOptions = {
          animate: true
        };

        var options = _.extend(defaultOptions, node.formElement.multipleselectOptions);

        $('#' + node.id).orderedSelect(options);
      }
    },
    'tags': {
      'template': ''
      + '<select name="<%= node.name %><%= node.formElement.getValue === "tagsinput" ? "" : "[]" %>" multiple="multiple"'
      + ' id="<%= id %>"'
      + ' <%= (fieldHtmlClass ? " class=\'" + fieldHtmlClass + "\'" : "") %>'
      + ' <%= (node.disabled? " disabled" : "")%>'
      + '> '
      + ' <% _.each(node.options, function(key, val) { %>'
      + '   <option <%= (value === key.value || (value.indexOf(key.value) >= 0)) ? "selected" : "" %> value="<%= key.value %>">'
      + '       <%= key.title %>'
      + '   </option>'
      + ' <% }) %>'
      + '</select>'
      + '<input type="text" id="<%=\'tags-\' + id %>" />',
      'compatibleTypes': ['array'],
      'compatibleItemTypes': ['string', 'number', 'integer', 'boolean'],
      'compatibleFormats': [],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      'acceptsEnum': true,
      'inputfield': true,
      'isSearchableField': true,
      isTbTemplate: false,
      'onBeforeRender': function (data, node) {
        if (node.value) {
          node.schemaElement.items.enum = node.value;
        }
      },
      'onInsert': function(evt, node) {
        var options = [];
        var selectedOptions = node.value || [];
        var selectizeOptions = node.formElement.selectizeoptions || {};
        var initialInput = '';
        var textInput = $('#tags-' + node.id);
        var selectInput = $('#' + node.id);
        var delimiterRegEx = '';
        var arrayDelimiterRegEx = '';
        var isDelimiterArray = selectizeOptions.delimiters
          && (selectizeOptions.delimiters.constructor === Array);
        node.schemaElement.getValue = 'tagsinput';

        selectInput.hide();

        _.each(selectInput.find('option'), function(option) {
          options.push(option.value);

          if (option.selected) {
            selectedOptions.push(option.value);
          }
        });

        $.extend(selectizeOptions, {
          plugins: ['drag_drop', 'remove_button'],
          persist: false,
          create: true,
          loadThrottle: null,
          onType: function(input){
            if (isDelimiterArray) {
              if ((selectizeOptions.delimiters)
                  && (selectizeOptions.delimiters.indexOf(input.slice(-1)) >= 0)) {
                  this.createItem(input.slice(0, -1));
              }
            }
          },
          onChange: function(value) {
            var optionsString = '';
            var tags = textInput[0].value.split(selectizeOptions.delimiter);

            if(isDelimiterArray && value.match(arrayDelimiterRegEx)) {

              var arrayDelimiterTags = textInput[0].value.split(delimiterRegEx);

              if (arrayDelimiterTags.length !== tags.length) {

                textInput[0].value = arrayDelimiterTags.join(selectizeOptions.delimiter);
                textInput[0].defaultValue = arrayDelimiterTags.join(selectizeOptions.delimiter);
                tags = arrayDelimiterTags;

                this.clear();
                for (var i = 0; i < tags.length; i++) {
                  this.createItem(tags[i]);
                };
              }
            }

            for (var i = 0, j = tags.length - 1; i <= j; i++) {
              optionsString += ''
                +'<option value="'
                + _.escape(tags[i])
                + '" selected="selected">'
                + _.escape(tags[i])
                + '</option>';
            };

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
              if (i != 0) {
                arrayDelimiterRegEx += '|';
              }
              arrayDelimiterRegEx += _.escapeRegExp(selectizeOptions.delimiters[i]);

              delimiterRegEx += '|';
              delimiterRegEx += _.escapeRegExp(selectizeOptions.delimiters[i]);
            }

          };
          delimiterRegEx += ']';
          arrayDelimiterRegEx += ']';
          delimiterRegEx = RegExp(delimiterRegEx, 'g');
          arrayDelimiterRegEx = RegExp(arrayDelimiterRegEx, 'g');
        }

        initialInput = selectedOptions[0];
        for (var i = 1; i < selectedOptions.length; i++) {
          initialInput += selectizeOptions.delimiter + selectedOptions[i];
        };

        textInput[0].value = (_.isString(initialInput) ? initialInput : "");

        textInput.selectize(selectizeOptions);
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el)
          .find('input')[0]
          .selectize
          .disable()
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el)
          .find('input')[0]
          .selectize
          .enable()
      }
    },
    'datepicker': {
      'template': datePickerTemplate,
      'compatibleTypes': ['string'],
      'compatibleFormats': ['iso8601-date'],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      'inputfield': true,
      isTbTemplate: false,
      'onBeforeRender': function(data, node) {
        ASSERT(window.hasOwnProperty('moment'));
        ASSERT(jQuery.fn.hasOwnProperty('datetimepicker'));
        ASSERT_PEER(node.schemaElement.type === 'string');

        if (node.required) {
          // implement timezone check logic
        };
      },
      'onInsert': function(evt, node) {
        var selector = '#' + node.id + ' input';
        var value = node.value || node.schemaElement.default;

        // create the plugin options object if it doesn't exist
        node.formElement.pluginoptions = node.formElement.pluginoptions || {};

        // set default format if none is slecified
        if (!node.formElement.pluginoptions.format) {
          node.formElement.pluginoptions.format = 'YYYY-MM-DD';
        }

        // does not use the current browser time of the client
        node.formElement.pluginoptions.useCurrent = false;

        // apply the value element to the field
        if (value) {
          var valueUnixTime = new Date(value);
          var minDateUnixTime = new Date(node.formElement.pluginoptions.minDate);
          var maxDateUnixTime = new Date(node.formElement.pluginoptions.maxDate);

          // make sure that the value in content, value or default obeys the minDate and maxDate limits
          ASSERT_PEER(valueUnixTime <= maxDateUnixTime);
          ASSERT_PEER(valueUnixTime >= minDateUnixTime);

          node.formElement.pluginoptions.defaultDate = value;
        }

        //initialize the datepicker plugin
        $(selector.toString()).datetimepicker(node.formElement.pluginoptions);

        /**
         * trigger a change event every time a different date/time is selected
         */
        $('#' + node.id).on('dp.change', function(){
          $('#' + node.id).trigger('change')
        });
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('readonly', true);
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .prop('readonly', false);
      }
    },
    'datetimepicker': {
      'template': datePickerTemplate,
      'compatibleTypes': ['string'],
      'compatibleFormats': ['iso8601-date'],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      'inputfield': true,
      isTbTemplate: false,
      'onBeforeRender': function(data, node) {
        ASSERT(window.hasOwnProperty('moment'));
        ASSERT(jQuery.fn.hasOwnProperty('datetimepicker'));
        ASSERT_PEER(node.schemaElement.type === 'string');

        if (node.required) {
          // implement timezone check logic
        }
      },
      'onInsert': function(evt, node) {
        var selector = '#' + node.id + ' input';
        var value = node.value || node.schemaElement.default;

        // create the plugin options object if it doesn't exist
        node.formElement.pluginoptions = node.formElement.pluginoptions || {};

        // set default format if none is slecified
        if (!node.formElement.pluginoptions.format) {
          node.formElement.pluginoptions.format = 'YYYY-MM-DDTHH:mm:ss';
        }

        // does not use the current browser time of the client
        node.formElement.pluginoptions.useCurrent = false;

        // apply the value element to the field
        if (value) {
          var valueUnixTime = new Date(value);
          var minDateUnixTime = new Date(node.formElement.pluginoptions.minDate);
          var maxDateUnixTime = new Date(node.formElement.pluginoptions.maxDate);

          // make sure that the value in content, value or default obeys the minDate and maxDate limits
          ASSERT_PEER(valueUnixTime <= maxDateUnixTime);
          ASSERT_PEER(valueUnixTime >= minDateUnixTime);

          node.formElement.pluginoptions.defaultDate = value;
        }

        //initialize the datepicker plugin
        $(selector.toString()).datetimepicker(node.formElement.pluginoptions);

        /**
         * trigger a change event every time a different date/time is selected
         */
        $('#' + node.id).on('dp.change', function(){
          $('#' + node.id).trigger('change')
        });
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('readonly', true);
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .prop('readonly', false);
      }
    },
    'timepicker': {
      'template': datePickerTemplate,
      'compatibleTypes': ['string'],
      'compatibleFormats': ['iso8601-date'],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      'inputfield': true,
      isTbTemplate: false,
      'onBeforeRender': function(data, node) {
        ASSERT(window.hasOwnProperty('moment'));
        ASSERT(jQuery.fn.hasOwnProperty('datetimepicker'));
        ASSERT_PEER(node.schemaElement.type === 'string');

        if (node.required) {
          // implement timezone check logic
        }
      },
      'onInsert': function(evt, node) {
        var selector = '#' + node.id + ' input';
        var value = node.value || node.schemaElement.default;

        // create the plugin options object if it doesn't exist
        node.formElement.pluginoptions = node.formElement.pluginoptions || {};

        // set default format if none is slecified
        if (!node.formElement.pluginoptions.format) {
          node.formElement.pluginoptions.format = 'THH:mm:ss';
        }

        // does not use the current browser time of the client
        node.formElement.pluginoptions.useCurrent = false;

        // apply the value element to the field
        if (value) {
          // use moment.js to set the time because javascript requires a date to create a valid Date object
          var valueUnixTime = new moment(value, node.formElement.pluginoptions.format);
          var minDateUnixTime = new moment(node.formElement.pluginoptions.minDate, node.formElement.pluginoptions.format);
          var maxDateUnixTime = new moment(node.formElement.pluginoptions.maxDate, node.formElement.pluginoptions.format);

          // make sure that the value in content, value or default obeys the minDate and maxDate limits
          ASSERT_PEER(valueUnixTime <= maxDateUnixTime);
          ASSERT_PEER(valueUnixTime >= minDateUnixTime);

          node.formElement.pluginoptions.defaultDate = value;
        }

        //initialize the datepicker plugin
        $(selector.toString()).datetimepicker(node.formElement.pluginoptions);

        /**
         * trigger a change event every time a different date/time is selected
         */
        $('#' + node.id).on('dp.change', function(){
          $('#' + node.id).trigger('change')
        });
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('readonly', true);
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .prop('readonly', false);
      }
    },
    'radios': {
      'template': '<div id="<%= node.id %>"><% _.each(node.options, function(key, val) { %>' +
        '<% if (!elt.inline) { %><div class="radio "><label><% } else { %>' +
        '<label class="radio<%= cls.inlineClassSuffix %>"><% } %>' +
        '<input type="radio" <% if (((key instanceof Object) && (node.value === key.value)) || (node.value === key)) { %> checked="checked" <% } %> name="<%= node.name %>" value="<%= (key instanceof Object ? key.value : key) %>"' +
        '<%= (node.disabled? " disabled" : "")%>' +
        '/><span><%= (key instanceof Object ? key.title : key) %></span></label><%= elt.inline ? "" : "</div>" %> <% }); %></div>',
      'compatibleTypes': ['array', 'string', 'number', 'integer', 'boolean'],
      'compatibleItemTypes': ['string', 'number', 'integer', 'boolean'],
      'compatibleFormats': [],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      'requiresEnum': true,
      'inputfield': true,
      isTbTemplate: false,
      onBeforeRender: function(evt, node) {
        if (!contains(node.schemaElement.type, 'null')) {
          console.log(node);
        }
        // alter the value descriptions is case a titleMap is defined
        if (node.formElement.titleMap) {
          _.each(node.options, function(key) {
            if (node.formElement.titleMap[key.value]) {
              key.title = node.formElement.titleMap[key.value];
            }
          });
        }
      },
      'onInsert': function (evt, node) {
        node.initializeEventHandlers = function() {
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
              .on('change', function() {
                var $this = $(this);
                var val = $this.val();
                var checked = $this.is(':checked');

                if (checked) {
                  for (var v in valueMapToNext) {
                    var $n = valueMapToNext[v];

                    if (v === val) {
                      $n.toggle(checked).toggleClass('tb-jf-visible', checked);
                    } else {
                      $n.toggle(!checked).toggleClass('tb-jf-visible', !checked);
                    }
                  }
                } else {
                  // no option checked yet
                  for (var v in valueMapToNext) {
                    var $n = valueMapToNext[v];

                    $n
                      .toggle(false)
                      .toggleClass('tb-jf-visible', false);
                  }
                }
              }).change();
          }
        }

        node.initializeEventHandlers();
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('disabled', true);
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .removeProp('disabled');
      }
    },
    'radiobuttonset': {
      'template': ''
      + '<div id="<%= node.id %>"'
      + ' class=" <%= elt.htmlClass ? " " + elt.htmlClass : "" %>'
      + ' <%= node.formElement.vertical ? "btn-group-vertical": "btn-group" %>'
      + ' <%= node.formElement.justified? "btn-group-justified": "btn-group" %>">'
      + '   <% _.each(node.options, function(key, val) {%>'
      + '   <label class="<%= node.formElement.buttonSize %> <%= cls.buttonClass %>">'
      + '     <input type="radio" style="position:absolute;left:-9999px;"'
      + '       <%= (node.value === key.value || node.value === key) ? "checked=checked" : "" %>'
      + '       name="<%= node.name %>"'
      + '       value="<%= (key instanceof Object) ? key.value : key %>" />'
      + '     <span><%= (key instanceof Object ? key.title : key) %></span>'
      + '   </label>'
      + '<% }); %>'
      + '</div>',
      'compatibleTypes': ['array', 'string', 'number', 'integer', 'boolean'],
      'compatibleItemTypes': ['string', 'number', 'integer', 'boolean'],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'requiresEnum': true,
      'compatibleFormats': [],
      fieldtemplate: true,
      inputfield: true,
      isTbTemplate: false,
      onBeforeRender: function(evt, node) {
        if (node.schemaElement.type === "boolean") {
          ASSERT.ofTbType(node.value, 'boolean|null|undefined');
        } else if (node.schemaElement.type === "string") {
          ASSERT.ofTbType(node.value, 'string|null|undefined');

          if (isSet(node.value)) {
            var isEnumMember = node.schemaElement.enum.indexOf(node.value) >= 0;

            ASSERT(isEnumMember === true, 'radiobuttonset: the specified value is not a valid type for this field.');
          }
        } else if (node.schemaElement.type === "number" || node.schemaElement.type === "integer") {
          ASSERT.ofTbType(node.value, 'number|null|undefined');
        }

        if (!node.required || !isSet(node.value)) {
          node.options.push({
            title: 'None',
            value: null,
          });

          node.value = (isSet(node.value)) ? node.value : null;
        }

        if (node.formElement.titleMap) {
          _.each(node.options, function(key) {
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
      onInsert: function(evt, node) {
        var activeClass = 'active';
        var element = node.formElement || {};

        $(node.el).find('label.btn')
          .on('click', function(e) {
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
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('.btn-group > label')
          .attr('disabled', true);
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('label')
          .removeAttr('disabled');
      }
    },
    'checkboxes': {
      'template': '<div id="<%= node.id %>"><%= choiceshtml %><%= children %></div>',
      'compatibleTypes': ['array'],
      'compatibleItemTypes': ['string', 'number', 'integer', 'boolean'],
      'compatibleFormats': [],
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'requiresEnum': true,
      'fieldtemplate': true,
      'inputfield': true,
      isTbTemplate: false,
      'childTemplate': function(inner, node) {
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
        if (!node.formElement.otherField.asArrayValue && node.formElement.otherField.novalue !== true || node.formElement.otherField.novalue === false) {
          template += ' name="'
            + node.key
            + '['
            + (node.formElement.otherField.idx !== undefined ? node.formElement.otherField.idx : node.formElement.options.length)
            + ']" value="'
            + (node.formElement.otherField.otherValue || 'OTHER')
            + '"';
        }
        template += '<%= node.disabled? " disabled=\'disabled\'" : "" %>';
        template += '<%= node.formElement.readOnly? " disabled=\'disabled\'" : "" %> />';
        template += '<span><%= node.title || "Other" %> </span>';
        var otherFieldClass = 'other-field';

        if (node.formElement.otherField.inline) {
          // put the other field just after the checkbox, wrapped in the label tag
          template += '<div class="tb-jf-other-field-content">'+ inner + '</div>';
          otherFieldClass = 'tb-jf-inline-' + otherFieldClass;
        }
        if (node.formElement.inline) {
          template = '<label class="'+otherFieldClass+' checkbox<%= cls.inlineClassSuffix %>">' + template + '</label>';
        } else {
          template = '<div class="'+otherFieldClass+' checkbox"><label>' + template + '</label></div>';
        }
        if (!node.formElement.otherField.inline) {
          // put the other field just after the checkbox's label/div
          template += '<div class="tb-jf-other-field-content">'+ inner + '</div>';
        }
        return template;
      },
      'onBeforeRender': function (data, node) {
        // Build up choices from the enumeration/options list
        if (!node || !node.schemaElement || !node.schemaElement.items) {
          return;
        }
        var choices = node.formElement.options;
        if (!choices) {
          return;
        }

        var template = '<input type="checkbox"<%= checked ? " checked=\'checked\'" : "" %>'
          + ' name="<%= name %>" value="<%= escape(value) %>"'
          + ' <%= node.disabled? " disabled=\'disabled\'" : "" %>'
          + ' <%= node.readOnly? " readonly=\'disabled\'" : "" %> />'
          + ' <span><%= title %></span>';

        if (node.formElement.inline) {
          template = '<label class="checkbox' + data.cls.inlineClassSuffix + '">' + template + '</label>';
        } else {
          template = '<div class="checkbox"><label>' + template + '</label></div>';
        }

        var choiceshtml = '';
        if (node.formElement.otherField && node.formElement.otherField.asArrayValue && node.value) {
          var choiceValues = choices.map(function(choice) { return choice.value; });
          // we detect values which are not within our choice values.
          var otherValues = [];
          node.value.forEach(function(val) {
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

          choiceshtml += _template(template, {
            name: node.key + '[' + idx + ']',
            value: choice.value,
            checked: _.includes(node.value, choice.value),
            title: choice.title,
            node: node,
            escape: _.escape
          }, fieldTemplateSettings);
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
          // 2.1.1 title, checked, disabled == text field title, non-blank, disabled
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
      'onInsert': function (evt, node) {
        // FIXME: consider default values?
        function inputHasAnyValue(inputs) {
          var anyValue = false;

          inputs.each(function() {
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

        function otherFieldValueChange() {
          $checkbox.prop('checked', inputHasAnyValue($inputs));
        }
        $inputs.on('keyup', otherFieldValueChange).on('change', otherFieldValueChange).change();

        $checkbox.on('change', function() {
          if (this.checked) {
            this.checked = false;

            $inputs.not(':checkbox, :radio, button').focus();
          } else {
            // FIXME: reset back to default?
            $inputs.filter('input[type=text], textarea').val('');
          }
        });
      },
      'onChange': function (evt, node) {
      },
      'lock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .hide();
        }

        $(node.el).find('input')
          .prop('disabled', true);
      },
      'unlock': function(node) {
        if (node.formElement.enableUndo
          || node.formElement.enableRedo
          || node.formElement.enableReset) {

          $(node.el).find('.tb-jf-value-history-buttons')
            .show();
        }

        $(node.el).find('input')
          .removeProp('disabled');
      }
    },
    'array': {
      'template': ''
        + '<div id="<%= id %>">'
        + '<ul class="tb-jf-array-ul">'
        + '<%= children %>'
        + '</ul>'
        + '<% if (!node.isReadOnly()) { %>'
        + '<span class="tb-jf-array-buttons">'
        + '<% if (node.formElement.enableAddingItems) { %>'
        + '<a href="" class="<%= cls.buttonClass %> btn-group-justified tb-jf-array-addmore">'
        + '<i class="<%= cls.iconClassPrefix %>-plus-sign" title="Add new"></i> add new</a> '
        + '<% } %>'
        + '</span>'
        + '<% } %>'
        + '</div>',
      'compatibleTypes': ['array'],
      'minRowWidth': 'half',
      'maxRowWidth': 'full',
      'containerField': true,
      'compatibleFormats': [],
      'fieldtemplate': true,
      'array': true,
      isArrayContainer: true, // to replace `array` property
      isTbTemplate: false,
      'onBeforeRender': function(data, node) {
      },
      'childTemplate': function(inner, node) {
        var template = '<li class="tb-jf-array-element row" data-idx="<%= node.childPos %>" data-tb-jf-type="array-item">';

        if (!node.isReadOnly() && $('').sortable && node.formElement.enableSorting) {
          template += ' <span class="tb-jf-array-button-group draggable line tb-jf-draggable">';
        } else if (!node.isReadOnly() && node.formElement.enableSorting) {
          template += ' <span class="tb-jf-array-button-group">';
        }

        if (!node.isReadOnly() && node.formElement.enableSorting) {
          template += ' <a class="<%= cls.buttonClass %> tb-jf-array-item-move-up btn-sm"><i class="<%= cls.iconClassPrefix %>-circle-arrow-up" title="Move item up"></i>'
            + '</a>'
            + ' <a class="<%= cls.buttonClass %> tb-jf-array-item-move-down btn-sm"><i class="<%= cls.iconClassPrefix %>-circle-arrow-down" title="Move item down"></i>'
            + '</a>'
            + ' </span>';
        }

        // console.log(node.formElement);
        if (!node.isReadOnly() && node.formElement.enableDeletingItems) {
          template += ' <a href="#" class="<%= cls.buttonClass %> tb-jf-array-item-delete btn-xs btn-danger"><i class="<%= cls.iconClassPrefix %>-remove" title="Remove item"></i>'
            + '</a>';
        }

        template += inner
          + '</li>';

        return template;
      },
      'onInsert': function(evt, node) {
        var $nodeid = $(node.el).find('#' + escapeSelector(node.id));
        var arrayLimits = node.getArrayLimits();
        var curItems = $('> ul > li', $nodeid).length;



        // array modification functions
        var moveNodeTo = function(fromIdx, toIdx) {
          // Note "switchValuesWithNode" extracts values from the DOM since field
          // values are not synchronized with the tree data structure, so calls
          // to render are needed at each step to force values down to the DOM
          // before next move.
          // TODO: synchronize field values and data structure completely and
          // call render only once to improve efficiency.
          if (fromIdx === toIdx
            || node.formElement.enableSorting !== true) {

            return;
          }

          var parentEl = $('> ul', $nodeid);
          var arrayIndexIncrementor = (toIdx > fromIdx)
            ? 1
            : -1;

          for (var i = fromIdx; i !== toIdx; i += arrayIndexIncrementor) {
            node.children[i]
              .switchValuesWithNode(node.children[i + arrayIndexIncrementor]);

            node.children[i].render(parentEl.get(0));
            node.children[i + arrayIndexIncrementor].render(parentEl.get(0));
          }

          node.markChildEventHandlersForUpdate();


          // No simple way to prevent DOM reordering with jQuery UI Sortable,
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
              $(node.children[fromIdx-1].el).after(fromEl);
            }

            $(node.children[toIdx-1].el).after(toEl);
          } else {
            if (toIdx === 0) {
              parentEl.prepend(toEl);
            } else {
              $(node.children[toIdx-1].el).after(toEl);
            }

            $(node.children[fromIdx-1].el).after(fromEl);
          }

          $nodeid.trigger('change');
        };

        var addItem = function(idx) {
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
        }

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
        }



        // user action event handlers
        var addItemEvent = function(item, evt) {
          evt.preventDefault();
          evt.stopPropagation();

          var idx = node.children.length;
          addItem(idx);
        }

        var deleteLastItemEvent = function(item, evt) {
          var idx = node.children.length - 1;
          evt.preventDefault();
          evt.stopPropagation();
          deleteItem(idx);
        }

        var deleteItemByIndexEvent = function(item, evt) {
          evt.preventDefault();
          var $li = $(evt.currentTarget).parent();

          if ($li.parent().parent().attr('id') != node.id) {
            return;
          }
          evt.stopPropagation();

          var idx = $li.data('idx');
          deleteItem(idx);
        }

        var moveItemUpEvent = function(item, evt) {
          evt.preventDefault();
          evt.stopPropagation();

          var index = item.parentNode.parentNode.getAttribute('data-idx');

          if (+index - 1 >= 0) {
            moveNodeTo(+index, +index - 1);
          }
        }

        var moveItemDownEvent = function(item, evt) {
          evt.preventDefault();
          evt.stopPropagation();

          var maxIndex = node.children.length - 1;
          var index = item.parentNode.parentNode.getAttribute('data-idx');

          if (+index + 1 <= +maxIndex) {
            moveNodeTo(+index, +index + 1);
          }
        }

        var moveItemToPositionEvent = function(item, evt, ui) {
          var idx = $(ui.item).data('idx');
          var newIdx = $(ui.item).index();

          moveNodeTo(idx, newIdx);
        }



        node.initializeEventHandlers = function() {
          // $nodeid = $('#' + escapeSelector(this.id));
          // console.log($nodeid);

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
          $('> span > a.tb-jf-array-addmore', $nodeid).click(function (evt) {
            addItemEvent(this, evt);
          });

          // delete the last child element
          $('> span > a.tb-jf-array-deletelast', $nodeid).click(function (evt) {
            deleteLastItemEvent(this, evt)
          });

          // delete clicked child element
          $nodeid.on('click', '> ul > li > a.tb-jf-array-item-delete', function (evt) {
            deleteItemByIndexEvent(this, evt);
          });

          // move child element one position ahead
          $nodeid.on('click', '> ul > li > .tb-jf-array-button-group > a.tb-jf-array-item-move-up', function (evt) {
            moveItemUpEvent(this, evt);
          });

          // move child element one position behind
          $nodeid.on('click', '> ul > li > .tb-jf-array-button-group > a.tb-jf-array-item-move-down', function (evt) {
            moveItemDownEvent(this, evt);
          });

          // enable or disable the sorting of array elements
          if (!this.isReadOnly() && $(this.el).sortable && this.formElement.enableSorting) {
            // initialize jquery-ui sortable
            $('> ul', $nodeid).sortable();

            // send sortable event to moveNodeTo
            $('> ul', $nodeid).bind('sortstop', function (evt, ui) {
              moveItemToPositionEvent(this, evt, ui);
            });
          }
        }



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
      'lock': function(node) {
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
      'unlock': function(node) {
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
    'tabarray': {
      'template': '<div id="<%= id %>"><div class="tabbable tabs-left">'
        + '<ul class="nav nav-tabs <%= (node.formElement.justified === true) ? "nav-justified" : "" %>">'
        + '<%= tabs %>'
        + '</ul>'
        + '<div class="tab-content tb-jf-input-fieldset row">'
        + '<%= children %>'
        + '</div>'
        + '</div>'
        + '</div>',
      'compatibleTypes': ['array'],
      // 'compatibleItemTypes': ['string', 'number', 'integer', 'boolean'],
      'compatibleFormats': [],
      'minRowWidth': 'half',
      'maxRowWidth': 'full',
      'fieldtemplate': true,
      'containerField': true,
      'array': true,
      isArrayContainer: true, // to replace `array` property
      isTbTemplate: false,
      'childTemplate': function(inner, node) {
        var template = '<div data-idx="<%= node.childPos %>" class="tab-pane fade" data-tb-jf-type="tabarray-item">';

        if (!node.isReadOnly() && node.formElement.enableSorting) {
          template += ' <span class="tb-jf-tab-array-button-group">' +
            ' <a class="<%= cls.buttonClass %> tb-jf-array-item-move-left btn-xs"><i class="<%= cls.iconClassPrefix %>-circle-arrow-left" title="Remove item"></i>'
          if (node.formElement.displaySystemButtonsLabels) {
            template += ' move left';
          }
          template += '</a>';

          template += ' <a class="<%= cls.buttonClass %> tb-jf-array-item-move-right btn-xs"><i class="<%= cls.iconClassPrefix %>-circle-arrow-right" title="Remove item"></i>'
          if (node.formElement.displaySystemButtonsLabels) {
            template += ' move right';
          }
          template += '</a> </span>';
        }

        template += inner
          + '</div>';

        return template;
      },
      'onBeforeRender': function(data, node) {
        if (node.formElement.items && node.formElement.items.length >= 0) {
          _.each(node.formElement.items, function(item) {
            ASSERT_PEER(item.type === 'section', 'tabarray: only elements with type section can be direct children of a tabarray');
          })
        }

        data.tabs = '';
      },
      'onInsert': function(evt, node) {
        var $nodeid = $(node.el).find('#' + escapeSelector(node.id));
        var arrayLimits = node.getArrayLimits();



        var moveNodeTo = function(fromIdx, toIdx) {
          // Note "switchValuesWithNode" extracts values from the DOM since field
          // values are not synchronized with the tree data structure, so calls
          // to render are needed at each step to force values down to the DOM
          // before next move.
          // TODO: synchronize field values and data structure completely and
          // call render only once to improve efficiency.
          fromIdx = Number(fromIdx);
          toIdx = Number(toIdx);
          if (fromIdx === toIdx) {
            return;
          }
          var incr = (fromIdx < toIdx) ? 1: -1;
          var tabEl = $('> .tabbable > .tab-content', $nodeid).get(0);

          for (var i = fromIdx; i !== toIdx; i += incr) {
            node.children[i].switchValuesWithNode(node.children[i + incr]);

            node.children[i].render(tabEl);
            node.children[i + incr].render(tabEl);
          }

          node.markChildEventHandlersForUpdate();

          $nodeid.trigger('change');
        };

        // Refreshes the list of tabs
        var updateTabs = function(selIdx) {
          var tabs = '';
          var activateFirstTab = false;

          if (selIdx === undefined) {
            selIdx = $('> .tabbable > .nav-tabs .active', $nodeid).data('idx');
            if (selIdx) {
              selIdx = parseInt(selIdx, 10);
            } else {
              activateFirstTab = true;
              selIdx = 0;
            }
          }

          if (selIdx >= node.children.length) {
            selIdx = node.children.length - 1;
          }

          _.each(node.children, function (child, idx) {
            var title = child.legend || child.title || ('Item ' + (idx+1));

            tabs += '<li data-idx="' + idx + '">' +
              '<a class="draggable tab" data-toggle="tab">' + _.escape(title);

            if (!node.isReadOnly() && node.formElement.enableDeletingItems) {
              tabs += ' <span href="#" class="tb-jf-tab-array-tab-delete btn-default btn-xs btn-danger"> <i class="' +
                node.ownerTree.defaultClasses.iconClassPrefix + '-remove" title="Remove item"></i></span>' +
                '</a>';
            }

            tabs += '</li>';
          });

          if (!node.isReadOnly()
            && node.formElement.enableAddingItems
            && (arrayLimits.maxItems < 0 || node.children.length < arrayLimits.maxItems)) {
            tabs += '<li data-idx="-1"><a class="tab tb-jf-tab-array-addmore" title="'+(node.formElement.addMoreTooltip ? _.escape(node.formElement.addMoreTooltip) : 'Add new item')+'"><i class="' +
              node.ownerTree.defaultClasses.iconClassPrefix + '-plus-sign"></i> '+(node.formElement.addMoreTitle || 'New')+'</a></li>';
          }

          $('> .tabbable > .nav-tabs', $nodeid).html(tabs);

          var canDelete = arrayLimits.minItems >= 0 && node.children.length <= arrayLimits.minItems;

          $nodeid.find('> .tabbable > .nav-tabs > li > a > .tb-jf-array-item-delete').toggle(!canDelete);

          if (activateFirstTab) {
            $('> .tabbable > .nav-tabs [data-idx="0"]', $nodeid).addClass('active');
          }

          $('> .tabbable > .nav-tabs [data-toggle="tab"]', $nodeid).eq(selIdx).click();
        };

        var deleteItem = function(idx) {
          var itemNumCanDelete = node.children.length - Math.max(arrayLimits.minItems, 0) - 1;

          $nodeid.find('> .tabbable > .nav-tabs > li > a > .tb-jf-tab-array-tab-delete')
            .toggle(itemNumCanDelete > 0);

          if (itemNumCanDelete < 0
            || node.formElement.enableDeletingItems !== true) {

            return false;
          }

          node.deleteArrayItem(idx);

          updateTabs();

          $nodeid.find('> a.tb-jf-tab-array-addmore')
            .toggleClass('disabled', arrayLimits.maxItems >= 0 && node.children.length >= arrayLimits.maxItems);

          $nodeid.trigger('change');
        }

        var addItem = function(idx) {
          if (node.formElement.enableAddingItems !== true) {
            return false;
          }

          if (arrayLimits.maxItems >= 0) {
            var slotNum = arrayLimits.maxItems - node.children.length;
            $nodeid.find('> a.tb-jf-tab-array-addmore')
              .toggleClass('disabled', slotNum <= 1);
            if (slotNum < 1) {
              return false;
            }
          }

          node.insertArrayItem(
            idx,
            $nodeid.find('> .tabbable > .tab-content').get(0)
          );
          updateTabs(idx);

          $nodeid.find('> a.tb-jf-tab-array-tab-delete')
            .toggleClass('disabled', node.children.length <= arrayLimits.minItems);

          $nodeid.trigger('change');
        }



        var addItemEvent = function(item, evt) {
          var idx = Number(node.children.length);

          evt.preventDefault();
          evt.stopPropagation();

          addItem(idx);
        }

        var deleteClickedItemEvent = function(item, evt) {
          evt.preventDefault();
          evt.stopPropagation();

          var idx = Number($(evt.currentTarget).closest('li').data('idx'));

          deleteItem(idx);
        }

        var updateLegendEvent = function(item, evt) {
          updateTabs();
          evt.preventDefault();
          evt.stopPropagation();
        }

        var moveItemAheadEvent = function(item, evt) {
          var idx = Number($(item).closest('.active.tab-pane').data('idx'));

          evt.preventDefault();
          evt.stopPropagation();

          if (idx > 0) {
            moveNodeTo(idx, idx - 1);
            updateTabs(idx - 1);
          }
        }

        var moveItemBehindEvent = function(item, evt) {
          var idx = Number($(item).closest('.active.tab-pane').data('idx'));

          evt.preventDefault();
          evt.stopPropagation();

          if (idx < node.children.length - 1) {
            moveNodeTo(idx, idx + 1);
            updateTabs(idx + 1);
          }
        }

        var itemSortChangeEvent = function(item, evt, ui) {
          if (ui.placeholder.index() == $(item).children().length-1
            && ui.placeholder.prev().data('idx') == -1) {

            ui.placeholder.prev().before(ui.placeholder);
          }
        }

        var itemSortStopEvent = function(item, evt, ui) {
          var idx = $(ui.item).data('idx');
          var newIdx = $(ui.item).index();

          moveNodeTo(idx, newIdx);
          updateTabs(newIdx);
        }



        node.initializeEventHandlers = function() {
          $nodeid.find('> a.tb-jf-tab-array-addmore')
            .toggleClass('disabled', arrayLimits.maxItems >= 0 && node.children.length >= arrayLimits.maxItems);

          var canDelete = arrayLimits.minItems >= 0 && node.children.length <= arrayLimits.minItems;

          $nodeid.find('> a.tb-jf-tab-array-tab-delete')
            .toggleClass('disabled', canDelete);

          $nodeid.find('> .tabbable > .nav-tabs > li > a > .tb-jf-tab-array-tab-delete')
            .toggle(!canDelete);

          // add item to the ent of an array
          $nodeid.on('click', '> a.tb-jf-tab-array-addmore, > .tabbable > .nav-tabs > li > .tb-jf-tab-array-addmore', function (evt) {
            addItemEvent(this, evt);
          });

          // delete tab on click
          $nodeid.on('click', '> .tabbable > .nav-tabs > li > a > .tb-jf-tab-array-tab-delete', function (evt) {
            deleteClickedItemEvent(this, evt);
          });

          // update item legend
          $(node.el).on('legendUpdated', function (evt) {
            updateLegendEvent(this, evt);
          });

          if (!node.isReadOnly() && node.formElement.enableSorting) {
            // move ahead (left)
            $nodeid.on('click', '> .tabbable > .tab-content > .tab-pane > .tb-jf-tab-array-button-group > .tb-jf-array-item-move-left', function (evt) {
              moveItemAheadEvent(this, evt);
            });

            // move behind (right)
            $nodeid.on('click', '> .tabbable > .tab-content > .tab-pane > .tb-jf-tab-array-button-group > .tb-jf-array-item-move-right', function (evt) {
              moveItemBehindEvent(this, evt);
            });
          }

          if (!node.isReadOnly()
            && $(node.el).sortable
            && node.formElement.enableSorting) {

            $('> .tabbable > .nav-tabs', $nodeid).sortable({
              containment: node.el,
              cancel: '.tb-jf-tab-array-addmore',
              tolerance: 'pointer'
            }).on('sortchange', function (evt, ui) {
              itemSortChangeEvent(this, evt, ui);
            }).on('sortstop', function (evt, ui) {
              itemSortStopEvent(this, evt, ui);
            });
          }
        }



        // satisfy the minItems constraint
        if (arrayLimits.minItems >= 0) {
          for (var i = node.children.length; i < arrayLimits.minItems; i++) {
            addItem(node.children.length);
          }

          updateTabs(0);
        } else {
          updateTabs();
        }

        node.initializeEventHandlers();
      },
      // similarly to the array template the elements for the lock and unlock functions cannot be cached
      // as new element can be created and old ones can be deleted by the user
      'lock': function(node) {
        $(node.el).find('> div.controls > div > div.tabbable > ul.nav > li[data-idx] > a > span.tb-jf-tab-array-tab-delete')
          .hide();

        $(node.el).find('> div.controls > div > div.tabbable > ul.nav > li[data-idx="-1"]')
          .hide();

        $(node.el).find('> div.controls > div > div.tabbable > div.tab-content > div.tab-pane > span.tb-jf-tab-array-button-group')
          .hide();
      },
      'unlock': function(node) {
        $(node.el).find('> div.controls > div > div.tabbable > ul.nav > li[data-idx] > a > span.tb-jf-tab-array-tab-delete')
          .show();

        $(node.el).find('> div.controls > div > div.tabbable > ul.nav > li[data-idx="-1"]')
          .show();

        $(node.el).find('> div.controls > div > div.tabbable > div.tab-content > div.tab-pane > span.tb-jf-tab-array-button-group')
          .show();
      }
    },
    'tabobject': {
      'template': ''
        + '<div id="<%= id %>">'
        + '<div class="tabbable <%= node.formElement.tabClass %> ">'
        + '<ul class="nav nav-tabs <%= (node.formElement.justified === true) ? "nav-justified" : "" %>">'
        + '<%= tabs %>'
        + '</ul>'
        + '<div class="tab-content tb-jf-input-fieldset row">'
        + '<%= children %>'
        + '</div>'
        + '</div>'
        + '</div>',
      'compatibleTypes': ['object'],
      // 'compatibleItemTypes': ['object', 'array', 'string', 'number', 'integer', 'boolean'],
      'compatibleFormats': [],
      'minRowWidth': 'half',
      'maxRowWidth': 'full',
      'containerField': true,
      'fieldtemplate': true,
      isTbTemplate: false,
      'getElement': function (el) {
        return $(el).parent().get(0);
      },
      'childTemplate': function (inner) {
        return '' +
          '<div data-idx="<%= node.childPos %>" class="tab-pane fade ' +
          '<% if (node.active) { %> in active <% } %>">' +
          inner +
          '</div>';
      },
      'onBeforeRender': function (data, node) {
        // Before rendering, this function ensures that:
        // 1. direct children have IDs (used to show/hide the tabs contents)
        // 2. the tab to active is flagged accordingly. The active tab is
        // the first one, except if form values are available, in which case
        // it's the first tab for which there is some value available (or back
        // to the first one if there are none)
        // 3. the HTML of the select field used to select tabs is exposed in the
        // HTML template data as "tabs"
        if (node.formElement.items && node.formElement.items.length >= 0) {
          _.each(node.formElement.items, function(item) {
            ASSERT_PEER(item.type, 'section' === 'tabobject: only elements with type section can be direct children of a tabobject');
          })
        }

        var children = null;
        var choices = [];
        // select the left margin for the tab content

        // pick the appropriate tab style depending on the form options
        switch (node.formElement.tabPosition) {
          case "left":
            node.formElement.tabClass = "tabs-left";
            break;

          case "right":
            node.formElement.tabClass = "tabs-right";
            break;

          default:
            node.formElement.tabClass = "tabs";
        }

        if (node.schemaElement) {
          choices = node.schemaElement['enum'] || [];
        }

        if (node.options) {
          children = _.map(node.options, function (option, idx) {
            var child = node.children[idx];
            if (option instanceof Object) {
              option = _.extend({ node: child }, option);
              option.title = option.title || child.legend || child.title || ('Option ' + (child.childPos+1));
              option.value = isSet(option.value) ?
                option.value :
                isSet(choices[idx]) ?
                  choices[idx] :
                  idx;

              return {
                value: option,
                title: option
              };
            } else {
              return {
                title: option,
                value: isSet(choices[child.childPos]) ?
                  choices[child.childPos] :
                  child.childPos,
                node: child
              };
            }
          });
        } else {
          children = _.map(node.children, function (child, idx) {
            return {
              title: child.legend || child.title || ('Option ' + (child.childPos+1)),
              value: choices[child.childPos] || child.childPos,
              node: child
            };
          });
        }

        // determine the active tab:
        //  if the form has been submitted use the last active tab
        //  if any of the tabs has an input field with non-default value (declared in form)
        //  otherwise set the first ta as default
        var activeChild = null;
        if (data.value) {
          activeChild = _.find(children, function (child) {
            return (child.value === node.value);
          });
        }

        if (!activeChild) {
          activeChild = _.find(children, function (child) {
            return child.node.hasNonDefaultValue();
          });
        }

        if (!activeChild) {
          activeChild = children[0];
        }

        activeChild.node.active = true;
        data.value = activeChild.value;

        var elt = node.formElement;

        var tabs = '';

        _.each(node.children, function (child, idx) {
          var title = (child.key) ?
            child.key.split('.').pop() :
            child.legend || child.title || ('Tab ' + (idx+1));
          var value = isSet(child.value) ? child.value : idx;

          tabs += ''
            + '<li data-idx="' + idx
            + '" value = "' + value + '"' + '>'
            + '<a class="tab ' + (child.active ? 'active' : '') + '">'
            + _.escape(title)
            + '</a>';

          tabs += '</li>';
        });

        data.tabs = tabs;

        return data;
      },
      'onInsert': function (evt, node) {
        // activate the first tab of every tab group
        var firstTab = $('> .tabbable > .nav-tabs [data-idx="0"]', '#' + node.id);
        firstTab.addClass('active');
        firstTab.addClass('in');
        firstTab.click();
      }
    },
    'alert': {
      'template': '<div class=" <%= node.formElement.alertType %>" role="alert">'
        + '<%= node.formElement.alertMessage %>'
        + '</div>',
      isTbTemplate: false,
      'minRowWidth': 'quarter',
      'maxRowWidth': 'full',
      'onBeforeRender': function (data, node) {
        if (!node.formElement.description) {
          ASSERT_PEER.ofTbType(node.formElement.title, 'string', 'elementType alert: the alert must have title, description or both.');
        } else {
          ASSERT_PEER.ofTbType(node.formElement.description, 'string', 'elementType alert: the alert must have title, description or both.');
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
        };

        if (node.formElement.title) {
          node.formElement.alertMessage += '<strong>'
            + _.escape(node.formElement.title)
            + '</strong> </br>'
        }

        node.formElement.alertMessage += _.escape(node.formElement.description);
      }
    },
    'fieldset': {
      'template': '<fieldset class="tb-jf-fieldset-header tb-jf-node row ' +
        '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
        '<% if (elt.expandable) { %>expandable<% } %> <%= elt.htmlClass?elt.htmlClass:"" %>" ' +
        '<% if (id) { %> id="<%= id %>"<% } %>' +
        ' data-tb-jf-type="fieldset">' +
        '<% if (node.title || node.legend) { %><legend class="tb-jf-legend"><%= node.title || node.legend %></legend><% } %>' +
        '<div class="tb-jf-plain-fieldset ' +
        '<% if (elt.expandable) { %>cls.groupClass" hidden <% } else { %> " <% } %> >' +
        '<%= children %>' +
        '</div>' +
        '<span class="help-block tb-jf-errortext tb-jf-hide"></span>' +
        '</fieldset>',
      isTbTemplate: false,
      'containerField': true,
      'compatibleTypes': ['object'],
      'compatibleFormats': [],
      'minRowWidth': 'half',
      'maxRowWidth': 'full',
      'onBeforeRender': function(data, node) {
      }
    },
    'submit': {
      'template':'<input type="submit" <% if (id) { %> id="<%= id %>" <% } %> class="btn btn-primary <%= elt.htmlClass?elt.htmlClass:"" %>" value="<%= value || node.title %>"<%= (node.disabled? " disabled" : "")%>/>',
      isTbTemplate: false,
      'minRowWidth': 'full',
      'maxRowWidth': 'full',
    },
    'button': {
      'template':' <button type="button" '
        + '<% if (id) { %> id="<%= id %>" <% } %> '
        + 'class=" btn <%= node.formElement.buttonSize %>'
        + '  <%= node.formElement.buttonType %> <%= cls.buttonClass %>'
        + '  <%= elt.htmlClass?elt.htmlClass:"" %> <%= node.formElement.buttonStyle %>">'
        + '<i class="glyphicon glyphicon-<%= node.formElement.buttonIcon %>">'
        + ' <%= node.title %>'
        + '</i>'
        + '</button> ',
      isTbTemplate: false,
      'onBeforeRender': function (data, node) {
        if (!node.formElement.description) {
          ASSERT_PEER.ofTbType(node.formElement.title, 'string', 'elementType alert: the alert must have title, description or both.');
        } else {
          ASSERT_PEER.ofTbType(node.formElement.description, 'string', 'elementType alert: the alert must have title, description or both.');
        }

        node.formElement.alertMessage = '';

        switch (node.formElement.buttonType) {
          case 'primary':
            node.formElement.buttonType = 'btn-primary';
            node.formElement.buttonIcon = (isSet(node.formElement.buttonIcon))
              ? node.formElement.buttonIcon : '<i class="glyphicon glyphicon-ok"></i> ';

            break;
          case 'success':
            node.formElement.buttonType = 'btn-success';
            node.formElement.buttonIcon = (isSet(node.formElement.buttonIcon))
              ? node.formElement.buttonIcon : '<i class="glyphicon glyphicon-ok"></i> ';

            break;
          case 'warning':
            node.formElement.buttonType = 'btn-warning';
            node.formElement.buttonIcon = (isSet(node.formElement.buttonIcon))
              ? node.formElement.buttonIcon : '<i class="glyphicon glyphicon-warning-sign"></i> ';

            break;
          case 'danger':
            node.formElement.buttonType = 'btn-danger';
            node.formElement.buttonIcon = (isSet(node.formElement.buttonIcon))
              ? node.formElement.buttonIcon : '<i class="glyphicon glyphicon-remove-sign"></i> ';

            break;
          case 'info':
            node.formElement.buttonType = 'btn-info';
            node.formElement.buttonIcon = (isSet(node.formElement.buttonIcon))
              ? node.formElement.buttonIcon : '<i class="glyphicon glyphicon-info-sign"></i> ';

            break;
          case 'default': default:
            node.formElement.buttonType = 'btn-default';
        };

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
      'lock': function(node) {
        $(node.el)
          .addClass('disabled')
          .prop('disabled', true);
      },
      'unlock': function(node) {
        $(node.el)
          .removeClass('disabled')
          .removeProp('disabled');
      }
    },
    'actions': {
      'template':'<div class="form-actions <%= elt.htmlClass?elt.htmlClass:"" %>"><%= children %></div>',
      isTbTemplate: false
    },
    'hidden': {
      'template':'<input type="hidden" id="<%= id %>" name="<%= node.name %>" value="<%= escape(value) %>" <%= (node.disabled? " disabled" : "")%> />',
      'inputfield': true,
      isTbTemplate: false,
      'compatibleTypes': ['string', 'number', 'integer', 'boolean', 'object', 'array'],
      'compatibleFormats': [],
      'minRowWidth': 'half',
      'maxRowWidth': 'full',
    },
    'selectfieldset': {
      'template': '<fieldset class="tab-container <%= elt.htmlClass?elt.htmlClass:"" %>">' +
        '<% if (node.legend) { %><legend><%= node.legend %></legend><% } %>' +
        '<% if (node.formElement.key) { %><input type="hidden" id="<%= node.id %>" name="<%= node.name %>" value="<%= escape(value) %>" /><% } else { %>' +
          '<a id="<%= node.id %>"></a><% } %>' +
        '<div class="tabbable">' +
          '<div class="tb-jf-form-group <%= cls.groupClass %><%= node.formElement.hideMenu ? " hide" : "" %>">' +
            '<% if (node.title && !elt.notitle) { %><label class="<%= cls.labelClass %>" for="<%= node.id %>"><%= node.title %></label><% } %>' +
            '<div class="<%= cls.controlClass %>"><%= tabs %></div>' +
          '</div>' +
          '<div class="tab-content">' +
            '<%= children %>' +
          '</div>' +
        '</div>' +
        '</fieldset>',
      // 'inputfield': true,
      'compatibleTypes': ['object'],
      'minRowWidth': 'half',
      'maxRowWidth': 'full',
      isTbTemplate: false,
      'containerField': true,
      'isSearchableField': true,
      'getElement': function (el) {
        return $(el).parent().get(0);
      },
      'childTemplate': function (inner) {
        return '<div data-idx="<%= node.childPos %>" class="tab-pane' +
          '<% if (node.active) { %> active<% } %>">' +
          inner +
          '</div>';
      },
      'onBeforeRender': function (data, node) {
        // Before rendering, this function ensures that:
        // 1. direct children have IDs (used to show/hide the tabs contents)
        // 2. the tab to active is flagged accordingly. The active tab is
        // the first one, except if form values are available, in which case
        // it's the first tab for which there is some value available (or back
        // to the first one if there are none)
        // 3. the HTML of the select field used to select tabs is exposed in the
        // HTML template data as "tabs"

        var children = null;
        var choices = [];
        var activeChild = null;

        if (node.schemaElement) {
          choices = node.schemaElement['enum'] || [];
        }

        if (node.options) {
          children = _.map(node.options, function (option, idx) {
            var child = node.children[idx];
            if (option instanceof Object) {
              option = _.extend({ node: child }, option);

              option.title = option.title
                || child.legend
                || child.title
                || ('Option ' + (child.childPos+1));

              option.value = isSet(option.value)
                ? option.value
                : isSet(choices[idx])
                  ? choices[idx]
                  : idx;

              return option;
            } else {
              return {
                title: option,

                value: isSet(choices[child.childPos])
                  ? choices[child.childPos]
                  : child.childPos,

                node: child
              };
            }
          });
        } else {
          children = _.map(node.children, function (child, idx) {
            return {
              title: child.legend || child.title || ('Option ' + (child.childPos+1)),
              value: choices[child.childPos] || child.childPos,
              node: child
            };
          });
        }

        if (data.value) {
          activeChild = _.find(children, function (child) {
            return (child.value === node.value);
          });
        }
        if (!activeChild) {
          activeChild = _.find(children, function (child) {
            return child.node.hasNonDefaultValue();
          });
        }
        if (!activeChild) {
          activeChild = children[0];
        }
        activeChild.node.active = true;
        data.value = activeChild.value;

        var elt = node.formElement;
        var tabs = '<select class="nav '+(data.cls.textualInputClass)+'"' +
          (node.disabled ? ' disabled' : '') +
          '>';
        _.each(children, function (child, idx) {
          tabs += '<option data-idx="' + idx + '" value="' + child.value + '"' +
            (child.node.active ? ' class="active"' : '') +
            '>' +
            _.escape(child.title) +
            '</option>';
        });
        tabs += '</select>';

        data.tabs = tabs;
        return data;
      },
      'onInsert': function (evt, node) {
        $(node.el).find('select.nav').first().on('change', function (evt) {
          var $option = $(this).find('option:selected');
          $(node.el).find('input[type="hidden"]').first().val($option.attr('value'));
        });
      }
    },
    'optionfieldset': {
      'template': '<div' +
        '<% if (node.id) { %> id="<%= node.id %>"<% } %>' +
        '>' +
        '<%= children %>' +
        '</div>',
      'compatibleTypes': ['object'],
      'containerField': true,
      'minRowWidth': 'half',
      'maxRowWidth': 'full',
      isTbTemplate: false
    },
    'section': {
      'template': '<div' +
        '<% if (node.id) { %> id="<%= node.id %>"<% } %> class="tb-jf-node row ' +
        '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
        ' <%= elt.htmlClass?elt.htmlClass:"" %>"' +
        ' data-tb-jf-type="section"><%= children %></div>',
      'compatibleTypes': ['array'],
      'compatibleFormats': [],
      'containerField': true,
      'minRowWidth': 'half',
      'maxRowWidth': 'full',
      isTbTemplate: false
    },
    'tablerow': {
      'template': '<div' +
        '<% if (node.id) { %> id="<%= node.id %>"<% } %> class="tb-jf-node ' +
        '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>' +
        ' <%= elt.htmlClass?elt.htmlClass:"" %>"' +
        '><%= children %></div>',
      'compatibleTypes': ['array'],
      'compatibleFormats': [],
      'containerField': true,
      'minRowWidth': 'full',
      'maxRowWidth': 'full',
      isTbTemplate: false,
      'onBeforeRender': function(data, node) {
        node.view.template = '<tr data-idx="<%= node.childPos %>" data-tb-jf-type="table-item"'
          + '<% if (node.id) { %> id=\"<%= node.id %>\"<% } %> '
          + 'class=\"tb-jf-node '
          + '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>'
          + ' <%= elt.htmlClass?elt.htmlClass:\"\" %>\"> '
          + '<%= children %>';

        if (node.parentNode.formElement.enableDeletingItems
          || node.parentNode.formElement.enableSorting) {

          node.view.template += '<td width="1%"> '
            + ' <span class="tb-jf-table-button-group">';
        }

        if (node.parentNode.formElement.enableSorting) {
          node.view.template += ' <a class="<%= cls.buttonClass %> tb-jf-table-row-move-up btn-xs">'
            + '<i class="<%= cls.iconClassPrefix %>-circle-arrow-up" title="move row up"></i>'
            + '</a>'
            + ' <a class="<%= cls.buttonClass %> tb-jf-table-row-move-down btn-xs">'
            + '<i class="<%= cls.iconClassPrefix %>-circle-arrow-down" title="move row down"></i>'
            + '</a>';
        }

        if (node.parentNode.formElement.enableDeletingItems) {
          node.view.template += ' <a href="#" class="<%= cls.buttonClass %> tb-jf-table-row-delete btn-xs btn-danger"><i class="<%= cls.iconClassPrefix %>-remove" title="remove row"></i></a>'
            + ' </span>'
            + ' </td>';
        }

        if (node.parentNode.formElement.enableDeletingItems
          || node.parentNode.formElement.enableSorting) {

          node.view.template += ' </span>'
            + ' </td>';
        }

        node.view.template += '</tr>'

        _.each(node.children, function(child) {
          child.fieldtemplate = false;
          child.view.tablecell = true;
        })

      }
    },
    'table': {
      'template': '<div class="tb-jf-table-container"><table '
        + 'name="<%= node.name %><%= (node.schemaElement && node.schemaElement.type === "array" ? "[]" : "") %>" '
        + 'id="<%= id %>" '
        + 'class="tb-jf-table table table-responsive <%= node.formElement.disableTableBorder %> table-hover <%= (fieldHtmlClass ? " fieldHtmlClass " : "") %> <%= (node.formElement.displayCompressedTables ? " table-sm " : "") %>" '
        + '<%= (node.disabled || node.readOnly? " disabled" : "")%> '
        + '>'
        + '<thead> <tr> <%= node.formElement.thead %> <tr> </thead>'
        + '<tbody> <%= children %> </tbody>'
        // + '<tfoot> <tr> <%= node.formElement.thead %> <tr> </tfoot>'
        + '</table>'
        + '<% if (!node.isReadOnly() && node.formElement.enableAddingItems) { %>'
        + '<span class="tb-jf-array-buttons">'
        + '<a href="#" class="<%= cls.buttonClass %> btn-group-justified tb-jf-table-addmore <%= (node.formElement.displayCompressedTables ? " btn-sm " : "") %>"><i class="<%= cls.iconClassPrefix %>-plus-sign" title="Add new"></i> add new</a> '
        + '</span>'
        + '<% } %>'
        + '</div>',
      'fieldtemplate': true,
      'array': true,
      'containerField': true,
      'compatibleTypes': ['array'],
      'compatibleFormats': [],
      'minRowWidth': 'half',
      'maxRowWidth': 'full',
      isArrayContainer: true, // to replace `array` property
      isTbTemplate: false,
      'onBeforeRender': function (data, node) {
        node.arrayLimits = node.getArrayLimits();

        node.formElement.disableTableBorder = (node.formElement.disableTableBorder)
          ? ' tb-jf-disable-table-border '
          : ' table-bordered ';

        node.childTemplate.view.template = '<tr '
          + '<% if (node.id) { %> id=\"<%= node.id %>\"<% } %> '
          + 'class=\"tb-jf-node '
          + '<%= (node.key) ? " tb-jf-error-" + node.selectorKey : "" %>'
          + ' <%= elt.htmlClass?elt.htmlClass:\"\" %>\"> '
          + '<%= children %>'
          + '</tr>'

        if (node.formElement.items[0].type === "section") {
          node.formElement.items[0].type = "tablerow";
        };

        /**
         * validate the columns in case they are specified
         * generate default values from the schema otherwise
         */
        if (node.formElement.items) {
          ASSERT_PEER.ofTbType(node.formElement.items, 'array', 'table: items must be an array');
          ASSERT_PEER(node.formElement.items.length >= 1, 'table: items must have a length of 1 or more');

          node.formElement.thead = '';
          _.each(node.formElement.items[0].items, function(col, index) {
            ASSERT_PEER(col.title, 'table: every column requires a title');

            if (col.type === "section") {
              ASSERT_PEER.ofTbType(col.items, 'array', 'table: items must be an array');
              ASSERT_PEER(col.items.length >= 1, 'table: items must have a length of 1 or more');

              // node.formElement.items[0].items.splice(i, 1);

              // for (var i = 0, j = col.items.length; i < j; i++) {
              //   node.formElement.items[0].items.splice(i, 0, col.items[i]);
              // };
            }

            node.formElement.thead += '<th>' + col.title + '</th>';
          });

          if (node.formElement.enableSorting && !node.formElement.enableDeletingItems) {
            node.formElement.thead += '<th> Reorder </th>';
          } else if (!node.formElement.enableSorting && node.formElement.enableDeletingItems) {
            node.formElement.thead += '<th> Remove </th>';
          } else if (node.formElement.enableSorting && node.formElement.enableDeletingItems) {
            node.formElement.thead += '<th> Modify </th>';
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

        _.each(node.children, function(row) {
          _.each(row.children, function(col) {
            // col.view.fieldtemplate = false;
            col.view.tablecell = true;
          })
        })
      },
      'onInsert': function (evt, node) {
        var $node = $(node.el);
        var $nodeid = $(node.el).find('#' + escapeSelector(node.id));
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

          var incr = (fromIdx < toIdx) ? 1: -1;
          var parentEl = tableBody;

          for (var i = fromIdx; i !== toIdx; i += incr) {
            node.children[i].switchValuesWithNode(node.children[i + incr]);

            node.children[i].render(parentEl.get(0));
            node.children[i + incr].render(parentEl.get(0));
          }

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
            else $(node.children[fromIdx-1].el).after(fromEl);
            $(node.children[toIdx-1].el).after(toEl);
          } else {
            if (toIdx === 0) parentEl.prepend(toEl);
            else $(node.children[toIdx-1].el).after(toEl);
            $(node.children[fromIdx-1].el).after(fromEl);
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
        }

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
        }

        // call addItem on click
        $('+ span > a.tb-jf-table-addmore', $nodeid).click(function (evt) {
          evt.preventDefault();
          evt.stopPropagation();
          var idx = node.children.length;
          addItem(idx);
        });

        //Simulate Users click to setup the form with its minItems
        var curItems = $('> ul > li', $nodeid).length;
        if (arrayLimits.minItems > 0) {
          for (var i = node.children.length; i < arrayLimits.minItems; i++) {
            //console.log('Calling click: ', $nodeid);
            //$('> span > a.tb-jf-table-addmore', $nodeid).click();
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

          var $tr = $(e.currentTarget).parent().parent();
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
  var FormNode = function() {
    // TRACE('FormNode %s', arguments);

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
  };


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
  FormNode.prototype.render = function(el) {
    // TRACE('FormNode.prototype.render %s', arguments);

    var html = this.getHtml();

    this.setHtml(html, el);
    this.enhance();
  };

  /**
   * Generates the view's HTML content for the underlying model.
   *
   * @function
   */
  FormNode.prototype.getHtml = function() {
    // TRACE('FormNode.prototype.getHtml %s', arguments);

    var html = '';
    var template = null;
    var data = {
      id: this.id,
      key: this.key,
      elt: this.formElement,
      schema: this.schemaElement,
      node: this,
      value: isSet(this.value) ? this.value : '',
      cls: this.ownerTree.defaultClasses,
      escape: _.escape
    };

    // Complete the data context if needed
    if (this.ownerTree.formDesc.onBeforeRender) {
      this.ownerTree.formDesc.onBeforeRender(data, this);
    }
    if (this.view.onBeforeRender) {
      this.view.onBeforeRender(data, this);
    }


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
    if ((this.fieldtemplate !== false)
      && (this.fieldtemplate || this.view.fieldtemplate)) {

      template = jsonform.fieldTemplate(template);
    } else if (this.tablecell || this.view.tablecell) {
      template = jsonform.tableCellTemplate(template);
    }

    // Wrap the content in the child template of its parent if necessary.
    if (this.parentNode
      && this.parentNode.view
      && this.parentNode.view.childTemplate) {

      template = this.parentNode.view.childTemplate(template, this.parentNode);
    }


    // Prepare the HTML of the children
    var childrenhtml = '';

    _.each(this.children, function (child) {
      childrenhtml += child.getHtml();
    });

    data.children = childrenhtml;


    data.fieldHtmlClass = '';

    if (this.ownerTree
      && this.ownerTree.formDesc
      && this.ownerTree.formDesc.params
      && this.ownerTree.formDesc.params.fieldHtmlClass) {

      data.fieldHtmlClass = this.ownerTree.formDesc.params.fieldHtmlClass;
    }

    if (this.formElement
      && (typeof this.formElement.fieldHtmlClass !== 'undefined')) {

      data.fieldHtmlClass = this.formElement.fieldHtmlClass;
    }


    // Apply the HTML template
    html = _template(template, data, fieldTemplateSettings);

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
  FormNode.prototype.setHtml = function(html, parentEl) {
    // TRACE('FormNode.prototype.setHtml %s', arguments);
    var node = $(html);
    var parentNode = parentEl
      || ((this.parentNode)
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
   *
   * Only nodes that have ID are directly associated with a DOM element.
   *
   * @function
   */
  FormNode.prototype.updateDomElementReference = function(domNode) {
    // TRACE('FormNode.prototype.updateDomElementReference %s', arguments);

    if (this.id) {
      this.el = $('#' + escapeSelector(this.id), domNode).get(0)
        || $('#' + escapeSelector(this.id));

      // array elements do not have schema keys thus they must be treated separetely
      var isArrayItem = this.parentNode
        && this.parentNode.formElement
        && jsonform.elementTypes[this.parentNode.formElement.type].array === true;

      if (isArrayItem) {
        var parentType = this.parentNode.formElement.type;

        this.el = this.el.closest('[data-tb-jf-type=' + parentType + '-item]');
      } else {
        this.el = this.el.closest('[data-tb-jf-type]');
      }
    }

    _.each(this.children, function (child) {
      child.updateDomElementReference(child.el || domNode);
    });
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
   * @param {Boolean} ignoreSchemaDefaultValues Ignore default values defined in the
   *  schema when set.
   * @param {Integer} the top array level of the default value scope, used when
   *  adding new items into an array, at that time won't consider all default values
   *  above the array schema level.
   */
  FormNode.prototype.computeInitialValues = function(values, settings) {
    // TRACE('FormNode.prototype.computeInitialValues %s', arguments);

    var self = this;
    var topDefaultArrayLevel;
    var ignoreSchemaDefaultValues;
    var shouldUpdateValueHistory = true;
    var formData = this.ownerTree.formDesc.tpldata || {};

    if (settings) {
      shouldUpdateValueHistory = settings.shouldUpdateValueHistory === false
        ? false
        : true;
      ignoreSchemaDefaultValues = settings.ignoreSchemaDefaultValues;
      topDefaultArrayLevel = settings.topDefaultArrayLevel;
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
    } else {
      this.arrayPath = [];
    }

    // Prepare special data param "idx" for templated values
    // (is is the index of the child in its wrapping array, starting
    // at 1 since that's more human-friendly than a zero-based index)
    formData.idx = (this.arrayPath.length > 0)
      ? this.arrayPath[this.arrayPath.length - 1] + 1
      : this.childPos + 1;

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

    if (this.formElement) {
      this.applyArrayPathToNodeProperties();
      this.applyTemplateToNodeProperties(formData);
    }

    // check if the form contains any values other than the private jsonformVersion and schemaId
    var hasNonPrivateValues = _.find(values, function(value, key) {
      return Boolean(key !== 'schemaId' && key !== 'jsonformVersion');
    });

    // Case 1: simple input field
    if (this.view
      && (this.view.inputfield || this.view.previewField)
      && this.schemaElement) {

      // the value of fieldValue and schemaDefault is either undefined in case nothing is specified in the content/value object
      // or the value itdelf (note that null is one of the possible values)
      var fieldValue = jsonform.util.getObjByKey(values, this.key);
      var schemaDefault = getSchemaDefaultByKeyWithArrayIdx(
        self.ownerTree.formDesc.schema,
        this.key,
        topDefaultArrayLevel
      );

      // in case the input field is a translated one and no value is given for the specific locale
      // we must pass it the value of the "unstranslated" field if such is given
      var parentKey = _.dropRight(this.key.split('/')).join('/');
      var parentSchema = getSchemaByKey(this.ownerTree.formDesc.schema, parentKey);

      // get the key & value of the field before localization (currently under the key "untranslated")
      var keyBeforeLocalization = parentKey + '/' + this.ownerTree.formDesc.form.originalLocale;
      var valueBeforeLocalization = jsonform.util.getObjByKey(values, keyBeforeLocalization);

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
          true
        );
      }

      if (fieldValue !== undefined) {
        var validatedValue = jsonform.util.validateValueType(
          this.key,
          this.schemaElement,
          this.formElement,
          this.ownerTree.formDesc.form.deprecatedValue,
          fieldValue,
          this.ownerTree.formDesc.form.isStrict
        );

        this.value = validatedValue;

        if (shouldUpdateValueHistory) {
          this.updateValueHistory(this.value);
        }
      } else if (parentSchema
          && parentSchema.isMultilanguage === true
          && isSet(valueBeforeLocalization)) {

        this.value = valueBeforeLocalization;

        if (shouldUpdateValueHistory) {
          this.updateValueHistory(this.value);
        }
      } else if (isSet(schemaDefault)) {
        // isValidDefault(this.schemaElement, schemaDefault);

        this.value = schemaDefault;

        if (_.isString(this.value)) {
          if (this.value.indexOf('{{values/') !== -1) {
            // This label wants to use the value of another input field.
            // Convert that construct into {{jsonform.getValue(key)}} for
            // Underscore to call the appropriate function of formData
            // when template gets called (note calling a function is not
            // exactly Mustache-friendly but is supported by Underscore).
            this.value = this.value.replace(
              /\{\{values\/([^\}]+)\}\}/g,
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
      } else if (this.parentNode.schemaElement
        && this.parentNode.schemaElement.isMultilanguage) {

        if (isSet(jsonform.util.getObjByKey(values, parentKey))) {
          var parentNodeValue = jsonform.util.getObjByKey(values, parentKey);

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

    // Case 2: array-like node
    } else if (this.view
      && this.view.array) {

      var nbChildren = 1;

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
        this.appendChildNode(this.getChildTemplate().clone());
      }
    }

    // Case 3 and in any case: recurse through the list of children
    _.each(this.children, function (child) {
      child.computeInitialValues(
        values, {
          'ignoreSchemaDefaultValues': ignoreSchemaDefaultValues,
          'topDefaultArrayLevel': topDefaultArrayLevel
      });
    });

    // If the node's value is to be used as legend for its "container"
    // (typically the array the node belongs to), ensure that the container
    // has a direct link to the node for the corresponding tab.
    if (this.formElement
      && this.formElement.valueInLegend) {

      var node = this;

      while (node) {
        if (node.parentNode
          && node.parentNode.view
          && node.parentNode.view.array) {

          node.legendChild = this;

          if (node.formElement
            && node.formElement.legend) {

            node.legend = applyArrayPath(node.formElement.legend, node.arrayPath);

            formData.idx = (node.arrayPath.length > 0)
              ? node.arrayPath[node.arrayPath.length - 1] + 1
              : node.childPos + 1;

            formData.value = isSet(this.value)
              ? this.value
              : '';
            node.legend = _template(node.legend, formData, valueTemplateSettings);

            break;
          }
        }

        node = node.parentNode;
      }
    }
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
  FormNode.prototype.getFormValues = function(updateArrayPath) {
    // TRACE('FormNode.prototype.getFormValues %s', arguments);

    var domElement = this.el;

    ASSERT(
      domElement,
      'FormNode.getFormValues can only be called on nodes that are associated with a DOM element in the tree'
    );
    // The values object that will be returned
    var values = {};

    // Form fields values
    var formArray = $(':input:not(.tb-jf-filter)', domElement).serializeArray();
    // Set values to false for unset checkboxes and radio buttons
    // because serializeArray() ignores them
    formArray = formArray.concat(
      $(':input[type=checkbox][name]', domElement).map(function() {
        return {
          "name": this.name,
          "value": this.checked
        }
      }).get()
    );

    formArray = formArray.concat(
      $(':input[type=radio]', domElement).map(function() {
        if (this.checked) {
          return {
            "name": this.name,
            "value": this.value
          }
        }
      }).get()
    );

    // add disabled select controls to the value
    formArray = formArray.concat(
      $('select:not(.tb-jf-filter)', domElement).map(function() {
        return {
          "name": this.name,
          "value": this.value
        }
      }).get()
    );

    if (updateArrayPath) {
      _.each(formArray, function (param) {
        param.name = applyArrayPath(param.name, updateArrayPath);
      });
    };

    // The underlying data schema
    var formSchema = this.ownerTree.formDesc.schema;

    for (var i = 0; i < formArray.length; i++) {
      // Retrieve the key definition from the data schema
      var name = formArray[i].name;
      var eltSchema = getSchemaByKey(formSchema, name);
      var arrayMatch = null;
      var val = null;

      // Skip the input field if it's not part of the schema
      if (!eltSchema) continue;

      /**
       * Handle multiple checkboxes separately as the idea is to generate
       * an array that contains the list of enumeration items that the user
       * selected.
       */
      if (eltSchema._jsonform_checkboxes_as_array) {
        arrayMatch = name.match(/\[([0-9]*)\]$/);

        if (arrayMatch) {
          name = name.replace(/\[([0-9]*)\]$/, '');
          val = jsonform.util.getObjByKey(values, name) || [];

          if ((eltSchema._jsonform_checkboxes_as_array === 'value')
            && (formArray[i].value !== false)
            && (formArray[i].value !== '')) {
            // Value selected, push the corresponding enumeration item
            // to the data result
            val.push(formArray[i].value);
          } else if (eltSchema._jsonform_checkboxes_as_array === true
              && formArray[i].value === '1') {

            // Value selected, push the corresponding enumeration item
            // to the data result
            val.push(eltSchema['enum'][parseInt(arrayMatch[1], 10)]);
          }

          jsonform.util.setObjValueByKey(values, name, val);
          continue;
        }
      }

      // if (eltSchema._jsonform_get_value_by_tagsinput === 'tagsinput') {
      //   var vals;

      //   if (updateArrayPath) {
      //     var oriName = applyArrayPath(name, this.arrayPath);
      //     vals = $(':input[name="' + oriName + '"]', domElement).tagsinput('items');
      //   } else {
      //     vals = $(':input[name="' + name + '"]', domElement).tagsinput('items');
      //   }

      //   jsonform.util.setObjValueByKey(values, name, vals);

      //   continue;
      // }

      if (name.slice(-2) === '[]') {
        name = name.slice(0, -2);
        eltSchema = getSchemaByKey(formSchema, name);

        if (contains(eltSchema.type, 'array')) {
          val = jsonform.util.getObjByKey(values, name);

          if (val === null || val === undefined) {
            val = [];
          }

          if (val.indexOf(formArray[i].value) < 0) {

            val.push(formArray[i].value);

            jsonform.util.setObjValueByKey(values, name, val);
          }

          continue;
        }
      }



      if (contains(eltSchema.type, 'boolean')) {
        if (formArray[i].value === '0' || formArray[i].value === 'false') {
          formArray[i].value = false;
        } else if (_.trim(formArray[i].value) === '') {
          formArray[i].value = null;
        } else {
          formArray[i].value = !!formArray[i].value;
        }
      }

      if (contains(eltSchema.type, 'number')
        || contains(eltSchema.type, 'integer', true)) {

        if (_.isString(formArray[i].value)) {
          if (_.trim(formArray[i].value).length < 1 || _.trim(formArray[i].value) === '') {
            formArray[i].value = null;
          } else if (!isNaN(Number(formArray[i].value))) {
            formArray[i].value = Number(formArray[i].value);
          }
        }
      }

      if (contains(eltSchema.type, 'string')) {
        if (_.trim(formArray[i].value) === '') {
          formArray[i].value = null;
        } else {
          formArray[i].value = _.trim(formArray[i].value);
        }
      }

      if (contains(eltSchema.type, 'object')
        && _.isString(formArray[i].value)
        && (formArray[i].value.substring(0, 1) === '{')) {

          try {
            formArray[i].value = JSON.parse(formArray[i].value);
          } catch (e) {
            ASSERT.ofTbType(formArray[i].value, 'object', 'The schema element set to object but its value is not a valid object');
          }
      }

      if (contains(eltSchema.type, 'array')
        && _.isString(formArray[i].value)) {

        if (formArray[i].value.substring(0, 1) === '[') {
          try {
            formArray[i].value = JSON.parse(formArray[i].value);
          } catch (e) {
            ASSERT.ofTbType(formArray[i].value, 'array', 'The schema element set to object but its value is not a valid object');
          }
        } else {
          formArray[i].value = null;
        }
      }

      if (contains(eltSchema.type, 'object')
        && (formArray[i].value === 'null' || formArray[i].value === '')) {

        formArray[i].value = null;
      }

      if (formArray[i].name) {
        jsonform.util.setObjValueByKey(values, formArray[i].name, formArray[i].value);

        // if (formArray[i].value !== null) {
        //   jsonform.util.setObjValueByKey(values.nonNullable, formArray[i].name, formArray[i].value);
        // }
      }
    }

    return values;
  };

  /**
   * Resets all DOM values in the node's subtree.
   *
   * This operation also drops all array item nodes.
   * Note values are not reset to their default values, they are rather removed!
   *
   * @function
   */
  FormNode.prototype.resetValues = function() {
    // TRACE('FormNode.prototype.resetValues %s', arguments);

    var params = null;

    // Reset value
    this.value = null;

    // Propagate the array path from the parent node
    // (adding the position of the child for nodes that are direct
    // children of array-like nodes)
    if (this.parentNode) {
      this.arrayPath = _.clone(this.parentNode.arrayPath);

      if (this.parentNode.view
        && this.parentNode.view.array) {

        this.arrayPath.push(this.childPos);
      }
    } else {
      this.arrayPath = [];
    }

    if (this.view
      && this.view.inputfield) {

      // Simple input field, extract the value from the origin,
      // set the target value and reset the origin value
      params = $(':input', this.el)
        .serializeArray();

      _.each(params, function (param) {
        // TODO: check this, there may exist corner cases with this approach
        // (with multiple checkboxes for instance)
        $('[name="' + escapeSelector(param.name) + '"]', $(this.el)).val('');
      }.bind(this));

    } else if (this.view
      && this.view.array) {

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
  FormNode.prototype.moveValuesToNode = function(node) {
    // TRACE('FormNode.prototype.moveValuesToNode %s', arguments);

    var values = this.getFormValues(node.arrayPath);
    node.resetValues();

    node.computeInitialValues(
      values, {
      'ignoreSchemaDefaultValues': true
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
  FormNode.prototype.switchValuesWithNode = function(node) {
    // TRACE('FormNode.prototype.switchValuesWithNode %s', arguments);

    var currentNodeValues = this.getFormValues(node.arrayPath);
    var substituteNodeValues = node.getFormValues(this.arrayPath);

    node.resetValues();
    this.resetValues();

    node.computeInitialValues(
      currentNodeValues, {
      'ignoreSchemaDefaultValues': true
    });

    this.computeInitialValues(
      substituteNodeValues, {
      'ignoreSchemaDefaultValues': true
    });
  };

  FormNode.prototype.validate = function(value) {
    var validationValue = constructObjectByKey(
      this.formElement.key,
      value
    );

    $(this.ownerTree).jsonFormClearErrors({
      dataPath: this.formElement.key
    });

    this.ownerTree.validate({
      'values': validationValue,
      'clearOldErrors': false
    });
  }

  /**
   * Returns true if the subtree that starts at the current node
   * has some non empty value attached to it
   */
  FormNode.prototype.hasNonDefaultValue = function() {
    // TRACE('FormNode.prototype.hasNonDefaultValue %s', arguments);

    // hidden elements don't count because they could make the wrong selectfieldset element active
    if (this.formElement && this.formElement.type=="hidden") {
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


  FormNode.prototype.activateValueHistoryEventHandlers = function() {
    if (this.formElement.enableReset || this.formElement.enableUndo || this.formElement.enableRedo) {
      var valueControls = $(this.el).find('> .controls > .tb-jf-value-history-buttons');

      if (this.formElement.enableReset) {
        var resetButton = valueControls.find('> .tb-jf-value-history-reset');

        ASSERT(resetButton, 'The reset button for schema element %s did not render properly.', this.formElement.key);

        resetButton.bind('click', function(evt) {
          this.setValueHistoryAbsPos(0);
        });
      }

      if (this.formElement.enableUndo) {
        var undoButton = valueControls.find('> .tb-jf-value-history-undo');

        ASSERT(resetButton, 'The undo button for schema element %s did not render properly', this.formElement.key);

        undoButton.bind('click', function(evt) {
          this.setValueHistoryRelPos(-1);
        });
      }

      if (this.formElement.enableRedo) {
        var redoButton = valueControls.find('> .tb-jf-value-history-redo');

        ASSERT(resetButton, 'The redo button for schema element %s did not render properly', this.formElement.key);

        redoButton.bind('click', function(evt) {
          this.setValueHistoryRelPos(1);
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
  FormNode.prototype.updateValueHistory = function(value, validate) {
    // TRACE('FormNode.prototype.updateValueHistory %s', arguments);
    if (value === undefined) {
      value = null;
    };

    // console.log(this.key, arguments, this.valueHistory, this.activeValueHistoryIdx);
    // if valueHistory is empty record the current value
    // else if it is an object compare the current and last objects by value (not reference)
    // finally if the value is scalar simply compare if it is equal to the last one
    if (this.valueHistory.length === 0
      || (typeof this.valueHistory[this.valueHistory.length - 1] === 'object'
        && !areObjectsEqual(value, this.valueHistory[this.valueHistory.length - 1]))
      || (typeof this.valueHistory[this.valueHistory.length - 1] !== 'object'
        && value !== this.valueHistory[this.valueHistory.length - 1])) {

      this.activeValueHistoryIdx = this.valueHistory.push(value) - 1;
    }

    if (validate && jsonform.formTree.formDesc.form.liveValidation) {
      this.validate(value);
    }

    ASSERT(this.valueHistory.length >= 1, 'No value given.');
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

    $(this.ownerTree.domRoot).trigger('jsonformsChange');
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
  FormNode.prototype.setValueHistoryAbsPos = function(position) {
    ASSERT(jsonform.util.typeof(position, true) === 'integer', 'setValueHistoryPos: position must be an integer for key %s.', this.formElement.key);

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
        'ignoreSchemaDefaultValues': true,
        'shouldUpdateValueHistory': false
    });

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
  FormNode.prototype.setValueHistoryRelPos = function(position) {
    ASSERT(jsonform.util.typeof(position, true) === 'integer', 'setValueHistoryPos: position must be an integer for key %s.', this.formElement.key);

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
        'ignoreSchemaDefaultValues': true,
        'shouldUpdateValueHistory': false
    });
    this.render(this.el);
  };


  /**
   * Clones a node
   *
   * @function
   * @param {FormNode} New parent node to attach the node to
   * @return {FormNode} Cloned node
   */
  FormNode.prototype.clone = function(parentNode) {
    // TRACE('FormNode.prototype.clone %s', arguments);

    var node = new FormNode();
    node.childPos = this.childPos;
    node.arrayPath = _.clone(this.arrayPath);
    node.ownerTree = this.ownerTree;
    node.parentNode = parentNode || this.parentNode;
    node.formElement = this.formElement;
    node.schemaElement = this.schemaElement;
    node.view = this.view;
    node.children = _.map(this.children, function (child) {
      return child.clone(node);
    });
    /*  if (this.childTemplate) {
      node.childTemplate = this.childTemplate.clone(node);
    }*/
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
  FormNode.prototype.getChildNodeByKey = function(key) {
    // TRACE('FormNode.prototype.getChildNodeByKey %s', arguments);

    ASSERT.ofTbType(
      key,
      'string',
      'getChildNodeByKey expected key to be a string.'
    );

    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].key
        && key === getInnermostJsonPathKey(this.children[i].key)) {

        return this.children[i];
      }
    }

    ASSERT(false, 'getChildNodeByKey: a node with the given path does not exist.');
  }

  /**
   * Searches among the children of the current node for
   * elements of a specified keyPath.
   *
   * getChildNodeByKeyPath('person/friends[]') => friends node
   *
   * @param  {string} key of child element
   * @return {FormNode} child element corresponding to the given key
   */
  FormNode.prototype.getChildNodeByKeyPath = function(keyPath) {
    // TRACE('FormNode.prototype.getChildNodeByKeyPath %s', arguments);

    ASSERT.ofTbType(
      keyPath,
      'string',
      'getNodeByKey expected key to be a string.'
    );

    var childNodeKeys = convertJsonPathStringToArray(keyPath);
    var node = this.getChildNodeByKey(childNodeKeys[0]);

    for (var i = 1; i < childNodeKeys.length; i++) {
      node = node.getChildNodeByKey(childNodeKeys[i]);
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
  FormNode.prototype.getProperty = function(prop, searchInParents) {
    // TRACE('FormNode.prototype.getProperty %s', arguments);

    var value = this[prop];

    if (value !== undefined || !searchInParents || !this.parentNode) {
      return value;
    }

    return this.parentNode.getProperty(prop, true);
  };

  FormNode.prototype.isReadOnly = function() {
    // TRACE('FormNode.prototype.isReadOnly %s', arguments);

    return this.getProperty('readOnly', true);
  };

  /**
   * Gets the child template node for the current node.
   *
   * The child template node is used to create additional children
   * in an array-like form element. We delay create it when first use.
   *
   * @function
   * @param {FormNode} node The child template node to set
   */
  FormNode.prototype.getChildTemplate = function() {
    // TRACE('FormNode.prototype.getChildTemplate %s', arguments);

    if (!this.childTemplate) {
      if (this.view.array) {
        // The form element is an array. The number of items in an array
        // is by definition dynamic, up to the form user (through "Add more",
        // "Delete" commands). The positions of the items in the array may
        // also change over time (through "Move up", "Move down" commands).
        //
        // The form node stores a "template" node that serves as basis for
        // the creation of an item in the array.
        //
        // Array items may be complex forms themselves, allowing for nesting.
        //
        // The initial values set the initial number of items in the array.
        // Note a form element contains at least one item when it is rendered.

        var key;

        if (this.formElement.items) {
          key = this.formElement.items[0] || this.formElement.items;
        } else {
          key = this.formElement.key + '[]';
        }

        // construct a valid json if just a key string is defined
        if (_.isString(key)) {
          key = {
            key: key
          };
        }

        var child = this.ownerTree.buildFromLayout(key, this.formElement);
        if (child) {
          this.setChildTemplate(child);
        }
      }
    }

    return this.childTemplate;
  };


  /**
   * Sets the child template node for the current node.
   *
   * The child template node is used to create additional children
   * in an array-like form element. The template is never rendered.
   *
   * @function
   * @param {FormNode} node The child template node to set
   */
  FormNode.prototype.setChildTemplate = function(node) {
    // TRACE('FormNode.prototype.setChildTemplate %s', arguments);

    this.childTemplate = node;
    node.parentNode = this;
  };

  FormNode.prototype.applyArrayPathToNodeProperties = function() {
    if (this.formElement.id) {
      this.id = escapeId(applyArrayPath(this.formElement.id, this.arrayPath));
    } else if (this.view
        && this.view.array) {

      this.id = escapeId(escapeSelector(this.ownerTree.formDesc.form.prefix))
        + '-elt-counter-'
        + _.uniqueId();
    } else if (this.parentNode
        && this.parentNode.view
        && this.parentNode.view.array) {

      // Array items need an array to associate the right DOM element
      // to the form node when the parent is rendered.
      this.id = escapeId(escapeSelector(this.ownerTree.formDesc.form.prefix))
        + '-elt-counter-'
        + _.uniqueId();
    } else if ((this.formElement.type === 'button')
        || (this.formElement.type === 'selectfieldset')
        || (this.formElement.type === 'tabobject')
        || (this.formElement.type === 'question')
        || (this.formElement.type === 'buttonquestion')) {

      // Buttons do need an id for "onClick" purpose
      this.id = escapeId(escapeSelector(this.ownerTree.formDesc.form.prefix))
        + '-elt-counter-'
        + _.uniqueId();
    }

    // Compute the actual key (the form element's key is index-free,
    // i.e. it looks like foo[]/bar/baz[]/truc, so we need to apply
    // the array path of the node to get foo[4]/bar/baz[2]/truc)
    if (this.formElement.key) {
      this.key = applyArrayPath(this.formElement.key, this.arrayPath);
      this.selectorKey = escapeId(this.key);
    }

    // Same idea for the field's name
    this.name = applyArrayPath(this.formElement.name, this.arrayPath);
  }

  FormNode.prototype.applyTemplateToNodeProperties = function(formData) {
    // Consider that label values are template values and apply the
    // form's data appropriately (note we also apply the array path
    // although that probably doesn't make much sense for labels...)
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
      if (_.isString(this.formElement[prop])) {
        // This label wants to use the value of another input field.
        // Convert that construct into {{jsonform.getValue(key)}} for
        // lodash to call the appropriate function of formData
        // when template gets called (note calling a function is not
        // exactly Mustache-friendly but is supported by lodash).
        if (this.formElement[prop].indexOf('{{values/') !== -1) {
          this[prop] = this.formElement[prop].replace(
            /\{\{values\/([^\}]+)\}\}/g,
            '{{getValue("$1")}}');
        // Note applying the array path probably doesn't make any sense,
        // but some geek might want to have a label "foo[]/bar[]/baz",
        // with the [] replaced by the appropriate array path.
        } else {
          this[prop] = applyArrayPath(this.formElement[prop], this.arrayPath);
        }

        if (this[prop]) {
          this[prop] = _template(this[prop], formData, valueTemplateSettings);
        }
      } else {
        this[prop] = this.formElement[prop];
      }
    }.bind(this));

    // Apply templating to options created with "titleMap" as well
    if (this.formElement.options) {

      this.options = _.map(this.formElement.options, function (option) {
        var title = null;
        if (_.isObject(option) && option.title) {
          // See a few lines above for more details about templating
          // preparation here.
          if (option.title.indexOf('{{values/') !== -1) {
            title = option.title.replace(
              /\{\{values\/([^\}]+)\}\}/g,
              '{{getValue("$1")}}');
          } else {
            title = applyArrayPath(option.title, self.arrayPath);
          }

          return _.extend({}, option, {
            value: (isSet(option.value) ? option.value : ''),
            title: _template(title, formData, valueTemplateSettings)
          });
        } else {
          return option;
        }
      });
    }
  }


  /**
   * Attaches a child node to the current node.
   *
   * The child node is appended to the end of the list.
   *
   * @function
   * @param {FormNode} node The child node to append
   * @return {FormNode} The inserted node (same as the one given as parameter)
   */
  FormNode.prototype.appendChildNode = function(node) {
    // TRACE('FormNode.prototype.appendChildNode %s', arguments);

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
  FormNode.prototype.removeChild = function() {
    // TRACE('FormNode.prototype.removeChild %s', arguments);

    var child = this.children[this.children.length-1];
    if (!child) {
      return;
    }

    // Remove the child from the DOM
    $(child.el).remove();

    child.render();

    // Remove the child from the array
    return this.children.pop();
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
  FormNode.prototype.getNumberOfItems = function(values, arrayPath) {
    // TRACE('FormNode.prototype.getNumberOfItems %s', arguments);

    var key = null;
    var arrayValue = null;
    var childNumbers = null;
    var idx = 0;

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
      arrayValue = jsonform.util.getObjByKey(values, key);
      if (!arrayValue) {
        // No key? That means this field had been left empty
        // in previous submit
        return 0;
      }
      childNumbers = _.map(this.children, function (child) {
        return child.getNumberOfItems(values, arrayPath);
      });
      return _.max([_.max(childNumbers) || 0, arrayValue.length]);
    }

    // Case 2: node is an array-like node, look for input fields
    // in its child template
    else if (this.view.array) {
      return this.getChildTemplate().getNumberOfItems(values, arrayPath);
    }

    // Case 3: node is a leaf or a container,
    // recurse through the list of children and return the maximum
    // number of items found in each subtree
    else {
      childNumbers = _.map(this.children, function (child) {
        return child.getNumberOfItems(values, arrayPath);
      });
      return _.max(childNumbers) || 0;
    }
  };


  /**
   * Inserts an item in the array at the requested position and renders the item.
   *
   * @function
   * @param {Number} idx Insertion index
   */
  FormNode.prototype.insertArrayItem = function(idx, domElement) {
    // TRACE('FormNode.prototype.insertArrayItem %s', arguments);
    ASSERT.ofTbType(idx, 'number|undefined', 'insertArrayItem expected array index to be a number');

    var i = 0;

    // Insert element at the end of the array if index is not given
    if (idx === undefined) {
      idx = this.children.length;
    }

    // Create the additional array item at the end of the list,
    // using the item template created when tree was initialized
    // (the call to resetValues ensures that 'arrayPath' is correctly set)
    var child = this.getChildTemplate().clone();

    this.appendChildNode(child);
    child.resetValues();

    // To create a blank array item at the requested position,
    // shift values down starting at the requested position
    // one to insert (note we start with the end of the array on purpose)
    for (i = this.children.length - 2; i >= idx; i--) {
      this.children[i]
        .moveValuesToNode(this.children[i + 1]);
    }

    // Initialize the blank node we've created with default values
    this.children[idx]
      .resetValues();

    this.children[idx]
      .computeInitialValues(null, {
        'ignoreSchemaDefaultValues': true,
        'topDefaultArrayLevel': this.children[idx].arrayPath.length
      });

    // Re-render all children that have changed
    for (i = idx; i < this.children.length; i++) {
      this.children[i]
        .render(domElement);
    }
  };

  /**
   * Remove an item from an array
   *
   * @function
   * @param {Number} idx The index number of the item to remove
   */
  FormNode.prototype.deleteArrayItem = function(idx) {
    // TRACE('FormNode.prototype.deleteArrayItem %s', arguments);

    ASSERT.ofTbType(idx, 'number|undefined', 'insertArrayItem expected array index to be a number');

    var lastIndex = this.children.length - 1;

    if (idx === undefined
      || idx > lastIndex) {

      idx = lastIndex;
    }

    // Move the item that is being deleted to the end of the array
    for (var i = idx; i < lastIndex; i++) {
      this.children[i + 1].moveValuesToNode(this.children[i]);
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
  FormNode.prototype.getArrayLimits = function() {
    // TRACE('FormNode.prototype.getArrayLimits %s', arguments);

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

      if (node.view
        && node.view.array
        && (node !== initialNode)) {

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
        arrayKey = node.key.replace(/\[[0-9]+\]/g, '[]');

        if (node !== initialNode) {
          arrayKey = arrayKey.replace(/\[\][^\[\]]*$/, '');
        }

        schemaKey = getSchemaByKey(
          node.ownerTree.formDesc.schema,
          arrayKey
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


  /**
   * Enhances the view with additional logic, binding event handlers
   * in particular.
   *
   * The function also runs the "insert" event handler of the view and
   * form element if they exist (starting with that of the view)
   *
   * @function
   */
  FormNode.prototype.enhance = function() {
    // TRACE('FormNode.prototype.enhance %s', arguments);

    var node = this;
    var handlers = null;
    var insertHandler = null;
    var formData = _.clone(this.ownerTree.formDesc.tpldata) || {};

    function onLegendChildChange(evt) {
      if (node.formElement
        && node.formElement.legend
        && node.parentNode) {

        node.legend = applyArrayPath(node.formElement.legend, node.arrayPath);
        formData.idx = (node.arrayPath.length > 0)
          ? node.arrayPath[node.arrayPath.length-1] + 1
          : node.childPos + 1;

        formData.value = $(evt.target).val();
        node.legend = _template(node.legend, formData, valueTemplateSettings);

        $(node.parentNode.el).trigger('legendUpdated');
      }
    }

    if (this.formElement) {
      // Check the view associated with the node as it may define an "onInsert"
      // event handler to be run right away
      if (this.view.onInsert) {
        this.view.onInsert({ target: $(this.el) }, this);
      }


      // trigger the "insert" event handler
      insertHandler = this.onInsert || this.formElement.onInsert;

      if (insertHandler) {
        insertHandler({ target: $(this.el) }, this);
      }


      // trigger the custom event handler initializer for each node
      // in case it has to be re-initialized
      if (this.mustUpdateEventHandlers) {
        // console.log(this.id, this.el);
        this.mustUpdateEventHandlers = false;

        for(var i = 0; i < this.children.length; i++) {
          this.children[i].mustUpdateEventHandlers = true;
        }

        if (typeof this.initializeEventHandlers === 'function') {
          this.initializeEventHandlers();
          // this.initializeEventHandlers.call(this);
          // console.log(this.id, this.el);
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

        // Register specific event handlers
        // TODO: Add support for other event handlers
        if (this.onChange) {
          $(this.el).bind('change', function(evt) {
            node.onChange(evt, node);
          });
        }
        if (this.view.onChange) {
          $(this.el).bind('change', function(evt) {
            node.view.onChange(evt, node);
          });
        }
        if (this.formElement.onChange) {
          $(this.el).bind('change', function(evt) {
            node.formElement.onChange(evt, node);
          });
        }

        if (this.onClick) {
          $(this.el).bind('click', function(evt) {
            node.onClick(evt, node);
          });
        }
        if (this.view.onClick) {
          $(this.el).bind('click', function(evt) {
            node.view.onClick(evt, node);
          });
        }
        if (this.formElement.onClick) {
          $(this.el).bind('click', function(evt) {
            node.formElement.onClick(evt, node);
          });
        }

        if (this.onKeyUp) {
          $(this.el).bind('keyup', function(evt) {
            node.onKeyUp(evt, node);
          });
        }
        if (this.view.onKeyUp) {
          $(this.el).bind('keyup', function(evt) {
            node.view.onKeyUp(evt, node);
          });
        }
        if (this.formElement.onKeyUp) {
          $(this.el).bind('keyup', function(evt) {
            node.formElement.onKeyUp(evt, node);
          });
        }

        if(node.filtersTree && !node.areFilterRendered) {
          $(node.el).before(node.filtersTree.root.el);

          node.areFilterRendered = true;
        }

        if (handlers) {
          _.each(handlers, function (handler, onevent) {
            if (onevent !== 'insert') {
              $(this.el).bind(onevent, function(evt) {
                handler(evt, node);
              });
            }
          }.bind(this));
        }

        if (this.schemaElement) {
          $(this.el).bind('change', function(evt) {
            var values = node.getFormValues();
            var nullableValue = jsonform.util.getObjByKey(values, node.key);

            // update valueHistory for all scalar fields (validate the field)
            if (jsonform.elementTypes[node.formElement.type].inputfield === true) {
              node.updateValueHistory(nullableValue, true);
            // update valueHistory for all non-scalar fields (do NOT validate the field)
            } else {
              // node.updateValueHistory(nullableValue);
            }
          });
        }
      }

      // Auto-update legend based on the input field that's associated with it
      if (this.formElement.legend && this.legendChild && this.legendChild.formElement) {
        $(this.legendChild.el).on('keyup', onLegendChildChange);
        $(this.legendChild.el).on('change', onLegendChildChange);
      }
    }

    // Recurse down the tree to enhance children
    _.each(this.children, function (child) {
      child.enhance();
    });
  };

  FormNode.prototype.markChildEventHandlersForUpdate = function() {
    ASSERT.ofTbType(this.children, 'array');

    for(var i = 0; i < this.children.length; i++) {
      this.children[i].mustUpdateEventHandlers = true;
    }
  }

  FormNode.prototype.lock = function() {
    if (this.formElement
      && !this.formElement.readOnly
      && jsonform.elementTypes[this.formElement.type].lock) {

      this.isLocked = true;
      jsonform.elementTypes[this.formElement.type].lock(this);
    }

    _.each(this.children, function(child) {
      child.lock();
    });
  };

  FormNode.prototype.unlock = function() {
    if (this.formElement
      && this.isLocked) {

      this.isLocked = false;
      jsonform.elementTypes[this.formElement.type].unlock(this);
    }

    _.each(this.children, function(child) {
      child.unlock();
    });
  };

  FormNode.prototype.handleFkeySearch = function() {
    ASSERT(this.expectingSearchValue === false, 'Another foreign key search is in progress.');

    var node = this;
    this.expectingSearchValue = true;

    displayLoadingAnimation(this.filtersTree.root.el);
    this.filtersTree.lock();

    $(jsonform.formTree.domRoot).trigger('search', {
      'node': this,
      'filters': this.filtersTree.root.getFormValues()
    });

    if (this.ownerTree.formDesc.form.enableFieldLockOnSearch) {
      this.lock();

      if (this.formElement.searchDurationMs >= 0) {
        setTimeout(function() {
          if (node.expectingSearchValue === true) {
            node.expectingSearchValue = false;

            node.unlock();
            node.filtersTree.unlock();
            removeLoadingAnimation(node.filtersTree.root.el);
          }
        }, this.formElement.searchDurationMs);
      }
    }
  }

  FormNode.prototype.setFkeyValues = function(values) {
    this.computeInitialValues(
      constructObjectByKey(this.key, values),
      {
        'ignoreSchemaDefaultValues': true,
        'shouldUpdateValueHistory': false
      }
    );

    if (this.ownerTree.formDesc.form.enableFieldLockOnSearch) {
      this.unlock();
    }

    this.expectingSearchValue = false;
    this.filtersTree.unlock();
    removeLoadingAnimation(this.filtersTree.root.el);

    this.render();
  }



  /**
   * Form tree class.
   *
   * Holds the internal representation of the form.
   * The tree is always in sync with the rendered form, this allows to parse
   * it easily.
   *
   * @class
   */
  var FormTree = function(formDesc, preserveParentSchema) {
    // TRACE('FormTree %s', arguments);

    this.eventhandlers = [];
    this.root = null;
    this.formDesc = null;
    this.initialize(formDesc, preserveParentSchema);
  };

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
  FormTree.prototype.initialize = function(formDesc, preserveParentSchema) {
    // TRACE('FormTree.prototype.initialize %s', arguments);

    formDesc = formDesc || {};

    escapeSchemaKeys(formDesc.schema);
    escapeValueKeys(formDesc.value);

    if (!preserveParentSchema) {
      jsonform.value = formDesc.value;
      jsonform.schema = formDesc.schema;
    }

    /**
     * parse the fields array and transform all shorthand notations
     * (string keys) to objects with a key property
     */
    _.each(formDesc.form.fields, function(element, index) {
      if (typeof element === 'string' && element !== '*') {
        formDesc.form.fields.splice(index, 1, {'key': element});
      }
    })

    // Keep a pointer to the initial JSONForm
    // (note clone returns a shallow copy, only first-level is cloned)
    this.formDesc = _.clone(formDesc);

    jsonform.defaultClasses = getDefaultClasses(this.formDesc.form.cssFramework
      || jsonform.cssFramework);
    this.defaultClasses = _.clone(jsonform.defaultClasses);

    if (this.formDesc.form.defaultClasses) {
      _.extend(this.defaultClasses, this.formDesc.form.defaultClasses);
    }

    // Compute form prefix if no prefix is given.
    this.formDesc.form.prefix = this.formDesc.form.prefix
      || 'tb-jf-' + _.uniqueId();

    // JSON schema shorthand
    if (this.formDesc.schema && !this.formDesc.schema.properties) {
      this.formDesc.schema = formDesc.schema;
    }

    this.formDesc._originalSchema = this.formDesc.schema;
    this.formDesc.schema = JSON.parse(JSON.stringify(this.formDesc.schema));

    // Ensure layout is set
    this.formDesc.form.fields = this.formDesc.form.fields || [
      '*'
    ];

    ASSERT.ofTbType(this.formDesc.form.fields, 'array', 'The form fields property must be an array.')

    this.formDesc.params = this.formDesc.params || {};

    // Create the root of the tree
    this.root = new FormNode();
    this.root.ownerTree = this;
    this.root.view = jsonform.elementTypes['root'];

    // Generate the tree from the form description
    this.buildTree();

    // this.computeGridLayoutWidth();

    this.initializeValidator();
    // Compute the values associated with each node
    // (for arrays, the computation actually creates the form nodes)
    this.computeInitialValues();
  };


  /**
   * Constructs the tree from the form description.
   *
   * The function must be called once when the tree is first created.
   *
   * @function
   */
  FormTree.prototype.buildTree = function() {
    // TRACE('FormTree.prototype.buildTree %s', arguments);

    // declare global defaults if none are specified
    this.formDesc.form.originalLocale = this.formDesc.form.originalLocale || 'untranslated';

    this.formDesc = _.merge({
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
        isSearchable: false,
        isMultilanguage: false,
        isTranslated: false,
        isStrict: true,
        isDebug: false,
        maxLength: 1000,
        minLength: 0,
        minItems: 0,
        maxItems: 1000000,
        searchableLimit: 100,
        searchDurationMs: 5000,
        minimum: Number.MIN_VALUE,
        maximum: Number.MAX_VALUE,
        exclusiveMinimum: false,
        exclusiveMaximum: false,
        deprecatedValue: '! ',
        maxDate: '2017-01-01',
        minDate: '1900-01-01',
        localeTabs: true,
        enableSorting: true,
        enableAddingItems: true,
        enableDeletingItems: true,
        enableFieldLockOnSearch: true,
        uniqueItems: true,
        displaySystemButtonsLabels: true,
        displayCompressedTables: false
      },
      locales: [this.formDesc.originalLocale]
    }, this.formDesc);

    ASSERT_PEER.ofTbType(this.formDesc.form.gridLayout, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.required, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.hideErrors, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.validate, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.liveValidation, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.preview, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.readOnly, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.isSearchable, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.isMultilanguage, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.isTranslated, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.isStrict, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.isDebug, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.enableAddingItems, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.enableDeletingItems, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.uniqueItems, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.enableReset, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.enableUndo, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.enableRedo, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.enableFieldLockOnSearch, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.displaySystemButtonsLabels, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.displayCompressedTables, 'boolean');

    ASSERT_PEER.ofTbType(this.formDesc.form.minItems, 'number');
    ASSERT_PEER.ofTbType(this.formDesc.form.maxItems, 'number');
    ASSERT_PEER.ofTbType(this.formDesc.form.minLength, 'number');
    ASSERT_PEER.ofTbType(this.formDesc.form.maxLength, 'number');
    ASSERT_PEER.ofTbType(this.formDesc.form.searchableLimit, 'number');
    ASSERT_PEER.ofTbType(this.formDesc.form.searchDurationMs, 'number');
    ASSERT_PEER(this.formDesc.form.searchableLimit >= 0);
    ASSERT_PEER(this.formDesc.form.minLength >= 0);
    ASSERT_PEER(this.formDesc.form.maxLength >= this.formDesc.form.minLength);

    ASSERT_PEER.ofTbType(this.formDesc.form.minimum, 'number');
    ASSERT_PEER.ofTbType(this.formDesc.form.maximum, 'number');
    ASSERT_PEER(this.formDesc.form.maximum >= this.formDesc.form.minimum);
    ASSERT_PEER.ofTbType(this.formDesc.form.exclusiveMinimum, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.exclusiveMaximum, 'boolean');

    ASSERT_PEER.ofTbType(this.formDesc.form.deprecatedValue, 'string');
    ASSERT_PEER.ofTbType(this.formDesc.form.maxDate, 'string');
    ASSERT_PEER.ofTbType(this.formDesc.form.minDate, 'string');

    ASSERT_PEER.ofTbType(this.formDesc.locales, 'array');
    ASSERT_PEER(this.formDesc.locales.length === _.uniq(this.formDesc.locales).length, 'All members of locales must be unique.');
    ASSERT_PEER.ofTbType(this.formDesc.form.localeTabs, 'boolean');
    ASSERT_PEER.ofTbType(this.formDesc.form.enableSorting, 'boolean');

    // Parse and generate the form structure based on the elements encountered
    _.each(this.formDesc.form.fields, function (formElement) {
      // construct a form using every single schema element except
      // the private properties jsonformVersion and id
      // and any non-default form items (only used for the "other" field in the checkbox element type)
      var child = null;

      if (formElement === '*') {
        // make sure that the keys are in alphabetical order to guarantee the same ordering every time.
        // This is needed as the order of elements is not guaranteed in objects/hashes.
        // If a specific order must be used the form.fields array must specify it.
        _.each(Object.keys(this.formDesc.schema.properties).sort(), function(key) {

          if (key === 'jsonformVersion'
            || key === 'id'
            || (this.formDesc.form.nonDefaultFormItems
              && this.formDesc.form.nonDefaultFormItems.indexOf(key) >= 0)) {

            return;
          }

          child = this.buildFromLayout({
            key: key
          });

          if (child) {
            this.root.appendChildNode(child);
          }

        }.bind(this));
      // convert all strings to valid form members
      // form ['schemaKey'] => form [{key: 'schemaKey'}]
      } else {
        if (_.isString(formElement)) {
          formElement = {
            key: formElement
          };
        }

        child = this.buildFromLayout(formElement);
        if (child) {
          this.root.appendChildNode(child);
        }
      }
    }.bind(this));

    if (this.formDesc.form.gridLayout === true
      && this.root.children.length > 0) {

      this.computeGridLayoutWidth(this.root.children);
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
  FormTree.prototype.buildFromLayout = function(formElement, formElementParent) {
    // TRACE('FormTree.prototype.buildFromLayout %s', arguments);

    var schemaElement = null;
    var node = new FormNode();
    var view = null;
    var key = null;

    // XXX: we now support setup formElement for specific key by customFormItems
    if (formElement.key && this.formDesc.form.customFormItems) {
      var formEl = this.formDesc.form.customFormItems[formElement.key];

      if (formEl !== undefined) {
        formEl.key = formElement.key;
        formElement = formEl;
      }
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

    /**
     * The form element is directly linked to an element in the JSON
     * schema. The properties of the form element override those of the
     * element in the JSON schema. Properties from the JSON schema complete
     * those of the form element otherwise.
     */
    if (formElement.key) {

      // Retrieve the element from the JSON schema
      schemaElement = getSchemaByKey(
        this.formDesc.schema,
        formElement.key
      );

      var parentSchema = getParentSchemaByKey(this.formDesc, formElement.key);

      if (schemaElement && schemaElement.isSkipped === true) {
        return;
      }

      ASSERT_PEER(schemaElement, 'The form element %s references the schema key %s but that key does not exist in the JSON schema', formElement, formElement.key);

      // TODO: make a decision regarding the inheritance of limits & options, who defines the input type ...
      /*
       * the locale fields which were generated from the additional properties object of their parentSchema
       * have an empty formElement. They will inherit the global defaults, but other properties can be set
       * in the additionalProperties object of the translatable field.
       */
      if (parentSchema && parentSchema.isMultilanguage === true && formElementParent) {
        // some formElement properties should not be inherited (id, name...) therefore we whitelist only the ones we need
        var self = this;
        var propertyArray = [
          'title', 'legend', 'description', 'legend',
          'append', 'prepend', 'helpvalue', 'placeholder',
          'required', 'readOnly', 'preview',
          'minLength', 'maxLength', 'minDate', 'maxDate'
        ];

        if (contains(schemaElement.type, 'number')
          || contains(schemaElement.type, 'integer')) {

          propertyArray.splice(0, 0, 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum');
        };

        // in case no "type" is specified in the additionalProperties object in the form
        // use the type of the parent element
        if (formElementParent.additionalProperties
          && isSet(formElementParent.additionalProperties.type)) {

          propertyArray.splice(0, 0, 'type');
        } else {
          // TODO deprecate and rely only on additionalProperties
          formElement.type = formElementParent.parentType;
        }

        _.each(propertyArray, function (property) {
          if (self.formDesc && isSet(self.formDesc[property])) {
            formElement[property] = self.formDesc[property]
          } else if (parentSchema.additionalProperties[property]) {
            formElement[property] = parentSchema.additionalProperties[property]
          } else {
            formElement[property] = undefined;
          }

          if (formElementParent.additionalProperties
            && isSet(formElementParent.additionalProperties[property])) {

            formElement[property] = formElementParent.additionalProperties[property]
              || formElement[property];
          }
        });

        if (!formElementParent.localeTabs) {
          formElement.title = formElement.title + ' ' + schemaElement.legend;
        }
      };

      formElement.name = formElement.name || formElement.key;
      formElement.name = _.escape(formElement.name);
      formElement.title = formElement.title || schemaElement.title;
      formElement.title = _.escape(formElement.title);
      formElement.description = formElement.description || schemaElement.description;
      formElement.description = _.escape(formElement.description);
      formElement.legend = formElement.legend || schemaElement.legend;
      formElement.legend = _.escape(formElement.legend);

      if (this.formDesc.form.isStrict === false) {
        formElement.title = formElement.title || formElement.name;
      } else {
        ASSERT_PEER.ofTbType(formElement.title, 'string', 'Error while building form: every schema element must have a title.');
        ASSERT_PEER(formElement.title.length >= 1, 'Every field must have a title, but schema element %s does not have one.', formElement.key);
      }

      ASSERT_PEER.ofTbType(formElement.name, 'string', 'Error while building form: name must be a string.');
      ASSERT_PEER.ofTbType(formElement.description, 'undefined|string', 'Error while building form: description must be either string or undefined.');
      ASSERT_PEER.ofTbType(formElement.legend, 'undefined|string', 'Error while building form: legend must be either string or undefined.');

      schemaElement.minLength = formElement.minLength = formElement.minLength || schemaElement.minLength || this.formDesc.form.minLength;
      schemaElement.maxLength = formElement.maxLength = formElement.maxLength || schemaElement.maxLength || this.formDesc.form.maxLength;

      formElement.isSearchable = formElement.isSearchable || this.formDesc.form.isSearchable;
      formElement.searchableLimit = formElement.searchableLimit || this.formDesc.form.searchableLimit;

      formElement.displaySystemButtonsLabels = formElement.displaySystemButtonsLabels || this.formDesc.form.displaySystemButtonsLabels;

      ASSERT_PEER.ofTbType(formElement.isSearchable, 'boolean', 'Error while building form: isSearchable must be boolean.');
      ASSERT_PEER.ofTbType(formElement.searchableLimit, 'number', 'Error while building form: searchableLimit must be a valid number.');
      ASSERT_PEER.ofTbType(formElement.maxLength, 'number', 'Error while building form: maxItems must be a valid number.');
      ASSERT_PEER.ofTbType(formElement.minLength, 'number', 'Error while building form: minItems must be a valid number.');
      ASSERT_PEER(formElement.minLength >= 0, 'Error while building form: minLength must be a valid number.');
      ASSERT_PEER.ofTbType(formElement.displaySystemButtonsLabels, 'boolean', 'Error while building form: isSearchable must be boolean.');

      /**
       * validate numeric schema fields
       */
      if (contains(schemaElement.type, 'integer')
        || contains(schemaElement.type, 'number')) {

        schemaElement.minimum = formElement.minimum = formElement.minimum || schemaElement.minimum || this.formDesc.form.minimum;
        schemaElement.maximum = formElement.maximum = formElement.maximum || schemaElement.maximum || this.formDesc.form.maximum;

        schemaElement.exclusiveMinimum = formElement.exclusiveMinimum = formElement.exclusiveMinimum
          || schemaElement.exclusiveMinimum || this.formDesc.form.exclusiveMinimum;
        schemaElement.exclusiveMaximum = formElement.exclusiveMaximum = formElement.exclusiveMaximum
          || schemaElement.exclusiveMaximum || this.formDesc.form.exclusiveMaximum;

        ASSERT_PEER.ofTbType(formElement.exclusiveMinimum, 'boolean', 'Error while building form: exclusiveMinimum must be a valid number.');
        ASSERT_PEER.ofTbType(formElement.exclusiveMaximum, 'boolean', 'Error while building form: exclusiveMaximum must be a valid number.');
        ASSERT_PEER.ofTbType(formElement.minimum, 'number', 'Error while building form: minimum must be a valid number.');
        ASSERT_PEER.ofTbType(formElement.maximum, 'number', 'Error while building form: maximum must be a valid number.');
        ASSERT_PEER(formElement.maximum >= formElement.minimum, 'Error while building form: maximum must be higher than minimum.');
      }

      /**
       * validate array schema fields
       */
      if (contains(schemaElement.type, 'array')) {
        var schemaArrayLimits = {
          minItems: schemaElement.minItems,
          maxItems: schemaElement.maxItems,
          enableAddingItems: schemaElement.enableAddingItems,
          enableDeletingItems:schemaElement.enableDeletingItems,
          enableSorting: schemaElement.enableSorting,
          uniqueItems: schemaElement.uniqueItems
        };

        var globalArrayLimits = {
          minItems: this.formDesc.form.minItems,
          maxItems: this.formDesc.form.maxItems,
          enableAddingItems: this.formDesc.form.enableAddingItems,
          enableDeletingItems: this.formDesc.form.enableDeletingItems,
          enableSorting: this.formDesc.form.enableSorting,
          uniqueItems: this.formDesc.form.uniqueItems
        };

        _.defaults(formElement, schemaArrayLimits, globalArrayLimits, formElement);

        ASSERT_PEER.ofTbType(formElement.minItems, 'number', 'Error while building form: array minItems must be a number.');
        ASSERT_PEER(formElement.minItems >= 0, 'Error while building form: arrays cannot have a negative number of items');
        ASSERT_PEER.ofTbType(formElement.maxItems, 'number', 'Error while building form: array maxItems must be a number.');
        ASSERT_PEER(formElement.maxItems >= formElement.minItems, 'Error while building form: array minItems must be less or euqal to maxItems.');
        ASSERT_PEER.ofTbType(formElement.enableDeletingItems, 'boolean', 'Error while building form: array enableDeletingItems must be boolean.');
        ASSERT_PEER.ofTbType(formElement.enableAddingItems, 'boolean', 'Error while building form: array enableAddingItems must be boolean.');
        ASSERT_PEER.ofTbType(formElement.uniqueItems, 'boolean', 'Error while building form: array uniqueItems must be boolean.');
        ASSERT_PEER.ofTbType(this.formDesc.form.enableSorting, 'boolean', 'Error while building form: array enableSorting must be boolean.');
      }

      formElement.minDate = formElement.minDate || schemaElement.minDate || this.formDesc.form.minDate;
      formElement.maxDate = formElement.maxDate || schemaElement.maxDate || this.formDesc.form.maxDate;

      var minDateTimestamp = Date.parse(TB.normalizeDate(formElement.minDate));
      var maxDateTimestamp = Date.parse(TB.normalizeDate(formElement.maxDate));

      // if both dates cannot be converted to unix time
      // it possibly consists of no date part and a time part (T10:04:45)
      if (isNaN(minDateTimestamp) &&  isNaN(minDateTimestamp) && window.moment) {
        minDateTimestamp = moment(formElement.minDate);
        minDateTimestamp = moment(formElement.minDate);
      }

      if (isNaN(minDateTimestamp) && window.moment) {
        maxDateTimestamp = moment(formElement.maxDate)
      }

      ASSERT_PEER(isNaN(maxDateTimestamp) === false, 'Error while building form: minDate is not a valid date.');
      ASSERT_PEER(isNaN(minDateTimestamp) === false, 'Error while building form: minDate is not a valid date.');
      ASSERT_PEER(maxDateTimestamp >= minDateTimestamp, 'Error while building form: maxDate cannot be smaller than formElement.minDate.');

      /*
       * Expand the schema element of multilanguage fields
       */
      if (schemaElement.isMultilanguage === true) {
        formElement.localeTabs = isSet(formElement.localeTabs) ? formElement.localeTabs : this.formDesc.form.localeTabs;

        ASSERT_PEER(!schemaElement.properties, 'Multilanguage fields use additionalProperties as template; the properties object must be empty.');
        ASSERT_PEER(schemaElement.type === 'object', 'Only objects with child templates specified in additionalProperties can become translated fields.');
        ASSERT_PEER.ofTbType(formElement.localeTabs, 'boolean', 'formElement.localeTabs is not valid.');

        schemaElement.properties = {};
        for (var i = 0, j = this.formDesc.locales.length - 1; i <= j; i++) {
          schemaElement.properties[this.formDesc.locales[i]] = _.clone(schemaElement.additionalProperties, true);
          schemaElement.properties[this.formDesc.locales[i]].legend = this.formDesc.locales[i];
        };

        // if a type is specified for the parent element keep it and use it for its' children
        formElement.parentType = formElement.type;

        // TODO this shouldn't be here
        if (formElement.localeTabs) {
          formElement.type = 'tabobject';
        } else {
          formElement.type = 'fieldset';
        }
      }

      var doesNotAllowNull = !contains(schemaElement.type, 'null');
      var isScalar = !contains(schemaElement.type, 'array')
        && !contains(schemaElement.type, 'object');

      formElement.required = formElement.required
        || isRequiredField(formElement.key, parentSchema)
        || this.formDesc.form.required
        || (doesNotAllowNull && isScalar);


      // inherited the preview property from parent form elements
      if (formElementParent) {
        if (formElementParent.key) {
          var parentKey = formElementParent.key;
          var grandparentSchema = getParentSchemaByKey(this.formDesc, parentKey);
        }

        formElement.preview = formElement.preview || formElementParent.preview || this.formDesc.form.preview;
      } else {
        formElement.preview = formElement.preview || this.formDesc.form.preview;
      }

      schemaElement.readOnly = formElement.readOnly = formElement.readOnly
        || schemaElement.readOnly || this.formDesc.form.readOnly || formElement.preview;

      /**
       * inherit the readOnly properties from parent schema object
       * update the schema in case the element is required
       */
      if (parentSchema) {
        schemaElement.readOnly = formElement.readOnly = formElement.readOnly
          || parentSchema.readOnly || formElement.preview || this.formDesc.form.readOnly;

        if (schemaElement.readOnly) {
          formElement.required = false;
        }

        /**
         * Schema validators often cannot parse the absolute path to the child.
         * Give them a relative path instead.
         */
        var propertyKey = formElement.key.split('/').pop();

        if (formElement.required && !schemaElement.readOnly) {
          if (parentSchema.required && _.isArray(parentSchema.required)) {
            if (parentSchema.required.indexOf(propertyKey) === -1) {
              parentSchema.required.push(propertyKey)
            }
          } else {
            parentSchema.required = [propertyKey];
          }
        } else {
          if (parentSchema.required && _.isArray(parentSchema.required)) {
            if (parentSchema.required.indexOf(propertyKey) >= 0) {
              parentSchema.required.pop(propertyKey)

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
      }

      /**
       * all readOnly fields are not required so that if a field is emty and readOnly
       * the user won't be prevented from submitting the form
       */
      if (schemaElement.readOnly) {
        formElement.required = false;
      }

      ASSERT_PEER.ofTbType(formElement.preview, 'boolean', 'Error while building form: preview must be a boolean.');
      ASSERT_PEER.ofTbType(formElement.readOnly, 'boolean', 'Error while building form: readOnly must be a boolean.');

      // json schema version 4
      if (_.isArray(formElement.required)) {
        ASSERT_PEER(!TB.isEmpty(formElement.required), 'Error while building form: required must be a non-empty array.');
      } else {
        ASSERT_PEER.ofTbType(formElement.required, 'boolean', 'Error while building form: required must be a boolean.');
      }

      /**
       * If the form element does not define a type for the fields
       * try to find the best possible visualization using the given schema element
       */
      if (!formElement.type) {
        if (contains(schemaElement.type, 'string')
          && (schemaElement.format === 'color')) {

          formElement.type = 'color';
        } else if ((contains(schemaElement.type, 'number') || contains(schemaElement.type, 'integer'))
          && !schemaElement['enum']) {

          formElement.type = 'number';
        } else if (contains(schemaElement.type, 'string')
          && schemaElement.maxLength > 1000) {

          formElement.type = 'textarea';
        } else if ((contains(schemaElement.type, 'string') || contains(schemaElement.type, 'any'))
          && !schemaElement['enum']) {

          formElement.type = 'text';
        } else if (contains(schemaElement.type, 'boolean')) {
          formElement.type = 'checkbox';
        } else if (contains(schemaElement.type, 'object')) {
          if (schemaElement.properties) {
            if (Object.keys(schemaElement.properties).length > 1) {
              formElement.type = 'tabobject';
            } else {
              formElement.type = 'fieldset';
            }
          } else {
            formElement.type = 'textarea';
          }
        } else if (contains(schemaElement.type, 'array')
          && schemaElement.items
          && !_.isUndefined(schemaElement.items['enum'])) {

          formElement.type = 'multipleselect';
        } else if (!_.isUndefined(schemaElement['enum'])) {
          formElement.type = 'select';
        } else if (jsonform.util.typeof(schemaElement.type) === 'string') {
          formElement.type = schemaElement.type;
        } else if (jsonform.util.typeof(schemaElement.type) === 'array') {
          if (contains(schemaElement.type, 'array')) {
            formElement.type = 'array';
          } else if (contains(schemaElement.type, 'string')) {
            formElement.type = 'text';
          } else if (contains(schemaElement.type, 'number')
            || contains(schemaElement.type, 'integer')) {

            formElement.type = 'number';
          } else {
            formElement.type = schemaElement.type[0];
          }
        }
      }

      /**
       * validate foreign key fields
       */
      ASSERT_PEER.ofTbType(
        schemaElement.isForeignKey,
        'boolean|undefined',
        'Error while building form: isForeignKey is of unrecognized type for schema key %s',
        formElement.key
      );
      ASSERT_PEER.ofTbType(
        formElement.searchableLimit,
        'number',
        'Error while building form: searchableLimit is of unrecognized type for schema key %s',
        formElement.key
      );

      if (schemaElement.isForeignKey) {
        ASSERT_PEER(
          jsonform.elementTypes[formElement.type].isSearchableField === true,
          'Error while building form: foreign key field %s has an invalid schema type %s (only select-like fields are valid)',
          formElement.key,
          formElement.type
        );

        ASSERT_PEER.ofTbType(
          schemaElement.filterSchema,
          'object',
          'Error while building form: filterSchema is of unrecognized type for schema key %s',
          formElement.key
        );

        ASSERT_PEER(
          !TB.isEmpty(schemaElement.filterSchema),
          'Error while building form: filterSchema is empty schema key %s',
          formElement.key
        );

        ASSERT_PEER.ofTbType(
          schemaElement.searchableValues,
          'array|undefined',
          'Error while building form: searchableValues is of unrecognized type for schema key %s',
          formElement.key
        );
      }

      if (schemaElement.isForeignKey === true
        && jsonform.elementTypes[formElement.type].isSearchableField) {

        formElement.searchDurationMs = formElement.searchDurationMs
          ? formElement.searchDurationMs
          : this.formDesc.form.searchDurationMs;

        ASSERT.ofTbType(formElement.searchDurationMs, 'number', 'searchDurationMs must be a number');

        // access filterSchema using getSchemaKey in order to resolve $refs
        var schema = getSchemaByKey(
          this.formDesc.schema,
          formElement.key + '/filterSchema'
        );

        var schemaFilterKeysEnum = [];

        _.each(Object.keys(schema), function(key) {
          // keep only the fields which were specified as searchable
          if (!schema[key].properites
            && !schema[key].items) {

            if (schema[key].isSearchable === true) {
              // filterSchema.properties[key] = schema[key];

              schemaFilterKeysEnum.push(key);
            }
          } else {
            //TODO add 2 or more level foreign key search
            // by creating a flat structure containign every single property
            if (schema[key].items) {

            } else if (schema[key].properties) {

            }
          }
        });

        var updateSearchResult = function(value) {
          node.computeInitialValues(
            constructObjectByKey(node.key, value),
            {
              'ignoreSchemaDefaultValues': true,
              'shouldUpdateValueHistory': false
            }
          );

          node.unlock();
          node.render(node.el);
        };

        // construct a new tree consisting only of the elements in filterSchema
        var filtersTree = new FormTree({
          schema: {
            'id': formElement.key + '/filterSchema',
            'type': 'object',
            'properties': {
              'filtersArray': {
                'type': 'array',
                'title': 'filters for ' + formElement.title,
                'enableDeletingItems': true,
                'enableAddingItems': true,
                'enableSorting': true,
                'items': {
                  'type': 'object',
                  'title': 'filters for ' + formElement.title,
                  'properties': {
                    'filter': {
                      'type': 'string',
                      'title': 'filter',
                      'enum': schemaFilterKeysEnum
                    },
                    'operator': {
                      'type': 'string',
                      'title': 'operator',
                      'enum': ['=']
                    },
                    'value': {
                      'type': 'string',
                      'title': 'search value'
                    }
                  }
                }
              }
            }
          },
          form: {
            schemaId: formElement.key + '/filterSchema',
            isStrict: false,
            jsonformVersion: '2.0',
            fields: [
              {
                'type': 'fieldset',
                'expandable': true,
                'title': 'search',
                'items': [
                  {
                    'key': 'filtersArray',
                    'type': 'table',
                    'enableSorting': false,
                    'enableDeletingItems': true,
                    'enableAddingItems': true,
                    'disableTableBorder': true,
                    'displayCompressedTables': true,
                    'items': {
                      'type': 'tablerow',
                      'items': [
                        {
                          'title': 'Filter name',
                          'key': 'filtersArray[]/filter',
                          'type': 'select'
                        },
                        {
                          'title': 'Operator',
                          'key': 'filtersArray[]/operator',
                          'type': 'select'
                        },
                        {
                          'title': 'Search value',
                          'key': 'filtersArray[]/value',
                          'type': 'text'
                        }
                      ]
                    }
                  },
                  {
                    'type': 'button',
                    'title': 'search',
                    'buttonSize': 'small',
                    'buttonType': 'primary',
                    'buttonIcon': 'search',
                    'buttonStyle': 'justified',
                    'onClick': function() {
                      node.handleFkeySearch();
                    }
                  }
                ]
              }
            ]
          },
          validator: this.formDesc.validator
        }, true);

        var filtersDomRoot = $('<div>');
        filtersTree.render(filtersDomRoot);
        $(filtersTree.root.el).addClass('tb-jf-filters');

        node.filtersTree = filtersTree;
        node.expectingSearchValue = false;
      }

      ASSERT_PEER(jsonform.elementTypes[formElement.type], 'The specified element type is undefined');

      /**
       * add value history buttons to the current scalar fields
       */
      if (jsonform.elementTypes[formElement.type].inputfield) {
        // TODO extend a local object and call _.defaults only once per input
        // not once for each form property
        var globalHistoryControls = {
          enableReset: this.formDesc.form.enableReset,
          enableRedo: this.formDesc.form.enableRedo,
          enableUndo: this.formDesc.form.enableUndo
        };

        _.defaults(formElement, globalHistoryControls, formElement);
      }

      // Compute the ID of the input field
      if (!formElement.id) {
        formElement.id = escapeSelector(this.formDesc.form.prefix)
          + '-elt-'
          + formElement.key;
      }

      if (formElement.preview
        && jsonform.elementTypes[formElement.type].inputfield) {

        formElement.type = 'preview';
      }

      var prepareOptions = function(formElement, enumValues) {
        if (formElement.options) {
          if (Array.isArray(formElement.options)) {
            formElement.options = formElement.options.map(function(value) {
              return _.has(value, 'value') ? value : {
                value: value,
                title: value
              };
            });
          } else if (typeof formElement.options === 'object') {
            // titleMap like options
            formElement.options = Object.keys(formElement.options).map(function(value) {
              return {
                value: value,
                title: formElement.options[value]
              };
            });
          }
        } else if (formElement.titleMap) {
          formElement.options = _.map(enumValues, function (value) {
            var title = value.toString();
            return {
              value: value,
              title: _.has(formElement.titleMap, title) ? formElement.titleMap[title] : title
            };
          });
        } else if (schemaElement.enumNames
          || (schemaElement.items && schemaElement.items.enumNames)) {

          var enumNames = schemaElement.enumNames
            || (schemaElement.items && schemaElement.items.enumNames);

          ASSERT_PEER(
            enumNames.length === enumValues.length,
            'Schema enum and enumNames must have the same length.'
          );

          formElement.options = _.map(enumValues, function (value, index) {
            var title = enumNames[index];

            ASSERT_PEER.ofTbType(title, 'string', 'Invalid enumNames title', title);

            return {
              value: value,
              title: title
            };
          });
        } else {
          formElement.options = enumValues.map(function(value) {
            return {
              value: value,
              title: value.toString()
            };
          });
        }
      }

      // Unless overridden in the definition of the form element (or unless
      // there's a titleMap defined), use the enumeration list defined in
      // the schema
      if (formElement.options) {
        // FIXME: be careful certin type of form elements may have special format for options
        prepareOptions(formElement);
      } else if (schemaElement['enum']
        || (schemaElement.items && schemaElement.items['enum'])
        || contains(schemaElement.type, 'boolean')) {

        var schemaEnum = null;
        var itemsEnum = null;
        var self = this;

        if (schemaElement['enum']) {
          schemaEnum = schemaElement['enum'];

          // validate all enum elements
          _.each(schemaEnum, function(value) {
            jsonform.util.validateValueType(
              formElement.key,
              schemaElement,
              formElement,
              self.formDesc.form.isStrict,
              value,
              true
            )
          });

          if (schemaElement['enumNames']) {
            ASSERT_PEER(
              schemaElement['enum'].length === schemaElement['enumNames'].length,
              'Schema enum and enumNames must have the same length.'
            );
          }
        }

        if (schemaElement.items && schemaElement.items['enum']) {
          itemsEnum = schemaElement.items['enum'];

          // validate all enum elements
          _.each(itemsEnum, function(value) {
            jsonform.util.validateValueType(
              formElement.key,
              schemaElement.items,
              formElement,
              self.formDesc.form.isStrict,
              value,
              true
            )
          });

          if (schemaElement.items['enumNames']) {
            ASSERT_PEER(
              schemaElement.items['enum'].length === schemaElement.items['enumNames'].length,
              'Schema enum and enumNames must have the same length.'
            );
          }
        }

        ASSERT_PEER(
          Boolean(schemaEnum && itemsEnum) === false,
          'Invalid Schema: Schema elements cannot have more than 1 enum. A schema element\
           with key %s contains enums in its\' body and in its\' items object',
          formElement.key
        );

        var enumValues = schemaEnum || itemsEnum;

        if (!enumValues) {
          enumValues = [true, false];
        }

        prepareOptions(formElement, enumValues);
      }

      // Flag a list of checkboxes with multiple choices
      if ((formElement.type === 'checkboxes' || formElement.type === 'checkboxbuttons')
        && schemaElement.items) {

        var theItem = (Array.isArray(schemaElement.items))
          ? schemaElement.items[0]
          : schemaElement.items;

        if (formElement.options) {
          // options only but no enum mode, since no enum, we can use only the value mode
          prepareOptions(formElement);
          theItem._jsonform_checkboxes_as_array = 'value';
        } else {
          var enumValues = theItem['enum'];

          if (enumValues) {
            prepareOptions(formElement, enumValues);
            theItem._jsonform_checkboxes_as_array = (formElement.type === 'checkboxes')
              ? true
              : 'value';
          }
        }
      }

      if (formElement.getValue === 'tagsinput') {
        schemaElement._jsonform_get_value_by_tagsinput = 'tagsinput';
      }

      /**
       * If the form element targets an "object" in the JSON schema,
       * we need to recurse through the list of children to create an
       * input field per child property of the object in the JSON schema
       */
      if (contains(schemaElement.type, 'object')
        && (!formElement.items || formElement.items.length === 0)) {

        _.each(schemaElement.properties, function (prop, propName) {

          var key = formElement.key + '/' + propName;

          if (this.formDesc.form.nonDefaultFormItems
            && this.formDesc.form.nonDefaultFormItems.indexOf(key) >= 0) {

            return;
          }

          var child = this.buildFromLayout({
            key: key
          }, formElement);

          if (child) {
            node.appendChildNode(child);
          }
        }.bind(this));
      }

      ASSERT_PEER(
        jsonform.elementTypes[formElement.type],
        'The JSONForm contains an unknown form type %s for schema key %s',
        formElement.type,
        formElement.key
      );
    } else {
      formElement.enableSorting = (isSet(formElement.enableSorting))
        ? formElement.enableSorting
        : this.formDesc.form.enableSorting;

      formElement.enableAddingItems = (isSet(formElement.enableAddingItems))
        ? formElement.enableAddingItems
        : this.formDesc.form.enableAddingItems;

      formElement.enableDeletingItems = (isSet(formElement.enableDeletingItems))
        ? formElement.enableDeletingItems
        : this.formDesc.form.enableDeletingItems;

      formElement.displaySystemButtonsLabels = (isSet(formElement.displaySystemButtonsLabels))
        ? formElement.displaySystemButtonsLabels
        : this.formDesc.form.displaySystemButtonsLabels;

      formElement.locales = (isSet(formElement.locales))
        ? formElement.locales
        : this.formDesc.locales;

      formElement.localeTabs = (isSet(formElement.localeTabs))
        ? formElement.localeTabs
        : this.formDesc.form.localeTabs;

      formElement.gridLayout = (isSet(formElement.gridLayout))
        ? formElement.gridLayout
        : this.formDesc.form.gridLayout;

      if (formElement.type === 'table') {
        formElement.displayCompressedTables = (isSet(formElement.displayCompressedTables))
          ? formElement.displayCompressedTables
          : this.formDesc.form.displayCompressedTables;

        ASSERT_PEER.ofTbType(formElement.displayCompressedTables, 'boolean');
      }

      ASSERT_PEER.ofTbType(this.formDesc.locales, 'array');
      ASSERT_PEER(this.formDesc.locales.length === _.uniq(this.formDesc.locales).length, 'All members of locales must be unique.');
      ASSERT_PEER.ofTbType(this.formDesc.form.localeTabs, 'boolean');
      ASSERT_PEER.ofTbType(this.formDesc.form.enableSorting, 'boolean');
      ASSERT_PEER(jsonform.elementTypes[formElement.type], 'The JSONForm contains an element whose type is unknown: %s', formElement.type);


      /* The form element is not linked to an element in the schema.
       * This means the form element must be a "container" element,
       * and must not define an input field.
       * selectfieldset is an exception because it has an inputfield but it does not return its value
       * it is used just for selecting the right element in the container
       */
      // TODO use a property from the element definition instead (allowed schema types)
      var isInputField = jsonform.elementTypes[formElement.type].inputfield
        && (formElement.type !== 'selectfieldset');

      // convert undefined and null values to false to match the strict equality (===) of the assert
      isInputField = (isInputField)
        ? isInputField
        : false;

      ASSERT(
        isInputField === false,
        'The JsonForm defines an element of type %s but no "key" property to link the input field\
         to the JSON schema.',
        formElement.type
      );
    }

    if (!formElement.type) {
      formElement.type = 'text';
    }

    ASSERT(
      jsonform.elementTypes[formElement.type],
      'The JSONForm contains an element whose type is unknown: %s',
      formElement.type
    );

    /**
     * make sure that the schema type is supported by the plugin which visualize it
     */
    if (schemaElement) {
      ASSERT(
        jsonform.elementTypes[formElement.type].compatibleTypes.length >= 1,
        'no compatibleTypes for form:%s with key %s',
        formElement.type,
        formElement.key
      );

      if (jsonform.util.typeof(schemaElement.type) === 'array') {
        ASSERT(
          _.intersection(jsonform.elementTypes[formElement.type].compatibleTypes, schemaElement.type).length >= 1,
          'The schema element %s does not accept any of the allowed types for the form %s.',
          schemaElement.type,
          formElement.type
        );
      } else {
        ASSERT(
          jsonform.elementTypes[formElement.type].compatibleTypes.indexOf(schemaElement.type) >= 0,
          'The schema element %s does not accept any of the allowed types for the form %s.',
          schemaElement.type,
          formElement.type
        );
      }
    }

    // A few characters need to be escaped to use the ID as jQuery selector
    formElement.iddot = escapeSelector(formElement.id || '');

    // Initialize the form node from the form element and schema element
    node.formElement = formElement;
    node.schemaElement = schemaElement;
    node.view = jsonform.elementTypes[formElement.type];
    node.ownerTree = this;

    // Set event handlers
    if (!formElement.handlers) {
      formElement.handlers = {};
    }

    // Parse children recursively
    if (node.view.array) {
      // Do not create childTemplate until we first use it.
    } else if (formElement.items) {
      // The form element defines children elements
      _.each(formElement.items, function (item) {
        // if the form element is defined as a schema key string
        // construct a valid json
        if (_.isString(item)) {
          item = { key: item };
        }

        var child = this.buildFromLayout(item, formElement);
        if (child) {
          node.appendChildNode(child);
        }
      }.bind(this));

    // in case the element is a checkbox with a otherField property
    // construct a valid json form and build the form element
    } else if (formElement.otherField) {
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

    if (node.formElement
      && node.formElement.gridLayout === true
      && node.children
      && node.children.length > 0) {

      this.computeGridLayoutWidth(node.children);
    }

    return node;
  };


  FormTree.prototype.initializeValidator = function() {
    // TRACE('FormTree.prototype.initializeValidator %s', arguments);

    ASSERT(
      this.formDesc.validator.ajv.RULES,
      'The validator is not a valid instance of Ajv2tb.'
    );

    /**
     * add custom formats to ajv, so that they can be validated during the
     * json schema validation.
     */
    function addFormats (validator, formats) {
      validator.ajv.addFormat('name_lat_t', /^[A-Za-z0-9\s\-\.\,\@,\_\*\?\!]+$/);
      validator.ajv.addFormat('numeric', /^(\+|\-)?(\d+(\.\d+)?)$/);

      _.each(_.keys(formats), function(key, index) {
        ajv.addFormat(key, formats[key]);
      });
    }

    addFormats(this.formDesc.validator, {});

    this.formDesc.validator.ajv.removeSchema(this.formDesc.schema.id);
    this.formDesc.validator.ajv.compile(this.formDesc.schema);
  }

  FormTree.prototype.validate = function(settings) {
    // TRACE('FormTree.prototype.validate %s', arguments);

    var values = settings.values;
    var clearOldErrors = settings.clearOldErrors || false;
    var hideErrors = settings.hideErrors || false;
    var options = this.formDesc;
    var errors = false;

    if (options.form.validate !== false) {
      var validator = options.validator;

      ASSERT(validator.ajv.RULES, 'The validator is not a valid instance of Ajv2tb.');

      // clear all errors from the previous validation
      $(this.domRoot).jsonFormErrors(null, {'clearOldErrors': clearOldErrors});

      var valid = validator.validate(this.formDesc.schema.id, values);

      if (valid !== true) {
        errors = valid.validationErrors;
      }
    }

    if (errors && !hideErrors) {
      if (options.displayErrors) {
        options.displayErrors(errors, this.domRoot);
      } else {
        $(this.domRoot).jsonFormErrors(errors, {'clearOldErrors': clearOldErrors});
      }
    }

    return {"errors": errors, "values": values};
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
  FormTree.prototype.computeInitialValues = function() {
    // TRACE('FormTree.prototype.computeInitialValues %s', arguments);

    this.root.computeInitialValues(this.formDesc.value);
  };

  FormTree.prototype.computeGridLayoutWidth = function(children) {
    var rowWidth = {
      'full': 12,
      'half': 6,
      'third': 4,
      'quarter': 3,
      'sixth': 2
    }

    function computeChildWidth(children, totalWidth, widthProperty) {
      var childrenLength = children.length;
      var widthPadding = [];

      for(var i = 0, j = childrenLength; i < j; i++) {
        widthPadding[i] = 0;
      }

      var computeWidthPadding = function() {
        if (totalWidth < rowWidth.full) {
          var availableWidth = rowWidth.full - totalWidth;

          for(var i = 0; availableWidth > 0; i++) {
            widthPadding[i]++;
            availableWidth--;

            if(availableWidth) {
              widthPadding[childrenLength - 1 - i]++;
              availableWidth--;
            }
          }
        }
      }

      var applyRowWidth = function() {
        for(var i = 0, j = children.length; i < j; i++) {
          var nodeWidth;

          if (children[i].formElement.rowWidth) {
            nodeWidth = children[i].formElement.rowWidth;
          } else {
            nodeWidth = children[i].view[widthProperty];
          }

          children[i].rowWidth = rowWidth[nodeWidth] + widthPadding[i];
        }
      }

      computeWidthPadding();
      applyRowWidth();
    }

    function computeTotalRowWidth(children) {
      var totalMaxRowWidth = 0;
      var totalMinRowWidth = 0;
      var minNodeWidth = [];

      for(var i = 0, j = children.length; i < j; i++) {
        if (children[i].formElement.rowWidth) {
          var formElementWidth = rowWidth[children[i].formElement.rowWidth];

          ASSERT.ofTbType(formElementWidth, 'number');
          ASSERT(formElementWidth >= rowWidth.sixth);
          ASSERT(formElementWidth <= rowWidth.full);

          totalMaxRowWidth += formElementWidth;
          totalMinRowWidth += formElementWidth;
          minNodeWidth.push(formElementWidth);
        } else {
          totalMaxRowWidth += rowWidth[children[i].view.maxRowWidth];
          totalMinRowWidth += rowWidth[children[i].view.minRowWidth];
          minNodeWidth.push(rowWidth[children[i].view.minRowWidth]);
        }
      }

      if (totalMaxRowWidth <= rowWidth.full) {
        computeChildWidth(children, totalMaxRowWidth, 'maxRowWidth');
      } else if (totalMinRowWidth <= rowWidth.full) {
        computeChildWidth(children, totalMinRowWidth, 'minRowWidth');
      } else {
        splitRow(children, minNodeWidth);
      }
    }

    function splitRow(children, minNodeWidth) {
      ASSERT(children.length === minNodeWidth.length);

      var subrow = [];
      var totalSubrowWidth = 0;

      if (children.length === 1) {
        computeTotalRowWidth(children);
      } else {
        for(var i = 0, j = minNodeWidth.length; i <= j; i++) {

          if (totalSubrowWidth === rowWidth.full
            || totalSubrowWidth + minNodeWidth[i] > rowWidth.full
            || i === j) {

            computeTotalRowWidth(subrow);

            subrow = [];
            totalSubrowWidth = 0;
          } else {
            subrow.push(children[i]);
            totalSubrowWidth += minNodeWidth[i];
          }
        }
      }
    }

    computeTotalRowWidth(children);
  }


  /**
   * Renders the form tree
   *
   * @function
   * @param {Node} domRoot The "form" element in the DOM tree that serves as
   *  root for the form
   */
  FormTree.prototype.render = function(domRoot) {
    // TRACE('FormTree.prototype.render %s', arguments);

    if (!domRoot) {
      return;
    }

    this.domRoot = domRoot;
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
        '<fieldset class="tb-jf-fieldset-header expandable">'
        + '<legend class="tb-jf-legend">'
        + 'view source'
        + '</legend>'
        + '<div class="tb-jf-plain-fieldset tb-jf-hide" hidden="hidden">'
        + '<textarea rows="30" class="tb-jf-debug-container">'
        + JSON.stringify(debugSchema, null, 2)
        + '</textarea>'
        + '</div>'
        + '</fieldset>'
      );
    }
  };

  FormTree.prototype.lock = function() {
    _.each(this.root.children, function(child) {
      child.lock();
    });
  };

  FormTree.prototype.unlock = function() {
    _.each(this.root.children, function(child) {
      child.unlock();
    });
  };

  FormTree.prototype.submit = function(evt) {
    // TRACE('FormTree.prototype.submit %s', arguments);
    this.lock();

    var self = this;
    var values = jsonform.getFormValue(this.domRoot);
    var options = this.formDesc;
    var brk = false;

    var domRoot = $(this.domRoot);
    var overlay = $('<div>')
      .addClass('tb-jf-overlay')
      .height(domRoot.height() + 20)
      .width(domRoot.width() + 20)
      .offset({
        left: domRoot.offset().left - 10,
        top: domRoot.offset().top - 10
      });
    $('body').append(overlay);

    var stopEvent = function() {
      if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
      }

      self.unlock();
      overlay.remove();

      return false;
    };

    this.forEachElement(function(elt) {
      if (brk) {
        return;
      }
      if (elt.view.onSubmit) {
        brk = !elt.view.onSubmit(evt, elt); //may be called multiple times!!
      }
    });

    if (brk) {

      return stopEvent();
    }

    var validated = this.validate({
      'values': values,
      'hideErrors': this.formDesc.form.hideErrors,
      'clearOldErrors': true
    });

    var merged = mergeValues(jsonform.value, values);

    if (options.onSubmit && !options.onSubmit(validated.errors, merged)) {

      return stopEvent();
    }

    if (validated.errors) {

      return stopEvent();
    }

    if (options.onSubmitValid && !options.onSubmitValid(merged)) {

      return stopEvent();
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
  FormTree.prototype.hasRequiredField = function() {
    // TRACE('FormTree.prototype.hasRequiredField %s', arguments);

    return $(this.domRoot).find('.tb-jf-required').length > 0;
  };

  /**
   * Walks down the element tree with a callback
   *
   * @function
   * @param {Function} callback The callback to call on each element
   */
  FormTree.prototype.forEachElement = function(callback) {
    // TRACE('FormTree.prototype.forEachElement %s', arguments);

    var f = function(root) {
      for (var i = 0; i < root.children.length; i++) {
        callback(root.children[i]);
        f(root.children[i]);
      }
    };

    f(this.root);
  };



  jsonform.cssFramework = 'bootstrap3';

  /**
   * create a generic schema by the given form descriptor
   */
  jsonform.generateSchema = function(descriptor) {
    // TRACE('jsonform.generateSchema %s', arguments);

    /**
     * append the given schemaElement to its place in the schema.
     * Resolve (/) and ([]) accessor operators if any.
     */
    var appendSchemaElement = function(parentSchema, elementKey, schemaElement) {
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
          parentObject = jsonform.util.getObjByKey(parentObject, keyPath[i]);

          if (parentObject.type === 'object') {
            parentObject = jsonform.util.getObjByKey(parentObject, 'properties');
          } else if (parentObject.type === 'array') {
            parentObject = jsonform.util.getObjByKey(parentObject, 'items');

            // in case the array is a complex one access the properties object
            if (parentObject.properties) {
              parentObject = jsonform.util.getObjByKey(parentObject, 'properties');
            }
          }
        }

        ASSERT_PEER(parentObject, 'The specified path for key %s does not exist.', elementKey);
      };
    }

    /**
     * create a generic schema by the given form descriptor
     */
    var generateSchemaFromForm = function(form) {
      ASSERT_PEER(form.schemaId, 'To generate a schema schemaId must be defined in the form object.');
      ASSERT_PEER(form.jsonformVersion, 'To generate a schema jsonformVersion must be defined in the form object.');

      /**
       * create initial schema object with all requied properites
       */
      var schema = {
        id: form.schemaId,
        type: 'object',
        properties: {}
      }

      /**
       * generate the schema for all scalar fields - either string, number, integer or boolean
       */
      function generateScalar(parentSchema, formElement, elementType, schemaElement) {
        ASSERT_PEER.ofTbType(formElement.key, 'string', 'Every element in the form must have a key.');
        ASSERT.ofTbType(elementType.compatibleTypes, 'array', 'The form element does not specify the types it supports.');

        /**
         * approximate the schema type by the given form element.
         * Use the first specified element in compatibleTypes as it is always the most generic one.
         */
        schemaElement.type = elementType.compatibleTypes[0];

        if (elementType.requiresEnum === true || elementType.acceptsEnum === true) {
          if (elementType.requiresEnum === true) {
            ASSERT_PEER.ofTbType(formElement.titleMap, 'object', 'To auto-generate a schema for a field requiring an enum a titleMap object is required.');
          }

          if (schemaElement.type === 'array') {
            schemaElement.items = {
              type: elementType.compatibleItemTypes[0]
            };

            if (formElement.titleMap) {
              schemaElement.items.enum = Object.keys(formElement.titleMap)
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
      function generateObject(parentSchema, formElement, elementType, schemaElement) {
        /**
         * placeholder fields such as fieldset, section, tablerow do not have to have a schema key
         */
        if (elementType.fieldtemplate) {
          ASSERT.ofTbType(
            formElement.key,
            'string',
            'Every element in the form must have a key. No key given for the following formElement: %s',
            formElement
          );

          schemaElement.properties = {};
          appendSchemaElement(parentSchema, formElement.key, schemaElement);
        }

        // console.log(formElement.items);
        for (var i = 0, j = formElement.items.length; i < j; i++) {
          // console.log(formElement.items[i]);
          generateSchemaElement(parentSchema, formElement.items[i]);
        };
      }

      /**
       * generate the schema for all array fields and iterate through their children
       */
      function generateArray(parentSchema, formElement, elementType, schemaElement) {
        if (elementType.fieldtemplate) {
          ASSERT_PEER(formElement.items.items.length >= 0, 'Arrays must have at least one element.');

          schemaElement.items = {}

          /**
           * complex arrays (containing more than one type of field) are represented as  arrays of objects.
           * Therefore the items object must be of type object and the form fields must be present
           * in the properties object.
           */
          if (formElement.items.items.length === 1) {
            var childSchemaElement = {};
            var childFormElement = formElement.items.items[0];
            var elementType = jsonform.elementTypes[childFormElement.type];

            ASSERT_PEER.ofTbType(childFormElement.key, 'string', 'Every element in the form must have a key.');
            ASSERT_PEER.ofTbType(elementType.compatibleTypes, 'array', 'The form element does not specify the types it supports.');

            schemaElement.items = generateScalar(parentSchema, childFormElement, elementType, childSchemaElement);
            appendSchemaElement(parentSchema, formElement.items.items[0].key, schemaElement);
          } else {
            ASSERT_PEER.ofTbType(
              formElement.key,
              'string',
              'Every element in the form must have a key. No key given for the following formElement: %s',
              formElement
            );

            schemaElement.items.type = 'object';
            schemaElement.items.properties = {};

            appendSchemaElement(parentSchema, formElement.key, schemaElement);

            for (var i = 0, j = formElement.items.items.length; i < j; i++) {
              generateSchemaElement(parentSchema, formElement.items.items[i]);
            }
          }
        } else {
          for (var i = 0, j = formElement.items.length; i < j; i++) {
            generateSchemaElement(parentSchema, formElement.items[i]);
          }
        }
      }

      /**
       * recurse through the given formElement and generate the schema all its children
       * using the generateScalar, generateObject and generateArray functions
       */
      function generateSchemaElement(parentSchema, formElement) {
        ASSERT_PEER(formElement.type, 'Every form element must have a type');
        ASSERT_PEER(jsonform.elementTypes[formElement.type], 'JsonForm does not support this element type.');

        var schemaElement = {};
        var elementType = jsonform.elementTypes[formElement.type];

        if (elementType.inputfield) {
          schemaElement = generateScalar(parentSchema, formElement, elementType, schemaElement);

          appendSchemaElement(parentSchema, formElement.key, schemaElement);
        } else if (elementType.containerField) {
          ASSERT_PEER.ofTbType(elementType.compatibleTypes, 'array', 'The form element does not specify the types it supports.');
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
          }
        };

        generateSchemaElement(schema.properties, form.fields[i]);
      };

      return schema;
    };

    /**
     * create a generic schema by the given content descriptor
     */
    var generateSchemaFromContent = function(descriptor) {
      var content = descriptor.content;

      ASSERT_PEER(descriptor.form.schemaId, 'To generate a schema schemaId must be defined in the form object.');

      /**
       * create initial schema object with all requied properites
       */
      var schema = {
        id: descriptor.form.schemaId,
        type: 'object',
        properties: {}
      }

      /**
       * generate the schema for all scalar fields - either string, number, integer or boolean
       */
      function generateScalar(parentSchema, value, schemaElement) {
        if (TB.typeof(value) === 'number') {
          schemaElement.type = 'number';
        } else if (value === null) {
          schemaElement.type = 'string';
        } else {
          schemaElement.type = TB.typeof(value);
        }

        ASSERT(['string', 'number', 'boolean', 'null'].indexOf(schemaElement.type) >= 0);
        ASSERT(['object', 'array'].indexOf(schemaElement.type) < 0, 'Error while generating schema from content: scalar type expected, given %s', schemaElement.type);

        return schemaElement;
      }

      /**
       * generate the schema for all object fields and iterate through their children
       */
      function generateObject(parentSchema, key, value, schemaElement) {
        var objectKeys = Object.keys(value);

        schemaElement.properties = {};
        appendSchemaElement(parentSchema, key, schemaElement);


        for (var i = 0, j = objectKeys.length; i < j; i++) {
          generateSchemaElement(parentSchema, objectKeys[i], value[objectKeys[i]], key);
        };
      }

      /**
       * generate the schema for all array fields and iterate through their children
       */
      function generateArray(parentSchema, key, value, schemaElement) {
        ASSERT_PEER(value.length >= 0, 'Error while generating schema from content: Arrays must have at least one element.');

        schemaElement.items = {};

        /**
         * complex arrays (containing more than one type of field) are represented as  arrays of objects.
         * Therefore the "items" object must be of type object and the form fields must be present
         * in the "properties" object.
         */

        if (typeof value[0] !== 'object') {
          var childSchemaElement = {};

          schemaElement.items = generateScalar(parentSchema, value[0], childSchemaElement);

          if (!schemaElement.items.title
            && !schemaElement.items.enum) {

            schemaElement.items.title = schemaElement.items.type + ':';
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
      function generateSchemaElement(parentSchema, key, value, parentKey) {
        ASSERT(key, 'Error while generating schema from content: Every content element must have a key.');
        ASSERT(value !== undefined, 'Error while generating schema from content: Every content element must have a value.');

        /**
         * follow the path of parent objects while generating the schema
         */
        if (parentKey) {
          key = parentKey + '/' + key;
        };

        var schemaElement = {
          title: key.split('/').pop()
        };

        if (!Array.isArray(value) && !_.isObject(value)) {
          schemaElement = generateScalar(parentSchema, value, schemaElement);

          appendSchemaElement(parentSchema, key, schemaElement);
        } else {
          if (Array.isArray(value)) {
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
        if (['schemaId', 'jsonformVersion'].indexOf(contentKeys[i]) < 0) {
          generateSchemaElement(schema.properties, contentKeys[i], content[contentKeys[i]]);
        }
      };

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
        'Invalid schema. Auto-generating schemas is supported only in unstrict mode.'
      );
    }

    return descriptor.schema;
  };

  /**
   * parse all schema elements and create a form descriptor for each one
   */
  jsonform.generateForm = function(descriptor) {
    // TRACE('jsonform.generateForm %s', arguments);

    if (!descriptor.form.isStrict) {
      descriptor.form.fields = [];

      /**
       * make sure that when generating a form using the schema all elements
       * are sorted alphabetically. This guarantees that the same form will
       * be generated on every run (js objects and hashes in general do not
       * guarantee the order of their elements)
       */
      var alphaKeys = _.keys(descriptor.schema.properties).sort();

      ASSERT_PEER(
        alphaKeys.length === _.keys(descriptor.schema.properties).length,
        'All schema keys must have unique keywords.'
      );

      _.each(alphaKeys, function(key) {
        descriptor.form.fields.push({'key': key});
      });
    } else {
      ASSERT_PEER(
        descriptor.form.isStrict === false,
        'Invalid schema. Auto-generating forms is supported only in unstrict mode.'
      );
    }

    return descriptor.form;
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
  jsonform.getFormValue = function(formelt) {
    // TRACE('jsonform.getFormValue %s', arguments);

    var form = null;

    if (formelt) {
      form = $(formelt).data('tb-jf-tree');
    } else {
      form = $(jsonform.formTree.domRoot).data('tb-jf-tree');
    }

    if (!form) {
      return null;
    }

    return form.root.getFormValues();
  };

  jsonform.submit = function(evt) {
    // TRACE('jsonform.submit %s', arguments);

    var form = $(formelt).data('tb-jf-tree');
    if (!form) {
      return null;
    }

    return form.root.submit();
  };



  /**
   * Generates the HTML form from the given JSON Form object and renders the form.
   *
   * Main entry point of the library. Defined as a jQuery function that typically
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
  $.fn.jsonForm = function(options) {
    displayLoadingAnimation(this);

    ASSERT_PEER(options, 'JsonForm did not receive any json descriptors.');

    ASSERT_PEER.hasPropertyOfTbType(options, 'form', 'object', 'JsonSchema requires a form.');
    ASSERT_PEER.hasPropertyOfTbType(options.form, 'jsonformVersion', 'string', 'The form must specify its jsonformVersion');
    ASSERT_PEER.hasPropertyOfTbType(options.form, 'schemaId', 'string', 'Every form must have a schemaId.');

    // TRACE('$.fn.jsonForm %s', arguments);

    /**
     * auto-generate the form or the schema in case one of them is missing and the form is in unstrict mode
     */
    if (!options.schema
      || !options.schema.properties
      || Object.keys(options.schema.properties).length === 0) {

      options.schema = jsonform.generateSchema(options);
    }

    if (!options.form
      || !options.form.fields
      || options.form.fields === null
      || options.form.fields.length === 0) {

      options.form = jsonform.generateForm(options);
    }

    // console.log(JSON.stringify(options, null, 2));

    ASSERT_PEER.hasPropertyOfTbType(options, 'schema', 'object', 'JsonForm requires a schema.');
    ASSERT_PEER(options.schema.type === 'object', 'The schema must be of type object.');
    ASSERT_PEER(!TB.isEmpty(options.schema.properties), 'object', 'Schema properties cannot be empty.');
    ASSERT_PEER.hasPropertyOfTbType(options.schema, 'id', 'string', 'Every schema must have an id.');

    ASSERT_PEER(options.schema.id === options.form.schemaId, 'The id of the schema and the schemaId from the form must match');

    if (!options.validator) {
      options.validator = new Ajv({
        verbose: true,
        allErrors: true,
        multipleOfPrecision: true,
        errorDataPath: 'object'
      });
    }

    // make sure that the schema is valid
    var validSchema = false;

    try {
      if(options.schema.$schema && options.schema.definitions[ options.schema.$schema ]) {
        options.validator.addMetaSchema(options.schema.definitions[ options.schema.$schema ]);
      }

      options.validator.compile(options.schema);

      validSchema = true;
    } catch (e) {
      console.log("ERRR", e)
      ASSERT_PEER(validSchema === true, 'The json schema is invalid.');
    };

    /**
     * remove the cached schema as it is possible that it will be modified before validation
     * possible modifications include escaping schema keys, changing schema restrictions in
     * unstrict mode and others
     */
    options.validator.removeSchema(options.schema.id);
    options.validator = new Ajv2tb(options.validator);

    /**
     * backwards compatibility with TbJsonForms - content is alias for value
     */
    if (isSet(options.content)) {
      if (options.form.isStrict) {
        ASSERT_PEER(options.schema.id === options.content.schemaId, 'The id of the schema and the schemaId from the content must match');
      }

      if (!isSet(options.value)) {
        options.value = options.content;

      } else {
        ASSERT_PEER(
          !options.value,
          'JsonForm cannot have content and value hash at the same time. Use only content instead.'
        );
      }
    }

    if (!options.hasOwnProperty('value')) {
      options.value = {};
      options.value.schemaId = options.schema.id;
    } else {
      if (options.form.isStrict) {
        ASSERT_PEER.hasPropertyOfTbType(options.value, 'schemaId', 'string', 'Every form must have a schemaId.');
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

    //TODO use the FormTree class instead of the FormTree class
    // console.time('newFormTree')
    var form = new FormTree(options);
    // var form = new FormTree(options);
    // console.timeEnd('newFormTree')

    form.render(formElt.get(0));

    removeLoadingAnimation(this);

    jsonform.value = options.value;
    jsonform.formTree = form;

    /**
     * Keep a direct pointer to the JSON schema for form submission purpose
     */
    formElt.data("tb-jf-tree", form);
    if (options.submitEvent) {
      formElt.unbind((options.submitEvent) + '.tb-jf');

      formElt.bind((options.submitEvent) + '.tb-jf', function(evt) {
        form.submit(evt);
      });
    }

    /**
     * Initialize tabs sections, if any
     */
    initializeTabs(formElt);

    /**
     * Initialize expandable sections, if any
     */
    $('.expandable > div, .expandable > fieldset', formElt).hide();
    formElt.on('click', '.expandable > legend', function () {
      var parent = $(this).parent();

      parent.toggleClass('expanded');
      $('> div', parent).slideToggle(100);
    });

    return form;
  };


  $.fn.jsonFormClearErrors = function(errors) {
    // TRACE('$.fn.jsonFormClearErrors %s', arguments);
    var settings = {
      clearSelectedErrors: true
    };

    // clear all error messages
    if (errors === '*') {
      settings.clearOldErrors = true;
    }

    this.jsonFormErrors(errors, settings);
  };

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
  $.fn.jsonFormErrors = function(errors, settings) {
    // TRACE('$.fn.jsonFormErrors %s', arguments);

    // console.log('jsonFormErrors');
    var clearOldErrors;
    var clearSelectedErrors;

    var form = $(this.domRoot).data("tb-jf-tree");
    var self = this;

    if (settings && settings.clearOldErrors) {
      clearOldErrors = settings.clearOldErrors;
    } else {
      clearOldErrors = false;
    }

    if (settings && settings.clearSelectedErrors) {
      clearSelectedErrors = settings.clearSelectedErrors;
    } else {
      clearSelectedErrors = false;
    }

    /**
     * clear all old errors by removing the error/warning class
     * and hiding the previous error text
     */

    if (clearOldErrors) {
      $("." + jsonform.defaultClasses.groupMarkClassPrefix + "error")
        .removeClass(jsonform.defaultClasses.groupMarkClassPrefix + "error");
      $("." + jsonform.defaultClasses.groupMarkClassPrefix + "warning")
        .removeClass(jsonform.defaultClasses.groupMarkClassPrefix + "warning");
      $(".tb-jf-errortext", this).hide();
    }


    if (!errors) {
      return;
    } else if (!Array.isArray(errors)
      && typeof errors === 'object') {

      errors = [errors];
    }

    var errorSelectors = [];

    /**
     * Compute the address of the input field in the form from the URI
     * returned by the JSON schema validator.
     */
    for (var i = 0; i < errors.length; i++) {
      var limitConstraintErrorPath = errors[i].data_path;
      var requiredConstraintErrorPath = errors[i].debug.ajvErr.params.missingProperty;
      console.log(errors[i], limitConstraintErrorPath, requiredConstraintErrorPath);

      // ASSERT_PEER(
      //   limitConstraintErrorPath || requiredConstraintErrorPath,
      //   'Every error must declare the path to its field.',
      //   errors[i]
      // );

      if (!clearSelectedErrors) {
        ASSERT_PEER(errors[i].msg, 'Every error must declare an error message that will be shown.');
      }

      var key;
      if (limitConstraintErrorPath && limitConstraintErrorPath.trim !== '') {
        key = limitConstraintErrorPath.replace('/', '.');
      } else if (requiredConstraintErrorPath && requiredConstraintErrorPath.trim !== '') {
        key = requiredConstraintErrorPath.replace('/', '.');
      }

      // normally all fields are separated by "" however illegal keys are escaped
      // legalKey.illegalKey becomes logalKey['illegalKey']
      var keyPath = key.split(/\[\'|\'\]\.|\'\]|\./);

      // ignore trailing empty strings
      if (keyPath[keyPath.length - 1] === '') {
        keyPath.pop();
      }

      if (keyPath[0] === '') {
        keyPath.shift();
      }

      ASSERT_PEER.ofTbType(key, 'string', 'An error occured but its location is unknown');

      for (var k = 0, j = keyPath.length; k < j; k++) {
        keyPath[k] = escapeId(keyPath[k]);
      };

      key = keyPath.join('-');

      var errorClass = ".tb-jf-error-" + key;

      var $node = $(errorClass, self.domRoot);

      errorSelectors.push(errorClass);

      $node.addClass(jsonform.defaultClasses.groupMarkClassPrefix + "error");
      var node = $node.find("> div > .tb-jf-errortext, > .tb-jf-errortext");

      // display all error messages
      if (!clearSelectedErrors) {
        node.text(errors[i].msg)
          .show();
      // remove all error messages and warning classes from the specified paths
      } else {
        var parent = node.closest('[data-tb-jf-type]');

        node.text('').hide();
        parent.removeClass(jsonform.defaultClasses.groupMarkClassPrefix + "error");
        parent.removeClass(jsonform.defaultClasses.groupMarkClassPrefix + "warning");
      }
    }

    /**
     * Look for the first error in the DOM and ensure the element
     * is visible so that the user understands that something went wrong
     */
    errorSelectors = errorSelectors.join(',');
    var $errorSelectors = $(errorSelectors, this);

    // XXX: check invisible panels if error happens there
    var $errorInvisiblePanels = $errorSelectors.parents('.tab-pane');
    var $errorTabs = $();

    $errorInvisiblePanels.each(function() {
      var $this = $(this);

      $errorTabs = $errorTabs.add(
        $this.closest('.tabbable').find('> .nav > li').eq($this.index())
          .addClass(jsonform.defaultClasses.groupMarkClassPrefix + 'error')
      );
    });

    var firstError = $errorSelectors.filter(':visible').get(0);

    if (firstError) {
      firstError.scrollIntoView(true, {
        behavior: 'smooth'
      });
    } else {
      /**
       * go through the errorTabs array and find the nested elements
       * if two tabs are nested not only the first one should be activated (parent)
       * but also the second one (child)
       */
      var activateNestedTabs = function(errorTabs, index) {
        if (!index) {
          index = 0;
        }

        errorTabs.get(index).click();

        // console.log(errorTabs.get(index).parentNode.parentNode)
        // console.log(errorTabs.get(index).parentNode)
        // console.log(errorTabs.get(index))
        // console.log(errorTabs.get(index + 1))
        // console.log($.contains(
        //     errorTabs.get(index).parentNode.parentNode,
        //     errorTabs.get(index + 1)
        //   )
        // );
        // console.log('---');

        if ($.contains(errorTabs.get(index).parentNode.parentNode, errorTabs.get(index + 1))) {
          activateNestedTabs(errorTabs, index + 1);
        }
      }

      // console.log($errorTabs);
      if ($errorTabs.length > 0) {

        activateNestedTabs($errorTabs, 0);
      }
    }
  };


  /**
   * Retrieves the structured values object generated from the values
   * entered by the user and the data schema that gave birth to the form.
   *
   * Defined as a jQuery function that typically needs to be applied to
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
  $.fn.jsonFormValue = function() {
    // TRACE('$.fn.jsonFormValue %s', arguments);

    var values = jsonform.getFormValue(this);
    var merged = mergeValues(jsonform.value, values);
    var validated = jsonform.formTree.validate({
      'values': values
    });

    validated.values = merged;

    return validated;
  };

  $.fn.jsonFormSetValue = function(path, value) {
    ASSERT_PEER.ofTbType(path, 'string', 'jsonFormSetValue: the first argument must be a valid json path string.');
    ASSERT_PEER(path !== undefined, 'jsonFormSetValue: the second argument must be defined.');

    var node = jsonform.formTree.root.getChildNodeByKeyPath(path);

    ASSERT_PEER(
      node.expectingSearchValue,
      true,
      'The API has tried setting value %s to node with path %s while it was not expecting a new value,'
    );

    node.setFkeyValues(value);
  }


  $.fn.jsonFormPlugin = function(options) {
    // TRACE('$.fn.jsonFormPlugin %s', arguments);

    return this.each(function() {
      var $this = $(this);

      if(!$this.is(':input:hidden')) {
        return $this.jsonForm(options);
      } else {
        var $form = $('<div id="tb-jf-form-hidden"></div>');
        var inlineOpts = $this.data('jsonform-inline');

        $this.after($form);
        $form.on('jsonformsChange', function() {
          var jsonformValue = $form.jsonFormValue();

          if(jsonformValue.errors instanceof Array && jsonformValue.errors.length > 0) {
            return;
          }

          $this.val(JSON.stringify(jsonformValue.values));
        });

        $.extend(true, inlineOpts, options);

        $form.jsonForm(inlineOpts);
      }
    });
  };

  /**
   * Expose the getFormValue method to the global object
   * (other methods exposed as jQuery functions)
   */
  if (!global.JSONForm) {
    global.JSONForm = jsonform;
  }

})((typeof exports !== 'undefined'),
  ((typeof exports !== 'undefined') ? exports : window),
  ((typeof jQuery !== 'undefined') ? jQuery : { fn: {} }),
  ((typeof _ !== 'undefined') ? _ : null),
  JSON);
