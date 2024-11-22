requirejs.config({
  map: {
    '*' : {
      'lodash-4': 'lodash',
      'langsheet/bower_components/lodash/lodash': 'lodash',
      'underscore': 'lodash',
      'jquery-2': 'jquery',
      'langsheet/bower_components/jquery/dist/jquery': 'jquery',

      'langsheet/bower_components/bootstrap/dist/js/bootstrap.min': 'jslibs/bootstrap-3.3.5/dist/js/bootstrap.min',

      'langsheet/scripts/vendor/tbjs/tb.core': 'tb.core',
      'langsheet/scripts/vendor/tbjs/tb.xerrors': 'tb.xerrors',
      'langsheet/scripts/vendor/tbjs/tb.request': 'tb.request',
      'langsheet/scripts/vendor/tbjs/tb.file': 'tb.file',
      'langsheet/scripts/vendor/tbjs/tb.dispatcher': 'tb.dispatcher',
      'langsheet/scripts/vendor/tbjs/tb.service': 'tb.service',
      'langsheet/scripts/vendor/tb.translate': 'tb.translate',

      'langsheet/bower_components/backbone/backbone': 'langsheet/bower_components/backbone/backbone',
      'langsheet/bower_components/handsontable/dist/handsontable.full': 'langsheet/bower_components/handsontable/dist/handsontable.full',
      'langsheet/bower_components/pofile/dist/pofile': 'langsheet/bower_components/pofile/dist/pofile',
  
      'langsheet/scripts/views/languagesdropdown': 'langsheet/scripts/views/languagesDropdown',
    }
  },
  paths: {
    'tb.translate': 'langsheet/scripts/vendor/tb.translate',
  },
  shim: {

    'langsheet/bower_components/pofile/dist/pofile': {
      'deps': ['langsheet/bower_components/backbone/backbone',  'langsheet/bower_components/handsontable/dist/handsontable.full'],
    },

    'langsheet/scripts/templates': {
      'deps': ['langsheet/bower_components/pofile/dist/pofile'],
    },

    'langsheet/scripts/main': {
      'deps': ['langsheet/scripts/templates']
    },

    'langsheet/scripts/routes/application': {
      'deps': ['langsheet/scripts/main'],
    },

    'langsheet/scripts/models/translateelem': {
      'deps': ['langsheet/scripts/routes/application'],
    },

    'langsheet/scripts/collections/translateelem': {
      'deps': ['langsheet/scripts/models/translateelem']
    },

    'langsheet/scripts/models/language': {
      'deps': ['langsheet/scripts/collections/translateelem'],
    },

    'langsheet/scripts/collections/language': {
      'deps': ['langsheet/scripts/models/language'],
    },

    'langsheet/scripts/views/languagesDropdown': {
      'deps': ['langsheet/scripts/collections/language'],
    },

    'langsheet/scripts/views/application': {
      'deps': ['langsheet/scripts/views/languagesDropdown'],
    },

    'langsheet/scripts/views/help': {
      'deps': ['langsheet/scripts/views/application'],
    },

    'langsheet/scripts/models/component': {
      'deps': ['langsheet/scripts/views/help'],
    },

    'langsheet/scripts/collections/component': {
      'deps': ['langsheet/scripts/models/component'],
    },

    'langsheet/scripts/views/components': {
      'deps': ['langsheet/scripts/collections/component'],
    },

    'langsheet/scripts/views/dashboard': {
      'deps': ['langsheet/scripts/views/components']
    },

    'langsheet/scripts/models/application': {
      'deps': ['langsheet/scripts/views/dashboard'],
    },

    'langsheet/scripts/views/import': {
      'deps': ['langsheet/scripts/models/application'],
    },

    'langsheet/scripts/models/import': {
      'deps': ['langsheet/scripts/views/import'],
    },
  },
}); 



console.log("TOPLEVEL of langsheet-require-main");

define(function(require) {
  console.log("LANGSHEET: LEVEL0 of the define!");

  require('langsheet/bower_components/jquery/dist/jquery');
  require('langsheet/bower_components/lodash/lodash');
  require('langsheet/bower_components/bootstrap/dist/js/bootstrap.min');

  console.log("LANGSHEET: LEVEL1 of the define!");
  require('langsheet/scripts/vendor/tbjs/tb.core');
  require('langsheet/scripts/vendor/tbjs/tb.xerrors');
  require('langsheet/scripts/vendor/tbjs/tb.request');
  require('langsheet/scripts/vendor/tbjs/tb.file');
  require('langsheet/scripts/vendor/tbjs/tb.dispatcher');
  require('langsheet/scripts/vendor/tbjs/tb.service');

  require('langsheet/scripts/vendor/tb.translate');
  console.log("LANGSHEET: LEVEL2 of the define!");

  require('langsheet/bower_components/backbone/backbone');
  let HandsontableRequire = require('langsheet/bower_components/handsontable/dist/handsontable.full');
  window.Handsontable = HandsontableRequire;
  require('langsheet/bower_components/pofile/dist/pofile');

  console.log("LANGSHEET: LEVEL3 of the define!");

  require('langsheet/scripts/templates');

  require('langsheet/scripts/main');


  require('langsheet/scripts/routes/application');
  require('langsheet/scripts/models/translateelem');
  require('langsheet/scripts/collections/translateelem');
  require('langsheet/scripts/models/language');
  require('langsheet/scripts/collections/language');
  require('langsheet/scripts/views/languagesdropdown');
  require('langsheet/scripts/views/application');
  require('langsheet/scripts/views/help');
  require('langsheet/scripts/models/component');
  require('langsheet/scripts/collections/component');
  require('langsheet/scripts/views/components');
  require('langsheet/scripts/views/dashboard');
  require('langsheet/scripts/models/application');
  require('langsheet/scripts/views/import');
  require('langsheet/scripts/models/import');

  // stolen from langsheet/scripts/main 
  TRACE('Starting Langsheet');
  Langsheet.init();
});

console.log("END TOPLEVEL of langsheet-require-main");


