/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false Mustache: true*/
(function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('lodash'));
  } else if (typeof define === 'function' && define.amd) {
    define(['lodash'], function () {
      return factory.apply(factory, arguments);
    });
  } else {
    global.TB = global.TB || {};
    global.TB.Template = factory(global._);
  }
})(this, function (_) {
  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var mustache = {};

  var regExpTest = RegExp.prototype.test;
  function testRegExp (re, string) {
    return regExpTest.call(re, string);
  }

  var nonSpaceRe = /\S/;
  function isWhitespace (string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var equalsRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!|@/;
  var filterRe = /^\s*([^\:]+)/g;
  var paramsRe = /\:\s*([\'][^\']*[\']|[\"][^\"]*[\"]|[^\:]+)\s*/g;
  var isStringRe  = /^[\'\"](.*)[\'\"]$/g;
  var isIntegerRe = /^[+-]?\d+$/g;
  var isFloatRe   = /^[+-]?\d*\.\d+$/g;

  /**
   * Breaks up the given `template` string into a tree of tokens. If the `tags`
   * argument is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. [ "<%", "%>" ]). Of
   * course, the default is to use mustaches (i.e. mustache.tags).
   *
   * A token is an array with at least 4 elements. The first element is the
   * mustache symbol that was used inside the tag, e.g. "#" or "&". If the tag
   * did not contain a symbol (i.e. {{myValue}}) this element is "name". For
   * all text that appears outside a symbol this element is "text".
   *
   * The second element of a token is its "value". For mustache tags this is
   * whatever else was inside the tag besides the opening symbol. For text tokens
   * this is the text itself.
   *
   * The third and fourth elements of the token are the start and end indices,
   * respectively, of the token in the original template.
   *
   * Tokens that are the root node of a subtree contain two more elements: 1) an
   * array of tokens in the subtree and 2) the index in the original template at
   * which the closing tag for that section begins.
   */
  function parseTemplate (template, tags) {
    if (!template)
      return [];

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace () {
      if (hasTag && !nonSpace) {
        while (spaces.length)
          delete tokens[spaces.pop()];
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var openingTagRe, closingTagRe, closingCurlyRe;
    function compileTags (tagsToCompile) {
      if (typeof tagsToCompile === 'string')
        tagsToCompile = tagsToCompile.split(spaceRe, 2);

      if (!_.isArray(tagsToCompile) || tagsToCompile.length !== 2)
        throw new Error('Invalid tags: ' + tagsToCompile);

      openingTagRe = new RegExp(_.escapeRegExp(tagsToCompile[0]) + '\\s*');
      closingTagRe = new RegExp('\\s*' + _.escapeRegExp(tagsToCompile[1]));
      closingCurlyRe = new RegExp('\\s*' + _.escapeRegExp('}' + tagsToCompile[1]));
    }

    compileTags(tags || mustache.tags);

    var scanner = new Scanner(template);

    var start, type, value, chr, token, openSection, filters;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(openingTagRe);

      if (value) {
        for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push({
            symbol: 'text',
            value: chr,
            start: start,
            end: start + 1,
          });
          start += 1;

          // Check for whitespace on the current line.
          if (chr === '\n')
            stripSpace();
        }
      }

      // Match the opening tag.
      if (!scanner.scan(openingTagRe))
        break;

      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(equalsRe);
        scanner.scan(equalsRe);
        scanner.scanUntil(closingTagRe);
      } else if (type === '{') {
        value = scanner.scanUntil(closingCurlyRe);
        scanner.scan(curlyRe);
        scanner.scanUntil(closingTagRe);
        type = '&';
      } else {
        value = scanner.scanUntil(closingTagRe);
      }

      // Match the closing tag.
      if (!scanner.scan(closingTagRe)) {
        throw new Error('Unclosed tag at ' + scanner.pos);
      }

      filters = parseFilters(value);
      value = filters.value;

      token = {
        symbol: type,
        value: value,
        start: start,
        end: scanner.pos,
        formatters: filters.formatters,
      };

      tokens.push(token);

      if (type === '#' || type === '^' || type === '@') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();

        if (!openSection)
          throw new Error('Unopened section "' + value + '" at ' + start);

        if (openSection.value !== value)
          throw new Error('Unclosed section "' + openSection.value + '" at ' + start);
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        compileTags(value);
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();

    if (openSection)
      throw new Error('Unclosed section "' + openSection.value + '" at ' + scanner.pos);

    return nestTokens(squashTokens(tokens));
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens (tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      if (token) {
        if (token.symbol === 'text' && lastToken && lastToken.symbol === 'text') {
          lastToken.value += token.value;
          lastToken.end = token.end;
        } else {
          squashedTokens.push(token);
          lastToken = token;
        }
      }
    }

    return squashedTokens;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens (tokens) {
    var nestedTokens = [];
    var collector = nestedTokens;
    var sections = [];

    var token, section;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      switch (token.symbol) {
        case '#':
        case '@':
        case '^':
          collector.push(token);
          sections.push(token);
          collector = token.children = [];
          break;
        case '/':
          section = sections.pop();
          section.endBlock = token.start;
          collector = sections.length > 0 ? sections[sections.length - 1].children : nestedTokens;
          break;
        default:
          collector.push(token);
      }
    }
    return nestedTokens;
  }

  /**
   * Gets the value of token and extractracts filters from it
   * @return {Object} Object containing array of filters and token's path
   * @todo write docs
   */
  function parseFilters(value) {
    var unparsedFormatters = value.split("|");
    var value = unparsedFormatters.shift().trim();
    var formatters = [];
    var formattersHash = {};

    var formatter, match, filter, params, result;
    for (var i = 0, numUnparsedFormatters= unparsedFormatters.length; i < numUnparsedFormatters; i++) {
      formatter = unparsedFormatters[i];
      params = [];
      match = formatter.match( filterRe );
      filter = match[0].trim();

      if (!TB.Template.Formatters.hasOwnProperty(filter)) {
        throw new Error('Unknown filter "' + filter + '"');
      }

      while ((match = paramsRe.exec( formatter ))) {
        params.push(parseFilterParam(match[1].trim()));
      }

      paramsRe.lastIndex = 0;
      result = {
        formatter: filter,
        formatterFunc: TB.Template.Formatters[filter],
        params: params,
      };

      formatters.push(result);
      formattersHash[filter] = result;
    }

    return {
      value: value,
      formatters: {
        list: formatters,
        hash: formattersHash,
      },
    };
  }

  function parseFilterParam(param) {
    var type = 'interpolate';
    var value = param;

    if (isStringRe.test(param)) {
      type = 'string';
      value = param.replace(isStringRe, '$1');
    } else if (isIntegerRe.test(param)) {
      type = 'integer';
      value = parseInt(param, 10);
    } else if (isFloatRe.test(param)) {
      type = 'float';
      value = parseFloat(param);
    }

    return {
      type: type,
      value: value,
    };
  }

  /**
   * A simple string scanner that is used by the template parser to find
   * tokens in template strings.
   */
  function Scanner (string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function eos () {
    return this.tail === '';
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function scan (re) {
    var match = this.tail.match(re);

    if (!match || match.index !== 0)
      return '';

    var string = match[0];

    this.tail = this.tail.substring(string.length);
    this.pos += string.length;

    return string;
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function scanUntil (re) {
    var index = this.tail.search(re), match;

    switch (index) {
      case -1:
        match = this.tail;
        this.tail = '';
        break;
      case 0:
        match = '';
        break;
      default:
        match = this.tail.substring(0, index);
        this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  /**
   * Represents a rendering context by wrapping a view object and
   * maintaining a reference to the parent context.
   */
  function Context (view, parentContext) {
    this.view = view;
    this.cache = { '.': this.view };
    this.parent = parentContext;
  }

  /**
   * Creates a new context using the given view with this context
   * as the parent.
   */
  Context.prototype.push = function push (view) {
    return new Context(view, this);
  };
  /**
   * Returns the value of the given name in this context, traversing
   * up the context hierarchy if the value is absent in this context's view.
   */
  Context.prototype.lookup = function lookup (name) {
     var cache = this.cache;

    var value;
    if (cache.hasOwnProperty(name)) {
      value = cache[name];
    } else {
      if(isStringRe.test(name)) {
        value = name.replace(isStringRe, '$1');
      } else  if (name.indexOf('.') > 0) {
        var names = name.split('.');
        var index = 0;
        value = this.view;

        /**
         * Using the dot notion path in `name`, we descend through the
         * nested objects.
         *
         * To be certain that the lookup has been successful, we have to
         * check if the last object in the path actually has the property
         * we are looking for. We store the result in `lookupHit`.
         *
         * This is specially necessary for when the value has been set to
         * `undefined` and we want to avoid looking up parent contexts.
         **/
        while (value != null && index < names.length) {
          value = value[names[index++]];
        }
      } else {
        value = this.view[name];
      }

      cache[name] = value;
    }

    if (_.isFunction(value)) {
      value = value.call(this.view);
    }

    value = (value === undefined) ? null : value;

    return value;
  };
  /**
   * Returns the value of the given name in this context, traversing
   * up the context hierarchy if the value is absent in this context's view.
   */
  Context.prototype.lookup_old = function lookup (name) {
    var cache = this.cache;

    var value;
    if (cache.hasOwnProperty(name)) {
      value = cache[name];
    } else {
      var context = this, names, index, lookupHit = false;

      while (context) {
        if (name.indexOf('.') > 0) {
          value = context.view;
          names = name.split('.');
          index = 0;

          /**
           * Using the dot notion path in `name`, we descend through the
           * nested objects.
           *
           * To be certain that the lookup has been successful, we have to
           * check if the last object in the path actually has the property
           * we are looking for. We store the result in `lookupHit`.
           *
           * This is specially necessary for when the value has been set to
           * `undefined` and we want to avoid looking up parent contexts.
           **/
          while (value != null && index < names.length) {
            if (index === names.length - 1)
              lookupHit = _.has(value, names[index]);

            value = value[names[index++]];
          }
        } else {
          value = context.view[name];
          lookupHit = _.has(context.view, name);
        }

        if (lookupHit)
          break;

        context = context.parent;
      }

      cache[name] = value;
    }

    if (_.isFunction(value))
      value = value.call(this.view);

    value = (value === undefined) ? null : value;

    return value;
  };

  /**
   * A Writer knows how to take a stream of tokens and render them to a
   * string, given a context. It also maintains a cache of templates to
   * avoid the need to parse the same template twice.
   */
  function Writer () {
    this.cache = {};
  }

  /**
   * Clears all cached templates in this writer.
   */
  Writer.prototype.clearCache = function clearCache () {
    this.cache = {};
  };

  /**
   * Parses and caches the given `template` and returns the array of tokens
   * that is generated from the parse.
   */
  Writer.prototype.parse = function parse (template, tags) {
    var cache = this.cache;
    var tokens = cache[template];

    if (tokens == null)
      tokens = cache[template] = parseTemplate(template, tags);

    return tokens;
  };

  /**
   * High-level method that is used to render the given `template` with
   * the given `view`.
   *
   * The optional `partials` argument may be an object that contains the
   * names and templates of partials that are used in the template. It may
   * also be a function that is used to load partial templates on the fly
   * that takes a single argument: the name of the partial.
   */
  Writer.prototype.render = function render (template, view, partials) {
    var tokens = this.parse(template);
    var context = (view instanceof Context) ? view : new Context(view);
    return this.renderTokens(tokens, context, partials, template);
  };

  /**
   * Low-level method that renders the given array of `tokens` using
   * the given `context` and `partials`.
   *
   * Note: The `originalTemplate` is only ever used to extract the portion
   * of the original template that was contained in a higher-order section.
   * If the template doesn't use higher-order sections, this argument may
   * be omitted.
   */
  Writer.prototype.renderTokens = function renderTokens (tokens, context, partials, originalTemplate) {
    var buffer = '';

    var token, symbol, value;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      value = undefined;
      token = tokens[i];
      symbol = token.symbol;


      if (symbol === '#') value = this.renderSection(token, context, partials, originalTemplate);
      else if (symbol === '@') value = this.renderLoop(token, context, partials, originalTemplate);
      else if (symbol === '^') value = this.renderInverted(token, context, partials, originalTemplate);
      else if (symbol === '>') value = this.renderPartial(token, context, partials, originalTemplate);
      else if (symbol === 'text') value = this.rawValue(token);
      else if (symbol === 'name' || symbol === '&') value = this.unescapedValue(token, context);

      if (value !== undefined)
        buffer += value;
    }

    return buffer;
  };

  Writer.prototype.applyFilters = function(token, context) {
    var value = context.lookup(token.value);
    var originalValue = value;
    var formatter, params;

    if(value === null && !token.formatters.hash.default) {
      throw new Error('Value is null or undefined: ' + token.value);
    }

    if(token.symbol === 'name') {
      value = mustache.escape(value);
    }

    for(var i = 0, l = token.formatters.list.length; i < l; i++) {
      formatter = token.formatters.list[i];

      if(formatter.params && formatter.params.length > 0) {
        params = _.map(formatter.params, function(paramObj) {
            return (paramObj.type === 'interpolate')
              ? context.lookup(paramObj.value)
              : paramObj.value;
          });
      } else {
        params = [];
      }

      value = (formatter.formatter === 'default' && originalValue === null) ? null : value;

      params.unshift(value);
      value = formatter.formatterFunc.apply(formatter.formatterFunc, params);
    }

    if (token.symbol === '@' && !_.isArray(value)) {
      throw new Error('Value must be an array: ' + token.value);
    }

    return value;
  };

  Writer.prototype.renderLoop = function renderLoop (token, context, partials, originalTemplate) {
    var buffer = '';
    var value = this.applyFilters(token, context);

    if(value === null) {
      return;
    }

    for (var j = 0, valueLength = value.length; j < valueLength; ++j) {
      buffer += this.renderTokens(token.children, context.push(value[j]), partials, originalTemplate);
    }

    return buffer;
  };

  Writer.prototype.renderSection = function renderSection (token, context, partials, originalTemplate) {
    var self = this;
    var buffer = '';
    var value = this.applyFilters(token, context);

    // This function is used to render an arbitrary template
    // in the current context by higher-order sections.
    function subRender (template) {
      return self.render(template, context, partials);
    }

    if(!value) {
      return;
    }

    if (typeof value === 'object' || typeof value === 'string' || typeof value === 'number') {
      buffer += this.renderTokens(token.children, context.push(value), partials, originalTemplate);
    } else if (_.isFunction(value)) {
      if (typeof originalTemplate !== 'string')  {
        throw new Error('Cannot use higher-order sections without the original template');
      }

      // Extract the portion of the original template that the section contains.
      value = value.call(context.view, originalTemplate.slice(token.end, token.endBlock), subRender);

      if (value != null) {
        buffer += value;
      }
    } else {
      buffer += this.renderTokens(token.children, context, partials, originalTemplate);
    }

    return buffer;
  };

  Writer.prototype.renderInverted = function renderInverted (token, context, partials, originalTemplate) {
    var value = this.applyFilters(token, context);

    // Use JavaScript's definition of falsy. Include empty arrays.
    // See https://github.com/janl/mustache.js/issues/186
    if (!value || (_.isArray(value) && value.length === 0))
      return this.renderTokens(token.children, context, partials, originalTemplate);
  };

  Writer.prototype.renderPartial = function renderPartial (token, context, partials) {
    if (!partials) return;

    var value = _.isFunction(partials) ? partials(token.value) : partials[token.value];
    if (value != null)
      return this.renderTokens(this.parse(value), context, partials, value);
  };

  Writer.prototype.unescapedValue = function unescapedValue (token, context) {
    var value = this.applyFilters(token, context);
    if (value != null)
      return value;
  };

  Writer.prototype.rawValue = function rawValue (token) {
    return token.value;
  };

  mustache.name = 'tb.template.js';
  mustache.version = '1.0.0';
  mustache.tags = [ '{{', '}}' ];

  // All high-level mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates in the default writer.
   */
  mustache.clearCache = function clearCache () {
    return defaultWriter.clearCache();
  };

  /**
   * Parses and caches the given template in the default writer and returns the
   * array of tokens it contains. Doing this ahead of time avoids the need to
   * parse templates on the fly as they are rendered.
   */
  mustache.parse = function parse (template, tags) {
    return defaultWriter.parse(template, tags);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function render (template, view, partials) {
    if (typeof template !== 'string') {
      throw new TypeError('Invalid template! Template should be a "string" ' +
                          'but "' + typeof template + '" was given as the first ' +
                          'argument for mustache#render(template, view, partials)');
    }

    return defaultWriter.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.,
  /*eslint-disable */ // eslint wants camel cased function name
  mustache.to_html = function to_html (template, view, partials, send) {
    /*eslint-enable*/

    var result = mustache.render(template, view, partials);

    if (_.isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = _.escape;

  // Export these mainly for testing, but also for advanced usage.
  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;
  mustache.Formatters = {

    /**
     * Translates given string
     * @param  {String} v      input string to translate to given locale
     * @param  {String} locale locale to translate given string to
     * @return {String}        translated string
     */
    translate: function(v, locale) {
      return v;
    },

    default: function( v, defaultValue ) {
      return (v === null) ? (defaultValue || '') : v;
    },

    number: function( v ) {
      return TB.Translate.getnumber( undefined, v );
    },

    currency: function( v, code ) {
      return TB.Translate.getcurrency( undefined, v, code );
    },

    link: function( v, label ) {
      label = (label === undefined || label === null) ? v : label;
      return '<a href="' + v + '">' + ( label ) + '</a>';
    },

    email: function( v, label ) {
      label = (label === undefined || label === null) ? v : label;
      return '<a href="mailto:' + v + '">' + ( label ) + '</a>';
    },

    date: function( v ) {
      return TB.Translate.getdate( undefined, v );
    },

    time: function( v ) {
      return TB.Translate.gettime( undefined, v );
    },

    datetime: function( v ) {
      return TB.Translate.getdatetime( undefined, v );
    },

    checkbox: function( v ) {
      var checked = (!!v) ? ' checked="checked"' : '';
      return '<input type="checkbox" disabled="disabled"' + checked + '/>'
    },

    yesno: function( v, yes, no ) {
      yes = (yes !== undefined) ? yes : 'yes';
      no = (no !== undefined) ? no : 'no';

      return (v == true) ? yes : no;
    },

  };


  return mustache;

});
