var query = require('query-component')
var event = require('event-component')

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

var init_enters = function(states, el) {
	var attr = config.prefix + 'enter'
	var enters = query.all('*[' + attr + ']', el)
	if (!enters) return;
	for (var i = 0; i < enters.length; ++i) {
		var n = enters[i]
		var val = parse_attr_val(n.getAttribute(attr))
		var action = val[0]
		var name = val[1]
		if (!states[name]) states[name] = new State(name)
		var state = states[name]
		var fn = function() { state.enter.call(state) }
		event.bind(n, action, fn)
		n.removeAttribute(attr)
	}
}

var init_exits = function(states, el) {
	var attr = config.prefix + 'exit'
	var exits = query.all('*[' + attr + ']', el)
	if (!exits) return;
	for (var i = 0; i < exits.length; ++i) {
		var n = exits[i]
		var val = parse_attr_val(n.getAttribute(attr))
		var action = val[0]
		var name = val[1]
		var state = states[name]
		if (state) {
			var fn = function() { state.exit.call(state) }
			event.bind(n, action, fn)
		}
		n.removeAttribute(attr)
	}
}

var init_attrs = function(states, el) {
	var stack = [el]
	while (stack.length > 0) {
		var node = stack.pop()
		var attrs = node.attributes
		if (attrs) {
			for (var i = 0; i < attrs.length; ++i) {
				var attr = attrs[i]
				if (attr.name.indexOf(config.prefix) === 0) {
					var name_parsed = parse_attr_name(attr.name)
					var parsed = parse_attr_val(attr.value)
					var state = parsed[0]
					var value = parsed[1]
					if (states[state]) states[state].bind_attr(node, name_parsed, value)
				}
			}
		}
		var children = node.childNodes
		for (var i = 0; i < children.length; ++i) stack.push(children[i])
	}
}

var parse_attr_val = function(attr_val) {
	return attr_val.replace(/\s+/g, '').split(':')
}

var parse_attr_name = function(attr_name) {
	return attr_name.replace(/\s+/g,'').replace(config.prefix,'')
}
