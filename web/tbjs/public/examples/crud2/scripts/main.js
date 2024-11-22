'use strict';

const JF_CODE = 'JF::jf_tables';

$(document).ready(function() {
  let service = new TB.RAService({
      apiUrl: '/cmsonline-admin/jsessidbddfd5c681a0cdef3d2335e85a2eb12b/jsonformapi',
      transportProtocol: 'jsonrpc2',
      httpMethod: 'GET',
      // requireCommandDefinition: true,
      payloadParams: {
        session_token: function() {
           return _.get(TB.SESSION_TOKEN, 'session.session_token', null);
        },
      },
      requestParams: {
        api_key: '6b3e93e3754a72b3687fefcb2de1b74d',
      },
      headers: {
        // Authorization: 'Basic aXZhbmxpOlBhcm9sYTQy'
      },
      withCredentials: true,
      commands: {

      },
    });


  let dta = new DataTablesApiWrapper({
    el: '#example',
    apiPrepareRequest: true,
    apiService: service,
    dtOptions: {
      serverSide: true,
      order: [],
    },
    renderFunctions: {
      renderImage: function(data) {
        return `CUSTOM HTML <img src="http://orig07.deviantart.net/bb0f/f/2011/224/6/6/rabbit_run_cycle_by_kium-d46celj.gif" width=50 heigth=50 /> ID${data.id}`;
      },
    },
    // rowActions: null,
  });

  dta.loadTable(JF_CODE)
    .then(() => {
      dta.renderDataTable();
    })
    .catch((err) => {
      console.log(err)
    });

} );

function DialogPromise($dialog) {
  let promise = new Promise(function(resolve, reject) {
    let cb = (evt) => { resolve($(evt.target).data('reason') ) };

    $dialog.one('hidden.bs.modal', () => { reject() });
    $dialog.find('button[data-resolve=modal]')
      .off('click', cb)
      .one('click', cb);
  });
  let result = _.merge($dialog, { promise: promise, });

  return result;
}

class DataTablesWrapper {
  /**
   * Description of what this does.
   *
   * @param {Array} [rowActionDefinitions]
   * @param {String} [rowActionDefinitions.bContent=''] content before icon
   * @param {String} [rowActionDefinitions.aContent=''] content after icon
   * @param {String} [rowActionDefinitions.title=''] text to be shown as title attribute of action buttons
   * @param {String} [rowActionDefinitions.iconClassName] class name of icon element inside action button. If not specified, no icon is displayed.
   * @param {String} [rowActionDefinitions.className='btn'] class name of displayed action button
   * @param {Boolean} [rowActionsGroup=true] should row actions be displayed as button group (e.g. bootstrap's `btn-group`)
   * @returns
   */
  constructor(settings) {
    /** @property Settings */
    this.s = _.merge({}, this.defaults, settings);

    console.log(this.s)

    /** @property Parsed formTree of defined table */
    if(this.s.formTree) {
      this.formTree = new FormTree(this.s.formTree);

      this.buildColumns();
    }

    /** @property jQuery element that hold's the table */
    this.$el = $(this.s.el);

    this._initModals();

    this.$el.on('click', '.tb-crud-btn-delete', (evt) => {
      let dtRow = this.getDtRowFromEvent(evt);
      let rowData = dtRow.data();

      this.$deleteModal.modal('show');

      DialogPromise(this.$deleteModal)
        .promise
        .then(function() {
          // TODO delete record
        });
    });


    this.$el.on('click', '.tb-crud-btn-view', (evt) => {
      let dtRow = this.getDtRowFromEvent(evt);

      this.$viewModal.modal('show');

      Promise.all([
        this.service.request('get_form', {
          jf_form_code: JF_CODE,
        }),
        this.service.request('get_record', {
          jf_form_code: JF_CODE,
          record_id: dtRow.id(),
        }),
      ])
        .then((resp) => {
          let [respForm, respContent] = resp;
          let formDefinition = {
            schema: this.formTree.root.rawNode.schema,
            form: respForm.form,
            content: respContent.record,
          };

          $(this.$viewModal.find('.crud-jsonform-body'))
            .empty()
            .jsonForm(_.cloneDeep(formDefinition));

          DialogPromise(this.$updateModal)
            .promise
            .then(function() {
              // TODO save record
            });
        });
    });


    this.$el.on('click', '.tb-crud-btn-update', (evt) => {
      let dtRow = this.getDtRowFromEvent(evt);

      this.$updateModal.modal('show');

      Promise.all([
        this.service.request('get_form', {
          jf_form_code: JF_CODE,
        }),
        this.service.request('get_record', {
          jf_form_code: JF_CODE,
          record_id: dtRow.id(),
        }),
      ])
        .then((resp) => {
          let [respForm, respContent] = resp;
          let formDefinition = {
            schema: this.formTree.root.rawNode.schema,
            form: respForm.form,
            content: respContent.record,
          };
          let $jsonFormEl = $(this.$updateModal.find('.crud-jsonform-body'));

          $jsonFormEl
            .empty()
            .jsonForm(_.cloneDeep(formDefinition));

          DialogPromise(this.$updateModal)
            .promise
            .then(() => {
              let value = $jsonFormEl.jsonFormValue();

              if(!value.errors) {
                let record = value.values;

                if(value.values) {
                    record.table = JSON.parse(record.table_json);
                }

                this.service.request('update_record', {
                  jf_form_code: JF_CODE,
                  record: record,
                });
              }
            });
        });
    });


    this.$createRecordBtn.on('click', () => {
      this.$createModal.modal('show');

      this.service.request('get_form', {
        jf_form_code: JF_CODE,
      })
        .then((resp) => {
          let formDefinition = {
            schema: this.formTree.root.rawNode.schema,
            form: resp.form,
            content: null,
          };

          let $jsonFormEl = $(this.$createModal.find('.crud-jsonform-body'));

          $jsonFormEl
            .empty()
            .jsonForm(_.cloneDeep(formDefinition));

          DialogPromise(this.$createModal)
            .promise
            .then(() => {
              let value = $jsonFormEl.jsonFormValue();

              if(!value.errors) {
                let record = value.values;

                if(value.values) {
                    record.table = JSON.parse(record.table_json);
                }

                this.service.request('update_record', {
                  jf_form_code: JF_CODE,
                  record: record,
                });
              }
            });
        });
    });

    this.buildService();
  }

