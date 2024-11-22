/**
 * @author Ivan Ivanov <ivan.ivanov@telebid-pro.com>
 * @desc Telebid's form library
 * @module TB
 * @memberOf TB
 */
/**
 * @typedef {Object} DOMElement
 */

/**
 * @typedef {Object} DOMFormElement
 * @instanceof DOMElement
 */

/**
 * Form input key and value
 * @typedef {Object} FormInputKV
 * @property {string} name name of the input
 * @property {string} [value] value of the input
 */

/**
 * @typedef {Object.<string, InputValue>} FormValue
 */

/**
 * @typedef {Object} InputValue
 * @type {(Array.<string>|string)}
 */
(function(root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = root.TB = factory(
      require('tb.xerrors'),
    );
  } else if (typeof define === 'function' && define.amd) {
    define(['tb.xerrors'], function() {
      return (root.TB.Form = factory(root.TB));
    });
  } else {
    root.TB.Form = factory(root.TB);
  }
})(this, function(TB) {
  var Form = {};

  /**
   * @todo should be proven in real situation
   */
  Form.lockForm = function(formEl, styles) {
    ASSERT(formEl && typeof formEl === 'object' && formEl.nodeName === 'FORM', { code: '', msg: '', });

    var over = document.createElement('div');
    var styles = Object.create({
      backgroundColor: 'black',
      opacity: 0,
    }, styles);

    Form.wrapInner(formEl, over);
  };

  /**
   * @param {DOMFormElement} formEl target HTML DOM form element
   * @param {DOMElement|String}
   */
  Form.wrapInner = function(parent, wrapper) {
    if (typeof wrapper === 'string') {
      wrapper = document.createElement(wrapper);
    }

    var div = parent.appendChild(wrapper);

    while(parent.firstChild !== wrapper) {
      wrapper.appendChild(parent.firstChild);
    }
  };

  /**
   * @param {DOMFormElement} formEl target HTML DOM form element
   * @return {Array.<FormInputKV>}
   */
  Form.getFormValuesArray = function (formEl) {
    ASSERT(formEl && typeof formEl === 'object' && formEl.nodeName === 'FORM', { code: '', msg: '', });
    ASSERT(formEl.length, { code: '', msg: 'The form must have at least one element', });

    var elements = formEl.elements;
    var result = [];

    for(var i = 0, l = elements.length; i < l; i++) {
      var el = elements[ i ];
      var nodeName = el.nodeName.toLowerCase();

      // if element has no name, then it should not be submitted
      if(!el.name) continue;

      if(nodeName === 'input' || nodeName === 'textarea') {
        // TODO decide whatcha gonna do when we have type="file"???
        if(el.type === 'file') continue;

        var value = el.value;

        if(el.type === 'checkbox' || el.type === 'radio') {
          value = el.checked ? el.value : undefined;
        }

        result.push({
          name: el.name,
          value: value,
        });
      } else if(nodeName === 'select') {
        var value = Form.getSelectValues(el);

        //ASSERT(!el.multiple, { msg: 'NOT IMPLEMENTED', });
        value = el.multiple ? value : value[0];

        result.push({
          name: el.name,
          value: value,
        });
      }
    }

    return result;
  };

  /**
   * @param {DOMFormElement} formEl target HTML DOM form element
   * @return {FormValue}
   */
  Form.extractValues = function (formEl) {
    var fieldsArr = Form.getFormValuesArray(formEl);
    var result = {};
    var metaData = {
      setFields: {},
      repeatedFields: {},
    };

    for (var i = 0, l = fieldsArr.length; i < l; i++) {
      var field = fieldsArr[ i ];

      if(field.value === null || field.value === undefined) continue;

      // if this field name has been already present
      if(metaData.setFields[ field.name ]) {
        // if this field name has been already present more than once
        if(metaData.repeatedFields[ field.name ]) {
          result[ field.name ].push(field.value);
          continue;
        }

        metaData.repeatedFields[ field.name ] = true;

        // convert to array of values
        result[ field.name ] = [
          result[ field.name ],
          field.value
        ];

        continue;
      }

      metaData.setFields[ field.name ] = true;
      result[ field.name ] = field.value;
    }

    return result;
  };

  /**
   * @param {DOMFormElement} formEl target HTML DOM form element
   * @param {FormValue} values
   * @param {boolean} [requireValues=undefined]
   */
  Form.populateValues = function(formEl, values, requireValues) {
    ASSERT(formEl && typeof formEl === 'object' && formEl.nodeName === 'FORM', { code: '', msg: '', });
    ASSERT(formEl.length, { code: '', msg: 'The form must have at least one element', });

    var elements = formEl.elements;

    for(var i = 0, l = elements.length; i < l; i++) {
      var el = elements[ i ];
      var nodeName = el.nodeName.toLowerCase();
      var value = values[ el.name ];

      // if element has no name, then it should not be submitted
      if(!el.name) continue;
      if(!requireValues && (value === undefined || value === null)) continue;

      ASSERT(value !== undefined && value !== null, { code: 'XXX', msg: 'Missing value for $NAME$', msgParams: { NAME: el.name, }, });

      if(nodeName === 'input' || nodeName === 'textarea') {
        // TODO decide whatcha gonna do when we have type="file"???
        if(el.type === 'file') continue;

        if(el.type === 'checkbox') {
          el.checked = valueExists(el.value, value);
        } else if (el.type === 'radio') {
          el.checked = el.value === value;
        } else {
          el.value = value;
        }
      } else if(nodeName === 'select') {
        Form.setSelectValues(el, values);
      }
    }
  };

  /**
   * @param {DOMSelectElement} selectEl target HTML DOM select input
   * @param {InputValue} values values of the input
   */
  Form.setSelectValues = function (selectEl, values) {
    var options = selectEl && selectEl.options;

    for (var i = 0, l = options.length; i < l; i++) {
      var opt = options[i];
      var optValue = opt.value === undefined ? opt.text : opt.value;

      opt.selected = valueExists(optValue, values[ selectEl.name ]);
    }
  };

  /**
   * @param {DOMSelectElement} selectEl target HTML DOM select input
   * @return {InputValue} values of the input
   */
  Form.getSelectValues = function (selectEl) {
    var result = [];
    var options = selectEl && selectEl.options;

    for (var i = 0, l = options.length; i < l; i++) {
      var opt = options[ i ];

      if (opt.selected) {
        result.push(opt.value || opt.text);
      }
    }

    return result;
  };

  function valueExists(elVal, val) {
    if((typeof val === 'string' || typeof val === 'number') && val.toString() === elVal) {
      return true;
    } else if (val instanceof Array) {
      return (val.indexOf(elVal) >= 0);
    } else {
      return false;
    }
  }

  return Form;
});
