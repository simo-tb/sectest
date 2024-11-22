/*global Langsheet, Backbone, JST*/

Langsheet.Views = Langsheet.Views || {};

(function () {
  'use strict';

  Langsheet.Views.components = Backbone.View.extend({

    template: JST['app/scripts/templates/components.ejs'],

    tagName: 'div',

    id: '',

    className: '',

    events: {

    },

    initialize: function () {
      this.render();

      Langsheet.appModel.on("change", function() {
        if (Langsheet.appModel.hasChanged('showHidden')) {
          this.render();
        }
      }.bind(this));

      Langsheet.componentsCollection.on("change", function() {
          this.$el.find('#module-badge-' + this.model.get('name').replace(/ /g, ''))
            .html(this.model.get('notTranslated'));
      }.bind(this));

      this.$el.off('change', '.locale-approve');
      this.$el.on('change', '.locale-approve', this.localeApprove.bind(this));

      this.$el.off('click', 'button.tb-ls-approve');
      this.$el.on('click', 'button.tb-ls-approve', function() {
        Langsheet.updateRemoteMeta(this.dataset.module);
      });

      this.$el.off('click', 'button.tb-ls-btn-export-file');
      this.$el.on('click', 'button.tb-ls-btn-export-file', function() {
        ASSERT(typeof this.dataset.locale != 'undefined');
        Langsheet.exportFile(this.dataset.module, this.dataset.locale);
      });

      // this.$el.off('click', 'button.tb-ls-export-pot');
      // this.$el.on('click', 'button.tb-ls-export-pot', function() {
      //   Langsheet.exportFile(this.dataset.module);
      // });

      Langsheet.appModel.off('tb.ls.updateSpreadSheet');
      Langsheet.appModel.on('tb.ls.updateSpreadSheet', function() {
        this.spreadSheet.render();
      }.bind(this));

      Langsheet.appModel.off('change');
      Langsheet.appModel.on('change:settingsShowModuleMeta', function() {
        $('.tb-ls-modules-meta').toggle( Langsheet.appModel.get('settingsShowModuleMeta') );
      });

      Langsheet.appModel.off('change');
      Langsheet.appModel.on('change:settingsShowDeprecated', function() {
        this.spreadSheet.render();
      }.bind(this));
    },

    attr: function (locale) {
      var context = this;

      return function (model, value) {
        if (_.isUndefined(value)) {
          var str = model.get(locale);

          return str;
        }

        if(value) {
          value = value.replace(/\s+/g, ' ');
        }


        if(!model.get(locale) && value) {
          context.model.set('notTranslated', context.model.get('notTranslated') - 1);
          context.model.get('notTranslatedByLocale')[locale] -= 1;
        } else if (model.get(locale) && !value) {
          context.model.set('notTranslated', context.model.get('notTranslated') + 1);
          context.model.get('notTranslatedByLocale')[locale] += 1;
        }

        model.set(locale, value);
      };
    },

    localeApprove: function(event) {
      var isChecked = event.target.checked || false;
      var locale = event.target.value;
      var metaData = this.model.get( '__META__' );

      this.model.trigger('change');
      _.set(metaData, ['locale_attributes', locale, 'is_approved'], isChecked);

      this.model.set('__META__', metaData);

      TRACE('Components meta updated to %s', metaData);
    },

    render: function () {
      this.$el.html(this.template({
        modules: Langsheet.componentsCollection.toJSON(),
        currentModule: this.model.toJSON(),
        currentModuleMeta: this.model.get( '__META__' ),
        locales: Langsheet.languagesCollection.toJSON(),
        canApprove: Langsheet.appModel.get('canApprove'),
        canImport: Langsheet.appModel.get('canImport'),
        showApprove: Langsheet.appModel.get('settingsShowModuleMeta'),
      }));

      Langsheet.appRouter.updateComponentTab();

      this.renderSpreadsheet();
    },

    renderSpreadsheet: function() {
      var context = this;
      var spreadSheet;
      var spreadSheetContainer = document.querySelector('#spreadsheet');

      var columns = {
        notes: {
          label: 'Context',
          width: 200,
          column: {
            data: this.attr('__NOTES__'),
            readOnly: true,
            locale: '__NOTES__',
          }
        },
        key: {
          label: CONFIG.NAME_KEY,
          width: 300,
          column: {
            data: this.attr('__KEY__'),
            readOnly: true,
            locale: '__KEY__',
          }
        },
        updatedAt: {
          label: 'Updated at',
          width: 250,
          column: {
            data: this.attr('__UPDATED_AT__'),
            readOnly: true,
            locale: '__UPDATED_AT__',
          }
        },
        updatedBy: {
          label: 'Updated by',
          width: 100,
          column: {
            data: this.attr('__UPDATED_BY__'),
            readOnly: true,
            locale: '__UPDATED_BY__',
          }
        },
      };



      // this.spreadSheetColumnNames = spreadSheetColumns.map(function(el) { return el.locale; });


      var a = updateSettings();

      Handsontable.renderers.registerRenderer('CustomCharsetChecker', function(instance, td, row, col, prop, value, cellProperties) {
        Handsontable.renderers.TextRenderer.apply(this, arguments);

        var model = context.collection.at(row);
        if ( ! model ){
          return;
        }

        var modelMeta = model.get( '__META__' );
        var settings = instance.getSettings();


        // check cyrillic letters in latin non-cyrillic locale
        if(CONFIG.CYRILIC_LOCALES.indexOf(cellProperties.locale) == -1) {
          if(/[а-яА-ЯЁё]/.test(value)) {
            td.style.color = 'red';
          }
        }

        // check placeholders
        if(col > settings.fixedColumnsLeft - 1) {
          if(value === undefined || value === null || value === '') {
            td.style.color = 'orange';
          } else {
            var matchesCount = value.toString().match(CONFIG.REGEX_PLACEHOLDERS);
            var matchesCountModel = model.get('__PLACEHOLDER_COUNT__');

            if(matchesCountModel && (matchesCount === null || matchesCount.length != matchesCountModel)) {
              td.style.color = 'orange';
            }
          }
        }

        // check deprecated string
        // if(modelMeta && modelMeta[ 'is_deprecated' ]) {
        //   if( Langsheet.appModel.get('settingsShowDeprecated') ) {
        //     td.style.textDecoration = 'line-through';
        //     td.hidden = false;
        //   } else {
        //     td.hidden = true;
        //   }
        // }

        // td.hidden = false;
      });


      Langsheet.appModel.off('change:settingsShowUpdatedAt');
      Langsheet.appModel.off('change:settingsShowUpdatedBy');
      Langsheet.appModel.off('change:settingsShowNotes');

      Langsheet.appModel.on('change:settingsShowUpdatedAt', function() {
        spreadSheet.updateSettings( updateSettings() );
        spreadSheet.render();
      });
      Langsheet.appModel.on('change:settingsShowUpdatedBy', function() {
        spreadSheet.updateSettings( updateSettings() );
        spreadSheet.render();
      });
      Langsheet.appModel.on('change:settingsShowNotes', function() {
        spreadSheet.updateSettings( updateSettings() );
        spreadSheet.render();
      });


      this.spreadSheet = spreadSheet = new Handsontable(spreadSheetContainer, {
        dataSchema: function() { return new Langsheet.Models.TranslateElem(); },
        data: this.collection,
        columns: a.columns,
        colHeaders: a.colHeaders,
        fixedColumnsLeft: a.spreadSheet,
        // stretchH: 'all',
        colWidths: a.colWidths,
        renderAllRows: true,

        autoColumnSize: true,
        autoWrapRow: true,
        manualColumnMove: true,
        manualColumnResize: true,
        fillHandle: true,
        minSpareRows: 0,
        minSpareCols: 0,
        maxRows: this.collection.length,
        search: true,
        currentRowClassName: 'currentRow',
        cells: function() {
          return {
            renderer: 'CustomCharsetChecker'
          };
        },
        // columnSorting: true, // Maximum callstack exceeded!
      });

      function onlyExactMatch(queryStr, value) {
        return queryStr.toString() === value.toString();
      };

      function updateSettings() {
        var spreadsheetColumns = [];
        var spreadsheetHeaders = [];
        var spreadsheetColWidths = [];
        var activeLocales = Langsheet.languagesCollection.getActive();
        var spreadsheetFixedColumns;


        if(Langsheet.appModel.get('settingsShowNotes')) {
          spreadsheetHeaders.push(columns.notes.label);
          spreadsheetColumns.push(columns.notes.column);
          spreadsheetColWidths.push(columns.notes.width);
        }

        spreadsheetHeaders.push( columns.key.label );
        spreadsheetColumns.push( columns.key.column );
        spreadsheetColWidths.push( columns.key.width );

        if(Langsheet.appModel.get('settingsShowUpdatedAt')) {
          spreadsheetHeaders.push(columns.updatedAt.label);
          spreadsheetColumns.push(columns.updatedAt.column);
          spreadsheetColWidths.push(columns.updatedAt.width);
        }

        if(Langsheet.appModel.get('settingsShowUpdatedBy')) {
          spreadsheetHeaders.push(columns.updatedBy.label);
          spreadsheetColumns.push(columns.updatedBy.column);
          spreadsheetColWidths.push(columns.updatedBy.width);
        }

        spreadsheetFixedColumns = spreadsheetColumns.length;

        activeLocales.forEach(function(locale) {
          spreadsheetHeaders.push( locale.get('language_name') );

          spreadsheetColumns.push({
            data: context.attr(locale.get('language')),
            locale: locale.get('language'),
            readOnly: locale.get('isReadonly'),
          });

          spreadsheetColWidths.push(columns.key.width); // Use the width of the key(string) column
        });

        return {
          columns: spreadsheetColumns,
          colHeaders: spreadsheetHeaders,
          colWidths: spreadsheetColWidths,
          spreadSheet: spreadsheetFixedColumns,
          stretch: 'all',
        };
      }

      $(Langsheet.DOMSearchInput)
        .off('change.spreadsheet')
        .on('change.spreadsheet', function() {
          var term = this.value;
          var queryResult = spreadSheet.search.query(term);

          spreadSheet.render();
        });
    },

  });

})();
