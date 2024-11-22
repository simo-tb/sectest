

var _ = require('lodash');
var url = require('url');
var deepmerge = require('deepmerge');
var jsonpointer = require('json-pointer-rfc6901');
var ASSERT_PEER = require('assert');
var ASSERT = ASSERT_PEER;

function hasType (schemaType, checkWith) {
  return _.includes(schemaType, checkWith);
}

var REGEX_PATH_SEGMENT_ENDS_IN_ARRAY_WILDCARD = /.+\[]/;
var REGEX_PATH_SEGMENT_ENDS_IN_OBJECT_WILDCARD = /.+\{\}/;

var SchemaResolver = function (rootSchema, s) {
  this.s = s || {};
  this.rootSchema = rootSchema;

  this._cache = {};
  this._refSchemas = rootSchema.$$refSchemas || {};
};

SchemaResolver.prototype.normalizeUrlPointer = function (pointer) {
  return pointer.replace(/^#/, '');
};

SchemaResolver.prototype.resolveSchema = function (schema, opts) {
  if (_.isNil(schema)) return schema;

  opts = opts || { refsSoFar: [] };

  ASSERT_PEER(_.isNil(schema.$ref) || _.isNil(schema.$merge), { code: 'TB/JFUtils/11050', msg: 'Schema must have either $ref or $merge, but not both at the same time. Check schema $SCHEMA$', msgParams: { SCHEMA: schema } });

  schema = this._resolveRefs(schema, opts);
  schema = this._resolveMerges(schema, opts);

  return schema;
};

SchemaResolver.prototype._resolveRefs = function (parentSchema, opts) {
  if (_.isNil(parentSchema) || !_.isString(parentSchema.$ref)) return parentSchema;

  var schema = parentSchema;
  var ref = schema.$ref;
  var schemaParser = this;

  if (opts.refsSoFar.indexOf(schema.$ref) >= 0) {
    throw new Error('reference loop');
  }

  var parsed = url.parse(ref);
  var hash = parsed.hash;

  if (ref.slice(0, 2) !== '#/') {
    // because url contains hash, we must rebuild it
    var schemaId = [parsed.protocol ? (parsed.protocol + '//') : '', parsed.host || '', parsed.path || ''].join('');

    // get schemaParser for the new schemaId found
    if (this._refSchemas[ schemaId ]) {
      schemaParser = this.findParentSchemaResolver(schemaId);

      // if not build already, create new schema parser
      if (!schemaParser) {
        schemaParser = new SchemaResolver(this._refSchemas[ schemaId ], {
          parentParser: this
        });
      }
    } else {
      // if schema not found in $$refSchemas property, fallback to `definitions` property
      hash = '#/definitions/' + jsonpointer.escape(ref);
    }
  }

  opts.refsSoFar.push(schema.$ref);

  if (hash) {
    schema = jsonpointer.get(schemaParser.rootSchema, hash);
  } else {
    schema = schemaParser.rootSchema;
  }

  schema = schemaParser.resolveSchema(schema, opts);

  return schema;
};

/**
 * Resolve $merge keywords
 * @param  {Object} parentSchema Schema to resolve $merge on
 * @param  {Object} opts         Additional data for current resolution
 * @return {Object}              Merged schema
 */
SchemaResolver.prototype._resolveMerges = function (parentSchema, opts) {
  if (_.isNil(parentSchema)) return parentSchema;

  var schema = parentSchema;

  if (_.isObject(schema.$merge)) {
    var sourceSch = this.resolveSchema(parentSchema.source, opts);
    var withSch = this.resolveSchema(parentSchema.with, opts);

    schema = deepmerge(sourceSch, withSch);
  }

  return schema;
};


// equal to getByPointer
SchemaResolver.prototype.getSchemaBySchemaPointer = function (pointer, opts) {

};

SchemaResolver.prototype.getSchemaByContentPointer = function (pointer, opts) {

};

SchemaResolver.prototype.findParentSchemaResolver = function (schemaId) {
  var parser = null;

  if (this.s.parentParser) {
    if (this.s.parentParser.rootSchema.id === schemaId) {
      parser = this.s.parentParser;
    } else {
      this.s.parentParser.findParentSchemaResolver(schemaId);
    }
  }

  return parser;
};

SchemaResolver.prototype._searchInObj = function (schema, key, opts) {
  // ignore patternProperties, because they are ambivalent
  if (_.isObject(schema.properties)) {
    schema = schema.properties[ key ];

    opts.schemaPath.push('properties');
    opts.schemaPath.push(key);
  } else if (opts.useAdditionalProperties && _.isObject(schema.additionalProperties)) {
    schema = schema.additionalProperties;

    opts.schemaPath.push('additionalProperties');
  } else {
    // unable to resolve schema
    schema = undefined;
  }

  return schema;
};

SchemaResolver.prototype._searchInArr = function (schema, key, opts) {
  if (_.isInteger(+key)) {
    if (_.isObject(schema.items)) {
      schema = schema.items;
    } else if (_.isArray(schema.items)) {
      // return schema if there is such element
      if (schema.items.length > parseInt(key)) {
        schema = schema.items[ key ];
        opts.schemaPath.push('items');
        opts.schemaPath.push(key);
      } else if (_.isObject(schema.additionalItems)) {
        schema = schema.additionalItems;
        opts.schemaPath.push('additionalItems');
      } else {
        // unable to resolve schema
        schema = undefined;
      }
    }
  } else {
    // unable to resolve schema
    schema = undefined;
  }

  return schema;
};

SchemaResolver.prototype._searchInOneOf = function (parentSchema, key, opts) {
  if (!opts.useOneOfSchema) return parentSchema;

  ASSERT(_.isObject(opts.useOneOfSchema));

  var soFarPointer = jsonpointer.compilePointer(opts.soFarPointerArr);
  var schema = parentSchema;

  if (opts.useOneOfSchema.hasOwnProperty(soFarPointer)) {
    var oneOfConfig = opts.useOneOfSchema[ soFarPointer ];

    ASSERT(_.isObject(schema.oneOf));
    ASSERT(_.isObject(oneOfConfig));
    ASSERT(_.isInteger(oneOfConfig.index));

    var oneOfSchema = schema.oneOf[ oneOfConfig.index ];

    ASSERT(_.isObject(oneOfSchema));

    opts.schemaPath.push('oneOf');
    opts.schemaPath.push(oneOfConfig.index);

    schema = this._search(oneOfSchema, key, opts);
  }

  return schema;
};

SchemaResolver.prototype._search = function (parentSchema, key, opts) {
  if (_.isNil(parentSchema)) return parentSchema;

  var resolvedSchema = this.resolveSchema(parentSchema, opts);
  var schema = resolvedSchema;

  if (_.isNil(schema)) return schema;

  if(opts.requirements[ opts.depth ]) {
    return schema[ opts.requirements[ opts.depth ] ];
  }

  // ignore allOf, and anyOf, because they are all ambivalent, but use oneOf as they are used in alternative forms
  schema = this._searchInOneOf(schema, key, opts);

  // schema !== resolvedSchema if found new schema in oneOf property
  if (schema === resolvedSchema || schema === undefined) {
    if (schema === undefined) schema = resolvedSchema;

    if (hasType(schema.type, 'object')) {
      schema = this._searchInObj(schema, key, opts);
    } else if (hasType(schema.type, 'array')) {
      schema = this._searchInArr(schema, key, opts);
    } else {
      // unable to resolve schema
      schema = undefined;
    }
  }

  return schema;
};

SchemaResolver.prototype.getByPointer = function (pointer, opts) {
  var pathArr = jsonpointer.parsePointer(pointer);
  var childSch = this.rootSchema;

  // opts keeps track of current search, as well as passing additional settings
  opts = Object.assign({}, opts || {});
  opts = Object.assign(opts, {
    schemas: [],
    schemaPath: ['#'],
    soFarPointerArr: [''],
    refsSoFar: [],
    depth: 0
  });

  // loop trough each part of json pointer
  for (var i = 0, l = pathArr.length; i < l; i++) {
    var key = pathArr[ i ];

    opts.soFarPointerArr.push(key);

    childSch = this._search(childSch, key, opts);

    opts.schemas.push({ key: key, val: childSch });
    opts.depth++;

    if (childSch === undefined) {
      break;
    }
  }

  childSch = this.resolveSchema(childSch, opts);

  return childSch;
};

SchemaResolver.prototype.getSchemaByFormPointer = function (pointer, opts) {
  var pointerArr = jsonpointer.parsePointer(pointer);

  opts = opts || {};
  opts.requirements = {};

  pointerArr.forEach(function (key, i) {
    var depth = i;

    if (REGEX_PATH_SEGMENT_ENDS_IN_ARRAY_WILDCARD.test(key)) {
      opts.requirements[ depth ] = 'items';
    }

    if (REGEX_PATH_SEGMENT_ENDS_IN_OBJECT_WILDCARD.test(key)) {
      opts.requirements[ depth ] = 'addtionalProperties';
    }
  });

  this.getByPointer(pointer, opts);
};

SchemaResolver.prototype.getParentSchemaByFormPointer = function (pointer, opts) {
  var pointerArr = jsonpointer.parsePointer(pointer);

  pointerArr.pop();

  var newPointer = jsonpointer.compile(pointerArr);

  return this.getSchemaByFormPointer(newPointer);
};

module.exports = SchemaResolver;
