JSONForm.elementTypes['wysihtml5'] = {
	'template':'<textarea id="<%= id %>" name="<%= node.name %>" style="height:<%= elt.height || "300px" %>;width:<%= elt.width || "100%" %>;"' +
    '<%= (node.disabled? " disabled" : "")%>' +
    '<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
    '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
    '<%= (node.required ? " required=\'required\'" : "") %>' +
    '<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
    '><%= value %></textarea>',
  'fieldtemplate': true,
  'inputfield': true,
  'onInsert': function (evt, node) {
    var setup = function () {
      //protect from double init
      if ($(node.el).data("wysihtml5")) {
        return;
      }
      $(node.el).data("wysihtml5_loaded",true);

      $(node.el).find('#' + escapeSelector(node.id)).wysihtml5({
        "html": true,
        "link": true,
        "font-styles":true,
        "image": true,
        "events": {
          "load": function () {
            // In chrome, if an element is required and hidden, it leads to
            // the error 'An invalid form control with name='' is not focusable'
            // See http://stackoverflow.com/questions/7168645/invalid-form-control-only-in-google-chrome
            $(this.textareaElement).removeAttr('required');
          }
        }
      });
    };

    // Is there a setup hook?
    if (window.jsonform_wysihtml5_setup) {
      window.jsonform_wysihtml5_setup(setup);
      return;
    }

    // Wait until wysihtml5 is loaded
    var itv = window.setInterval(function() {
      if (window.wysihtml5) {
        window.clearInterval(itv);
        setup();
      }
    },1000);
  }
}