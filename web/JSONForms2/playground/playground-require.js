requirejs(['tb.requirejs', ], function() {
  requirejs(['bootstrap-datetimepicker-4'], function() {
	  requirejs(['jf.ui' ], function() {
	  	requirejs(['tbjf-select2', 'tbjf-select2-plugin', 'tbjf-datetime-plugin', 'tbjf-questions', 'tbjf-datetimerangepicker', 'tbjf-daterangepicker', 'jquery.orderedselect'], function() {
	      requirejs(['playground'], function() {
	        // alert('Finally loaded everything');
	        // console.log('config.js loaded', jf(['jquery-4'], () => { }))
		  });
	  	});
	  });
  });
})
