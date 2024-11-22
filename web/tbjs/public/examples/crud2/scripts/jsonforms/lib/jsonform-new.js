function FormTree(s) {
  /**
   * Root container, holding all nodes of the tree
   * @type {Object}
   */
  this.root = null;

  /**
   * Settings object
   * @type {Object}
   */
  this.s = null;

  /**
   * Default values of settings
   * @type {Object}
   */
  this.defaults = {
    cssFramework: 'bootstrap3',
    form: [
      '*',
      {
        type: 'actions',
        items: [{
          type: 'submit',
          value: 'Submit'
        }],
      },
    ],
    prefix: 'tb-jf-' + _.uniqueId() + '-',
    params: {},
  };



  this.s = _.assign({}, this.defaults, s);
  this.formDesc = this.s;

  ASSERT.hasPropertyOfTbType(this.s, 'form', 'array');
  ASSERT.hasPropertyOfTbType(this.s, 'params', 'object');
  ASSERT.hasPropertyOfTbType(this.s, 'prefix', 'string');
  ASSERT.hasPropertyOfTbType(this.s, 'schema', 'object');

  this._normalizeSchemaShorthand();


  /**
   * @todo resolve refs
   */
  // TODO ....


  // TODO remove this
  jsonform.defaultClasses = getDefaultClasses(this.s.cssFramework);
  this.defaultClasses = _.clone(jsonform.defaultClasses);




  this.root = new FormNode(this, null, this.s.form);
  this.root.ownerTree = this;
  this.root.view = jsonform.elementTypes['root'];

  this.parseTree();

  this.computeInitialValues();
}

// FormTree.prototype = formTree.prototype;

FormTree.prototype._normalizeSchemaShorthand = function() {
  if (this.s.schema && !this.s.schema.properties) {
    this.s.schema = {
      properties: this.s.schema,
    };
  }
};

FormTree.prototype.parseTree = function() {
  _.each(this.s.form, (formElement) => {
    if (formElement === '*') {
      // TODO
    } else {
      if (_.isString(formElement)) {
        formElement = {
          key: formElement,
        };
      }

      this.root.appendChild(new FormNode(this, this.root, formElement));
    }
  });
};

function getSchemaByKey(schema, key) {
  var schemaKey = key
    .replace(/\./g, '.properties.')
    .replace(/\[[0-9]*\]/g, '.items');
  var schemaDef = jsonform.util.getObjKey(schema, schemaKey, true);

  if (schemaDef && schemaDef.$ref) {
    THROW('JSONForm does not yet support schemas that use the $ref keyword. See: https://github.com/joshfire/jsonform/issues/54');
  }

  return schemaDef;
}

function FormNode(ownerTree, parentNode, formElement) {
  /**
   * The node's ID (may not be set)
   * @type {String}
   */
  this.id = null;
  /**
   * The node's key path (may not be set)
   * @type {String}
   */
  this.key = null;
  /**
   * DOM element associated with the form element.
   *
   * The DOM element is set when the form element is rendered.
   * @type {DOMElement}
   */
  this.el = null;
  /**
   * Link to the form element that describes the node's layout
   * (note the form element is shared among nodes in arrays)
   * @type {Object}
   */
  this.formElement = null;
  /**
   * Link to the schema element that describes the node's value constraints
   * (note the schema element is shared among nodes in arrays)
   * @type {Object}
   */
  this.schemaElement = null;
  /**
   * Pointer to the "view" associated with the node, typically the right
   * object in jsonform.elementTypes
   * @type {Object}
   */
  this.view = null;
  /**
   * Child template for array-like nodes.
   *
   * The child template gets cloned to create new array items.
   * @todo add type
   */
  this.childTemplate = null;
  /**
   * Direct children of array-like containers may use the value of a
   * specific input field in their subtree as legend. The link to the
   * legend child is kept here and initialized in computeInitialValues
   * when a child sets "valueInLegend"
   * @todo add type
   */
  this.legendChild = null;
  /**
   * Position of the node in the list of children of its parents
   * @type {Integer}
   */
  this.childPos = 0;
  /**
   * Node's subtree (if one is defined)
   * @type {Array}
   */
  this.children = [];
  /**
   * The path of indexes that lead to the current node when the
   * form element is not at the root array level.
   *
   * Note a form element may well be nested element and still be
   * at the root array level. That's typically the case for "fieldset"
   * elements. An array level only gets created when a form element
   * is of type "array" (or a derivated type such as "tabarray").
   *
   * The array path of a form element linked to the foo[2].bar.baz[3].toto
   * element in the submitted values is [2, 3] for instance.
   *
   * The array path is typically used to compute the right ID for input
   * fields. It is also used to update positions when an array item is
   * created, moved around or suppressed.
   *
   * @type {Array(Number)}
   */
  this.arrayPath = [];



  this.ownerTree = ownerTree;
  this.parentNode = parentNode;
  this.formElement = _.clone(formElement);

  if(parentNode !== null) {
    this._initialize(this.formElement);
  }
}

