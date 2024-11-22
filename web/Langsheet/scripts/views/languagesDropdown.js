/*global Langsheet, Backbone, JST*/

Langsheet.Views = Langsheet.Views || {};

(function () {
    'use strict';

    Langsheet.Views.LanguagesDropdown = Backbone.View.extend({

        template: JST['app/scripts/templates/languagesDropdown.ejs'],

        tagName: 'div',

        id: '',

        className: '',

        events: {
          'change input': 'languageChange',
        },

        initialize: function () {
          this.listenTo(this.collection, 'change', this.render);
          this.listenTo(this.collection, 'add', this.render);
          this.render();
        },

        render: function () {
          this.$el.html(this.template({
            languages: this.collection.toJSON(),
          }));
        },

        languageChange: function (e) {
          TRACE('Settings isChecked to %s for %s', e.target.checked, e.target.value);

          this.collection
            .get(e.target.value)
            .set('isChecked', e.target.checked);
        },

    });

})();
