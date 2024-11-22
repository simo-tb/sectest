requirejs.config({
  paths: {
    'jf.page': 'jsonforms2/lib/jf.page',
    'jf-import-export': 'jsonforms2/lib/jf.import-export',
  },

  shim: {
    'jf-import-export': ['jf.page'],
    'jf.page': ['jquery', 'jslibs/bootstrap-3.3.5/dist/js/bootstrap.min',],
  }
}); 


define(function(require) {
  console.log("Before standalone require load");
  require('standalone-jf-require');
  console.log("After standalone require load");
  console.log("Before jf-page load");
  require('jf.page');
  console.log("After jf-page load");
  require('jf-import-export');
  console.log("After jf-import-export load", new Date());
});

