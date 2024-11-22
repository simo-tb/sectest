JSONForm.elementTypes['tagsinput'] = {
  'template':'<select name="<%= node.name %><%= node.formElement.getValue === "tagsinput" ? "" : "[]" %>" id="<%= id %>"' +
    ' class="<%= fieldHtmlClass || cls.textualInputClass %>" multiple' +
    '<%= (node.disabled? " disabled" : "")%>' +
    '<%= (node.required ? " required=\'required\'" : "") %>' +
    '> ' +
    '</select>',
  'fieldtemplate': true,
  'inputfield': true,
  'onInsert': function(evt, node) {
    if (!$.fn.tagsinput) {
      throw new Error('tagsinput is not found');
    }
    var $input = $(node.el).find('select');
    $input.tagsinput(node.formElement ? (node.formElement.tagsinput || {}) : {});
    if (node.value) {
      node.value.forEach(function(value) {
        $input.tagsinput('add', value);
      });
    }
  }
}