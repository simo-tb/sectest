/*global Langsheet, Backbone, JST*/

Langsheet.Views = Langsheet.Views || {};

(function () {
  'use strict';

  Langsheet.Views.Help = Backbone.View.extend({

    template: JST['app/scripts/templates/help.ejs'],

    tagName: 'div',

    events: {},

    initialize: function () {
      this.render();
    },

    render: function () {
      this.$el.html(this.template());
    }

  });

})();
