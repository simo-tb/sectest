define(function(require) {
  const _ = require('lodash-4');
  const DataTablesWrapper = require('DataTablesWrapper');
  console.log(666);

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

  return DataTablesApiWrapper;
});