  getDtRowFromEvent(evt) {
    // TODO ако случайно в клетката има друг tr, то не трябва да се използва $.fn.closest()
    let targetTr = evt.currentTarget.closest('tr');
    let dtRow = this.dt.row(targetTr);

    return dtRow;
  }

  get defaults () {
    return {
      dtOptions: {
        searching: false,
        autoWidth: false,
        rowId: 'id',
        retrieve: true,
        pagingType: 'full',
        lengthMenu: [ [10, 25, 50, -1], [10, 25, 50, "∞"] ],
      },
      apiPrepareRequest: null,
      apiService: null,
      rowActions: [
        'preview',
        'update',
        'delete',
      ],
      rowActionsGroup: true,
      renderFunctions: {
        actions: () => this.buildRowActions(),
        number: (d) => { return `${d}`; },
        date: (d) => { return d; },
        time: (d) => { return d; },
        datetime: (d) => { return d; },
        json: (d) => { return JSON.stringify(d); },
        boolean: (d) => `<input type="checkbox" name="checked" readonly="readonly" onclick="return false" value=""${ (d) ? ' checked="checked"' : '' }>`,
      },
      rowActionDefinitions: {
        preview: {
          className: 'btn-info tb-crud-btn-view',
          iconClassName: 'fa fa-eye',
          title: 'Preview',
        },
        update: {
          className: 'btn-primary tb-crud-btn-update',
          iconClassName: 'fa fa-edit',
          title: 'Update',
        },
        delete: {
          className: 'btn-danger tb-crud-btn-delete',
          iconClassName: 'fa fa-trash',
          title: 'Delete',
        },
      },
    };
  }

  _initModals() {
    this.$createRecordBtn = $(`<button type="button" class="btn btn-primary tb-crud-btn-create">Create</button>`);
    this.$el.after(this.$createRecordBtn);

    this.$deleteModal = $(`
      <div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="Confirm deletion of record">
        <div class="modal-dialog modal-sm" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 class="modal-title">Confirm deletion</h4>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete this row?</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
              <button type="button" class="btn btn-danger" data-resolve="modal" data-reason="delete">Delete data</button>
            </div>
          </div>
        </div>
      </div>
    `).modal({
      show: false,
    });

    this.$createModal = $(`

      <div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="Create new record">
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 class="modal-title">Create new record</h4>
            </div>
            <div class="modal-body">
              <div class="modal-body" style="padding-top: 0px; padding-bottom: 0px;">
                <div class="crud-jsonform-body"></div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" data-resolve="modal" data-reason="create">Create record</button>
            </div>
          </div>
        </div>
      </div>

      `);

    this.$viewModal = $(`

      <div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="View record">
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 class="modal-title">View record</h4>
            </div>
            <div class="modal-body">
              <div class="modal-body" style="padding-top: 0px; padding-bottom: 0px;">
                <div class="crud-jsonform-body"></div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>

      `);

    this.$updateModal = $(`

      <div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="Update record">
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 class="modal-title">Update record</h4>
            </div>
            <div class="modal-body">
              <div class="modal-body" style="padding-top: 0px; padding-bottom: 0px;">
                <div class="crud-jsonform-body"></div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" data-resolve="modal" data-reason="create">Update record</button>
            </div>
          </div>
        </div>
      </div>

      `);
  }

