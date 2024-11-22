/*global Langsheet, Backbone*/

console.log("Will touch the Langsheet.Routers!");

(function () {
    'use strict';

    Langsheet.Routers.Application = Backbone.Router.extend({

      routes: {
        '': 'dashboard',
        'dashboard': 'dashboard',
        // 'help': 'help',
        'modules': 'modules',
        'modules/:componentName/edit': 'moduleEdit',
        'import': 'importFile',
      },

      menuElements: {
        dashboard: $('#menu-dashboard'),
        modules: $('#menu-modules'),
        help: $('#menu-help'),
        import: $('#menu-import'),
      },

      updateMenu: function(menuItem) {
        for(var key in this.menuElements) {
          $(this.menuElements[key]).removeClass('active');
        }

        if(Langsheet.DOMSearchInput) {
            Handsontable.Dom.removeEvent(Langsheet.DOMSearchInput, 'change');
        }

        $(this.menuElements[menuItem]).addClass('active');
      },

      dashboard: function() {
        this.updateMenu('dashboard');

        new Langsheet.Views.Dashboard({
          el: Langsheet.$page,
        });
      },

      modules: function() {
        this.updateMenu('modules');

        var componentName = Langsheet.componentsCollection.first().get('name');

        this.navigate('modules/' + componentName + '/edit', {trigger: true});
      },

      moduleEdit: function(componentName) {
        this.updateMenu('modules');
        var componentModel = Langsheet.componentsCollection.get(componentName);

        if(TB.isUndefined(componentModel)) {
          this.navigate('');
        }

        Langsheet.componentView = new Langsheet.Views.components({
          el: Langsheet.$page,
          collection: componentModel.get('translateElementsVisible'),
          model: componentModel,
        });

        this.updateComponentTab(componentName);
        this.toggleDisabledSearch(false);
      },

      updateComponentTab: function(moduleName) {
        var currentPath = (moduleName) ? ('#modules/' + moduleName + '/edit') : Backbone.history.location.hash;
        var tabAnchor = $('#modules-tabs').find('a[href="' + currentPath + '"]');

        $('#modules-tabs').addClass('active');
        $('#modules-tabs').find('li')
          .removeClass('active');

        tabAnchor.parent()
          .addClass('active');
      },

      toggleDisabledSearch: function(isDisabled) {
        $('#ls-form-search').find(':input').prop('disabled', !!(isDisabled));
        Langsheet.$submitButton.prop('disabled', !!(isDisabled));
      },

      help: function() {
        this.updateMenu('help');
        new Langsheet.Views.Help({
          el: Langsheet.$page,
        });

        this.toggleDisabledSearch(true);
      },

      importFile: function() {
        if (!Langsheet.data['can_import']) {
          this.navigate('');
          return;
        }

        new Langsheet.Views.Import({
          el: Langsheet.$page,
        });

        this.updateMenu('import');
      },

    });

})();
