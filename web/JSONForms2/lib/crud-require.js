requirejs.config({
  paths: {
    'jf.crud': 'jsonforms2/lib/jf.crud',
    'jf.multiple-import-export': 'jsonforms2/lib/jf.multiple-import-export',
  },
  shim: {
    'jf.multiple-import-export': ['jf.crud'],
  }

});

define(function(require) {
  console.log("Before standalone require load");
  require('standalone-jf-require');
  console.log("After standalone require load");
  require('jf.crud');
  console.log("After jfcrud load");
  require('jf.multiple-import-export');
});

