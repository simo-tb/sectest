JSONForm.elementTypes['select2'] = {
  'template': '<select name="<%= node.name %>" id="<%= id %>"'
  + 'class="<%= cls.textualInputClass %> <%= fieldHtmlClass %>" '
  + '<%= (node.disabled? " disabled" : "")%>'
  + '<%= (node.required ? " required=\'required\'" : "") %>'
  + '<%= (node.readOnly ? " readonly=\'readonly\' disabled=\'disabled\'" : "") %>'
  + '> '
  + '<% _.each(node.options, function(key, val) { if (key instanceof Object) { if (value === key.value) { %> <option selected value="<%= key.value %>"><%= key.title %></option> <% } else { %> <option value="<%= key.value %>"><%= key.title %></option> <% }} else { if (value === key) { %> <option selected value="<%= key %>"><%= key %></option> <% } else { %><option value="<%= key %>"><%= key %></option> <% }}}); %> '
  + '</select>',
  'compatibleTypes': ['string', 'number', 'integer', 'boolean'],
  'compatibleFormats': [],
  'fieldtemplate': true,
  'requiresEnum': true,
  'inputfield': true,
  'isSearchable': true,
  'onInsert': function(evt, node) {
    var defaultOptions = {};
    var options = _.extend( defaultOptions, node.formElement.pluginOptions );
    var nativeSelect = $('#' + node.id);

    nativeSelect.select2(options)
  },
  'lock': function(node) {
    if (node.formElement.enableUndo
      || node.formElement.enableRedo
      || node.formElement.enableReset) {

      $(node.el).find('.tb-jf-value-history-buttons')
        .hide();
    }

    $(node.el).find('select')
      .select2('enable', false);
  },
  'unlock': function(node) {
    if (node.formElement.enableUndo
      || node.formElement.enableRedo
      || node.formElement.enableReset) {

      $(node.el).find('.tb-jf-value-history-buttons')
        .show();
    }

    $(node.el).find('select')
      .select2('enable', true);
  }
}