  setFormTree(formTree) {
    this.formTree = new FormTree(formTree);

    this.buildColumns();
  }

  renderDataTable() {
    let dtOptions = _.defaults({}, this.s.dtOptions, {
      columns: this.columns,
    });

    this.dt = this.$el.DataTable( dtOptions );
  }

  buildColumns() {
    // Store cols in hash with keys of ordering and value as array of columns. In perfect case there must be exactly one element in the array. In case of collision, there must be two or more and will be ordered by key.
    let colsHash = {};
    // let rowActions = this.buildRowActions();

    // Extract columns from schema
    this.formTree.root.children.forEach((node) => {
      let renderFnName = _.get(node, 'uiField.renderFn');
      let dtCol = _.defaults({
        name: node.pathStr,
        orderable: !!node.sortable,
        data: (node.isVirtual) ? null : node.pathStr,
        __node: node,
      }, node.uiField.dtCol);

      dtCol.title = dtCol.title || node.title;

      if(node.hasType('number') || node.hasType('integer') || node.format === 'numeric') {
        renderFnName = renderFnName || 'number';
        dtCol.type = 'num';
      } else if(node.hasType('boolean')) {
        // TODO unable to sort by boolean
        renderFnName = renderFnName || 'boolean';
      } else if(node.format === 'date' || node.format === 'datetime' || node.format === 'time') {
        dtCol.type = 'date';
      }

      if(_.isString(renderFnName)) {
        ASSERT(_.isFunction(this.s.renderFunctions[ renderFnName ]), 'Render function is not defined: %s', renderFnName);

        dtCol.render = this.s.renderFunctions[ renderFnName ];
      }

      let ordering = _.isInteger(+node.ordering) ? +node.ordering : 'UNKNOWN';

      colsHash[ ordering ] = colsHash[ ordering ] || [];
      colsHash[ ordering ].push(dtCol);
    });

    let orderings = Object.keys(colsHash).sort();
    let colsArr = [];
    let primaryColsArr = [];

    _.forEach(orderings, (ordering) => {
      let cols = colsHash[ ordering ];

      if(ordering.length > 1)  {
        ordering = _.sortBy(cols, (col) => col.title);
      }

      primaryColsArr = colsArr.concat(_.filter(ordering, (col) => {
        return !col.__node.primary;
      }));

      colsArr = colsArr.concat(ordering);
    });

    this.colNamesArr = _.map(colsArr, (col) => col.name);
    this.columns = colsArr;
    this.primaryCols = primaryColsArr;
  }

  buildRowActions() {
    // if not defined, return null
    if(_.isNil(this.s.rowActions)) {
      return null;
    }

    ASSERT_PEER(_.isArray(this.s.rowActions));

    let rowActionsHtml = '';

    this.s.rowActions.forEach((actionDef) => {
      // short definition of action of `preview`, `edit` and `delete` or any custom type
      if(_.isString(actionDef)) {
        ASSERT_PEER(!_.isNil(this.s.rowActionDefinitions[ actionDef ]), 'Unknown action definition of type: ' + actionDef);

        actionDef = this.s.rowActionDefinitions[ actionDef ];
      }

      ASSERT_PEER(_.isObject(actionDef));

      // object definition of action
      let icon = '';
      let className = `btn ${actionDef.className || ''}`;
      let content = '';

      if(actionDef.iconClassName) {
        icon = `<i class="${ actionDef.iconClassName }"></i>`;
      }

      content = `${ actionDef.bContent || '' }${ icon }${ actionDef.aContent || '' }`;
      rowActionsHtml += `<button type="button" class="${ className }" title="${ actionDef.title || '' }">${ content }</button>`;
    });

    // If no rowActions build, return null
    if(!rowActionsHtml) {
      return null;
    }

    // Check if needed to wrap rowActions in `btn-group`
    if(this.s.rowActionsGroup === true) {
      rowActionsHtml = `<div class="btn-group">${rowActionsHtml}</div>`;
    }

    return rowActionsHtml;
  }
}



