/*global ui, Backbone, JST*/

Langsheet.Views = Langsheet.Views || {};

(function () {
    'use strict';

    Langsheet.Views.Import = Backbone.View.extend({

        template: JST['app/scripts/templates/import.ejs'],

        tagName: 'div',

        id: '',

        className: '',

        spreadsheet: null,
        
        importFileContents: null,

        events: {
        },

        initialize: function () {
            // this.listenTo(this.model, 'change', this.render);
            this.render();
            $(this.el).off('submit', 'form');
            $(this.el).on('submit', 'form', this.submitForm.bind(this));
            $(this.el).off('change', 'input[type="file"]');
            $(this.el).on('change', 'input[type="file"]', this.fileChange.bind(this));
        },

        render: function () {
            this.$el.html(this.template());
        },

        submitForm: function(e) {
            e.preventDefault();

            var spreadsheetData = this.spreadsheet.getData();
            var resultData = {};
            var meta = this.moduleJson['__META__'];
            
            resultData[ meta.module ] = {};

            for(var i = 0, l = spreadsheetData.length; i < l; i++) {
                var rowData = spreadsheetData[ i ];

                if(rowData[3]) {
                    resultData[ meta.module ][ rowData[0] ] = this.moduleJson[ rowData[0] ];
                }
            }

            Langsheet.importFile(meta.module, meta.locale, resultData)
                .then(function() {
                    Langsheet.appRouter.navigate('modules/' + meta.module + '/edit', {trigger: true});
                });
        },

        fileChange: function(e) {
            var self = this;
            var file = e.target.files[0];
            var reader  = new FileReader();

            if( TB.isDefined(file) ) {
                $('#tb-ls-import-submit').prop('disabled', false);
                $('#tb-ls-import-meta').removeClass('hidden');
            } else {
                $('#tb-ls-import-submit').prop('disabled', true);
                $('#tb-ls-import-meta').addClass('hidden');
                return;
            }

            ASSERT_USER( typeof file != 'undefined', 'Please select file to import', 'LS/500');

            reader.onload = function() {
                try {
                    self.importFileContents = reader.result;
                    console.log(reader.result);
                } catch (err) {
                    self.readFileError(err);
                    return;
                }

                self.readFileSuccess();
            };

            reader.onerror = function() {
                console.log(arguments, reader.error)
                self.readFileError(reader.error);
            };

            console.log(arguments, reader.error)
            reader.readAsText(file);
        },

        readFileError: function(error) {
            TRACE('Error while reading file: %s', error);
            this.importFileContents = null;
            Langsheet.appView.showMessage('danger', 'Error while reading file!');
        },

        readFileSuccess: function() {
            var poMeta;
            var moduleJson = {};
            var resultJson = {};
            var po;

            try {
                var PO = require('pofile');

                po = PO.parse(this.importFileContents);
                poMeta = JSON.parse(po.headers['X-Langsheet-Meta']);
            } catch( err ) {
                this.readFileError(err);
                return;
            }

            moduleJson['__META__'] = poMeta;
            resultJson[ poMeta.module ] = moduleJson;

            po.items
                .forEach(function( item ) {
                    moduleJson[ item.msgid ] = moduleJson[ item.msgid ] || {};
                    moduleJson[ item.msgid ][ poMeta.locale ] = item.msgstr;
                });



            var moduleCollection = Langsheet.componentsCollection.get( moduleJson['__META__'].module );

            ASSERT( typeof moduleCollection != 'undefined');

            var currentModuleJson = moduleCollection.extractLangsheet( moduleJson['__META__'].locale );
            var strings = Object.keys(currentModuleJson).sort()
            var spreadsheetData = [];

            for(var i = 0, l = strings.length; i < l; i++) {
                var row = {};
                var string = strings[ i ];

                if( string === '__META__' ) {
                    continue;
                }

                row.key = string;
                row.old = TB.get( currentModuleJson, [ string, moduleJson['__META__'].locale, 0 ] );
                row.new = TB.get( moduleJson, [ string, moduleJson['__META__'].locale, 0 ] );
                row.replace = TB.isDefined( row.new ) && row.new !== row.old;

                spreadsheetData.push(row);
            }


            this.moduleJson = moduleJson;

            this.showSpreadsheet(spreadsheetData, moduleJson);
        },

        showSpreadsheet: function (spreadsheetData, moduleJson) {
            var example1 = document.getElementById('tb-ls-import-spreadsheet');
            document.getElementById('tb-ls-import-module').innerHTML = moduleJson['__META__'].module;
            document.getElementById('tb-ls-import-language').innerHTML = moduleJson['__META__'].locale;

            example1.innerHTML = '';

            Handsontable.renderers.registerRenderer('CustomDiff', function(instance, td, row, col, prop, value, cellProperties) {
                if(col === 3) {
                    Handsontable.renderers.CheckboxRenderer.apply(this, arguments);
                } else {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                }

                var rowData = spreadsheetData[ row ];

                if(rowData.new === rowData.old) {
                    if(col === 3) {
                        td.querySelector('input').disabled = true;
                    }
                } else if( TB.isEmpty( rowData[2] ) ) {
                    td.style.color = 'red';
                } else {
                    td.style.color = 'orange';
                }
            });

            this.spreadsheet = new Handsontable(example1, {
                data: spreadsheetData,
                colHeaders: [CONFIG.NAME_KEY, 'Old translation', 'New translation', 'Replace old with new translation'],
                maxRows: spreadsheetData.length,
                disableVisualSelection: true,
                columns: [
                  {
                    data: 'key',
                    readOnly: true
                  },
                  {
                    data: 'old',
                    readOnly: true
                  },
                  {
                    data: 'new',
                    readOnly: true
                  },
                  {
                    data: 'replace',
                    type: 'checkbox'
                  }
                ],
                cells: function() {
                  return {
                    renderer: 'CustomDiff'
                  };
                },
              });
        }

    });

})();
