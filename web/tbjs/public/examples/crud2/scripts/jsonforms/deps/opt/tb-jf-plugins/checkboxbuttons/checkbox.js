JSONForm.elementTypes['checkboxbuttons'] = {
  'template': '<div id="<%= node.id %>"><%= choiceshtml %></div>',
  'fieldtemplate': true,
  'inputfield': true,
  'onBeforeRender': function (data, node) {
    // Build up choices from the enumeration list
    var choices = null;
    var choiceshtml = null;
    var template = '<label class="<%= cls.buttonClass %> ' + data.fieldHtmlClass + '">' +
      '<input type="checkbox" style="position:absolute;left:-9999px;" <% if (checked) { %> checked="checked" <% } %> name="<%= name %>" value="<%= value %>"' +
      '<%= (node.disabled? " disabled" : "")%>' +
      '/><span><%= title %></span></label>';
    if (!node || !node.schemaElement || !node.schemaElement.items) {
      return;
    }

    choices = node.formElement.options;
    if (!choices) {
      return;
    }
    if (!node.value || !Array.isArray(node.value)) {
      node.value = [];
    }
    choiceshtml = '';
    _.each(choices, function (choice, idx) {
      choiceshtml += _template(template, {
        name: node.key + '[' + idx + ']',
        checked: _.includes(node.value, choice.value),
        value: choice.value,
        title: choice.title,
        node: node,
        cls: data.cls
      }, fieldTemplateSettings);
    });

    data.choiceshtml = choiceshtml;
  },
  'onInsert': function (evt, node) {
    var activeClass = 'active';
    var elt = node.formElement || {};
    if (elt.activeClass) {
      activeClass += ' ' + elt.activeClass;
    }
    $(node.el).find('label').on('click', function () {
      $(this).toggleClass(activeClass, $(this).find('input:checkbox').prop('checked'));
    }).find(':checked').closest('label').addClass(activeClass);
  }
}