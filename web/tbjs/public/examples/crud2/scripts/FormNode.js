define(function(require) {
  const _ = require('lodash-4');

  class FormNode {
    constructor(rawNode) {
      this.ownerTree = rawNode.ownerTree;

      this.secondary = !!rawNode.secondary;
      this.primary = !rawNode.secondary;
      this.rawNode = rawNode;
      this.schema = rawNode.schema;
      this.uiField = rawNode.uiField;
      this.isVirtual = !rawNode.schema;
      this.pathStr = rawNode.path.join('');

      this.children = [];
      this.childrenPathMap = {};
      this.childrenFullPathMap = {};
    }

    get type() {
      return this._getUiFieldOrSchemaProperty('type', 'string');
    }

    get title() {
      return this._getUiFieldOrSchemaProperty('title');
    }

    get format() {
      return this._getUiFieldOrSchemaProperty('format');
    }

    get sortable() {
      return this._getUiFieldOrSchemaProperty('sortable');
    }

    get ordering() {
      let ordering;

      if(this.rawNode.uiField && this.rawNode.uiField.ordering >= -Infinity) {
        ordering = this.rawNode.uiField.ordering;
      } else if(this.rawNode.schema && this.rawNode.schema.ordering >= -Infinity) {
        ordering = this.rawNode.schema.ordering;
      }

      return ordering;
    }

    hasType(type) {
      return _.includes(this.type, type);
    }

    _getUiFieldOrSchemaProperty(fieldName, defaultValue) {
      let field = defaultValue;

      if(this.rawNode.uiField && this.rawNode.uiField[ fieldName ]) {
        field = this.rawNode.uiField[ fieldName ];
      } else if(this.rawNode.schema && this.rawNode.schema[ fieldName ]) {
        field = this.rawNode.schema[ fieldName ];
      }

      return field;
    }

    appendChild(ctxUiField, ctxSchema, path, fullPath) {
      let node = new FormNode({
        schema: ctxSchema,
        uiField: ctxUiField || {},
        path: path,
        fullPath: fullPath,
        secondary: ctxSchema && !!ctxSchema.secondary,
        ownerTree: this.ownerTree,
      });

      this.childrenPathMap[ path ] = node;
      this.childrenFullPathMap[ fullPath ] = node;

      this.children.push(node);
    }


    sortChildren() {
      this.children = this.children.sort((a, b) => {

        return (a.ordering < b.ordering)
          ? -1
          : (a.ordering > b.ordering)
            ? 1
            : (a.name < b.name)
              ? -1
              : (a.name > b.name)
                ? 1
                : 0;

      });
    }
  }

  return FormNode;
});