// FormNode.prototype = formNode.prototype;

FormNode.prototype._initialize = function(formElement) {

  if (formElement.items) {
    ASSERT.hasPropertyOfTbType(formElement, 'items', 'array');

    formElement.items = _.map(formElement.items, _.clone);
  }

  if (this.formElement.key) {
    var schemaElement = getSchemaByKey(this.ownerTree.s.schema.properties, this.formElement.key);

    ASSERT.ofTbType(schemaElement, 'object');

    this.schemaElement = schemaElement;

    formElement.id = this.ownerTree.s.prefix + 'elt-' + escapeSelector(this.formElement.key);
    formElement.name = formElement.name || this.formElement.key;
    formElement.title = formElement.title || schemaElement.title;
    formElement.description = formElement.description || schemaElement.description || '';

    formElement.readOnly = this.ownerTree.s.readOnly === true || schemaElement.readOnly === true || formElement.readOnly === true;
    formElement.required = this.ownerTree.s.required === true || schemaElement.required === true || formElement.required === true;
    formElement.preview = this.ownerTree.s.preview === true || formElement.preview === true;

    ASSERT.ofTbType(formElement.name, 'string');
    ASSERT.ofTbType(formElement.title, 'string');
    ASSERT.ofTbType(formElement.description, 'string');

    // Check if form element is marked as preview only, then replace control type to `preview`
    if (formElement.preview) {
      formElement.type = 'preview';
    }

    // If control type isn't set, try to guess it from schema
    this._guessElementTypeBySchema(formElement, schemaElement);
    this._prepareDefaults(formElement, schemaElement);
    this._prepareEnumValues(formElement, schemaElement);

    this.options = formElement.options;
  }


  ASSERT.hasPropertyOfTbTypes(formElement, 'type', 'string');
  ASSERT.hasPropertyOfTbTypes(jsonform.elementTypes, formElement.type, 'object', 'The JSONForm contains an element whose type is unknown: %s', formElement.type);
  ASSERT.isDefined(jsonform.elementTypes[formElement.type], 'The form contains an element whose type is unknown: %s', formElement.type);

  this.view = jsonform.elementTypes[formElement.type];

  formElement.handlers = formElement.handlers || {};

  if (schemaElement !== null && schemaElement !== undefined) {
    if (_.isArray(this.view.compatibleTypes)) {
      ASSERT(_.includes(this.view.compatibleTypes, schemaElement.type));
    }

    if (_.isArray(this.view.compatibleFormats) && schemaElement.format) {
      ASSERT(_.includes(this.view.compatibleFormats, schemaElement.format));
    }
  }

  // formElement.key === 'address' && console.log(formElement);

  if (this.view.isArrayContainer !== true) {
    if (formElement.items) {
      this.parseTree();
    } else if (formElement.otherField) {
      // TODO do we really need to support `otherField`
    }
  }
}

