/*global Langsheet, Backbone*/

Langsheet.Collections = Langsheet.Collections || {};

(function () {
    'use strict';

    Langsheet.Collections.TranslateElem = Backbone.Collection.extend({

        model: Langsheet.Models.TranslateElem,

        splice: function(index, howMany) {
          var args = _.toArray(arguments).slice(2).concat({at: index}),
              removed = this.models.slice(index, index + howMany);

          this.remove(removed).add.apply(this, args);

          return removed;
        },

    });

})();
