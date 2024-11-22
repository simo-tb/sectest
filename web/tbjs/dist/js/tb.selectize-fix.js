define(['selectize'], function(Selectize) {
    window.Selectize = Selectize;

    Selectize.define("stop_backspace_delete", function (options) { 
      var self = this;

      this.deleteSelection = (function() {
        var original = self.deleteSelection;

        return function (e) {
          if (!e || e.keyCode !== 8) {
            return original.apply(this, arguments);                                                                                                                                                     }

          return false;
        };

      })();                   

    });

    let loadedEvent = new Event('tb_backspace_delete_plugin_loaded');
    window.dispatchEvent(loadedEvent);

});