/**
 * Returns the number of items that the array node should have based on
 * the values/content object.
 *
 * The whole difficulty is that values may be hidden deep in the subtree
 * of the node and may actually target different arrays in the JSON schema.
 *
 * @function
 * @param {Object} values Previously submitted values
 * @param {Array(Number)} arrayPath the array path we're interested in
 * @return {Number} The number of items in the array
 */
FormNode.prototype.getPreviousNumberOfItems = function (values, arrayPath) {
  var key = null;
  var arrayValue = null;
  var childNumbers = null;
  var idx = 0;

  if (!values) {
    // No previously submitted values, no need to go any further
    return 0;
  }

  if (this.view.inputfield && this.schemaElement) {
    // Case 1: node is a simple input field that links to a key in the schema.
    // The schema key looks typically like:
    //  foo.bar[].baz.toto[].truc[].bidule
    // The goal is to apply the array path and truncate the key to the last
    // array we're interested in, e.g. with an arrayPath [4, 2]:
    //  foo.bar[4].baz.toto[2]
    key = truncateToArrayDepth(this.formElement.key, arrayPath.length);
    key = applyArrayPath(key, arrayPath);
    arrayValue = jsonform.util.getObjKey(values, key);
    if (!arrayValue) {
      // No key? That means this field had been left empty
      // in previous submit
      return 0;
    }
    childNumbers = _.map(this.children, function (child) {
      return child.getPreviousNumberOfItems(values, arrayPath);
    });
    return _.max([_.max(childNumbers) || 0, arrayValue.length]);
  }
  else if (this.view.array) {
    // Case 2: node is an array-like node, look for input fields
    // in its child template
    return this.getChildTemplate().getPreviousNumberOfItems(values, arrayPath);
  }
  else {
    // Case 3: node is a leaf or a container,
    // recurse through the list of children and return the maximum
    // number of items found in each subtree
    childNumbers = _.map(this.children, function (child) {
      return child.getPreviousNumberOfItems(values, arrayPath);
    });
    return _.max(childNumbers) || 0;
  }
};

