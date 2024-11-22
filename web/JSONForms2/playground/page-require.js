requirejs(['jslibs/bootstrap-datetimepicker-4.17.47/build/js/bootstrap-datetimepicker.min'], function() {
  requirejs(['jf.ui' ], function() {
    requirejs(['tbjf-select2', 'tbjf-select2-plugin', 'tbjf-datetime-plugin', 'tbjf-questions', 'tbjf-datetimerangepicker', 'tbjf-daterangepicker', 'jquery.orderedselect', 'jf.api'], function() {
      requirejs(['jf.page'], function() {
        // alert('Finally loaded everything');
        // console.log('config.js loaded', jf(['jquery-4'], () => { }))
      });
    });
  });
});
