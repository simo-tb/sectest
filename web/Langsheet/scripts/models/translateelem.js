/*global Langsheet, Backbone*/

console.log("Will touch the Langsheet.models!");

(function () {
    'use strict';

    Langsheet.Models.TranslateElem = Backbone.Model.extend({

      url: '',

      initialize: function() {
        this.on('change', function(event, object) {
          var modelData = this.extractLangsheet();
          this.trigger('tb.ls.singleModelUpdate', this);
        });
      },

      defaults: {
      },

      validate: function(attrs, options) {
      },

      parse: function(response, options)  {
        return response;
      },

      extractLangsheet: function(localeToExtract) {
        var model2json = this.toJSON();
        var result = {};


        result['__META__'] = model2json['__META__'] || {};
        // result['__META__']['previous_values'] = _.mapValues(Langsheet.data.translations[ model2json['__COMPONENT_NAME__'] ][ model2json['__KEY__'] ], function(value) {
        //   return (value) ? [value] : [];
        // });

        // if(model2json['__META__']['__IS_CHECKED_FOR_DELETE__']) {
        //   result['__META__']['is_checked_for_delete'] = model2json['__IS_CHECKED_FOR_DELETE__'];
        // }

        // delete result['__META__']['previous_values']['__META__'];

        if(TB.isDefined(localeToExtract)) {
          if(model2json.hasOwnProperty(localeToExtract)) {
            result[localeToExtract] = [ model2json[ localeToExtract ] ];
          }

          return result;
        }

        for(var i = 0, l = Langsheet.data['locales_list'].length; i < l; i++) {
          var locale = Langsheet.data['locales_list'][ i ];
          if(model2json.hasOwnProperty(locale)) {
            result[locale] = [ model2json[ locale ] ];
          }
        }

        return result;
      },

      update: function(data) {
        if(typeof data === 'object' && data.hasOwnProperty('__META__')) {
          var meta = data['__META__'];
          var objMeta = this.get('__META__') || {};

          if(meta.updated_at) {
            this.attributes['__UPDATED_AT__'] = TB.get(meta, 'updated_at');
            objMeta.updated_at = TB.get(meta, 'updated_at');
          }

          if(meta.updated_at) {
            this.attributes['__UPDATED_BY__'] = TB.get(meta, 'updated_by');
            objMeta.updated_by = TB.get(meta, 'updated_by');
          }
        }

        this.set('__META__', objMeta)


        Langsheet.appModel.trigger('tb.ls.updateSpreadSheet');
      },
    });

})();
