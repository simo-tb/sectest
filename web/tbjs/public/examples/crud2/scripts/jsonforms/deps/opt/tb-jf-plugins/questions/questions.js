/**
   * A "questions" field renders a series of question fields and binds the
   * result to the value of a schema key.
   */
JSONForm.elementTypes['questions'] = {
	'template': '<div>' +
    '<input type="hidden" id="<%= node.id %>" name="<%= node.name %>" value="<%= escape(value) %>" />' +
    '<%= children %>' +
    '</div>',
  'compatibleTypes': ['string'],
  'compatibleFormats': ['iso8601-date'],
  'fieldtemplate': true,
  'inputfield': true,
  'getElement': function (el) {
    return $(el).parent().get(0);
  },
  'onInsert': function (evt, node) {
    if (!node.children || (node.children.length === 0)) {
      return;
    }
    _.each(node.children, function (child) {
      $(child.el).hide();
    });
    $(node.children[0].el).show();
  }
}

/**
   * A "question" field lets user choose a response among possible choices.
   * The field is not associated with any schema key. A question should be
   * part of a "questions" field that binds a series of questions to a
   * schema key.
   */
JSONForm.elementTypes['question'] = {
  'template': '<div id="<%= node.id %>"><% _.each(node.options, function(key, val) { %>' +
  '<% if (elt.optionsType === "radiobuttons") { %><label class="<%= cls.buttonClass%> <%= ((key instanceof Object && key.htmlClass) ? " " + key.htmlClass : "") %>"><% } else { %>' +
  '<% if (!elt.inline) { %><div class="radio"><% } %>' +
  '<label class="<%= elt.inline ? "radio"+cls.inlineClassSuffix : "" %> <%= ((key instanceof Object && key.htmlClass) ? " " + key.htmlClass : "") %>">' +
  '<% } %><input type="radio" <% if (elt.optionsType === "radiobuttons") { %> style="position:absolute;left:-9999px;" <% } %>name="<%= node.id %>" value="<%= val %>"<%= (node.disabled? " disabled" : "")%>/><span><%= (key instanceof Object ? key.title : key) %></span></label><%= elt.optionsType !== "radiobuttons" && !elt.inline ? "</div>" : "" %> <% }); %></div>',
  'fieldtemplate': true,
  'compatibleTypes': ['string'],
  'compatibleFormats': ['iso8601-date'],
  'onInsert': function (evt, node) {
    var activeClass = 'active';
    var elt = node.formElement || {};
    if (elt.activeClass) {
      activeClass += ' ' + elt.activeClass;
    }

    // Bind to change events on radio buttons
    $(node.el).find('input[type="radio"]').on('change', function (evt) {
      var questionNode = null;
      var option = node.options[$(this).val()];
      if (!node.parentNode || !node.parentNode.el) {
        return;
      }

      $(node.el).find('label').removeClass(activeClass);
      $(this).parent().addClass(activeClass);
      $(node.el).nextAll().hide();
      $(node.el).nextAll().find('input[type="radio"]').prop('checked', false);

      // Execute possible actions (set key value, form submission, open link,
      // move on to next question)
      if (option.value) {
        // Set the key of the 'Questions' parent
        $(node.parentNode.el).find('input[type="hidden"]').val(option.value);
      }
      if (option.next) {
        questionNode = _.find(node.parentNode.children, function (child) {
          return (child.formElement && (child.formElement.qid === option.next));
        });
        $(questionNode.el).show();
        $(questionNode.el).nextAll().hide();
        $(questionNode.el).nextAll().find('input[type="radio"]').prop('checked', false);
      }
      if (option.href) {
        if (option.target) {
          window.open(option.href, option.target);
        } else {
          window.location = option.href;
        }
      }
      if (option.submit) {
        setTimeout(function () {
          node.ownerTree.submit();
        }, 0);
      }
    });
  }
}