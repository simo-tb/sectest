JSONForm.elementTypes['iconSelect'] = {
	'template': '<div>' +
    '<input type="hidden" name="<%= node.name %>" id="<%= node.id %>" value="<%= value %>" />' +
    '<div class="dropdown">' +
    '<a class="<%= node.value ? buttonClass : cls.buttonClass %>" data-toggle="dropdown" href="#"<% if (node.value) { %> style="max-width:<%= width %>px;max-height:<%= height %>px"<% } %>>' +
      '<% if (node.value) { %><i class="<%= cls.iconClassPrefix %>-<%= node.value %>" /><% } else { %><%= buttonTitle %><% } %>' +
    '</a>' +
    '<div class="dropdown-menu navbar" id="<%= node.id %>_dropdown">' +
      '<div>' +
      '<% _.each(node.options, function(key, idx) { if ((idx > 0) && ((idx % columns) === 0)) { %></div><div><% } %><a class="<%= buttonClass %>" ><% if (key instanceof Object) { %><i class="<%= cls.iconClassPrefix %>-<%= key.value %>" alt="<%= key.title %>" /></a><% } else { %><i class="<%= cls.iconClassPrefix %>-<%= key %>" alt="" /><% } %></a> <% }); %>' +
      '</div>' +
      '<div class="pagination-right"><a class="<%= cls.buttonClass %>">Reset</a></div>' +
    '</div>' +
    '</div>' +
    '</div>',
  'fieldtemplate': true,
  'inputfield': true,
  'onBeforeRender': function (data, node) {
    var elt = node.formElement || {};
    var nbRows = null;
    var maxColumns = elt.imageSelectorColumns || 5;
    data.buttonTitle = elt.imageSelectorTitle || 'Select...';
    data.buttonClass = elt.imageButtonClass || data.cls.buttonClass;
    if (node.options.length > maxColumns) {
      nbRows = Math.ceil(node.options.length / maxColumns);
      data.columns = Math.ceil(node.options.length / nbRows);
    } else {
      data.columns = maxColumns;
    }
  },
  'getElement': function (el) {
    return $(el).parent().get(0);
  },
  'onInsert': function (evt, node) {
    $(node.el).on('click', '.dropdown-menu a', function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      var i = (evt.target.nodeName.toLowerCase() === 'i') ?
        $(evt.target) :
        $(evt.target).find('i');
      var value = i.attr('class');
      var elt = node.formElement || {};
      if (value) {
        value = value;
        $(node.el).find('input').attr('value', value);
        $(node.el).find('a[data-toggle="dropdown"]')
          .addClass(elt.imageButtonClass)
          .html('<i class="'+ value +'" alt="" />');
      } else {
        $(node.el).find('input').attr('value', '');
        $(node.el).find('a[data-toggle="dropdown"]')
          .removeClass(elt.imageButtonClass)
          .html(elt.imageSelectorTitle || 'Select...');
      }
    });
  }
}