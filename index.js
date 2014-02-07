var event = require('event')

var config = { prefix: 'data-state-' }

var states = {}

// Access a state
var machina = function(state) {
	return get_state(state)
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

State.prototype.on = function(transition, fn) {
	if(transition === 'enter') {
		this._on_enter = fn
	} else if (transition == 'exit') {
		this._on_exit = fn
	}
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
	find_attrs(states, el)
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

var get_state = function(name) {
	var state = states[name]
	if (!state)
		states[name] = state = new State(name)
	return state
}

var find_attrs = function(states, el) {
	traverse_dom_attrs(el, function(attr, node) {
		if (attr.name.indexOf(config.prefix) === 0) {
			var val = parse_attr_val(attr.value)
			var ev, state_name, state
			if (attr.name.indexOf(config.prefix + 'enter') === 0) {
				ev = val[0], state_name = val[1]
				state = get_state(state_name)
				var fn = function() { state.enter.call(state) }
				event.bind(node, ev, fn)
				node.removeAttribute(attr.name)
			} else if (attr.name.indexOf(config.prefix + 'exit') === 0) {
				ev = val[0], state_name = val[1]
				state = get_state(state_name)
				var fn = function() { state.exit.call(state) }
				event.bind(node, ev, fn)
				node.removeAttribute(attr.name)
			} else {
				var attr_name = parse_attr_name(attr.name)
				state_name = val[0], val = val[1]
				state = get_state(state_name)
				state.bind_attr(node, attr_name, val)
			}
		}
	})
}

var parse_attr_val = function(attr_val) {
	return attr_val.replace(/\s+/g, '').split(':')
}

var parse_attr_name = function(attr_name) {
	return attr_name.replace(/\s+/g,'').replace(config.prefix,'')
}
