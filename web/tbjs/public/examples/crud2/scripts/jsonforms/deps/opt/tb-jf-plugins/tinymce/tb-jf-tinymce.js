JSONForm.elementTypes['tinymce'] = {
  'template':'<textarea id="<%= id %>" name="<%= node.name %>" ' +
    'class="<%= fieldHtmlClass || cls.textualInputClass %>" ' +
    'style="<%= elt.height ? "height:" + elt.height + ";" : "" %>width:<%= elt.width || "100%" %>;"' +
    '<%= (node.disabled? " disabled" : "")%>' +
    '<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
    '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
    '<%= (node.required ? " required=\'required\'" : "") %>' +
    '<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
    '><%= value %></textarea>',
  'fieldtemplate': true,
  'inputfield': true
  'onBeforeRender': function(evt, node) {
    ASSERT.isDefined(tinymce);
    console.log(node);

    var textareaSelector = '#' + node.id;

    tinymce.init({
      selector: textareaSelector,
      plugins: 'bdesk_photo'
    })
  }
}