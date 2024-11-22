/*global Langsheet, Backbone, JST*/

Langsheet.Views = Langsheet.Views || {};

(function () {
    'use strict';

    Langsheet.Views.Application = Backbone.View.extend({

        template: JST['app/scripts/templates/application.ejs'],

        id: '',

        className: '',

        initialize: function () {
          var context = this;

          $('form').on('submit', function(e) { e.preventDefault(); return false; });
          $('#ls-form-settings-show-hidden').on('change', function() {
            context.model.set('showHidden', this.checked);
          });
          Langsheet.$submitButton.on('click', this.submitLangsheet.bind(this));

          Langsheet.appModel.on('tb.ls.ajaxStart', function() {
            Langsheet.$submitButton.prop('disabled', true);
            Langsheet.$ajaxLoader.toggleClass('visible', true);

            Langsheet.setOnBeforeUnload();
            Langsheet.$submitButton.prop('disabled', false);

            context.changeStatus('saving');
          });

          Langsheet.appModel.on('tb.ls.ajaxStop', function() {
            Langsheet.$submitButton.prop('disabled', false);
            Langsheet.$ajaxLoader.toggleClass('visible', false);

            Langsheet.unsetOnBeforeUnload();
            Langsheet.$submitButton.prop('disabled', true);

            console.log('Langsheet/ui/app/scripts/views/application.js:onAjaxStop', Langsheet.translateStringsForUpdate.size());
            context.changeStatus('saved');
          });

          Langsheet.appModel.on('tb.ls.ajaxError', function() {
            context.changeStatus('retrying');
          });

          Langsheet.$settingsShowModuleMeta
            .on('change', this.toggleShowApproved.bind(this));

          Langsheet.$settingsShowDeprecated
            .on('change', this.toggleShowDeprecated.bind(this));

          Langsheet.$settingsShowUpdatedAt
            .on('change', this.toggleShowUpdatedAt.bind(this));

          Langsheet.$settingsShowUpdatedBy
            .on('change', this.toggleShowUpdatedBy.bind(this));

          Langsheet.$settingsShowNotes
            .on('change', this.toggleShowNotes.bind(this));
        },

        showProperMenus: function() {
          Langsheet.$settingsShowModuleMeta.closest('li').removeClass('hidden');

          if( Langsheet.data['can_import'] ) {
            $('#menu-import').removeClass('hidden');
          }
        },

        toggleShowApproved: function(event) {
          Langsheet.appModel.set('settingsShowModuleMeta', event.target.checked);
        },

        toggleShowDeprecated: function(event) {
          Langsheet.appModel.set('settingsShowDeprecated', event.target.checked);
        },

        toggleShowUpdatedAt: function(event) {
          Langsheet.appModel.set('settingsShowUpdatedAt', event.target.checked);
        },

        toggleShowUpdatedBy: function(event) {
          Langsheet.appModel.set('settingsShowUpdatedBy', event.target.checked);
        },

        toggleShowNotes: function(event) {
          Langsheet.appModel.set('settingsShowNotes', event.target.checked);
        },

        changeStatus: function(status) {
          $('.tb-ls-save-state-saving').toggle(status === 'saving');
          $('.tb-ls-save-state-saved').toggle(status === 'saved');
          $('.tb-ls-save-state-retrying').toggle(status === 'retrying');
        },

        submitLangsheet: function() {
          var context = this;
          var result = Langsheet.componentsCollection.extractLangsheet();

          TRACE('Prepare to submit result: %s', result);

          Langsheet.$submitButton.prop('disabled', true);

          context.showMessage('info', 'Loading!');

          var req = Langsheet.service.requestJsonRpc('set_strings', {
            translations: result,
          })
            .then(function() {
              context.showMessage('success', 'Success! Translations saved!');
              Langsheet.appModel.set('isDirty', false);
              context.appModel.trigger('tb.ls.ajaxStop');
            }, function() {
              context.showMessage('danger', 'Error! Unable to save translations!');
              context.appModel.trigger('tb.ls.ajaxError');
              req.retry();
            })
            .always(function() {
              Langsheet.$submitButton.prop('disabled', false);
            });
        },

        showMessage: function(type, message, notDismissable) {
          var $alert = $('\
                  <div id="ls-alert-' + type + '" class="alert alert-' + type + ' alert-dismissable" style="display:none">'
                    + ((!notDismissable) ?  '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' : '')
                    + message + '\
                  </div>');
          $('#container')
            .children('.alert')
            .remove()
            .end()
            .prepend($alert);

          $alert.fadeIn();
        },

        hideMessage: function() {
          $('#container')
            .children('.alert')
            .remove();
        },

    });
})();
