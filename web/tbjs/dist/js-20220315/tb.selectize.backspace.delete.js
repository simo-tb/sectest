/*
Selectize.define("stop_backspace_delete", function (options) {
	  var self = this;

	  this.deleteSelection = (function() {
		var original = self.deleteSelection;

		return function (e) {
		  if (!e || e.keyCode !== 8) {
			return original.apply(this, arguments);
		  }

		  return false;
		};
	  })();
  });
*/
