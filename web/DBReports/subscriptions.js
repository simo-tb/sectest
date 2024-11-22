window.addEventListener('tb_libs_loaded', (event) => {
  $('.activate-custom-report').on('click', function(e) {
      if(!confirm("Are you sure that you want to activate the subscription?")) {
        e.preventDefault();
      }
  });

  $('.pause-custom-report').on('click', function(e) {
      if(!confirm("Are you sure that you want to pause the subscription?")) {
        e.preventDefault();
      }
  });

  $('.delete-custom-report').on('click', function(e) {
      if(!confirm("Are you sure that you want to delete the custom report?")) {
        e.preventDefault();
      }
  });
});
