/*global Langsheet, Backbone*/

Langsheet.Models = Langsheet.Models || {};

(function () {
    'use strict';

    Langsheet.Models.Application = Backbone.Model.extend({

        url: '',

        initialize: function() {
        },

        defaults: {
            isDirty: false,
            settingsShowModuleMeta: true,
            settingShowDeprecated: true,
            settingsShowUpdatedAt: true,
            settingsShowUpdatedBy: true,
            settingsShowNotes: true,
            showStringMeta: true,
        },

        validate: function(attrs, options) {
        },

        parse: function(response, options)  {
            return response;
        }
    });

})();
