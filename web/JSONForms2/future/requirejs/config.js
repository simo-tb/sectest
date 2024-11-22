requirejs(['tb.requirejs'], function() {
        requirejs(['jf.page'], function(jf) {
          alert('Finally loaded everything')
          // console.log('config.js loaded', jf(['jquery-4'], () => { }))
        });
})
