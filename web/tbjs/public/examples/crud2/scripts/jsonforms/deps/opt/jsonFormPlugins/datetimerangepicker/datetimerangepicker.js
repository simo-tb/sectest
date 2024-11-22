JSONForm.elementTypes['datetimerangepicker'] = {
  'template': '<input id="<%= id %>" name="<%= node.name %>" '
    + 'class="<%= fieldHtmlClass || cls.textualInputClass %>" '
    + '<%= (node.disabled? " disabled" : "")%>'
    + '<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>'
    + '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>'
    + '<%= (node.required ? " required=\'required\'" : "") %>'
    + '<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>'
    + 'style="display:none; width: 1px; height: 1px;" value="<%= value %>" />'
    + '<div class="row"><div class="col-md-6">'
    + '<label class="control-label" for="<%=node.id%>"> <% console.log(node.formElement)%> <%= node.formElement.pluginoptions.startlabel %> </label> </br>'
    + '<input class="<%= fieldHtmlClass || cls.textualInputClass %>" '
    + '<%= (node.disabled? " disabled" : "")%>'
    + '<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>'
    + '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>'
    + '<%= (node.required ? " required=\'required\'" : "") %>'
    + '<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>  />'
    + '</div>  <div class="col-md-6">'
    + '<label class="control-label" for="<%=node.id%>"> <%= node.formElement.pluginoptions.endlabel %> </label> </br>'
    + '<input class="<%= fieldHtmlClass || cls.textualInputClass %>" '
    + '<%= (node.disabled? " disabled" : "")%>'
    + '<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>'
    + '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>'
    + '<%= (node.required ? " required=\'required\'" : "") %>'
    + '<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%> />'
    + '</div></div>',
  'fieldtemplate': true,
  'inputfield': true,
  'onBeforeRender': function(data, node) {
    // TRACE('datepicker: moment must be defined')
    ASSERT.hasProperty(window, 'moment');
    // TRACE('datepicker: datetimepicker jQuery plugin must be defined')
    ASSERT.hasProperty(jQuery.fn, 'datetimepicker');
    // TRACE('datepicker: datetimepicker field must be of type string')
    ASSERT.eq(node.schemaElement.type, 'string');

    if (node.required) {
      // TODO specify timezone requirements

      // implement timezone check logic
    };

    node.formElement.pluginoptions = node.formElement.pluginoptions || {};

    node.formElement.pluginoptions.startlabel = node.formElement.pluginoptions.startlabel
      || node.title
      || node.key;

    node.formElement.pluginoptions.endlabel = node.formElement.pluginoptions.endlabel
      || node.title
      || node.key;

    // ignore the general title that jsonform assins to all inputfields
    // node.formElement.notitle = true;
  },
  'onInsert': function(evt, node) {
    var formInputsSelector = '#' + node.id;
    var formInput = $(formInputsSelector);
    var rangeInputsSelector = '#' + node.id + ' +.row input';
    var dateRangeInputs = $(rangeInputsSelector);
    var value = node.value || node.schemaElement.default;



    // create the plugin datetimerangepickeroptions object if it doesn't exist

    // set default format if none is slecified
    if (!node.formElement.pluginoptions.format) {
      node.formElement.pluginoptions.format = 'YYYY-MM-DDTHH:mm:ss';
    }

    // does not use the current browser time of the client
    node.formElement.pluginoptions.useCurrent = false;

    delete node.formElement.pluginoptions.startlabel;
    delete node.formElement.pluginoptions.endlabel;

    var periodStartOptions = _.clone(node.formElement.pluginoptions);
    var periodEndOptions = _.clone(node.formElement.pluginoptions);

    // apply the value element to the fields
    // according to ISO 8601 date ranges are written in the format "start/end"
    if (value) {
      value = value.split('/');

      for (var i = 0, j = value.length; i < j; i++) {
        value[i] = value[i] ? value[i] : undefined;
      }

      // both start and end values must be defined
      ASSERT.isDefined(value[0]);
      ASSERT.isDefined(value[1]);

      var startValueUnixTime = new Date(value[0]);
      var endValueUnixTime = new Date(value[1]);
      var minDateUnixTime = new Date(periodStartOptions.minDate);
      var maxDateUnixTime = new Date(periodStartOptions.maxDate);

      // make sure that the value in content, value or default obeys the minDate and maxDate limits
      ASSERT.le(startValueUnixTime, maxDateUnixTime);
      ASSERT.ge(startValueUnixTime, minDateUnixTime);
      ASSERT.le(endValueUnixTime, maxDateUnixTime);
      ASSERT.ge(endValueUnixTime, minDateUnixTime);

      periodStartOptions.maxDate = value[1];
      periodStartOptions.defaultDate = value[0];

      periodEndOptions.minDate = value[0];
      periodEndOptions.defaultDate = value[1];
    }

    //initialize the linked datepicker plugin
    dateRangeInputs.eq(0).datetimepicker(periodStartOptions);
    dateRangeInputs.eq(1).datetimepicker(periodEndOptions);

    // the end date cannot precede the start date
    dateRangeInputs.eq(0)
      .on("dp.change", function (input) {
        var endElement = dateRangeInputs.eq(1);
        var startValue = dateRangeInputs.eq(0).val();
        var endValue = endElement.val();
        var mergedRange = '';

        endElement.data("DateTimePicker").minDate(input.date);

        if (startValue || endValue) {
          if (!endValue) {
            endValue = startValue;
          }

          mergedRange = ''
            + startValue
            + '/'
            + endValue;
        } else {
          mergedRange = null;
        }

        formInput.val(mergedRange);
      });

    // the start date cannot be after the end date
    dateRangeInputs.eq(1)
      .on("dp.change", function (input) {
        var startElement = dateRangeInputs.eq(0);
        var startValue = startElement.val();
        var endValue = dateRangeInputs.eq(1).val();
        var mergedRange = '';

        startElement.data("DateTimePicker").maxDate(input.date);

        if (startValue || endValue) {
          if (!startValue) {
            startValue = endValue;
          }

          mergedRange = ''
            + startValue
            + '/'
            + endValue;
        } else {
          mergedRange = null;
        }

        formInput.val(mergedRange);
      });

  },
  'getElement': function (el) {
    return $(el).parent().get(0);
  }
}