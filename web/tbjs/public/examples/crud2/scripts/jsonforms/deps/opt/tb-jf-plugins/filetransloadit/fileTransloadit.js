JSONForm.elementTypes['fileTransloadit'] = {
	'template': '<span><% if (value && (value.type||value.url)) { %>'+fileDisplayTemplate+'<% } %><input class="input-file" id="_transloadit_<%= id %>" type="file" name="_transloadit_<%= node.name %>" /><input type="hidden" id="<%= id %>" name="<%= node.name %>" value=\'<%= escape(JSON.stringify(node.value)) %>\' /></span>',
  'fieldtemplate': true,
  'inputfield': true,
  'getElement': function (el) {
    return $(el).parent().get(0);
  },
  'onChange': function (evt, elt) {
    // The "transloadit" function should be called only once to enable
    // the service when the form is submitted. Has it already been done?
    if (elt.ownerTree._transloadit_bound) {
      return false;
    }
    elt.ownerTree._transloadit_bound = true;

    // Call the "transloadit" function on the form element
    var formElt = $(elt.ownerTree.domRoot);
    formElt.transloadit({
      autoSubmit: false,
      wait: true,
      onSuccess: function (assembly) {
        // Image has been uploaded. Check the "results" property that
        // contains the list of files that Transloadit produced. Note
        // JSONForm only supports 1-to-1 associations, meaning it
        // expects the "results" property to contain only one image
        // per file input in the form.
        // console.log(assembly.results);
        var results = _.values(assembly.results);
        results = _.flatten(results);
        _.each(results, function (result) {
          // Save the assembly result in the right hidden input field
          var input = formElt.find('input[name="' +
            result.field.replace(/^_transloadit_/, '') +
            '"]');
          var nonEmptyKeys = _.filter(_.keys(result.meta), function (key) {
            return !!isSet(result.meta[key]);
          });
          result.meta = _.pick(result.meta, nonEmptyKeys);
          input.val(JSON.stringify(result));
        });

        // Unbind transloadit from the form
        elt.ownerTree._transloadit_bound = false;
        formElt.unbind('submit.transloadit');

        // Submit the form on next tick
        _.delay(function () {
          console.log('submit form');
          elt.ownerTree.submit();
        }, 10);
      },
      onError: function (assembly) {
        // TODO: report the error to the user
        console.log('assembly error', assembly);
      }
    });
  },
  'onInsert': function (evt, node) {
    $(node.el).find('a.tb-jf-delete').on('click', function (evt) {
      $(node.el).find('.tb-jf-preview').remove();
      $(node.el).find('a.tb-jf-delete').remove();
      $(node.el).find('#' + escapeSelector(node.id)).val('');
      evt.preventDefault();
      return false;
    });
  },
  'onSubmit': function (evt, elt) {
    if (elt.ownerTree._transloadit_bound) {
      return false;
    }
    return true;
  }
}