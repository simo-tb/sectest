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
      // 'tbjson.url': 'tbjson.url-test',
      'url': 'tbjson.url',
      'lodash': 'lodash-4',
      'tbjf-select2-plugin': 'tbjf-select2',
    }
  },
  paths: {
    'jquery': 'https://ajax.googleapis.com/ajax/pub/jsonforms2/libs/jquery/3.1.1/jquery.min',
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
    
    'jquery.orderedselect': './pub/jsonforms2/deps/opt/orderedselect/jquery.orderedselect',
    'tbjf-select2': './pub/jsonforms2/deps/opt/tb-jf-plugins/select2/select2',
    'tbjf-daterangepicker': './pub/jsonforms2/deps/opt/tb-jf-plugins/daterangepicker/daterangepicker',
    'tbjf-datetimerangepicker': './pub/jsonforms2/deps/opt/tb-jf-plugins/datetimerangepicker/datetimerangepicker',
    'tbjf-questions': './pub/jsonforms2/deps/opt/tb-jf-plugins/questions/questions',
    'tbjf-datetime-plugin': './pub/jsonforms2/deps/opt/tb-jf-plugins/tbdatetimepicker/js/tb_datetimepicker',

    'tb.requirejs': '', // TODO
    'tb.xerrors': './pub/jsonforms2/deps/tbjs/js/tb.xerrors',
    'tb.core': './pub/jsonforms2/deps/tbjs/js/tb.core',
    'tb.dispatcher': './pub/jsonforms2/deps/tbjs/js/tb.dispatcher',
    'tb.livegrid': './pub/jsonforms2/deps/tbjs/js/tb.livegrid',
    'tb.service': './pub/jsonforms2/deps/tbjs/js/tb.service',
    'tb.request': './pub/jsonforms2/deps/tbjs/js/tb.request',
    'tb.file': './pub/jsonforms2/deps/tbjs/js/tb.file',
    'tb.template': './pub/jsonforms2/deps/tbjs/js/tb.template',
    'tb.translate': './pub/jsonforms2/deps/tbjs/js/tb.translate',
    
    'tbjson.jsonpointer': './pub/jsonforms2/deps/scripts/tbjson.jsonpointer',
    'tbjson.deepmerge': './pub/jsonforms2/deps/scripts/tbjson.deepmerge',
    'tbjson.ajv2tb': './pub/jsonforms2/deps/scripts/tbjson.ajv2tb',
    'tbjson.traverseSchema': './pub/jsonforms2/deps/scripts/tbjson.traverseSchema',
    'tbjson.traverse': './pub/jsonforms2/deps/scripts/tbjson.traverse',
    'tbjson.schemaResolver': './pub/jsonforms2/deps/scripts/tbjson.schemaResolver',
    
    'tbjson.url':'./pub/jsonforms2/deps/scripts/tbjson.url',
    // 'tbjson.url-test': './pub/jsonforms2/deps/scripts/tbjson.url-test',



    'jf.core': './pub/jsonforms2/lib/jf.core',
    'jf.utils': './pub/jsonforms2/lib/jf.utils',
    'jf.api': './pub/jsonforms2/lib/jf.api',
    'jf.tiny': './pub/jsonforms2/lib/jf.tiny',
    'jf.page': './pub/jsonforms2/lib/jf.page',
    'jf.ui': './pub/jsonforms2/lib/jsonform',
    'jf.jquery': './pub/jsonforms2/lib/jf.jquery',
    'jf.crud': '',
    'jf.p.plugin1': '',
    'jf.p.plugin2': '',
    'jf.p.plugin3': '',
    'playground': './pub/jsonforms2/playground/playground'
  }
});

//
// 'tbjf-select2',
// 'tbjf-daterangepicker', 'tbjf-datetimerangepicker', 'tbjf-questions',
//
//
// require('tbjf-select2'), require('tbjf-daterangepicker'),
// require('tbjf-datetimerangepicker'), require('tbjf-questions'),
