define(function(require) {
  const _ = require('lodash-4');
  const FormNode = require('FormNode');

  class FormTree {
    constructor (s) {
      this.s = _.assign({}, this.defaults, s);

      this.root = new FormNode({
        schema: this.s.schema,
        table: this.s.table,
        path: [],
        fullPath: [],
        ownerTree: null,
      });

      this.parseTree();
    }

    getSchemaByPath (path) {
      return _.get(this.s.schema, ['properties', path]);
    }

    parseTree() {
      _.forEach(this.s.table.columns, (ctxUiField, path) => {
        let ctxSchema = this.getSchemaByPath(path);

        if(_.isNil(ctxSchema)) {
          ASSERT(_.isObject(ctxUiField), { msg: 'Must be defined UI field' });
          ASSERT(ctxUiField.isActionsCol === true || !_.isNil(ctxUiField.dtCol), { msg: 'Must be either actions col or dtCol' });

          this.parseSchemaScalar(ctxUiField, ctxSchema, [path]);
        } else {
          this.parseSchemaScalar(ctxUiField, ctxSchema, [path]);
        }
      });

      this.sortTree();
    }

    parseSchemaProp (ctxSchema, pathArr) {
      ASSERT_PEER(!_.isNil(ctxSchema.type), { msg: 'JSON schema must have property "type"' });

      if(ctxSchema.type === 'object') {
        this.parseSchemaObj(ctxSchema, pathArr);
      } else if (ctxSchema.type === 'array') {
        this.parseSchemaObj(ctxSchema, pathArr);
      } else {
        this.parseSchemaScalar(null, ctxSchema, pathArr);
      }
    }

    parseSchemaObj (schema, pathArr) {
      ASSERT_PEER(_.isObject(schema.properties), { msg: 'JSON schema must have property "properties" of type "object"' });

      _.forEach(schema.properties, (property, key) => {
        let path = pathArr.concat(key);
        let fullPath = pathArr.concat('properties', key);

        this.root.appendChild(null, property, path, fullPath);
      });
    }

    parseSchemaArr (schema, pathArr) {
      if(_.isObject(schema.items)) {
        _.forEach(schema.items, (property, key) => {
          let path = pathArr.concat('items[]', key);
          let fullPath = pathArr.concat('items', key);

          this.root.appendChild(null, property, path, fullPath);
        });
      } else if (_.isArray(schema.items)) {
        _.forEach(schema.items, (property, index) => {
          let path = pathArr.concat(index);
          let fullPath = pathArr.concat('items', index);

          this.root.appendChild(null, property, path, fullPath);
        });
      } else {
        THROW_PEER('JSON schema of type "array" must have property "items" of type "object" or "array"');
      }
    }

    parseSchemaScalar(ctxUiField, ctxSchema, pathArr) {
      this.root.appendChild(ctxUiField, ctxSchema, pathArr, pathArr);
    }

    extractFiltersForm() {
      // TODO далеч от завършено, трябва да създаде напълно годна схема за филтрите

      if(!this.root) {
        throw new Error('Undefined root');
      }

      let tree = {
        schema: {
          id: 'test',
          type: "object",
          properties: {},
        },
        form: {
          jsonformVersion: '2.0',
          schemaId: 'test',
        },
      };

      this.root.children.forEach((formNode) => {
        if(formNode.isVirtual === true) {
          return;
        }

        let searchable = _.get(formNode, 'schema.searchable');

        if(!_.isNil(searchable) && searchable !== 'none') {
          tree.schema.properties[formNode.rawNode.fullPath.join()] = formNode.rawNode.schema;
        }
      });


      return tree;
    }

    sortTree() {
      this.root.sortChildren();
    }
  }

  return FormTree;
});
