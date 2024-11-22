/*global Langsheet, Backbone*/

Langsheet.Models = Langsheet.Models || {};

(function () {
    'use strict';

    Langsheet.Models.Language = Backbone.Model.extend({

        url: '',

        initialize: function() {
            this.bind('change', function() {
                this.updateLocalStorage();
            });
        },

        idAttribute: 'language',

        defaults: {
            language: null,
            locale: null,
            language_name: null,
            isReadonly: true,
        },

        validate: function(attrs, options) {
        },

        parse: function(response, options)  {
            return response;
        },

        updateLocalStorage: function() {
            var langs = localStorage.getItem('languages');

            if(langs) {
                langs = JSON.parse(langs);
            } else {
                langs = {};
            }

            langs[ this.get('language') ] = this.get('isChecked');
            localStorage.setItem('languages',  JSON.stringify(langs) );
        },
    });

})();
