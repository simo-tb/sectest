/*global $, ace, console*/
(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('jquery-2'), require('jf.ui'));
  } else if (typeof define === 'function' && define.amd) {
    define(['jquery-2', 'jf.ui'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    factory($);
  }
})(this, function ($, jsonForms) {
  var sourceForm = {
    schema: {
      id: 'http://jschemas.tbpro.com/tblib/jf/playground/source-form',
      $schemaId: 'http://jschemas.tbpro.com/tblib/jf/playground/source-form',
      type: 'object',
      properties: {
        source: {
          title: 'JSON Form object to render',
          type: 'string',
          maxLength: 150000
        }
      }
    },
    form: {
      $schemaId: 'http://jschemas.tbpro.com/tblib/jf/playground/source-form',
      validate: false,

      jsonformVersion: '2.0',
      fields: [
        {
          "type": "fieldset",
          "title": "View example's source",
          "expandable": true,
          "items": [
            {
              key: 'source',
              type: 'ace',
              aceMode: 'json',
              width: '100%',
              height: '' + (window.innerHeight - 140) + 'px',
              // notitle: true,
              onChange: function () {
                generateForm();
              }
            }
          ]
        }
      ]
    }
  };

  var formObject = {
    schema: {
      id: 'http://jschemas.tbpro.com/tblib/jf/playground/form-object',
      $schemaId: 'http://jschemas.tbpro.com/tblib/jf/playground/form-object',
      type: 'object',
      properties: {
        example: {
          title: 'JSON Form example to start from',
          type: ['string', 'null'],
          'default': '1-input-text-basic'
        },
      },
    },
    form: {
      $schemaId: 'http://jschemas.tbpro.com/tblib/jf/playground/form-object',
      jsonformVersion: '2.0',
      validate: false,
      fields: [
        {
          key: 'example',
          notitle: true,
          prepend: 'Try with',
          htmlClass: 'trywith',
          type: 'select2',
          options: {
            // '.1': '<optgroup label="INPUT FIELDS">',

            // '.2': '<optgroup label="&nbsp;&nbsp;text inputs">',
            '1-input-text-basic': '1.0 Text input - basic',
            '1-input-text-advanced': '1.1 Text input - advanced',
            '1-input-text-egn-basic': '1.2 Text input - format EGN - basic',
            '1-input-text-ip-basic': '1.3 Text input - format IP - basic',
            '1-textarea-basic': '2.0 Textarea - basic',
            '1-textarea-advanced': '2.1 Textarea - advanced',
            // 'tb-tags-simple': 'TB - Tag select - simple',
            // 'tb-tags-advanced': 'TB - Tag select - advanced',
            '2-ace-basic': '3.0 Ace code editor - basic',
            '2-ace-advanced': '3.1 Ace code editor - advanced',
            '2-tinymce-basic': '4.0 TinyMCE html editor - basic',
            '2-tinymce-advanced': '4.1 TinyMCE html editor - advanced',
            // 'tagsinput-basic': 'Tags - basic',

            // '.3': '<optgroup label="&nbsp;&nbsp;radio buttons">',
            '3-radios-basic': '5.0 radiobuttons basic',
            '3-radios-advanced': '5.1 radiobuttons advanced',
            '3-radiobuttonset-basic': '6.0 Radio buttonset basic',
            '3-radiobuttonset-advanced': '6.1 Radio buttonset advanced',

            // '.4': '<optgroup label="&nbsp;&nbsp;checkboxes">',
            '4-checkbox-basic': '7.0 Checkbox - basic',
            '4-checkbox-advanced': '7.1 Checkbox - advanced',

            // '.5': '<optgroup label="&nbsp;&nbsp;select lists">',
            '5-select-basic': '8.0 select basic',
            '5-select-advanced': '8.1 select advanced',
            '5-native-multipleselect-basic': '9.0 Native multipleselect basic',
            '5-native-multipleselect-advanced': '9.1 Native multipleselect advanced',
            '5-multipleselect': '10.0 Multiple select basic',
            '5-multipleselect-advanced': '10.1 Multiple select advanced',
            '5-orderedselect-basic': '11.0 Ordered select',
            '5-orderedselect-advanced': '11.1 Ordered select advanced',
            '5-select2-basic': '12.0 Select2 basic',
            '5-selectize-basic': '13.0 Selectize basic',
            '5-selecttemplate-basic': '14.0 Select template basic',
            '5-selecttemplate-advanced': '14.1 Select template advanced',
            '5-tags-basic': '15.0 Tags basic',
            '5-tags-advanced': '15.1 Tags advanced',
            '5-key-not-working': '9999. Simo Task',

            //foreign key
            '5-foreign-key-basic': '37.0 Foreign Key Search Basic',
            '5-foreign-key-advanced': '37.1 Foreign Key Search Advanced',
            // 'orderedselect-advanced': 'Orderedselect advanced',
            // 'tb-multiple-select': 'TB - Multiple select',

            // '.6': '<optgroup label="&nbsp;&nbsp;date inputs">',
            '6-datepicker-basic': '16.0 datePicker - basic',
            '6-datepicker-advanced': '16.1 datePicker - advanced',
            '6-datepicker-basic-range': '16.2 datePicker range - basic',
            '6-timepicker-basic': '16.2 timePicker - basic',
            '6-datetimepicker-basic': '16.3 dateTimePicker - basic',
            '6-datetimepicker-advanced': '16.4 dateTimePicker - advanced',
            '6-daterangepicker-basic': '16.5 dateRangePicker - basic',
            '6-daterangepicker-advanced': '16.6 dateRangePicker - advanced',
            '6-datetimerangepicker-basic': '16.7 dateTimeRangePicker - basic',
            '6-datetimerangepicker-advanced': '16.8 dateTimeRangePicker - advanced',


            // '.7': '<optgroup label="&nbsp;&nbsp;other inputs">',
            '7-color': '17.0 Fields - Color picker: the color type',

            // '.8': '<optgroup label="FIELDSETS">',
            '8-section': '18.0 Section',
            '8-fieldset': '19.0 Fieldset',
            '8-array': '20.0 Array basic',
            '8-array-parse': '20.1 Array parse',
            '8-tabarray-basic': '21.0 Tabarray basic',
            '8-tabarray-select': '21.1 Tabarray with select',
            '8-tabarray-advanced': '22.0 Tabarray advanced',
            '8-tabobject-simple': '23.0 Tabobject - basic',
            '8-tabobject-select': '23.0 Tabobject with select',
            '8-table-as-simple-as-possible': '24.0 Simple Table',
            '8-table-advanced': '24.1 Table advanced',
            '8-table-object-simple': '24.2 #TODO Table object',

            '8-table-object-advanced': '24.3 Table object advanced',
            '8-table-object-inside-tabarray': '24.4 Table object inside tabarray',
            '8-table-object-inside-tabobject': '24.5 Table object inside tabobject',
            '8-locales': '24.6 Translated fields - MULTILANGUAGE - basic',
            '8-locales-advanced': '24.7 Translated fields - MULTILANGUAGE - advanced with merge!',
            '8-table-data-plugin': '24.8. DataTable plugin example',

            // '.9': '<optgroup label="CONTROL FLOW">',
            '9-questions': '25.0 Questions basic',
            '9-questionary-generator': '25.1 Questionary generator',
            '9-questionary': '25.2 Questionary ',
            '9-selectfieldset': '26.0 Selectfieldset basic',
            '9-selectfieldset-advanced': '26.1 Selectfieldset advanced',
            '9-selectfieldset-advanced2': '26.2 Selectfieldset auto expand fields of children',
            '9-selectfieldset-advanced-field-params': '26.3 Selectfieldset with field params',
            '9-alternatives': 'Alternatives',
            // 'fields-questions-advanced': 'Fields - Series of questions: the questions type',
            // 'fields-selectfieldset-key': 'selectfieldset advanced',

            // '.10': '<optgroup label="OPTIONS">',
            '10-templating-idx': '27.0 Templating - item index with idx',
            '10-templating-value': '27.1 Templating - tab legend with value and valueInLegend',
            '10-templating-tpldata': '27.2 Templating - Using the tpldata property',
            '10-templating-value-tabobject': '27.3 Templating - tab legend with value and valueInLegend',

            // 'schema-default': 'Default values',
            '11-submit': '28.0 Submit type',
            '11-hidden': '29.0 Hidden type',
            '11-events': '30.0 Using event handlers',

            // auto schema generation
            '12-auto-form-basic': '31.0 Schema generation from form: flat structure',
            '12-auto-form-object': '31.1 Schema generation from form: objects',
            '12-auto-form-array': '31.2 Schema generation from form: arrays',
            '12-auto-content-basic': '31.3 Schema generation from content: scalar fields',
            '12-auto-content-object': '31.4 Schema generation from content: objects',
            '12-auto-content-array': '31.5 Schema generation from content: arrays',

            //$refs
            '13-inline-ref-basic': '32.0 Schema reference - basic',
            '13-inline-ref-advanced': '32.1 Schema reference - advanced',


            // files
            '14-file': '33.0 File Schema generator',
            '14-fileRequest': '33.1 External File Upload',
            '14-file-multiple': '33.2 Multiple File Upload',
            '14-fileDrawerjs': '33.3. Drawejs Example',

            '15-range': '34.0 Range generator',
            '16-all-of-example': '35.0 allOfSchema Example',
            '16-all-of-example-2': '35.01 allOfForm Example',
            '16-password-field-example': '35.1 Password Example',
            '16-password-field-example-in-array': '35.15 password in array',
            '16-not-in-schema-but-in-content': '35.2 Not in schema but in content Example',
            '16-should-broke-tabobject-with-array': '35.3 should-broke-tabobject-with-array',
            '16-enum-example': '35.4 Enum Example',
            '16-selection-field-set-broken': '35.5 Selection Fieldset broken',
            '16-double-file-upload': '35.6 Mitko double file upload',
            '16-broken-translateobject-with-array': '35.7 bug pls fix',
            '16-genericHTML-text': '35.8 generic HTML example',
            '16-slavi-broken': '35.9 found the slavi schema, now fix it!',
            '16-broken-schema-null-with-null-test-ajv-validation': '35.10 Broken input schema. Ajv should complain!',
            '16-multi-language-in-merge': '35.11 Schema modification and merge',
            '16-inet-format-example': '40.0. Inet v6 format example - TODO: we should make it work!',
            '16-html-format-example': '40.1. html format exaplme',

            '16-suri-broken': '35.13 Form is broken - suricactus!',
            '17-imagePreview-example': '36.0 imagePreview example',

            '37-include-form-example': '37.0 Include Form Inclusion Example',
            '37-include-form-inside-included-form-example': '37.1 Include Form Inside Include Form Example',
            '37-two-included-forms-inside-included-form-example': '37.1 2 Include Forms Inside Include Form Example',
            '39-fieldParams-example': '39.0 Field Params Example',


            'new_stuff': '35.2-mitko-file',
            '777-rado':'36-jpsettings',
            '999-should-break-formValidator':'999-momo',
            '555-array-broken': '555-array-broken',
            '400-input-text-with-dot': 'dot test case',
            '420-test-alternatives': 'Alternatives test',

            '8-tabcontrols-nested': '9999. Test for nested controls',
            '20-tests-escaping': 'Escaping keys in the form, content and value - test case',
            '20-tests-merge-and-ref-object-manipulation': 'Check if merge and ref manipulate the schema directly or just via object manipulation!',
            '20-tests-big-rado-schema': 'Check if this big schema is being loaded, and if all the required properties have *, and those that aren\'t - don\'t',
            '21-json-editor': 'JSON EDITOR example',

            '51-pg-interval': 'PG Time Interval Basic',
            '52-time-interval': 'Time Interval Basic',
            '9999-ultimate-key-test': '9999. Ultimate key test',
            '21-json-editor-example1': 'JSON EDITOR example - without readOnly'
          },
          onChange: function (evt) {
            var selected = $(evt.target).val();

            if (selected.slice(0, 1) !== '.') {
              loadExample(selected);
              if (history) {
                history.pushState({example: selected}, 'Example - ' + selected, '?example=' + selected);
              }
            }
          }
        }
      ]
    }
  };

  /**
   * Extracts a potential form to load from query string
   */
  var getRequestedExample = function () {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    var param = null;
    for (var i = 0; i < vars.length; i++) {
      param = vars[i].split('=');
      if (param[0] === 'example') {
        if (param[1].slice(-1) == '/')
          return param[1].slice(0, -1);
        return param[1];
      }
    }
    return null;
  };

  /**
   * Loads and displays the example identified by the given name
   */
  var loadExample = function (example) {
    var exampleDir = 'examples/';
    $.ajax({
      url: exampleDir + example + '.json?2',
      dataType: 'text'
    }).done(function (code) {
      // var uicode = JSON.parse(code);
      // for (var i = 0, j = uicode.form.length; i < j; i++) {
      //   if (uicode.form[i].type === "submit") {
      //     uicode.form.splice(i, 1);
      //   }
      // }

      // editor.getSession().setValue(JSON.stringify(uicode, null, " "));
      var aceId = $('#source .ace_editor').attr('id');
      var editor = ace.edit(aceId);
      editor.getSession().setValue(code);

      // $('#source').html('');
      // $('#source').jsonForm(sourceForm);

    }).fail(function () {
      $('#result').html('Sorry, I could not retrieve the example!');
    });
  };

  $('#injector').change(function() {
    generateForm();
  });

  var $showEnumCSS = $('<style> .tb-jf-enumerate-form { display: inline; } </style>');
  $('#add-numeration').change(function() {
    if (this.checked) {
      $('body').append($showEnumCSS);
    } else {
      $showEnumCSS.remove();
    }

  });

  /**
   * Displays the form entered by the user
   * (this function runs whenever once per second whenever the user
   * changes the contents of the ACE input field)
   */
  var generateForm = function () {
    // Reset result pane
    $('#result').html('');

    // Parse entered content as JavaScript
    // (mostly JSON but functions are possible)
    var createdForm = null;

    // Most examples should be written in pure JSON,
    // but playground is helpful to check behaviors too!
    try {
      var values = $('#source').jsonFormValue().values;

      //we use eval instead of JSON.parse, because the content might not be real JSON, it can contain event handler function, and other non-JSON stuff....
      createdForm = values.source;

    } catch (e) {
      console.log(200, e);

      $('#result').html('<pre>Entered content is not yet a valid' +
        ' JSON Form object.\n\nJavaScript parser returned:\n' +
        e + '</pre>');

      return;
    }

    // Render the resulting form, binding to onSubmitValid
    try {
      createdForm.onSubmitValid = function (values) {
        if (console && console.log) {
          console.log('Values extracted from submitted form', values);
        }
        window.alert('Form submitted. Values object:\n' +
          JSON.stringify(values, null, 2));
      };
      createdForm.onSubmit = function (errors, values) {
        if (errors) {
          console.log('Validation errors', errors);
          return false;
        }
        return true;
      };

      createdForm.onLoad = function () {
        console.info(111, 'loaded jf');
      };

      $('#result').html('<form id="result-form" class="form-vertical"></form>');

      $('#result-form').on('jfload', function(){
        console.info(888, 'the jsonform is loaded!');
        // var html = $('#result-form').jsonFormTinyGenerateForm();
        // $('#result-form').replaceWith(html);
      });

      var shouldInjectSubmit = $('#injector').prop('checked');
      if (shouldInjectSubmit) {
        createdForm.form.fields.push({
          type: 'submit',
          title: 'submit'
        });
      }

      var start_time = Date.now();
      var form = $('#result-form').jsonForm(createdForm);

      $('#get-jftiny-html').click(function() {
        $('#jf-tiny-html-modal-text').text(form.jsonFormTinyGenerateForm());
        $('#exampleModalLong').modal('show');
      });

      var optionData = [
        {value: '123', title: 'scrub'},
      ]
      var templateData = [
        {text: '123', name: 'myName', email: 'momo@tevenen.com', city: 'sofia', country: 'Bulgaria'},
      ]

      // form.jsonFormAddTemplateData('hello', optionData, templateData);
      // form.jsonFormSetTemplateData('hello', optionData, templateData);

      // console.info('This should be all about the input data to jsonforms ', $('#result-form').getFullFormDescriptor());
    }
    catch (e) {
      console.log(e)
      $('#result').html('<pre>Entered content is not yet a valid' +
        ' JSON Form object.\n\nThe JSON Form library returned:\n' +
        e.origMsg + '</pre>');
      return;
    }
  };


  // Render the form
  $('#source').jsonForm(sourceForm);
  $('#form').jsonForm(formObject);


  console.info('Loaded all the stuff');

  // Wait until ACE is loaded
  var itv = window.setInterval(function() {
    var example = getRequestedExample() || '1-input-text-basic';
    $('.trywith select').val(example);
    if (window.ace) {
      window.clearInterval(itv);
      loadExample(example);
    }
  }, 1000);
});
