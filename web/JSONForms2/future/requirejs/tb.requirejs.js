requirejs.config({
  config: {
    'jf': {
      dependencies: ['jf.plugin']
    }
  },
  map: {
  '*': {
      'underscore': 'lodash',
      'microplugin': 'microplugin-0.0',
      'sifter': 'sifter-0.5',
      'jquery-2': 'jquery',
      'moment': 'moment-2',
    }
  },
  paths: {
    'jquery': 'https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min',
    'lodash': 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash',

    'jquery': 'https://ajax.googleapis.com/ajax/libs/jquery/2.2.1/jquery.min',
    'ajv-4': 'https://cdnjs.cloudflare.com/ajax/libs/ajv/4.11.8/ajv.bundle',
    'lodash-4': 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash',
    'selectize-0': 'https://cdnjs.cloudflare.com/ajax/libs/selectize.js/0.12.4/js/selectize.min',
    'select2-4': 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.3/js/select2.min',
    'spectrum-1': 'https://cdnjs.cloudflare.com/ajax/libs/spectrum/1.8.0/spectrum.min',
    'moment-2': 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min',
    'tinymce-4': 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/4.6.4/tinymce.min',
    'ace-1': 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.8/ace',
    'bootstrap-datetimepicker-4': 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.17.47/js/bootstrap-datetimepicker.min',
    'bootstrap-3': 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/js/bootstrap',
    'bootstrap-typeahead-2': 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-3-typeahead/4.0.2/bootstrap3-typeahead.min',
    'jquery.ui-1': 'https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min',
    'sifter-0.5': 'https://cdnjs.cloudflare.com/ajax/libs/sifter/0.5.2/sifter.min',
    'microplugin-0.0': 'https://cdnjs.cloudflare.com/ajax/libs/microplugin/0.0.3/microplugin.min',
    
    'jquery.orderedselect': '/deps/opt/orderedselect/jquery.orderedselect',
    'tbjf-select2': '/deps/opt/tb-jf-plugins/select2/select2',
    'tbjf-daterangepicker': '/deps/opt/tb-jf-plugins/daterangepicker/daterangepicker',
    'tbjf-datetimerangepicker': '/deps/opt/tb-jf-plugins/datetimerangepicker/datetimerangepicker',
    'tbjf-questions': '/deps/opt/tb-jf-plugins/questions/questions',

    'tb.requirejs': '', // TODO
    'tb.xerrors': '/deps/tbjs/js/tb.xerrors',
    'tb.core': '/deps/tbjs/js/tb.core',
    'tb.dispatcher': '/deps/tbjs/js/tb.dispatcher',
    'tb.livegrid': '/deps/tbjs/js/tb.livegrid',
    'tb.service': '/deps/tbjs/js/tb.service',
    'tb.request': '/deps/tbjs/js/tb.request',
    'tb.file': '/deps/tbjs/js/tb.file',
    'tb.template': '/deps/tbjs/js/tb.template',
    'tb.translate': '/deps/tbjs/js/tb.translate',
    'tbjson.jsonpointer': '/deps/scripts/tbjson.jsonpointer',
    'tbjson.deepmerge': '/deps/scripts/tbjson.deepmerge',
    'tbjson.ajv2tb': '/deps/scripts/tbjson.ajv2tb',
    'tbjson.traverseSchema': '/deps/scripts/tbjson.traverseSchema',
    'tbjson.schemaResolver': '/deps/scripts/tbjson.schemaResolver',


    'jf.core': '/lib/jf.core',
    'jf.utils': '/lib/jf.utils',
    'jf.api': '/lib/jf.api',
    'jf.tiny': '/lib/jf.tiny',
    'jf.page': '/lib/jf.page',
    'jf.ui': '/lib/jsonform',
    'jf.jquery': '/lib/jf.jquery',
    'jf.crud': '',
    'jf.p.plugin1': '',
    'jf.p.plugin2': '',
    'jf.p.plugin3': ''
  }
});

//
// 'tbjf-select2',
// 'tbjf-daterangepicker', 'tbjf-datetimerangepicker', 'tbjf-questions',
//
//
// require('tbjf-select2'), require('tbjf-daterangepicker'),
// require('tbjf-datetimerangepicker'), require('tbjf-questions'),
