/*global Langsheet, Backbone*/

Langsheet.Collections = Langsheet.Collections || {};

(function () {
    'use strict';

    Langsheet.Collections.Component = Backbone.Collection.extend({

        model: Langsheet.Models.Component,

        customAdd: function(obj) {
          var self = this;

          Object.keys(obj).sort().forEach(function(name) {
            var data = {};

            obj[ name ] = obj[ name ] || {};

            data.name = name;
            data['__META__'] = obj[ name ]['__META__'];

            self.add(data);
          });
        },

        extractLangsheet: function(localeToExtract) {
          var result = {};
          this.each(function(component) {
            result[ component.get('name') ] = component.extractLangsheet(localeToExtract);
          });
          return result;
        },

    });

})();
