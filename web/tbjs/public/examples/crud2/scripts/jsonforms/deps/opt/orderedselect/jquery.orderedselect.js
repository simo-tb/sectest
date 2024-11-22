;(function($) {

  $.fn.orderedSelect = function(customOptions) {
    var options = {
      sortable: true,           // Should the list be sortable?
      highlight: false,         // Use the highlight feature?
      animate: true,            // Animate the the adding/removing of items in the list?
      addItemTarget: 'bottom',  // Where to place new selected items in list: top or bottom
      minHeight: 200,           // Minimum height for both elements (selection and order)
      maxHeight: 600,           // Maximum height for both elements
      debugMode: false,          // Debug mode keeps original select visible

      removeLabel: '✕',                           // Text used in the "remove" link
      moveUpLabel: 'Up',                          // Text used in the "move up" link
      moveDownLabel: 'Down',                      // Text used in the "move down" link
      highlightAddedLabel: 'Added: ',             // Text that precedes highlight of added item
      highlightRemovedLabel: 'Removed: ',         // Text that precedes highlight of removed item

      containerClass: 'tb-os-container',              // Class for container that wraps this widget
      selectClass: 'tb-os-select',                    // Class for the newly created <select>
      optionDisabledClass: 'tb-os-disabled-option',   // Class for items that are already selected / disabled
      listClass: 'tb-os-list',                        // Class for the list ($orderedSelect)
      listContainerClass: 'tb-os-container-list',     // Class for the div which contains the ordered list
      listSortableClass: 'tb-os-list-sortable',       // Another class given to the list when it is sortable
      listItemClass: 'tb-os-list-item',               // Class for the <li> list items
      listItemLabelClass: 'tb-os-list-item-label',    // Class for the label text that appears in list items
      listItemConrols: 'tb-os-list-item-controls',    // Control box containing all buttons
      removeClass: 'tb-os-list-item-remove',          // Class given to the "remove" link
      moveUpClass: 'tb-os-list-item-move-up',         // Class given to the "move up" link
      moveDownClass: 'tb-os-list-item-move-down',     // Class given to the "move down" link
      highlightClass: 'tb-os-highlight',              // Class given to the highlight <span>
    };

    $.extend(options, customOptions);

    return this.each(function() {
      var index = _.uniqueId();               // unique index used for DOM id

      var $originalSelect = $(this);          // the original multiple select
      var $fakeSelect;                        // mimics the native browser multipleselect
      var $separator                          // visual seperator between the ordered and unordered list
      var $orderedSelect;                     // the of options which we order
      var $quickSelectButtonsContainer;       // quick select buttons
      var $selectAllButton;
      var $deselectAllButton;
      var $orderedSelectContainer;            // wrapper for orderedSelect
      var $container;                         // a container that is wrapped around the whole widget

      var isBuildingSelect = false;           // is the new select being constructed right now?
      var ignoreOriginalChangeEvent = false;  // originalChangeEvent bypassed when this is true

      var selectedOptions = [];               // the ids of all currently selected elements


      function init() {

        /**
         * if the multipleselect used to initialize the plugin has no options
         * hide the multipleselect and dislay a warning message
         */
        if ($originalSelect.children('option').length === 0) {
          $originalSelect.parent().prepend('<center><b class="warning-message">Ordered select requires at least one option.</b></center>');
          $originalSelect.hide();

          return;
        };

        $fakeSelect = $('<ol></ol>')
          .addClass(options.selectClass)
          .attr('name', options.selectClass + index)
          .attr('id', options.selectClass + index)
          .addClass(options.listContainerClass)
          .addClass(options.listClass)
          .css({
            height: '100%',
            height: options.minHeight,
            'min-height': options.minHeight,
            'max-height': options.maxHeight
          });
        $fakeSelect.on('click', 'li', selectChangeEvent);

        $orderedSelectContainer = $('<div></div>');

        if (options.sortable) {
          $orderedSelect = $('<ol></ol>')
            .addClass(options.listClass)
            .attr('id', options.listClass + index)
            .css({
              overflow: 'hidden'
            });

          $orderedSelectContainer
            .addClass(options.listContainerClass)
            .append($orderedSelect)
            .css({
              resize: 'vertical',
              height: options.minHeight,
              'min-height': options.minHeight,
              'max-height': options.maxHeight
            });
        } else {
          $fakeSelect.css({
            width: '25%'
          })
        }

        $separator = $('<div class="tb-os-separator"> ➤ </div>')
          .css({
            'margin-top': $fakeSelect.height() / 2
          });

        $container = $('<div></div>')
          .addClass(options.containerClass)
          .attr('id', options.containerClass + index)
          .css({
            resize: 'vertical',
            height: options.minHeight,
            'min-height': options.minHeight,
            'max-height': options.maxHeight
          });

        $quickSelectButtonsContainer = $('<div class="tb-os-quick-selector-buttons"></div>');
        $selectAllButton = $('<button type="button" class="tb-os-btn tb-os-btn-default tb-os-btn-xs tb-os-select-all">✓ select all</button>')
          .on('click', function(){
            var options = $fakeSelect.children();

            for (var i = 0, j = options.length; i < j; i++) {
              var id = options[i].getAttribute('rel');

              if(selectedOptions.indexOf(id) < 0) {
                addListItemHandler(id);
              }
            }
          });

        $deselectAllButton = $('<button type="button" class="tb-os-btn tb-os-btn-danger tb-os-btn-xs tb-os-deselect-all">✕ deselect all</button>')
          .on('click', function(){
            var options = $fakeSelect.children();

            for (var i = 0, j = options.length; i < j; i++) {
              var id = options[i].getAttribute('rel');

              if(selectedOptions.indexOf(id) >= 0) {
                dropListItemHandler(id);
              }
            }
          });

        $quickSelectButtonsContainer
          .append($deselectAllButton)
          .append($selectAllButton)

        $container.append($fakeSelect);

        if (options.sortable) {
          $container.append($separator);
        }

        $container.append($orderedSelectContainer);

        buildSelect();

        $originalSelect
          .change(originalChangeEvent)
          .after($container);

        $container.after($quickSelectButtonsContainer);

        $container.after($('<span style="clear: left; display: block;"></span>'));

        if (options.sortable) {
          makeSortable();

          $fakeSelect.height($orderedSelectContainer.height() || options.minHeight);
          $fakeSelect.on('mousemove', function() {
            $orderedSelectContainer
              .height($fakeSelect.height());

            $separator.css({
              'margin-top': $fakeSelect.height() / 2
            });
          });

          $orderedSelectContainer.on('mousemove', function() {
            $fakeSelect
              .height($orderedSelectContainer.height());

            $separator.css({
              'margin-top': $fakeSelect.height() / 2
            });
          });
        };

        // set the element width according to the width of the input
        // var checkboxWidth = $($fakeSelect.find('> li')[0]).find('> span > input').width();
        // $fakeSelect.width($fakeSelect.width() + checkboxWidth);

        updateHighlighting();
      }

      /**
       * make any items in the selected list sortable
       * requires jQuery UI sortables, draggables, droppables
       */
      function makeSortable() {
        $orderedSelect.sortable({
          items: 'li.' + options.listItemClass,
          handle: '.' + options.listItemLabelClass,
          axis: 'y',
          update: function(e, data) {
            $(this).children('li').each(function(n) {

              $option = $('#' + $(this).attr('rel'));

              $originalSelect.append($option);
            });
          },
          /**
           *  moving an item using the drag & drop functionality does not trigger a change event
           *  instead manually trigger a change event on the whole jquery plugin
           */
          change: function(event, ui) {
            $container.trigger('change');
          }
        }).addClass(options.listSortableClass);
      }

      /**
       * an item has been selected on the regular select we created
       * check to make sure it's not an IE screwup, and add it to the list
       */
      function selectChangeEvent(e) {
        var id = $(this).attr('rel');

        if(selectedOptions.indexOf(id) >= 0) {
          dropListItemHandler(id);
        } else {
          addListItemHandler(id);
        }
      }

      function dropListItemHandler(id) {
        dropListItem(id);
        selectedOptions = _.without(selectedOptions, id);
        updateHighlighting();
      }

      function addListItemHandler(id) {
        addListItem($('#' + id), id);
        $('#' + id)[0].selected = true;
        selectedOptions.push(id);
        updateHighlighting();
      }

      /**
       * select or option change event manually triggered
       * on the original <select multiple>, so rebuild ours
       */
      function originalChangeEvent(e) {

        if (ignoreOriginalChangeEvent) {
          ignoreOriginalChangeEvent = false;
          return;
        }

        selectedOptions = [];

        $fakeSelect.empty();

        if (options.sortable) {
          $orderedSelect.empty();
        }

        buildSelect();
      }

      /**
       * build or rebuild the new select that the user
       * will select items from
       */
      function buildSelect() {
        isBuildingSelect = true;

        var list = '';

        $originalSelect.children('option').each(function(n) {
          var $originalOption = $(this);
          var id = 'tb-os-' + index + '-option-' + n;

          if (!$originalOption.attr('id')) {
            $originalOption.attr('id', id);
          }

          if ($originalOption.attr('selected')) {
            selectedOptions.push(id);
            addListItem($originalOption, id);
            list += addSelectOption($originalOption, id, true);
          } else {
            list += addSelectOption($originalOption, id, false);
          }

        });

        // IE6, IE7, IE8 require this on every init or nothing appears
        if (!options.debugMode) {
          $originalSelect.hide();
        }

        $fakeSelect.append(list);
        isBuildingSelect = false;
      }

      /**
       * add an <option> to the <select>
       * used only by buildSelect()
       */
      function addSelectOption($originalOption, optionId, selected) {
        return '<li class="tb-os-list-item" rel="'
          + optionId
          + '" value="'
          + $originalOption.val()
          + '"><span class="tb-os-list-item-label">'
          + '<input type="checkbox" '
          + (selected ? 'checked="checked"' : '')
          + '/> '
          + $originalOption.text()
          + '</span></li>';
      }

      /**
       * make an option disabled, indicating that it's already been selected
       * for unsupported disabled attribute
       * we apply a class that reproduces the disabled look in other browsers
       */
      function disableSelectOption($option) {
        $option
          .addClass(options.optionDisabledClass)
          .find('input').prop('checked', true);
          // .attr('selected', false)
          // .attr('disabled', true);
      }

      /**
       * given an already disabled select option, enable it
       */
      function enableSelectOption($option) {
        $option.removeClass(options.optionDisabledClass)
          .find('input').prop('checked', false);
          // .attr('disabled', false);
      }

      /**
       * add a new item to the html list
       */
      function addListItem($option, optionId) {
        // this is the first item, selectLabel
        if (!$option) {
          return;
        }

        var $removeLink = $('<button type="button" class="tb-os-btn tb-os-btn-danger tb-os-btn-xs"></button>')
          .attr('href', '#')
          .addClass(options.removeClass)
          .prepend(options.removeLabel)
          .click(function() {
            dropListItem($(this).parent().parent('li').attr('rel'));
            return false;
          });

        var $moveUpLink = $('<button type="button" class="tb-os-btn tb-os-btn-default tb-os-btn-xs"></button>')
          .attr('href', '#')
          .addClass(options.moveUpClass)
          .prepend(options.moveUpLabel)
          .click(function() {
            moveListItemUp($(this).parent().parent('li'));
            return false;
          });

        var $moveDownLink = $('<button type="button" class="tb-os-btn tb-os-btn-default tb-os-btn-xs"></button>')
          .attr('href', '#')
          .addClass(options.moveDownClass)
          .prepend(options.moveDownLabel)
          .click(function() {
            moveListItemDown($(this).parent().parent('li'));
            return false;
          });

        var $itemControls = $('<span></span>')
          .addClass(options.listItemConrols)
          .append($moveUpLink)
          .append($moveDownLink)
          .append($removeLink);

        var $itemLabel = $('<span></span>')
          .addClass(options.listItemLabelClass)
          .html($option.text());

        var $item = $('<li></li>')
          .attr('rel', optionId)
          .addClass(options.listItemClass)
          .append($itemLabel)
          .append($itemControls)
          .hide();

        if (!isBuildingSelect) {
          if ($option.is(':selected')) {
            return;
          }
          $option.attr('selected', true);
        }

        if (options.addItemTarget === 'top' && !isBuildingSelect) {
          $originalSelect.prepend($option);

          if (options.sortable) {
            $orderedSelect.prepend($item);
          }
        } else {
          $originalSelect.append($option);

          if (options.sortable) {
            $orderedSelect.append($item);
          }
        }

        addListItemShow($item);

        disableSelectOption($('[rel=' + optionId + ']', $fakeSelect));

        if (!isBuildingSelect) {
          setHighlight($item, options.highlightAddedLabel);
          if (options.sortable) {
            $orderedSelect.sortable('refresh');
          }
        }

        // scroll to the bottom of the ordered elements list
        if (options.sortable) {
          var animate = function() {
            $orderedSelectContainer.stop().animate({
              scrollTop: $orderedSelect[0].scrollHeight
            }, 800);
          }

          // postpone execution so that all list elements are rendered
          // 0 is enough as it puts the function at the end of the call stack
          setTimeout(animate, 0);
        }

        $fakeSelect.height($orderedSelectContainer.height() || options.minHeight);
        triggerOriginalChange(optionId, 'add item')
      }

      /**
       * reveal the currently hidden item with optional animation
       * used only by addListItem()
       */
      function addListItemShow($item) {
        if (options.animate && !isBuildingSelect) {
          $item.animate({
            opacity: 'show',
            height: 'show',
          }, 100, 'swing', function() {
            $item.animate({
              height: '+=2px',
            }, 50, 'swing', function() {
              $item.animate({
                height: '-=2px',
              }, 25, 'swing');
            });
          });
        } else {
          $item.show();
        }
      }

      function moveListItemUp($item) {
        var updatedOptionId;

        if($item.index() !== 0) {
          $item.parent().children().eq($item.index() - 1)
          .before($item);

          $item.parent().children('li').each(function(n) {
            $option = $('#' + $(this).attr('rel'));

            if ($(this).is('.ui-sortable-helper')) {
              updatedOptionId = $option.attr('id');
              return;
            }

            $originalSelect.append($option);
          });

          triggerOriginalChange(updatedOptionId, 'sort');
        }
      }

      function moveListItemDown($item) {
        var updatedOptionId;

        if(selectedOptions.length - 1 !== $item.index()) {
          $item.parent().children().eq($item.index() + 1)
          .after($item);

          $item.parent().children('li').each(function(n) {
            $option = $('#' + $(this).attr('rel'));

            if ($(this).is('.ui-sortable-helper')) {
              updatedOptionId = $option.attr('id');
              return;
            }

            $originalSelect.append($option);
          });

          triggerOriginalChange(updatedOptionId, 'sort');
        }
      }

      /**
       * remove an item from the list of sorted items
       */
      function dropListItem(optionId, highlightItem) {
        var $option = $('#' + optionId);
        selectedOptions = _.without(selectedOptions, optionId);

        if (highlightItem === undefined) {
          highlightItem = true;
        }

        $option.attr('selected', false);
        enableSelectOption($('[rel=' + optionId + ']', $fakeSelect));

        if (options.sortable) {
          $item = $orderedSelect.children('li[rel=' + optionId + ']');

          dropListItemHide($item);

          if (highlightItem) {
            setHighlight($item, options.highlightRemovedLabel);
          }
        }

        triggerOriginalChange(optionId, 'drop');
      }

      /**
       * remove the currently visible item with optional animation
       * used only by dropListItem()
       */
      function dropListItemHide($item) {
        if (options.animate && !isBuildingSelect) {

          $prevItem = $item.prev('li');

          $item.animate({
            opacity: 'hide',
            height: 'hide',
          }, 100, 'linear', function() {
            $prevItem.animate({
              height: '-=2px',
            }, 50, 'swing', function() {
              $prevItem.animate({
                height: '+=2px',
              }, 100, 'swing');
            });
            $item.remove();
          });

        } else {
          $item.remove();
        }
      }

      function updateHighlighting() {
        _.each($fakeSelect.children('li'), function(option){
          if(selectedOptions.indexOf($(option).attr('rel')) >= 0) {
            $(option).addClass('tb-os-list-item-active');
          } else {
            $(option).removeClass('tb-os-list-item-active');
          }
        })
      }

      /**
       * set the contents of the highlight area that appears
       * directly after the <select> single
       * fade it in quickly, then fade it out
       */
      function setHighlight($item, label) {
        if (!options.highlight) {
          return;
        }

        $fakeSelect.next('#' + options.highlightClass + index).remove();

        var $highlight = $('<span></span>')
          .hide()
          .addClass(options.highlightClass)
          .attr('id', options.highlightClass + index)
          .html(label + $item.children('.' + options.listItemLabelClass).slice(0, 1).text());

        $fakeSelect.after($highlight);

        $highlight.fadeIn('fast', function() {
          setTimeout(function() {
            $highlight.fadeOut('slow');
          }, 50);
        });
      }

      /**
       * trigger a change event on the original select multiple
       * so that other scripts can pick them up
       */
      function triggerOriginalChange(optionId, type) {
        ignoreOriginalChangeEvent = true;
        $option = $('#' + optionId);

        $originalSelect.trigger('change');

        if(type === 'add' || type === 'drop') {
          updateHighlighting();
        }
      }

      init();
    });
  };

})(jQuery);
