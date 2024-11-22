/*! sprintf-js | Alexandru Marasteanu <hello@alexei.ro> (http://alexei.ro/) | BSD-3-Clause */

!function(a){function b(){var a=arguments[0],c=b.cache;return c[a]&&c.hasOwnProperty(a)||(c[a]=b.parse(a)),b.format.call(null,c[a],arguments)}function c(a){return Object.prototype.toString.call(a).slice(8,-1).toLowerCase()}function d(a,b){return Array(b+1).join(a)}var e={not_string:/[^s]/,number:/[diefg]/,json:/[j]/,not_json:/[^j]/,text:/^[^\x25]+/,modulo:/^\x25{2}/,placeholder:/^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijosuxX])/,key:/^([a-z_][a-z_\d]*)/i,key_access:/^\.([a-z_][a-z_\d]*)/i,index_access:/^\[(\d+)\]/,sign:/^[\+\-]/};b.format=function(a,f){var g,h,i,j,k,l,m,n=1,o=a.length,p="",q=[],r=!0,s="";for(h=0;o>h;h++)if(p=c(a[h]),"string"===p)q[q.length]=a[h];else if("array"===p){if(j=a[h],j[2])for(g=f[n],i=0;i<j[2].length;i++){if(!g.hasOwnProperty(j[2][i]))throw new Error(b("[sprintf] property '%s' does not exist",j[2][i]));g=g[j[2][i]]}else g=j[1]?f[j[1]]:f[n++];if("function"==c(g)&&(g=g()),e.not_string.test(j[8])&&e.not_json.test(j[8])&&"number"!=c(g)&&isNaN(g))throw new TypeError(b("[sprintf] expecting number but found %s",c(g)));switch(e.number.test(j[8])&&(r=g>=0),j[8]){case"b":g=g.toString(2);break;case"c":g=String.fromCharCode(g);break;case"d":case"i":g=parseInt(g,10);break;case"j":g=JSON.stringify(g,null,j[6]?parseInt(j[6]):0);break;case"e":g=j[7]?g.toExponential(j[7]):g.toExponential();break;case"f":g=j[7]?parseFloat(g).toFixed(j[7]):parseFloat(g);break;case"g":g=j[7]?parseFloat(g).toPrecision(j[7]):parseFloat(g);break;case"o":g=g.toString(8);break;case"s":g=(g=String(g))&&j[7]?g.substring(0,j[7]):g;break;case"u":g>>>=0;break;case"x":g=g.toString(16);break;case"X":g=g.toString(16).toUpperCase()}e.json.test(j[8])?q[q.length]=g:(!e.number.test(j[8])||r&&!j[3]?s="":(s=r?"+":"-",g=g.toString().replace(e.sign,"")),l=j[4]?"0"===j[4]?"0":j[4].charAt(1):" ",m=j[6]-(s+g).length,k=j[6]&&m>0?d(l,m):"",q[q.length]=j[5]?s+g+k:"0"===l?s+k+g:k+s+g)}return q.join("")},b.cache={},b.parse=function(a){for(var b=a,c=[],d=[],f=0;b;){if(null!==(c=e.text.exec(b)))d[d.length]=c[0];else if(null!==(c=e.modulo.exec(b)))d[d.length]="%";else{if(null===(c=e.placeholder.exec(b)))throw new SyntaxError("[sprintf] unexpected placeholder");if(c[2]){f|=1;var g=[],h=c[2],i=[];if(null===(i=e.key.exec(h)))throw new SyntaxError("[sprintf] failed to parse named argument key");for(g[g.length]=i[1];""!==(h=h.substring(i[0].length));)if(null!==(i=e.key_access.exec(h)))g[g.length]=i[1];else{if(null===(i=e.index_access.exec(h)))throw new SyntaxError("[sprintf] failed to parse named argument key");g[g.length]=i[1]}c[2]=g}else f|=2;if(3===f)throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported");d[d.length]=c}b=b.substring(c[0].length)}return d};var f=function(a,c,d){return d=(c||[]).slice(0),d.splice(0,0,a),b.apply(null,d)};"undefined"!=typeof exports?(exports.sprintf=b,exports.vsprintf=f):(a.sprintf=b,a.vsprintf=f,"function"==typeof define&&define.amd&&define('tblib-sprintf', function(){return{sprintf:b,vsprintf:f}}))}("undefined"==typeof window?this:window);
//# sourceMappingURL=sprintf.min.map
/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @desc Translating utilities using Langsheet
 * @module Translate
 * @memberOf TB
 */
;(function(global, factory) {
  if(typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('tb.xerrors'));
  } else if (typeof define === 'function' && define.amd) {
    define(['tb.xerrors'], function() {
        return factory.apply(factory, arguments);
    });
  } else {
    global.TB = global.TB || {};
    global.TB.Translate = factory(global.TB);
  }
})(this, function(TB) {
  'use strict';
  /**
   * Translate object
   * @constructor
   * @memberof TB
   * @param {Object} translations translations JSON
   * @param {Array} locales      list of locales
   * @param {String} module       module name
   */
  function Translate( translations, locales, module ) {
    /**
     * Current module
     * @name TB.Translate#module
     * @type {String}
     */
    this.module = null;
    /**
     * Locales
     * @type {Array<String>}
     */
    this.locales = null;
    /**
     * Translations object
     * @type {Object}
     */
    this.translations = null;
    /**
     * Currency code
     * @type {String}
     */
    this.currencyCode = null;
    /**
     * Currency object to create new formated strings from
     * @type {Object}
     */
    this.currencyObj = null;
    /**
     * Date object to create new formated strings from
     * @type {Object}
     */
    this.dateObj = null;
    /**
     * Date object to create new formated strings from
     * @type {Object}
     */
    this.dateTimeObj = null;
    /**
     * Date object to create new formated strings from
     * @type {Object}
     */
    this.timeObj = null;


    this._init.apply( this, arguments );
  }

  var fakeIntlDateTimeFormat = function ( locale, config ) {
    this.locale = locale;
    this.config = config;

    this.format = function ( value ) {
        return value;
    };

    return this;
  };

  var fakeIntlNumberFormat = function ( locale, config ) {
    this.locale = locale;
    this.config = config || {};

    this.format = function (value) {
        var maximumFractionDigits = ( typeof this.config.maximumFractionDigits === 'number' )
            ? this.config.maximumFractionDigits
            : ( this.config.style === 'currency' )
                ? 2
                : undefined;

        if ( typeof maximumFractionDigits === 'number' )
        {
            value = value.toString();
            var parts = value.split( /\.|\,/ );

            if ( parts[1] ) {
                value = parts[0];

                if ( maximumFractionDigits > 0 ) {
                    value += '.' + parts[1].substring(0, maximumFractionDigits);
                }
            }
        }

        if ( this.config.style === 'currency' && this.config.currency ) {
           return this.config.currency + ' ' + value;
        }

        return value;
    };

    return this;
  };

  var IntlDateTimeFormat = function ( locale, config ) {
    if(typeof Intl === 'object' && typeof Intl.DateTimeFormat !== 'undefined') {
        return new Intl.DateTimeFormat( TB.underscoreToDash( locale ), config );
    }

    return new fakeIntlDateTimeFormat(locale, config);
  };

  var IntlNumberFormat = function( locale, config ) {
    if(typeof Intl === 'object' && typeof Intl.DateTimeFormat !== 'undefined') {
        return new Intl.NumberFormat( TB.underscoreToDash( locale ), config );
    }

    return new fakeIntlNumberFormat(locale, config);
  };

  /** @lends TB.Translate.prototype */
  Translate.prototype = {
    /**
     * Init
     * @private
     */
    _init: function( translations, locales, module ) {
      ASSERT( _.isArray(locales) && !_.isEmpty(locales) > 0, { code: 'TBJS/I18N/2001', msg: 'Bad locales list'} );

      this.module = module;
      this.locales = locales;
      this.translations = translations;
      this.currencyCode = null;
      this.currencyObj = null;
      this.currentLocale = locales[0];
      this.dateObj = new IntlDateTimeFormat( this.currentLocale );
      this.dateTimeObj = new IntlDateTimeFormat( this.currentLocale, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      } );
      this.timeObj = new IntlDateTimeFormat( this.currentLocale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      } );
    },
    /**
     * Get raw translation
     * @private
     * @param  {String} translateKey requested text to translate
     * @param  {?String} locale translate in locale
     * @return {?String}              translated string or null if not found
     */
    _getRawTranslation: function( translateKey, locale ) {
      if ( !this.translations[ this.module ] ) {
        return null;
      }

      var translateObj = this.translations[ this.module ][ translateKey ];

      // make it work with lowecase translations
      translateObj = this.translations[ this.module ][ (translateKey || '').toLowerCase() ];

      // make it work with lowecase translations
      translateObj = this.translations[ this.module ][ translateKey.toLowerCase() ];

      return translateObj ? translateObj[ locale ] : null;
    },
    /**
     * Reinitialization with new params. If not provided, the old instance values are used
     * @param {?Object} translations translations JSON
     * @param {?Array} locales      list of locales
     * @param {?String} module       module name
     */
    reinit: function( translations, locales, module ) {
      translations = translations || this.translations;
      locales = locales || this.locales;
      module = module || this.module;

      this._init.call( this, translations, locales, module );
    },
    /**
     * Sets instance locale to given locale
     * @param {ISOlocale} locale new locale
     * @throws when unknown locale
     */
    setLocale: function( locale ) {
      if ( this.locales.indexOf( locale ) >= 0 ) {
        this.currentLocale = locale;
      } else {
        throw new Error( 'Unknown locale ' + locale + ' in list of ' + this.locales.join() );
      }
    },
    /**
     * Set instance currency to given currency
     * @param {ISOcurrency} currencyCode currency code
     */
    setCurrency: function( currencyCode ) {
      this.currencyCode = currencyCode;
      this.currencyObj = new IntlNumberFormat( this.currentLocale, {
        style: 'currency',
        currency: currencyCode,
      } );
    },
    /**
     * Get translated text. If not available, get preferred translation. If not available preferred translation, return requested text
     * @param  {String} translateKey requested text to translate
     * @return {String}              translated text
     */
    gettext: function( translateKey ) {
      translateKey = (translateKey || '').toString();

      var translationArr = this._getRawTranslation( translateKey, this.currentLocale );
      var argumentsArr = Array.prototype.slice.call( arguments );

      if ( !translationArr || !translationArr[0] ) {
        translationArr = this._getRawTranslation( translateKey, this.locales[0] );

        if ( !translationArr || !translationArr[0] ) {
          translationArr = [translateKey];
        }
      }

      argumentsArr[0] = translationArr[0];
      if(typeof argumentsArr[0] === 'string') {
        argumentsArr[0] = argumentsArr[0].replace(/(%)(?![sdf])/g, '%%');
      }

      return sprintf.apply( sprintf, argumentsArr );
    },
    /**
     * Get localized number
     * @param  {Number} number         number to localize
     * @param  {Number} fractionDigits fraction digits
     * @param  {Object} params         IntlNumberFormat params
     * @return {String}                formatted number
     */
    getnumber: function( number, fractionDigits, params ) {
      return Translate.getnumber.call( this, this.currentLocale, number, fractionDigits, params );
    },
    /**
     * Get localized currency
     * @param  {Number} number       number to localize
     * @param  {ISOcurrency} currencyCode ISO currency code
     * @param  {Boolean} hideFraction if true hide fraction
     * @param  {Object} params       IntlNumberFormat params
     * @return {String}              formatted currency
     * @todo remove this function, use the static method of the class
     */
    getcurrency: function( number, currencyCode, hideFraction, params ) {
      var formattedNumber;

      if ( !this.currencyCode || currencyCode || hideFraction ) {
        params = {
          style: 'currency',
          currency: currencyCode || this.currencyCode,
        };

        if ( hideFraction ) {
          params.minimumFractionDigits = 0;
          params.maximumFractionDigits = 0;
        }

        formattedNumber = new IntlNumberFormat( this.currentLocale, params ).format( number );
      } else {
        formattedNumber = this.currencyObj.format( number );
      }

      formattedNumber = formattedNumber.toString().replace( /([A-Z]{3})([\d\.\,]+)|([\d\.\,]+)([A-Z]{3})/, '$1$3 $2$4' );

      return formattedNumber;
    },
    /**
     * Get localized date
     * @param  {String|Date} date date to localize
     * @return {String}      localized date
     */
    getdate: function( date ) {
      if ( ! _.isString(date) && !_.isDate(date) ) {
        // should be ASSERT...
        return TB.CONFIG.EMPTY_DATE;
      }
      if ( _.isString(date) && date.length == 0 ) {
        return TB.CONFIG.EMPTY_DATE;
      }

      return this.dateObj.format( TB.normalizeDate( date ) );
    },
    /**
     * Get localized time
     * @param  {String|Date} date date to localize
     * @return {String}      localized time
     */
    gettime: function( date ) {
      if ( ! _.isString(date) && !_.isDate(date) ) {
        // should be ASSERT...
        return TB.CONFIG.EMPTY_DATE;
      }
      if ( _.isString(date) && date.length == 0 ) {
        return TB.CONFIG.EMPTY_DATE;
      }

      return this.timeObj.format( TB.normalizeDate( date ) );
    },
    /**
     * Get localized datetime
     * @param  {String|Date} date date to localize
     * @return {String}      localized date and time
     */
    getdatetime: function( date ) {
      if ( ! _.isString(date) && !_.isDate(date) ) {
        // should be ASSERT...
        return TB.CONFIG.EMPTY_DATE;
      }
      if ( _.isString(date) && date.length == 0 ) {
        return TB.CONFIG.EMPTY_DATE;
      }

      return this.dateTimeObj.format( TB.normalizeDate( date ) );
    },
    /**
     * Get localized
     * @param {String} fallback fallback string
     * @param {(String|Object)} hash object with locale properties
     * @return {String} localized string
     */
    gethash: function( fallback, hash ) {
      var placeholderValues = _.toArray( arguments ).slice( 2 );

      if ( _.isEmpty( hash ) || hash == null) {
        placeholderValues.unshift( fallback );

        return this.gettext.apply( this, placeholderValues );
      } else if ( _.isString( hash ) ) {
        placeholderValues.unshift( hash );

        return this.gettext.apply( this, placeholderValues );
      } else if ( _.isObject( hash ) ) {
        var localeString = hash[ this.currentLocale ];
        var string = localeString || fallback || hash['DEFAULT'];

        placeholderValues.unshift( string );

        return this.gettext.apply( this, placeholderValues );
      } else {
        return THROW( 'Unable to gethash' );
      }
    },

  };

  /**
   * Get localized number
   * @param  {String} locale       locale
   * @param  {Number} number         number to localize
   * @param  {Number} fractionDigits fraction digits
   * @param  {Object} params         IntlNumberFormat params
   * @return {String}                formatted number
   */
  Translate.getnumber = function( locale, number, fractionDigits, params ) {
    locale = (locale !== undefined) ? TB.underscoreToDash( locale ) : undefined;
    params = params || {};

    if ( fractionDigits !== undefined ) {
      params.minimumFractionDigits = params.maximumFractionDigits = parseInt( fractionDigits );
    }

    return new IntlNumberFormat( locale, params ).format( number );
  };
  /**
   * Get localized currency
   * @param  {String} locale            locale
   * @param  {Number} number            number to localize
   * @param  {ISOcurrency} currencyCode ISO currency code
   * @param  {Boolean} hideFraction     if true hide fraction
   * @param  {Object} params            IntlNumberFormat params
   * @return {String}                   formatted currency
   */
  Translate.getcurrency = function( locale, number, currencyCode, hideFraction, params ) {
    var formattedNumber;

    locale = (locale !== undefined) ? TB.underscoreToDash( locale ) : undefined;
    params = params || {};
    params.style = 'currency';
    params.currency = currencyCode;

    if ( hideFraction ) {
      params.minimumFractionDigits = 0;
      params.maximumFractionDigits = 0;
    }

    formattedNumber = new IntlNumberFormat( locale, params ).format( number );
    formattedNumber = formattedNumber.toString().replace( /([A-Z]{3})([\d\.\,]+)|([\d\.\,]+)([A-Z]{3})/, '$1$3 $2$4' );

    return formattedNumber;
  };
  /**
   * Get localized date
   * @param  {String} locale locale
   * @param  {String|Date} date date to localize
   * @return {String}      localized date
   */
  Translate.getdate = function( locale, date ) {
    if ( !_.isDate( date ) ) {
      return TB.CONFIG.EMPTY_DATE;
    }
    locale = (locale !== undefined) ? TB.underscoreToDash( locale ) : undefined;

    return new IntlDateTimeFormat( locale ).format( TB.normalizeDate( date ) );
  };
  /**
   * Get localized time
   * @param  {String} locale locale
   * @param  {String|Date} date date to localize
   * @return {String}      localized time
   */
  Translate.gettime = function( locale, date ) {
    if ( !_.isDate( date ) ) {
      return TB.CONFIG.EMPTY_DATE;
    }
    locale = (locale !== undefined) ? TB.underscoreToDash( locale ) : undefined;

    return new IntlDateTimeFormat( locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    } )
      .format( TB.normalizeDate( date ) );
  };
  /**
   * Get localized datetime
   * @param  {String} locale    locale
   * @param  {String|Date} date date to localize
   * @return {String}           localized date and time
   */
  Translate.getdatetime = function( locale, date ) {
    if ( !_.isDate( date ) ) {
      return TB.CONFIG.EMPTY_DATE;
    }
    locale = (locale !== undefined) ? TB.underscoreToDash( locale ) : undefined;

    return new IntlDateTimeFormat( locale, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    } )
      .format( TB.normalizeDate( date ) );
  };

  TB.Translate = Translate;

  return Translate;
});
