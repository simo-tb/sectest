define(function (require) {
  var TB = require('tb.core');

  console.log(TB, 1)

  // return;
  const $ = require('jquery');
  const _ = require('lodash-4');
  const dataTables = require('datatables.net');
  const dataTablesBootstrap = require('datatables-bootstrap-1');
  const ajv = require('ajv-4');
  const tbCore = require('tb.core');
  const tbXerrors = require('tb.xerrors');
  const tbRequest = require('tb.request');
  const tbService = require('tb.service');
  const DataTablesApiWrapper = require('DataTablesApiWrapper');

  const JF_CODE = 'JF::jf_tables';

  const $title = $('h1');
  const qParams = tbCore.parseQueryParams();

  $title.text(qParams['table_title']);

  let service = new TB.RAService({
//      apiUrl: 'http://10.21.2.44/xpay-9086/backoffice/jsessidb984c8e8a25b104c373cd20d4a6cb645/jsonformapi',
      apiUrl: 'jsonformapi',
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
        api_key: '632902af9f596a38ddcc34390cec39ea',
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

  dta.loadTable(qParams['table_code'])
    .then(() => {
      dta.renderDataTable();
    })
    .catch((err) => {
      console.log(err)
    });
});
