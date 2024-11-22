(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('lodash'), require('jquery'), require('jf.ui'));
  } else if (typeof define === 'function' && define.amd) {
    define(['lodash', 'jquery', 'jf.ui'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    factory(global._, global.jQuery, global.TB.jf.ui);
  }
})(this, function (_, $, jfUi) {
  jfUi.elementTypes['tabobject'] = {
    template: '' +
      '<div id="<%= id %>" data-tb-jf-type="tabobject">' +
      '<div class="tabbable <%= node.formElement.tabClass %> ">' +
      '<h4><%= node.title %></h4>' +
      '<ul class="nav nav-tabs <%= (node.formElement.justified === true) ? "nav-justified" : "" %>">' +
      '<%= tabs %>' +
      '</ul>' +
      '<div class="tab-content tb-jf-input-fieldset row">' +
      '<%= children %>' +
      '</div>' +
      '</div>' +
      '</div>',
    compatibleTypes: ['object'],
    // 'compatibleItemTypes': ['object', 'array', 'string', 'number', 'integer', 'boolean'],
    compatibleFormats: [],
    minRowWidth: 'half',
    maxRowWidth: 'full',
    fieldtemplate: false,
    containerField: true,
    isTbTemplate: false,
    getElement: function (el) {
      return $(el).parent().get(0);
    },
    childTemplate: function (inner, parentNode, node) {
      if (node.alreadyLoaded) {
          return inner;
      }

      node.alreadyLoaded = true;
      return '' +
        '<div data-idx="<%= node.childPos %>" class="tab-pane fade ' +
        '<% if (node.active) { %> in active <% } %>">' +
        inner +
        '</div>';
    },
    onBeforeRender: function (data, node) {

      // special case for tabobject - hide the default enum title
      if (node.formElement.notitle === undefined) {
        node.formElement.notitle = true;
      }

      // Before rendering, this function ensures that:
      // 1. direct children have IDs (used to show/hide the tabs contents)
      // 2. the tab to active is flagged accordingly.
      // The active tab is:
      //      the first tab for which there is some value available  -> from @momo: this is nonsence, because we are always "clicking" the first tab anyway ...
      //      OR the first one (default behaviour)
      // 3. the HTML of the select field used to select tabs is exposed in the
      // HTML template data as "tabs"
      if (node.formElement.items && node.formElement.items.length >= 0) {
        _.each(node.formElement.items, function (item) {
          // ASSERT(item.type === 'section', {msg: 'tabobject: only elements with type section can be direct children of a tabobject', code: 2950});
        });
      }

      if (node.formElement.orderObjectKey) {

      }

      var children = null;
      var choices = [];
      // select the left margin for the tab content

      // pick the appropriate tab style depending on the form options
      switch (node.formElement.tabPosition) {
        case 'left':
          node.formElement.tabClass = 'tabs-left';
          break;

        case 'right':
          node.formElement.tabClass = 'tabs-right';
          break;

        default:
          node.formElement.tabClass = 'tabs';
      }

      if (node.schemaElement) {
        choices = node.schemaElement['enum'] || [];
      }

      if (node.options) {
        children = _.map(node.options, function (option, idx) {
          var child = node.children[idx];
          if (option instanceof Object) {
            option = _.extend({ node: child }, option);
            option.title = option.title || child.legend || child.title || ('Option ' + (child.childPos + 1));
            option.value = !_.isNil(option.value)
              ? option.value
              : !_.isNil(choices[idx])
                ? choices[idx]
                : idx;

            return {
              value: option,
              title: option
            };
          } else {
            return {
              title: option,
              value: !_.isNil(choices[child.childPos])
                ? choices[child.childPos]
                : child.childPos,
              node: child
            };
          }
        });
      } else {
        children = _.map(node.children, function (child, idx) {
          return {
            title: child.legend || child.title || ('Option ' + (child.childPos + 1)),
            value: choices[child.childPos] || child.childPos,
            node: child
          };
        });
      }

      var activeChild = null;
      //  if the form has been submitted use the last active tab
      //  if any of the tabs has an input field with non-default value (declared in form) -> from @momo: this is nonsence
      //  otherwise set the first ta as default
      if (data.value) {
        activeChild = _.find(children, function (child) {
          return (child.value === node.value);
        });
      }

      /*
      if (!activeChild) {
        activeChild = _.find(children, function (child) {
          return child.node.hasNonDefaultValue();
        });
      }
      */

      if (!activeChild) {
        activeChild = children[0];
      }

      activeChild.node.active = true;
      data.value = activeChild.value;
      var isTabSelect = node.formElement.forceTabSelect != null ? node.formElement.forceTabSelect : node.children.length > 20;
      var tabs = isTabSelect ? '<select class="nav">' : '';
      _.each(node.children, function (child, idx) {
        var title = 'Tab ' + (idx + 2);
        if (child && child.legend) {
          title = child.legend;
        } else if (child && child.title) {
          title = child.title;
        } else if (child && child.key) {
          title = child.key.split('/').pop();
        }

        var enumerate = child.currentCounterArray.join('.');

        var value = !_.isNil(child.value) ? child.value : idx;
        if (isTabSelect) {
          tabs += '<option data-idx="' + idx + '" value="' + idx + '"' +
                      (child.active ? ' class="active" ' : ' gay ') +
                      ' data-data="' + _.escape(JSON.stringify({enumerate, title, isOrig: child.active})) + '" ' +
                      ' data-value="' + idx + '"' +
                      ' data-selectable' +
                    '>' +
                  '</option>';
        } else {

          tabs += ''
          // + '<li data-idx="' + idx
            + '<li data-idx="' + idx + '" class="' + (idx ? '':' in active2 active ')
              + '" value = "' + _.escape(value) + '"' + '>'
              + '<a class="tab ' + (child.active ? 'active' : '') + '">'
              + '<span class="tb-jf-enumerate-form">'+ enumerate + ': </span>' + '<span class="tb-jf-content-title">' + title + '</span>',
              +'</a>';
            + '</li>';
        }
      });

      if (isTabSelect) {
        tabs += '</select>';
      }

      data.tabs = tabs;

      return data;
    },
    onInsert: function (evt, node) {
      // TODO merge this somewhere
      var isTabSelect = node.formElement.forceTabSelect != null ? node.formElement.forceTabSelect : node.children.length > 20;

      if (isTabSelect) {
        var templateFunc = function(data, escape) {
          var { enumerate, title, isOrig } = data;
          return ('<div' + (isOrig ? ' data-is-orig=1 ' : '') + '> <span class="tb-jf-enumerate-form">' +
            + escape(enumerate)
            + '</span>'
            + '<span class="tb-jf-content-title">'
            + escape(title)
            + '</span>'
            // + (isOrig ? '<i class="glyphicon glyphicon-bookmark text-success" style="margin-left: 5px"></i>': '')
            + '</div>');
        }
        var $select = $(node.el).find('select').selectize({
          render: {
            item: templateFunc,
            option: templateFunc
          }
        });
        var selectize = $select[0].selectize;
        selectize.refreshOptions(false);
        $(node.el).on('legendUpdated', function (evt, { childPos, legend }) {
          evt.stopPropagation();
          var $opt = selectize.getOption(childPos);
          var data = $opt.data();
          data.value = childPos;
          data.title = legend;
          selectize.updateOption(childPos, data);
        });
      } else {
        var $tabs = $(node.el).find(`> div > .nav-tabs > [data-idx] > a > span.tb-jf-content-title`);
        node.tabEls = $tabs;

        $(node.el).on('legendUpdated', function (evt, { childPos, legend }) {
          evt.stopPropagation();
          node.tabEls.eq(childPos).text(legend);
        });
      }
    }
  };
});