class DataTablesApiWrapper extends DataTablesWrapper {

  constructor(settings) {
    super(settings);

    this.buildService();

    this.buildRequest(this.s.dtOptions);
  }

  loadTable(tableCode, schemaId = null) {
    const getUiTable = (tableCode) => { return this.service.request('get_table', { jf_table_code: tableCode, })};
    const getSchema = (schemaId) => { return this.service.request('get_jsonschema', { schema_id: schemaId, })};
    const getUiTableAndSchemaHandler = (resultArr) => {
      if(resultArr.length < 2) {
        return Promise.all([
          resultArr[0],
          getSchema(_.get(resultArr[0], 'table.schemaId')),
        ])
          .then(getUiTableAndSchemaHandler);
      }

      return {
        tableCode: resultArr[0].code,
        table: resultArr[0].table,
        schema: resultArr[1].schema,
      }
    }
    const promises = [getUiTable(tableCode)];

    if(schemaId) {
      promises.push(getSchema(schemaId));
    }

    return Promise.all(promises)
      .then(getUiTableAndSchemaHandler)
      .catch((err) => {
        console.log('Error', arguments);
        throw err;
      })
      .then((formTree) => {
        this.setFormTree(formTree)
        console.log(this.formTree.extractFiltersForm());

        try {
          var a = $('<div></div>');
          a.jsonForm(this.formTree.extractFiltersForm());

          $('#example').before(a)
        } catch(e) {
          console.info(e)
        }
      });
  }

  buildService() {
    if(_.isObject(this.s.apiService)) {
      this.service = this.s.apiService;
    }

    if(this.s.apiService === true) {
      throw new Error('Not implemented yet');
    }
  }

  buildRequest(dtOptions) {
    if(this.s.apiPrepareRequest !== true && !_.isFunction(this.s.apiPrepareRequest)) {
        return dtOptions;
    }

    let apiPrepareRequest;

    if(this.s.apiPrepareRequest === true) {
      apiPrepareRequest = (data, cb, dtOptions, dtWrapper) => {
        let newData = {
          limit: data.length,
          offset: data.start,
          page: data.draw,
          table: 'jf_tables',
          ordering: [],
        };

        if(_.isArray(data.order)) {
          _.forEach(data.order, (obj) => {
            let colName = dtWrapper.colNamesArr[ obj.column ];
            let dir = obj.dir;

            newData.ordering.push([colName, dir])
          });
        }

        dtWrapper.service.request('crud_list', newData)
          .then((resp) => {
            let dtData = {
              data: resp.data,
              recordsTotal: resp.records_total,
              recordsFiltered: resp.records_filtered,
              draw: resp.page,
            };

            cb(dtData);
          })
          .catch((err) => {
            console.log(err);
            // alert('WHATCHA GONNA DO?!?');
          });
      };
    } else if(_.isFunction(this.s.apiPrepareRequest)) {
      apiPrepareRequest = this.s.apiPrepareRequest;
    }

    let dtWrapper = this;

    dtOptions.ajax = function(data, cb, dtOptions) {
      return apiPrepareRequest.call(this, data, cb, dtOptions, dtWrapper);
    };

    return dtOptions;
  }

}


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
        ASSERT(_.isObject(ctxUiField), 'Must be defined UI field');
        ASSERT(ctxUiField.isActionsCol === true || !_.isNil(ctxUiField.dtCol), 'Must be either actions col or dtCol');

        this.parseSchemaScalar(ctxUiField, ctxSchema, [path]);
      } else {
        this.parseSchemaScalar(ctxUiField, ctxSchema, [path]);
      }
    });

    this.sortTree();
  }

  parseSchemaProp (ctxSchema, pathArr) {
    ASSERT_PEER(!_.isNil(ctxSchema.type), 'JSON schema must have property "type"');

    if(ctxSchema.type === 'object') {
        this.parseSchemaObj(ctxSchema, pathArr);
    } else if (ctxSchema.type === 'array') {
      this.parseSchemaObj(ctxSchema, pathArr);
    } else {
      this.parseSchemaScalar(null, ctxSchema, pathArr);
    }
  }

  parseSchemaObj (schema, pathArr) {
    ASSERT_PEER(_.isObject(schema.properties), 'JSON schema must have property "properties" of type "object"');

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
