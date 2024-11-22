/*global $, ace, console*/
$('document').ready(function () {
  var sourceForm = {
    schema: {
      id: 'http://jschemas.tbpro.com/tblib/jf/playground/source-form',
      type: 'object',
      properties: {
        source: {
          title: 'JSON Form object to render',
          type: 'string',
          maxLength: 50000
        }
      }
    },
    form: {
      schemaId: 'http://jschemas.tbpro.com/tblib/jf/playground/source-form',
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
              notitle: true,
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
      schemaId: 'http://jschemas.tbpro.com/tblib/jf/playground/form-object',
      jsonformVersion: '2.0',
      fields: [
        {
          key: 'example',
          notitle: true,
          prepend: 'Try with',
          htmlClass: 'trywith',
          type: 'select',
          options: {
            // '.1': '<optgroup label="INPUT FIELDS">',

            // '.2': '<optgroup label="&nbsp;&nbsp;text inputs">',
            '1-input-text-basic': '1.0 Text input - basic',
            '1-input-text-advanced': '1.1 Text input - advanced',
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
            // 'orderedselect-advanced': 'Orderedselect advanced',
            // 'tb-multiple-select': 'TB - Multiple select',

            // '.6': '<optgroup label="&nbsp;&nbsp;date inputs">',
            '6-datepicker-basic': '16.0 datePicker - basic',
            '6-datepicker-advanced': '16.1 datePicker - advanced',
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
            '8-tabarray-basic': '21.0 Tabarray basic',
            '8-tabarray-advanced': '22.0 Tabarray advanced',
            '8-tabobject-simple': '23.0 Tab object - basic',
            '8-locales': '24.0 Translated fields - basic',

            // '.9': '<optgroup label="CONTROL FLOW">',
            '9-questions': '25.0 Questions basic',
            '9-selectfieldset': '26.0 Selectfieldset basic',
            // 'fields-questions-advanced': 'Fields - Series of questions: the questions type',
            // 'fields-selectfieldset-key': 'selectfieldset advanced',

            // '.10': '<optgroup label="OPTIONS">',
            '10-templating-idx': '27.0 Templating - item index with idx',
            '10-templating-value': '27.1 Templating - tab legend with value and valueInLegend',
            '10-templating-tpldata': '27.2 Templating - Using the tpldata property',

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

      var aceId = $('#source .ace_editor').attr('id');
      var editor = ace.edit(aceId);
      editor.getSession().setValue(code);
      // editor.getSession().setValue(JSON.stringify(uicode, null, " "));

    }).fail(function () {
      $('#result').html('Sorry, I could not retrieve the example!');
    });
  };


  /**
   * Displays the form entered by the user
   * (this function runs whenever once per second whenever the user
   * changes the contents of the ACE input field)
   */
  var generateForm = function () {
    var values = $('#source').jsonFormValue().values;

    // Reset result pane
    $('#result').html('');

    // Parse entered content as JavaScript
    // (mostly JSON but functions are possible)
    var createdForm = null;

    // Most examples should be written in pure JSON,
    // but playground is helpful to check behaviors too!
    try {
      // console.log(values.source);
      // console.log(JSON.parse(values.source));

      eval('createdForm=' + values.source);
    } catch (e) {
      console.log(e);

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
      $('#result').html('<form id="result-form" class="form-vertical"></form>');
      $('#result-form').jsonForm(createdForm);
    }
    catch (e) {
      console.log(e.stack)
      $('#result').html('<pre>Entered content is not yet a valid' +
        ' JSON Form object.\n\nThe JSON Form library returned:\n' +
        e + '</pre>');
      return;
    }
  };

  // Render the form
  $('#source').jsonForm(sourceForm);
  $('#form').jsonForm(formObject);

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