FormNode.prototype.computeInitialValues = function(values, ignoreDefaultValues, topDefaultArrayLevel) {
  var self = this;
  var formData = this.ownerTree.formDesc.tpldata || {};

  topDefaultArrayLevel = topDefaultArrayLevel || 0;

  // Prepare special data param "value" for templated values
  formData.value = '';

  // Prepare special data param "idx" for templated values
  // (is is the index of the child in its wrapping array, starting
  // at 1 since that's more human-friendly than a zero-based index)
  formData.idx = (this.arrayPath.length > 0) ?
    this.arrayPath[this.arrayPath.length-1] + 1 :
    this.childPos + 1;


  // Prepare special function to compute the value of another field
  formData.getValue = function (key) {
    return getInitialValue(self.ownerTree.formDesc, key, self.arrayPath, formData, !!values);
  };

  if (this.formElement) {
    // Compute the ID of the field (if needed)
    if (this.formElement.id) {
      this.id = escapeId(applyArrayPath(this.formElement.id, this.arrayPath));
    } else if (this.view && this.view.array) {
      this.id = escapeId(escapeSelector(this.ownerTree.formDesc.prefix)) +
        '-elt-counter-' + _.uniqueId();
    } else if (this.parentNode && this.parentNode.view &&
      this.parentNode.view.array) {
      // Array items need an array to associate the right DOM element
      // to the form node when the parent is rendered.
      this.id = escapeId(escapeSelector(this.ownerTree.formDesc.prefix)) +
        '-elt-counter-' + _.uniqueId();
    } else if ((this.formElement.type === 'button') ||
      (this.formElement.type === 'selectfieldset') ||
      (this.formElement.type === 'tabobject') ||
      (this.formElement.type === 'question') ||
      (this.formElement.type === 'buttonquestion')) {
      // Buttons do need an id for "onClick" purpose
      this.id = escapeId(escapeSelector(this.ownerTree.formDesc.prefix)) +
        '-elt-counter-' + _.uniqueId();
    }

    // Compute the actual key (the form element's key is index-free,
    // i.e. it looks like foo[].bar.baz[].truc, so we need to apply
    // the array path of the node to get foo[4].bar.baz[2].truc)
    if (this.formElement.key) {
      this.key = applyArrayPath(this.formElement.key, this.arrayPath);
    }

    // Same idea for the field's name
    this.name = applyArrayPath(this.formElement.name, this.arrayPath);

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
        if (this.formElement[prop].indexOf('{{values.') !== -1) {
          // This label wants to use the value of another input field.
          // Convert that construct into {{jsonform.getValue(key)}} for
          // Underscore to call the appropriate function of formData
          // when template gets called (note calling a function is not
          // exactly Mustache-friendly but is supported by Underscore).
          this[prop] = this.formElement[prop].replace(
            /\{\{values\.([^\}]+)\}\}/g,
            '{{getValue("$1")}}');
        } else {
          // Note applying the array path probably doesn't make any sense,
          // but some geek might want to have a label "foo[].bar[].baz",
          // with the [] replaced by the appropriate array path.
          this[prop] = applyArrayPath(this.formElement[prop], this.arrayPath);
        }
        if (this[prop]) {
          this[prop] = _template(this[prop], formData, valueTemplateSettings);
        }
      } else {
        this[prop] = this.formElement[prop];
      }
    }, this);

    // Apply templating to options created with "titleMap" as well
    if (this.formElement.options) {

      this.options = _.map(this.formElement.options, function (option) {
        var title = null;
        if (_.isObject(option) && option.title) {
          // See a few lines above for more details about templating
          // preparation here.
          if (option.title.indexOf('{{values.') !== -1) {
            title = option.title.replace(
              /\{\{values\.([^\}]+)\}\}/g,
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

  // check if the form contains any values other than the private _JSONFORMS_VERSION and _JSONFORMS_CONTENT_VERSION
  var hasNonPrivateValues = _.find(values, function(value, key) {
    return Boolean(key !== '_JSONFORMS_CONTENT_VERSION' && key !== '_JSONFORMS_VERSION');
  });

  if (this.view && this.view.inputfield && this.schemaElement) {
    // Case 1: simple input field

    var schemaDefault = getSchemaDefaultByKeyWithArrayIdx(self.ownerTree.formDesc.schema, this.key, topDefaultArrayLevel);
    var specifiedValue = jsonform.util.getObjKey(values, this.key);

    // in case the input field is a translated one and no value is given for the specific locale
    // we must pass it the value of the "unstranslated" field if such is given
    var parentKey = _.dropRight(this.key.split('.')).join('.');
    var parentSchema = getSchemaKey(this.ownerTree.formDesc.schema.properties, parentKey);
    // get the key & value of the field before localization (currently under the key "untranslated")
    var originalKey = parentKey + '.' + this.ownerTree.formDesc.originalLocale;
    var originalValue = jsonform.util.getObjKey(values, originalKey);

    if (isSet(specifiedValue)) {
      this.value = specifiedValue;
    } else if (parentSchema && parentSchema.translate === true && isSet(originalValue)) {
      this.value = originalValue;
    } else if (isSet(schemaDefault)) {
      this.value = schemaDefault;

      if (_.isString(this.value)) {
        if (this.value.indexOf('{{values.') !== -1) {
          // This label wants to use the value of another input field.
          // Convert that construct into {{jsonform.getValue(key)}} for
          // Underscore to call the appropriate function of formData
          // when template gets called (note calling a function is not
          // exactly Mustache-friendly but is supported by Underscore).
          this.value = this.value.replace(
            /\{\{values\.([^\}]+)\}\}/g,
            '{{getValue("$1")}}');
        } else {
          // Note applying the array path probably doesn't make any sense,
          // but some geek might want to have a label "foo[].bar[].baz",
          // with the [] replaced by the appropriate array path.
          this.value = applyArrayPath(this.value, this.arrayPath);
        }
        if (this.value) {
          this.value = _template(this.value, formData, valueTemplateSettings);
        }
      }

      this.defaultValue = true;
    } else if (this.parentNode.schemaElement && this.parentNode.schemaElement.translate) {

      if (isSet(jsonform.util.getObjKey(values, parentKey))) {
        var parentNodeValue = jsonform.util.getObjKey(values, parentKey);

        if (parentNodeValue.constructor !== Object) {
          this.value = parentNodeValue;
        }
      }
    }
  } else if (this.view && this.view.array) {
    // Case 2: array-like node
    var nbChildren = 0;

    if (hasNonPrivateValues) {
      nbChildren = this.getPreviousNumberOfItems(values, this.arrayPath);
    }
    // TODO: use default values at the array level when form has not been
    // submitted before. Note it's not that easy because each value may
    // be a complex structure that needs to be pushed down the subtree.
    // The easiest way is probably to generate a "values" object and
    // compute initial values from that object
    /*
    else if (this.schemaElement['default']) {
      nbChildren = this.schemaElement['default'].length;
    }
    */
    else if (nbChildren === 0) {
      // If form has already been submitted with no children, the array
      // needs to be rendered without children. If there are no previously
      // submitted values, the array gets rendered with one empty item as
      // it's more natural from a user experience perspective. That item can
      // be removed with a click on the "-" button.
      nbChildren = 1;
    }

    for (var i = 0; i < nbChildren; i++) {
      this.appendChild(this.getChildTemplate().clone());
    }
  }

  // Case 3 and in any case: recurse through the list of children
  _.each(this.children, function (child) {
    child.computeInitialValues(values, ignoreDefaultValues, topDefaultArrayLevel);
  });

  // If the node's value is to be used as legend for its "container"
  // (typically the array the node belongs to), ensure that the container
  // has a direct link to the node for the corresponding tab.
  if (this.formElement && this.formElement.valueInLegend) {
    var node = this;
    while (node) {
      if (node.parentNode && node.parentNode.view && node.parentNode.view.array) {
        node.legendChild = this;

        if (node.formElement && node.formElement.legend) {
          node.legend = applyArrayPath(node.formElement.legend, node.arrayPath);

          formData.idx = (node.arrayPath.length > 0) ?
            node.arrayPath[node.arrayPath.length-1] + 1 :
            node.childPos + 1;

          formData.value = isSet(this.value) ? this.value : '';
          node.legend = _template(node.legend, formData, valueTemplateSettings);

          break;
        }
      }
      node = node.parentNode;
    }
  }
};

/**
 * Gets the child template node for the current node.
 *
 * The child template node is used to create additional children
 * in an array-like form element. We delay create it when first use.
 *
 * @function
 * @param {formNode} node The child template node to set
 */
FormNode.prototype.getChildTemplate = function () {

  if (!this.childTemplate) {
    if (this.view.array) {
      var formElement = null;
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
      if (this.formElement.items) {
        formElement = this.formElement.items[0] || this.formElement.items;
      } else {
        formElement = this.formElement.key + '[]';
      }

      // construct a valid json if just a key string is defined
      if (_.isString(formElement)) {
        formElement = {
          key: formElement
        };
      }

      console.log(formElement, this.formElement.key)

      var child = new FormNode(this.ownerTree, this, formElement);

      if (child) {
        this.setChildTemplate(child);
      }
    }
  }

  return this.childTemplate;
};

FormNode.prototype._buildCaptions = function() {
  _.each([
    'title',
    'legend',
    'description',
    'append',
    'prepend',
    'helpvalue'
  ], function (prop) {
    if (_.isString(this.formElement[prop]) && _.includes(this.formElement.templateCaptions, prop)) {
      this[prop] = this.formElement[prop];

      // if (_.isString(this.formElement[prop])) {
      //   if (this.formElement[prop].indexOf('{{values.') !== -1) {
      //     // This label wants to use the value of another input field.
      //     // Convert that construct into {{jsonform.getValue(key)}} for
      //     // Underscore to call the appropriate function of formData
      //     // when template gets called (note calling a function is not
      //     // exactly Mustache-friendly but is supported by Underscore).
      //     this[prop] = this.formElement[prop].replace(
      //       /\{\{values\.([^\}]+)\}\}/g,
      //       '{{getValue("$1")}}');
      //   } else {
      //     // Note applying the array path probably doesn't make any sense,
      //     // but some geek might want to have a label "foo[].bar[].baz",
      //     // with the [] replaced by the appropriate array path.
      //     this[prop] = applyArrayPath(this.formElement[prop], this.arrayPath);
      //   }
      //   if (this[prop]) {
      //     this[prop] = _template(this[prop], formData, valueTemplateSettings);
      //   }
      // }
    }

    this[prop] = this.formElement[prop];
  }, this);


    // Apply templating to options created with "titleMap" as well
  if (this.formElement.options) {
    this.options = _.map(this.formElement.options, function (option) {
      if (_.get(option, 'title') && _.includes(this.formElement.templateCaptions, 'options')) {
        var title = null;

        // // See a few lines above for more details about templating
        // // preparation here.
        // if (option.title.indexOf('{{values.') !== -1) {
        //   title = option.title.replace(
        //     /\{\{values\.([^\}]+)\}\}/g,
        //     '{{getValue("$1")}}');
        // } else {
        //   title = applyArrayPath(option.title, self.arrayPath);
        // }
        // return _.extend({}, option, {
        //   value: (isSet(option.value) ? option.value : ''),
        //   // TODO да се поправи това:
        //   // title: _template(title, formData, valueTemplateSettings),
        // });
      }

      return option;
    }, this);
  }
};

FormNode.prototype._buildArrayPath = function() {
  if (this.parentNode && this.parentNode.arrayPath.length > 0) {
    this.arrayPath = _.clone(this.parentNode.arrayPath);

    if (this.parentNode.view.isArrayContainer) {
      this.arrayPath.push(this.childPos);
    }
  }
};

FormNode.prototype._buildId = function() {
  if (this.formElement.id) {
    this.id = escapeId(applyArrayPath(this.formElement.id, this.arrayPath));
  } else if (this.view.array || (this.parentNode && this.parentNode.view.array)) {
    this.id = escapeId(this.ownerTree.formDesc.prefix) + '-elt-counter-' + _.uniqueId();
  } else if ((this.formElement.type === 'button')
    || (this.formElement.type === 'selectfieldset')
    || (this.formElement.type === 'tabobject')
    || (this.formElement.type === 'question')
    || (this.formElement.type === 'buttonquestion')) {
    // TODO remove this! Не трябва да има имена на плъгини вътре в ядрото!!!
    this.id = escapeId(this.ownerTree.formDesc.prefix) + '-elt-counter-' + _.uniqueId();
  }
};

FormNode.prototype.parseTree = function() {
  _.each(this.formElement.items, (formElement) => {
    if (_.isString(formElement)) {
      formElement = {
        key: formElement,
      };
    }

    this.appendChild(new FormNode(this.ownerTree, this, formElement));
  });
};

/**
 * If element does not have specific type, defined in form, try to guess
 * it by data type in schema
 * @param  {Object} formElement   contains form element
 * @param  {Object} schemaElement contains schema element
 */
FormNode.prototype._guessElementTypeBySchema = function(formElement, schemaElement) {
  if (!formElement.type) {
    if (schemaElement.type === 'string') {
      if (schemaElement.format === 'color') {
        formElement.type = 'color';
      }

      if (!schemaElement.enum) {
        formElement.type = 'text';
      }
    } else if (schemaElement.type === 'boolean') {
      formElement.type = 'checkbox';
    } else if (schemaElement.type === 'number' || schemaElement.type === 'integer') {
      if (!schemaElement.enum) {
        formElement.type = 'number';
      }
    } else if (schemaElement.type === 'object') {
      if (schemaElement.translate === true) {
        formElement.type = 'tabobject';
      } else {
        formElement.type = 'fieldset';
      }
    }

    if (!formElement.type && _.isArray(schemaElement.enum)) {
      formElement.type = 'select';
    }
  }
};

FormNode.prototype._prepareDefaults = function(formElement, schemaElement) {
  switch(schemaElement.type) {
    case 'text':
      formElement.maxLength = schemaElement.maxLength || this.s.maxLength;
      formElement.minLength = schemaElement.minLength || this.s.minLength;
      break;
    case 'integer':
    case 'number':
      formElement.minimum = schemaElement.minimum || this.s.minimum;
      formElement.maximum = schemaElement.maximum || this.s.maximum;
      formElement.exclusiveMinimum = schemaElement.exclusiveMinimum || this.s.exclusiveMinimum;
      formElement.exclusiveMaximum = schemaElement.exclusiveMaximum || this.s.exclusiveMaximum;
      break;
  };

  switch(schemaElement.format) {
    case 'date':
      formElement.maxDate = schemaElement.maxDate || this.s.maxDate;
      formElement.minDate = schemaElement.minDate || this.s.minDate;
      break;
  }
};

FormNode.prototype._prepareEnumValues = function(formElement, schemaElement) {
  if (formElement.options) {
    this._prepareOptions(formElement);
  } else if (schemaElement['enum'] || schemaElement.type === 'boolean') {
    var enumValues = schemaElement['enum'];

    if (!enumValues) {
      enumValues = (formElement.type === 'select') ? ['', true, false] : [true, false];
    } else {
      formElement.optionsAsEnumOrder = true;
    }

    this._prepareOptions(formElement, enumValues);
  }

  // Flag a list of checkboxes with multiple choices
  if ((formElement.type === 'checkboxes' || formElement.type === 'checkboxbuttons') && schemaElement.items) {
    var theItem = _.isArray(schemaElement.items) ? schemaElement.items[0] : schemaElement.items;

    if (formElement.options) {
      // options only but no enum mode, since no enum, we can use only the value mode
      this._prepareOptions(formElement);
      theItem._jsonform_checkboxes_as_array = 'value';
    } else {
      var enumValues = theItem['enum'];

      if (enumValues) {
        this._prepareOptions(formElement, enumValues);
        formElement.optionsAsEnumOrder = true;
        theItem._jsonform_checkboxes_as_array = (formElement.type === 'checkboxes') ? true : 'value';
      }
    }
  }
};

FormNode.prototype._prepareOptions = function(formElement, schemaElement) {
  if (_.has(formElement, 'options')) {
    var options = formElement.options;

    if (_.isArray(options)) {
      formElement.options = _.map(options, (value) => {
        if (_.isObject(value)) {
          ASSERT.hasProperty(value, 'title');
          ASSERT.hasProperty(value, 'value');

          return value;
        } else if (_.isArray(value)) {
          ASSERT(value.length === 2, 'There must be exactly two elements for key and value in option');

          return {
            value: value[0],
            title: value[1],
          };
        } else {
          return {
            value: value,
            title: value,
          };
        }
      });
    } else if (_.isObject(formElement.options)) {
      formElement.options = [];

      _.each(options, (title, value) => {
        formElement.options.push({
          title: title,
          value: value,
        });
      });
    }
  } else if (_.has(schemaElement, 'enum') || schemaElement.type === 'boolean') {
    var enumValues = this._prepareEnumValues(formElement, schemaElement);

    if (formElement.titleMap) {
      ASSERT.ofTbType(enumValues, 'array');

      formElement.options = _.map(enumValues, function(value) {
        var title = value.toString();

        return {
          value: value,
          title: _.has(formElement.titleMap, title) ? formElement.titleMap[title] : title,
        };
      });
    } else {
      ASSERT.ofTbType(enumValues, 'array');

      formElement.options = _.map(enumValues, function(value) {
        return {
          value: value,
          title: value.toString(),
        }
      });
    }
  }
};
