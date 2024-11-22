JSONForm.elementTypes['radiobuttons'] = {
  'template': '<div id="<%= node.id %>" '+' class="<%= elt.htmlClass ? " " + elt.htmlClass : "" %>">' +
    '<% _.each(node.options, function(key, val) { %>' +
      '<label class="<%= cls.buttonClass %>  ">' +
      '<input type="radio" style="position:absolute;left:-9999px;" ' +
      '<% if (((key instanceof Object) && (value === key.value)) || (value === key)) { %> checked="checked" <% } %> name="<%= node.name %>" value="<%= (key instanceof Object ? key.value : key) %>" />' +
      '<span><%= (key instanceof Object ? key.title : key) %></span></label> ' +
      '<% }); %>' +
    '</div>',
  'fieldtemplate': true,
  'inputfield': true,
  'onInsert': function (evt, node) {
    var activeClass = 'active';
    var elt = node.formElement || {};
    if (elt.activeClass) {
      activeClass += ' ' + elt.activeClass;
    }
    $(node.el).find('label').on('click', function () {
      $(this).parent().find('label').removeClass(activeClass);
      $(this).addClass(activeClass);
    }).find(':checked').closest('label').addClass(activeClass);
  }
}