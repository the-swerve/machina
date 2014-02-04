var query = require('query')
var event = require('event')

var config = {
	prefix: 'mm-'
}

var states = {}

// Access a state
var machina = function(state) {
	return states[state]
}

machina.config = function(settings) {
	for (var key in settings) config[key] = settings[key]
}

module.exports = machina

var State = function() {
	if (!(this instanceof State)) return new State()
	this._callback = undefined
	this.attrs = []
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
	var n = ev.currentTarget
	this._on_enter(ev)
	for (var i = 0; i < this.attrs.length; ++i) {
		var attr = this.attrs[i]
		attr.node.setAttribute(attr.name, attr.val)
	}
	return this
}

State.prototype.exit = function(ev) {
	var n = ev.currentTarget
	this._on_exit(ev)
	for (var i = 0; i < this.attrs.length; ++i) {
		var attr = this.attrs[i]
		attr.node.removeAttribute(attr.name)
	}
	return this
}

// When the state
State.prototype.bind_attr = function(node, name, value) {
	this.attrs.push({
		node: node,
		name: attr,
		val: value
	})
	return this
}

// Functional utils

var init = function(states) {
	init_enters(states)
	init_exits(states)
	init_attrs(states)
}

var init_enters = function(states) {
	var attr = config.prefix + 'enter'
	var enters = query('*[' + attr + ']')
	for (var i = 0; i < enters.length; ++i) {
		var n = enters[i]
		var val = parse_attr_val(n.getAttribute(attr))
		var action = val[0]
		var name = val[1]
		if (!states[name]) states[name] = new State(name)
		var state = states[name]
		event.bind(n, action, state.enter)
		n.removeAttribute(attr)
	}
}

var init_exits = function(states) {
	var attr = config.prefix + 'exit'
	var exits = query('*[' + attr + ']')
	for (var i = 0; i < exits.length; ++i) {
		var n = exits[i]
		var val = parse_attr_val(n.getAttribute(attr))
		var action = val[0]
		var name = val[1]
		var state = states[name]
		if (state) event.bind(n, action, state.exit)
		n.removeAttribute(attr)
	}
}

var init_attrs = function(node, states) {
	stack = [document.body]
	while (stack.length > 0) {
		var node = stack.pop()
		var attrs = node.attributes
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
		var children = node.childNodes
		for (var i = 0; i < children.length; ++i) stack.push(children[i])
	}
}

var parse_attr_val = function(attr_val) {
	return attr_name.replace(/\s+/g, '').split(':')
}

var parse_attr_name = function(attr_name) {
	return attr_name.replace(/\s+/g,'').(config.prefix,'')
}

init(states)
