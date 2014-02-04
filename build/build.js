
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-event/index.js", function(exports, require, module){
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);

  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);

  return fn;
};
});
require.register("machina/index.js", function(exports, require, module){
var event = require('event')

var config = { prefix: 'mm-' }

var states = {}

// Access a state
var machina = function(state) {
	return states[state]
}

machina.config = function(settings) {
	for (var key in settings) config[key] = settings[key]
}

machina.init = function(el) {
	el = el || document.body
	init(states, el)
}

module.exports = machina

var State = function() {
	if (!(this instanceof State)) return new State()
	this._on_enter = function() {}
	this._on_exit = function() {}
	this._attrs = []
	return this
}

State.prototype.onenter = function(f) {
	this._on_enter = f
	return this
}

State.prototype.onexit = function(f) {
	this._on_exit = f
	return this
}

State.prototype.enter = function(ev) {
	this._on_enter(ev)
	for (var i = 0; i < this._attrs.length; ++i) {
		var attr = this._attrs[i]
		attr.node.setAttribute(attr.name, attr.val)
	}
	return this
}

State.prototype.exit = function(ev) {
	this._on_exit(ev)
	for (var i = 0; i < this._attrs.length; ++i) {
		var attr = this._attrs[i]
		attr.node.removeAttribute(attr.name)
	}
	return this
}

// When the state
State.prototype.bind_attr = function(node, name, value) {
	this._attrs.push({
		node: node,
		name: name,
		val: value
	})
	return this
}

// Functional utils

var init = function(states, el) {
	init_enters(states, el)
	init_exits(states, el)
	init_attrs(states, el)
}

var init_exits = function(states, el) {
}

var traverse_dom_attrs = function(el, fn) {
	var stack = [el]
	while (stack.length > 0) {
		var node = stack.pop()
		var attrs = node.attributes
		if (attrs) {
			for (var i = 0; i < attrs.length; ++i) {
				var attr = attrs[i]
				fn(attr, node)
			}
		}
		var cs = node.childNodes
		for (var i = 0; i < cs.length; ++i) stack.push(cs[i])
	}
}

var init_enters = function(states, el) {
	traverse_dom_attrs(el, function(attr, node) {
		if (attr.name.indexOf(config.prefix + 'enter') === 0) {
			var val = parse_attr_val(attr.value)
			var action = val[0]
			var name = val[1]
			if (!states[name]) states[name] = new State(name)
			var state = states[name]
			var fn = function() { state.enter.call(state) }
			event.bind(node, action, fn)
			node.removeAttribute(attr.name)
		}
	})
}

var init_exits = function(states, el) {
	traverse_dom_attrs(el, function(attr, node) {
		if (attr.name.indexOf(config.prefix + 'exit') === 0) {
			var val = parse_attr_val(attr.value)
			var action = val[0]
			var name = val[1]
			var state = states[name]
			if (state) {
				var fn = function() { state.exit.call(state) }
				event.bind(node, action, fn)
			}
			node.removeAttribute(attr.name)
		}
	})
}

var init_attrs = function(states, el) {
	traverse_dom_attrs(el, function(attr, node) {
		if (attr.name.indexOf(config.prefix) === 0) {
			var name_parsed = parse_attr_name(attr.name)
			var parsed = parse_attr_val(attr.value)
			var state = parsed[0]
			var value = parsed[1]
			if (states[state]) states[state].bind_attr(node, name_parsed, value)
		}
	})
}

var parse_attr_val = function(attr_val) {
	return attr_val.replace(/\s+/g, '').split(':')
}

var parse_attr_name = function(attr_name) {
	return attr_name.replace(/\s+/g,'').replace(config.prefix,'')
}

});
require.alias("component-event/index.js", "machina/deps/event/index.js");
require.alias("component-event/index.js", "event/index.js");

require.alias("machina/index.js", "machina/index.js");