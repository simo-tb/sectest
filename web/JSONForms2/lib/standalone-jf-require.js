requirejs.config({
  map: {
    '*' : {
      'lodash-4': 'lodash',
      'jquery-2': 'jquery',
      //'select2': 'select2-4',
      'moment-2': 'moment',
      'bootstrap-datetimepicker-4': 'bootstrap-datetimepicker',
      'jsonforms2/lib/jsonform': 'jf.ui',
      'jsonforms2/lib/jf.api': 'jf.api',
      'ajv': 'ajv-4',
      'tbjson-generatesubtree': 'jsonforms2/deps/scripts/tbjson.generatesubtree',
    }
  },
  paths: {
    'jquery': 'jslibs/jquery-2.2.4/jquery-2.2.4.min',
    'select2-4': 'jsonforms2/deps/opt/select2-4.0.0/dist/js/select2.full',
    'jquery-ui-custom': 'jsonforms2/deps/opt/jqueryui/jquery.ui.custom',
    'jsoneditor-5': 'cdn/jsoneditor-5.22.0/jsoneditor.min',
    'jf.utils': 'jsonforms2/lib/jf.utils',
    'jf.jquery': 'jsonforms2/lib/jf.jquery',
    'jf.tab-controls': 'jsonforms2/lib/plugins/tab-controls',
  },
  shim: {
    'jf.ui': ['jslibs/bootstrap-3.3.5/dist/js/bootstrap.min'],
  },
}); 



console.log("TOPLEVEL of standalone-jf-require");

define(function(require) {
  console.log("REQUIREJS: LEVEL1 of standalone-jf-require");
  require('ajv');
  require('bootstrap-datetimepicker-4');
  require('jquery-2');
  require('jsoneditor-5');

  require('jsonforms2/lib/jsonform');
  require('jquery-ui-custom');
    
  console.log("REQUIREJS: LEVEL2 of standalone-jf-require");

  require('jsonforms2/deps/opt/tb-jf-plugins/select2/select2');
  require('jsonforms2/deps/opt/tb-jf-plugins/tbdatetimepicker/js/tb_datetimepicker');
  require('jsonforms2/deps/opt/tb-jf-plugins/questions/questions');
  require('jsonforms2/deps/opt/tb-jf-plugins/datetimerangepicker/datetimerangepicker');
  require('jsonforms2/deps/opt/tb-jf-plugins/daterangepicker/daterangepicker');
  require('jsonforms2/deps/opt/orderedselect/jquery.orderedselect');
  require('jsonforms2/lib/jf.api');
  require('jf.utils');
  require('jf.jquery');
  require('jf.tab-controls');
  require('tbjson-generatesubtree');

  console.log("REQUIREJS: End of standalone-jf-require");
});

