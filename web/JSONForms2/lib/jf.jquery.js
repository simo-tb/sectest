(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('lodash'), require('jquery'), require('jf.ui'));
  } else if (typeof define === 'function' && define.amd) {
    define(['lodash', 'jquery', 'jf.ui'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    global.TB = global.TB || {};
    global.TB.jf = global.TB.jf || {};
    global.TB.jf.jquery = factory(global._, global.jQuery, global.TB.jf.ui);
  }
})(this, function (_, jQuery, TbJf) {
  'use strict';

    // Plugin definition.
  jQuery.fn.jsonform = function (method, options) {
    if (!this.length) return;

    if (!_.isString(method)) {
      options = method;
      method = undefined;
    }

    var $el = jQuery(this[0]);

    if (_.isUndefined(method)) {
      // here maybe assert it's not already set
      $el.data('jf-original-args', _.cloneDeep(options));
      var ret = $el.jsonForm(options.data);
      $el.on('change', () => $el.data('jf-unsaved-changes', true));
      return ret;
    }

    if (method === 'values') {
      ASSERT.isPlainObjectOrNil(options, { code: 'JFT/JQ/1100', msg: 'Must have value of type object, but given $value$', msgParams: { value: options } });

      if (options) {
        ASSERT(0, { msg: 'NOT IMPLEMENTED' });
      } else {
        return $el.jsonFormValue();
      }
    } else if (method === 'changes') {
      return $el.jsonFormChanges();
    } else if (method === 'setOrigContent') {
      $el.setOrigContent(options.content);
    } else if (method === 'destroy') {
      TB.schemaCache = {};
      $el.empty();
      $el.off();
      $el.removeData();
    } else if (method === 'setErrors') {
      ASSERT(0, { msg: 'NOT IMPLEMENTED' });
    } else if (method === 'setFkeys') {
      ASSERT(0, { msg: 'NOT IMPLEMENTED' });
    } else {
      ASSERT(0, { code: 'JFT/JQ/2100', msg: 'Unknown method $method$', msgParams: { method: method } });
    }
  };

  // Plugin defaults – added as a property on our plugin function.
  jQuery.fn.jsonform.defaults = {};
});
