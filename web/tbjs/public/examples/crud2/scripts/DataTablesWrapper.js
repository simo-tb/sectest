define(function(require) {
  const $ = require('jquery');
  const _ = require('lodash-4');
  const FormTree = require('FormTree');
  const tbXerrors = require('tb.xerrors');
  const bootstrap = require('bootstrap-3');
  const jsonForm = require('jf2');
  const tableCode = TB.parseQueryParams()['table_code'];


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
            jf_form_code: tableCode,
          }),
          this.service.request('get_record', {
            jf_form_code: tableCode,
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
            jf_form_code: tableCode,
          }),
          this.service.request('get_record', {
            jf_form_code: tableCode,
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
          ASSERT(_.isFunction(this.s.renderFunctions[ renderFnName ]), { msg: 'Render function is not defined: $renderFnName$', msgParams: { renderFnName } });

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
          ASSERT_PEER(!_.isNil(this.s.rowActionDefinitions[ actionDef ]), { msg: 'Unknown action definition of type: ', msgParams: { actionDef } });

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


  return DataTablesWrapper;
});
