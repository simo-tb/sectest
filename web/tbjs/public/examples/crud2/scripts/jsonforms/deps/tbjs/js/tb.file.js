;(function(window){
'use strict';
var TB = window.TB || {};
window.TB = TB;
/**
 * File manipulation
 * @alias TB.File
 * @constructor
 * @memberOf TB
 * @param {Object} settings instance settings
 * @param {String} [settings.type='text/plain'] file type
 * @param {String} [settings.charset='utf-8'] file charset
 * @param {String} [settings.filename=new Date().toString()] filename
 * @param {String} data file's data
 */
function File( settings, data ) {
  ASSERT.ofTbType( settings, 'object' );
  ASSERT.ofTbType( data, 'string' );

  var defaultSettings = {
    type: 'text/plain',
    charset: 'utf-8',
    filename: new Date().toString(),
  };

  settings = TB.merge( TB.merge( {}, defaultSettings ), settings );

  ASSERT.hasPropertyOfTbType( settings, 'type', 'string' );
  ASSERT.hasPropertyOfTbType( settings, 'charset', 'string' );
  ASSERT.hasPropertyOfTbType( settings, 'filename', 'string' );

  /**
   * Hold settings of the plugin
   * @name TB.File#s
   * @type {Object}
   * @readonly
   */
  this.s = settings;

  /**
   * File data
   * @type {String}
   */
  this.data = data;
}

/**
 * @lends TB.File.prototype
 */
File.prototype = {
  /**
   * Prepares current file data for download (encodes to URI)
   * @return {String}
   */
  _prepareData: function() {
    return encodeURIComponent( this.data );
  },
  /**
   * Download file in the browser
   * @todo currently works only for text/plain;charset=utf8
   */
  download: function() {
    var element = document.createElement( 'a' );

    element.setAttribute( 'href', 'data:text/plain;charset=utf-8,' + this._prepareData() );
    element.setAttribute( 'download', this.s.filename );

    element.style.display = 'none';

    document.body.appendChild( element );

    element.click();

    document.body.removeChild( element );
  },

};

TB.File = File;
})( typeof window === "undefined" ? this : window );
