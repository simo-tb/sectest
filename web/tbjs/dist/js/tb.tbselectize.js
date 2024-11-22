(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('jquery'));
  } else if (typeof define === 'function' && define.amd) {
    define(['jquery'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    factory(global.jQuery); 
  }
})(this, function ($) {
  'use strict';

	function onDropdownOpenHandler(e, dst) {
		let numberOfCloses = 0;
		let numberOfMissingSelectize = 0;
		let begin = Date.now();
		$('select.selectized').not(this.$input).each(function(idx, el) {
			if (el.selectize) {
				numberOfCloses += 1;
				el.selectize.close();
				el.selectize.blur();
			} else {
				numberOfMissingSelectize += 1;
			}
		});

		let end = Date.now();
		console.log("ITERATED: ", numberOfMissingSelectize, numberOfCloses, "TIME_TAKEN: ", (end - begin) , " ms");
	}

	$.fn.tbselectize = function (options){
		options ||= {};
		let onDropdownOpenHandlers = [onDropdownOpenHandler];
    if ( options.onDropdownOpen ) {
      onDropdownOpenHandlers.push(options.onDropdownOpen);
    }
		options.onDropdownOpen = function (e, dst){
      for (const handler of onDropdownOpenHandlers) {
        handler.apply(this, e, dst);
      }
		}

        options.score = function(search) {
          if (!search) return function() { return 1; };
          search = search.toLowerCase();
          return function(item) {
                      return item.text.toLowerCase().includes(search) ? 1 : 0;
          };
        };

		this.selectize(options);
		return $(this);
	}
});
