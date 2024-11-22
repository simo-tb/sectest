/*global Langsheet, $*/

window.CONFIG = {
  REGEX_PLACEHOLDERS: /[^%](%[si])/g,
  KEY_KEY: '__KEY__',
  API_URL: TB.API_URL,
  NAME_KEY: 'String',
  CYRILIC_LOCALES: ['bg_BG', 'ru_RU', 'be_BE', 'az_AZ', 'mk_MK', 'kk_KZ', 'sr_SP', 'uk_UA', 'uz_UZ'],
  RETRY_TIMEOUT: 1,
};

console.log("Will defined window.Langsheet!");
window.Langsheet = {
    Models: {},
    Collections: {},
    Views: {},
    Routers: {},
    reqId: 0,
    init: function () {
      'use strict';


      Langsheet.queryParams = TB.parseQueryParams();
      Langsheet.DOMSearchInput = document.querySelector('#ls-form-search input');
      Langsheet.$page = $('#ls-page');
      Langsheet.$languagesDropdown = $('#ls-languages-dropdown');
      Langsheet.$submitButton = $('#ls-form-submit-submit').hide();
      Langsheet.$ajaxLoader = $('#ls-ajax-loader1');
      Langsheet.$settingsShowModuleMeta = $('#tb-ls-show-module-meta');
      Langsheet.$settingsShowDeprecated = $('#tb-ls-show-deprecated');
      Langsheet.$settingsShowUpdatedAt = $('#tb-ls-show-updated-at');
      Langsheet.$settingsShowUpdatedBy = $('#tb-ls-show-updated-by');
      Langsheet.$settingsShowNotes = $('#tb-ls-show-notes');


      var apiKey = Langsheet.queryParams['api_key'] || TB.API_KEY || null;


      Langsheet.service = new TB.RAService({
          apiUrl: CONFIG.API_URL,
          requestParams: {
            api_key: apiKey,
          }
      });


      Langsheet.appRouter = new Langsheet.Routers.Application();
      Langsheet.appModel = new Langsheet.Models.Application();
      Langsheet.appView = new Langsheet.Views.Application({
        model: Langsheet.appModel,
        el: document,
      });

      Langsheet.appView.showMessage('info', 'Loading translations', true);

      /**
       * @todo velislav da promeni dolniq event listener s hook-a  TB.CONFIG.XERRORS_HOOK_ERROR_HANDLER_UI
       * TB.CONFIG.XERRORS_HOOK_ERROR_HANDLER_UI = function(err) {};                 
       * */
      window.addEventListener('error', function(event) {
        var error = event.error;
        var msg = '';

        TRACE('ERROR: %s', error.message);

        if(error.name === 'TypeError') {
          msg = 'Unexpected error! Please reload!';
        } else {
          msg = 'Unexpected error!\n ' + error.message;
        }

        Langsheet.appView.showMessage('danger', msg, true);

        alert(msg);
      });

      // Langsheet.service.request('get_langsheet', {
      //   modules: ['langsheet'],
      // })
      //   .then(function(result) {
      //     Langsheet.gt = new TB.Translate(
      //       result.translations,
      //       result.locales_list,
      //       'langsheet'
      //     );

      //     // $('[data-tb-ls=""]').each(function() {
      //     //   var $this = $(this);
      //     //   var translateStr = $.trim($this.text());
      //     //   $this.text(Langsheet.gt.gettext(translateStr))
      //     //     .attr('data-tb-ls', 'true');
      //     // });
      //   });

// NOTE: jQuery no longer used for requests, now we use tb.request
// TODO: Implement ajaxStart in tb.request
//      $( document ).ajaxStart(function() {
//        this.appModel.trigger('tb.ls.ajaxStart');
//     }.bind(this));
//      $( document ).ajaxStop(function() {
//        this.appModel.trigger('tb.ls.ajaxStop');
//      }.bind(this));
//      $( document ).ajaxError(function() {
//        this.appModel.trigger('tb.ls.ajaxError');
//      }.bind(this));
//
      Langsheet.service.on('ajaxStart',function() {
        this.appModel.trigger('tb.ls.ajaxStart');
     }.bind(this));


      Promise.all([ 
          Langsheet.service.request('get_strings_admin', {}, { timeout: 0 }), 
      ])
        .then(function(responseAll) {
          var response = responseAll[0];

          Langsheet.appView.hideMessage();

          Langsheet.data = response;
          Langsheet.prepareInterface();
        
          this.appModel.trigger('tb.ls.ajaxStop');
        }.bind(this))
    	.catch(function(e) {
          console.log(e);
          Langsheet.appView.showMessage('danger', 'No connection to server', true);
          this.appModel.trigger('tb.ls.ajaxError');
//          req.retry();
        }.bind(this));

      Langsheet.updateRemoteMeta = this.updateRemoteMeta;
    },

    prepareInterface: function() {
      var context = this;
      Langsheet.$submitButton.prop('disabled', false);
      Langsheet.appView.showProperMenus();


      this.normalizeData();


      Langsheet.componentsCollection = new Langsheet.Collections.Component();
      Langsheet.componentsCollection.customAdd( Langsheet.data.translations );


      Langsheet.languagesCollection = new Langsheet.Collections.Language();
      Langsheet.languagesCollection.customAdd( Langsheet.data.locales, Langsheet.data.translate_locales_list );


      Langsheet.appModel.set('canApprove', Langsheet.data['can_approve'] == '1');
      Langsheet.appModel.set('canImport', Langsheet.data['can_import'] == '1');


      TRACE('Locales are: %s', Langsheet.data.locales);


      Langsheet.languagesDropdownView = new Langsheet.Views.LanguagesDropdown({
        collection: Langsheet.languagesCollection,
        el: Langsheet.$languagesDropdown,
      });

      Langsheet.translateStringsForUpdate = new Langsheet.Collections.TranslateElem();
     /**
      * @todo: should retry to update strings on fail - 5XX, App Err, etc. (each Nth second)
      * Show the number of strings to be updated (not done) in UI
      * Status text 'All changes are saved' should be updated
      **/
      Langsheet.translateStringsForUpdate.on('change', TB.debounce(function() {
        var collection = this;
        var sentModels = [];
        var data = [];

        if(collection.size() === 0) {
          Langsheet.appModel.set('isDirty', false);
          return;
        }

        TRACE("DATA_COLLECTIONS: ", JSON.stringify(collection));
        collection.each(function(model) {
          var component = model.get('__COMPONENT_NAME__');
          var string = model.get('__KEY__');
          var changedAttributes = model.changedAttributes();

          sentModels.push(model);
          TRACE("DATA_LOCALES: ", JSON.stringify(changedAttributes));

          // filter only real locales,
          for(var locale in changedAttributes) {
            if( locale === '__META__') {
              continue;
            }

            var values = (typeof changedAttributes[ locale ] === 'string' && changedAttributes[ locale ].length > 0)
              ? [ changedAttributes[ locale ] ]
              : [];

            data.push({
                module: component, 
                string: string, 
                locale: locale, 
                values: values
            });
          }
        });

        TRACE("DATA_API: ", JSON.stringify(data));

        var request = context.updateRemoteStrings(data);

        request.promise
          .then(function(result) {
            var updatedTranslations = result.updated_translations;

            Langsheet.translateStringsForUpdate.remove(model);

            for(var i = 0, l = sentModels.length; i < l; i++) {
              var model = sentModels[ i ];
              var module = model.get('__COMPONENT_NAME__');
              var key = model.get('__KEY__');

              if(updatedTranslations[ module ] && updatedTranslations[ module ][ key ]) {
                model.update(updatedTranslations[ module ][ key ]);
              }
            }

            Langsheet.translateStringsForUpdate.remove(sentModels);

            if(Langsheet.translateStringsForUpdate.size() === 0) {
              Langsheet.appModel.set('isDirty', false);
              return;
            }
          }, function() {
           TRACE('retrying to save %s', data);
            request.retry();
          });
      }, 250));

      Langsheet.appModel.on('change', function() {
        if (Langsheet.appModel.hasChanged('showHidden')) {
          Langsheet.updateComponents();

          if(Langsheet.componentView) {
            Langsheet.componentView.render();
          }
        } else if(Langsheet.appModel.hasChanged('isDirty')) {
          if(Langsheet.appModel.get('isDirty')) {
            Langsheet.setOnBeforeUnload();
            Langsheet.$submitButton.prop('disabled', false);
          } else {
            Langsheet.unsetOnBeforeUnload();
            Langsheet.$submitButton.prop('disabled', true);
          }
        }
      });


      Langsheet.languagesCollection.on('change', function() {
        if(Langsheet.componentView) {
          Langsheet.componentView.render();
        }
      });


      Langsheet.componentsCollection.each(function(component) {
        var dict = Langsheet.data.translations[component.get('name')];
        var componentModel = Langsheet.componentsCollection.get(component);
        var translateElementsCollection = new Langsheet.Collections.TranslateElem();
        var translateElements = _.sortBy(Object.keys(dict), function(key) {
          var value = dict[key];
          var notes = '';

          if(value && value.__META__ && value.__META__.notes) {
            notes = value.__META__.notes;
          }

          return notes + key;
        });

        for(var j = 0, l = Langsheet.data.locales_list.length; j < l; j++) {
          var locale = Langsheet.data.locales_list[j];
          componentModel.get('notTranslatedByLocale')[ locale ] = 0;
        }

        componentModel.updateMeta( dict['__META__'] || {} );

        for(var i = 0, l = translateElements.length; i < l; i++) {
          var key = translateElements[i];
          var placeholdersCount = (key.match(CONFIG.REGEX_PLACEHOLDERS) || []).length;
          var modelData = $.extend({}, dict[key]);


          if(key === '__META__') {
            continue;
          }


          modelData['__KEY__'] = key;
          modelData['__PLACEHOLDER_COUNT__'] = placeholdersCount;
          modelData['__COMPONENT_NAME__'] = componentModel.get('name');
          modelData['__UPDATED_AT__'] = TB.get(modelData, '__META__.updated_at');
          modelData['__UPDATED_BY__'] = TB.get(modelData, '__META__.updated_by');
          modelData['__NOTES__'] = TB.get(modelData, '__META__.notes');


          TRACE('Prepared TranslateElem model: %s', modelData);

          // if(false && modelData['__META__']['is_disabled'] && !(Langsheet.appModel.get('showHidden'))) {
          //   continue;
          // }


          for(var j = 0, ll = Langsheet.data.locales_list.length; j < ll; j++) {
            var locale = Langsheet.data.locales_list[j];
            componentModel.set('totalStrings', componentModel.get('totalStrings') + 1);

            if(!modelData[locale]) {
              componentModel.set('notTranslated', componentModel.get('notTranslated') + 1);
              componentModel.get('notTranslatedByLocale')[ locale ] += 1;

            }
          }


          translateElementsCollection.push(modelData);
        }

        componentModel.set('translateElements', translateElementsCollection);
        componentModel.set('translateElementsVisible', translateElementsCollection.clone());

        componentModel.get('translateElementsVisible')
          .on('tb.ls.singleModelUpdate', function(model) {
            Langsheet.appModel.set('isDirty', true);
            var component = model.get('__COMPONENT_NAME__');

            Langsheet.translateStringsForUpdate.add(model);
            Langsheet.translateStringsForUpdate.trigger('change');
          }.bind(this));
      }.bind(this));


      this.updateComponents();


      Langsheet.componentsCollection.on('change', function() {
        Langsheet.appModel.set('isDirty', true);
      });

      if(!Backbone.History.started) {
        Backbone.history.start();
      }
    },

    updateComponents: function() {
      Langsheet.componentsCollection.each(function(component) {
        var componentModel = Langsheet.componentsCollection.get(component);
        var translateElementsCollection = componentModel.get('translateElements');
        var visibleTranslateElementsCollection = componentModel.get('translateElementsVisible');

        visibleTranslateElementsCollection.reset();

        translateElementsCollection.map(function(translateElement) {
          if( Langsheet.appModel.get('showHidden') || !translateElement.get('__META__') || (translateElement.get('__META__') && !(translateElement.get('__META__')['is_disabled']))) {
            if(translateElement.get('__KEY__') != '__META__') {
              visibleTranslateElementsCollection.add(translateElement);
            }
          }
        });

        componentModel.set('translateElementsVisible', visibleTranslateElementsCollection);

      }.bind(this));
    },

    normalizeData: function() {
      for(var component in Langsheet.data.translations) {
        for(var key in Langsheet.data.translations[component]) {
          if(key === '__META__') {
            continue;
          }

          for(var locale in Langsheet.data.translations[component][key]) {
            if(locale !== '__META__') {
              Langsheet.data.translations[component][key][locale] = Langsheet.data.translations[component][key][locale][0];
            }
          }
        }
      }
    },

    setOnBeforeUnload: function() {
      window.onbeforeunload = function(){
        return 'There are some unsaved changes detected!';
      };
    },

    unsetOnBeforeUnload: function() {
      window.onbeforeunload = undefined;
    },

    updateRemoteStrings: function(data) {


      var req = Langsheet.service.request('update_strings', {
        translations: data,
      }, {
        httpMethod: 'POST'
      });

      req.promise
        .then(function() {
          this.appModel.trigger('tb.ls.ajaxStop'); 
        }.bind(this))
        .catch(function() {
          var strings = data.map(function(d) {
            return '"' + d.string + '"';
          });

          this.appView.showMessage('danger', 'Error! Unable to save translated strings "' + strings.join(', ') + '"!');
          this.appModel.trigger('tb.ls.ajaxError');

          req.retry();
        }.bind(this));

      return req;
    },

    updateRemoteString: function(module, string, locale, value) {

      var req = Langsheet.service.request('update_string', {
        module: module,
        string: string,
        locale: locale,
        values: value,
      });

      req.promise
        .then(function() {
//          this.appModel.trigger('tb.ls.ajaxStop');
        }.bind(this))
        .catch(function() {
          this.appView.showMessage('danger', 'Error! Unable to save translated string "' + string + '"!');
          this.appModel.trigger('tb.ls.ajaxError');
//          req.retry();
        }.bind(this));


      return req;
    },

    updateRemoteMeta: function(module) {
      var data = {};
      var moduleMeta = Langsheet.componentsCollection.get(module).get('__META__');

      for(var locale in moduleMeta['locale_attributes']) {
        data[ locale ] = moduleMeta['locale_attributes'][ locale ].is_approved;
      }
        
      var request = Langsheet.service.request('approve_strings', {
        module: module,
        locale_attributes: data,
      })
        .then(function(result) {
          Langsheet.appModel.set('isDirty', false);


          // TODO remove from heret this!!!
          for(var module in result.updated_translations) {
            for(var locale in result.updated_translations[ module ]['__META__'].locale_attributes) {
              var localeAttributes = result.updated_translations[ module ]['__META__'].locale_attributes[ locale ];

              $('.tb-ls-' + locale + '-approved-by').parent().toggleClass('hidden', !(localeAttributes['approved_at'] && localeAttributes['is_approved']));
              $('.tb-ls-' + locale + '-approved-by').text( localeAttributes['approved_by'] );
              $('.tb-ls-' + locale + '-approved-at').text( localeAttributes['approved_at'] );
            }
          }

          this.appModel.trigger('tb.ls.ajaxStop');
          this.appView.showMessage('success', 'Successfully approved selected languages!');
        }.bind(this))
    	.catch(function() {
          this.appView.showMessage('danger', 'Error! Unable to save which languages are approved!');
          this.appModel.trigger('tb.ls.ajaxError');
//          request.retry();
        }.bind(this));

      return request;
    },

    exportFile: function(moduleName, localeToExtract){
      TRACE('Export file for "%s" module in "%s" locale', moduleName, localeToExtract);

      ASSERT(typeof moduleName != 'undefined');
      ASSERT(typeof localeToExtract != 'undefined');

      var data = {};
      var now = (new Date()).toISOString();
      var moduleCollection = this.componentsCollection.get(moduleName);
      var extractedCollection = moduleCollection.extractLangsheet(localeToExtract);
      var strings = Object.keys(extractedCollection);
      var meta = {
        module: moduleName,
        locale: localeToExtract,
        date: now
      };
      var PO = require('pofile');
      var po = new PO();

      po.headers['PO-Revision-Date'] = now;
      po.headers['Language'] = localeToExtract;
      po.headers['MIME-Version'] = '1.0';
      po.headers['Content-Type'] = 'text/plain; charset=UTF-8';
      po.headers['Content-Transfer-Encoding'] = '8bit';
      po.headers['X-Langsheet-Meta'] = JSON.stringify(meta);


      for(var i = 0, l = strings.length; i < l; i++) {
        var string = strings[ i ];
        var stringObj = extractedCollection[ string ];
        var poItem = new PO.Item();

        if( string === '__META__') {
          continue;
        }

        poItem.msgid = string;
        poItem.msgstr = TB.get(stringObj, [localeToExtract], []);
        po.items.push(poItem);
      }

      var tbFile = new TB.File({
        filename: ['translations', moduleName, localeToExtract, now].join('-') + '.po',
      }, po.toString());
      tbFile.download();
    },

    importFile: function(module, locale, translations) {
      Langsheet.appView.showMessage('info', 'Importing translations', true);
    
      var req = Langsheet.service.request('import_strings', {
        module: module,
        locale: locale,
        strings: translations,
      }, { 
        httpMethod: 'POST'
      })
        .then(function(response) {
          this.appView.showMessage('success', 'Successfully imported strings!');

          Langsheet.data = response;
          Langsheet.prepareInterface();
          this.appModel.trigger('tb.ls.ajaxStop');
        }.bind(this))
        .catch(function() {
          this.appView.showMessage('danger', 'Error! Unable to import file!');
          this.appModel.trigger('tb.ls.ajaxError');
//          req.retry();
        }.bind(this));

      return req;
    },
};

