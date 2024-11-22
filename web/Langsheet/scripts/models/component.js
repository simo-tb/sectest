/*global Langsheet, Backbone*/

Langsheet.Models = Langsheet.Models || {};

(function () {
    'use strict';

    Langsheet.Models.Component = Backbone.Model.extend({

        url: '',

        initialize: function(obj) {
          this.set('__META__', obj['__META__'] || {});
          this.set('notTranslatedByLocale', {});
        },

        idAttribute: 'name',

        defaults: {
          isActive: false,
          totalStrings: 0,
          notTranslated: 0,
        },

        validate: function(attrs, options) {
        },

        parse: function(response, options)  {
            return response;
        },

        extractLangsheet: function(localeToExtract) {
          var result = {};

          this.get('translateElements').each(function(translateElement) {
            result[ translateElement.get('__KEY__') ] = translateElement.extractLangsheet(localeToExtract);
          });

          result['__META__'] = this.get( '__META__' );

          return result;
        },

        updateMeta: function(newMetaData) {
          var oldMetaData = this.get( '__META__' );
          var metaData = _.merge(oldMetaData, newMetaData);
          TRACE('Updated meta from %s to %s with %s', oldMetaData, metaData, newMetaData);

          metaData.locale_attributes = metaData.locale_attributes || {};

          Langsheet.languagesCollection.each(function(localeModel) {
            var locale = localeModel.get('locale');
            _.set(metaData, ['locale_attributes', locale, 'is_approved'], !!_.get(metaData, ['locale_attributes', locale, 'is_approved']));
          });

          this.set('__META__', metaData);
        },
    });

})();
