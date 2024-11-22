/*global Langsheet, Backbone*/

Langsheet.Collections = Langsheet.Collections || {};

(function () {
    'use strict';

    Langsheet.Collections.Language = Backbone.Collection.extend({

        model: Langsheet.Models.Language,

        customAdd: function(locales, localesList) {
          var storedLocales =  localStorage.getItem('languages') ? JSON.parse(localStorage.getItem('languages')) : {};
         
          localesList = localesList || [];

          for(var i = 0, l = locales.length; i < l; i++) {
          // for(var locale in locales) {
            this.add({
              locale: locales[i]['locale'],
              language: locales[i]['locale'],
              language_name: locales[i]['lang_name'],
              isChecked: (storedLocales[ locales[i]['name'] ] !== false),
              isReadonly: localesList.indexOf(locales[i]['locale']) < 0,
            })
          }
        },

        getActive: function() {
          return this.where({
            isChecked: true,
          });
        }

    });

})();
