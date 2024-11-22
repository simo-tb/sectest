/*global Langsheet, Backbone, JST*/

Langsheet.Views = Langsheet.Views || {};

(function () {
  'use strict';

  Langsheet.Views.Dashboard = Backbone.View.extend({

    template: JST['app/scripts/templates/dashboard.ejs'],

    tagName: 'div',

    events: {},

    initialize: function () {
      this.render();
    },

    render: function () {
      var modulesMeta = Langsheet.componentsCollection.map(function(moduleModel) {
        return moduleModel.get( '__META__' );
      });

      this.$el.html(this.template({
        modules: Langsheet.componentsCollection.toJSON(),
        locales: Langsheet.languagesCollection.toJSON(),
        modulesMeta: modulesMeta,
      }));
    }

  });

})();
