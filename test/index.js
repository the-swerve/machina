var assert = require('assert')
var domify = require('domify')

var machina = require('../')

describe('machina', function() {

	it ('returns undefined without any machina', function() {
		assert.equal(machina('lol'), undefined)
	})

	it ('should initialize states based on enters in the dom', function() {
		var el = domify("<div><p mm-enter='click:lol'></p></div>")
		machina.init(el)
		assert.notEqual(machina('lol'), undefined)
	})

	it ('should enter a state and set attrs on an event', function() {
		var el = domify("<div mm-class='lol:clicked'><p mm-enter='click:lol'></p></div>")
		machina.init(el)
		el.firstChild.click()
		assert.equal(el.getAttribute('class'), 'clicked')
	})

	it ('should enter a state when enter called', function() {
		var el = domify("<div mm-class='lol:clicked'><p mm-enter='click:lol'></p></div>")
		machina.init(el)
		machina('lol').enter()
		assert.equal(el.getAttribute('class'), 'clicked')
	})

	it ('should exit a state and remove attrs on an event', function() {
		var el = domify("<div mm-class='lol:clicked'><p mm-enter='click:lol'></p><p mm-exit='click:lol'></p></div>")
		machina.init(el)
		el.firstChild.click()
		assert.equal(el.getAttribute('class'), 'clicked')
		el.lastChild.click()
		assert.equal(el.getAttribute('class'), null)
	})

	it ('should exit a state when exit called', function() {
		var wrapper = domify("<div mm-class='lol:clicked'></div>")
		var enter = domify("<a mm-enter='click:lol'></a>")
		var exit = domify("<a mm-exit='click:lol'></a>")
		wrapper.appendChild(enter)
		wrapper.appendChild(exit)
		machina.init(wrapper)

		machina('lol').enter()
		assert.equal(wrapper.getAttribute('class'), 'clicked')
		machina('lol').exit()
		assert.equal(wrapper.getAttribute('class'), null)
	})

	it ('runs the callbacks', function() {
		machina.config({prefix: 'data-machina-'})
		var el = domify("<div><p --enter='click:lol'></p></div>")
		machina.init(el)
		var x = 0
		machina('lol').onenter(function(e) { ++x })
		machina('lol').enter()
		machina('lol').onexit(function(e) { ++x })
		machina('lol').exit()
		assert.equal(x, 2)
	})

	it ('can change the prefix with config', function() {
		machina.config({prefix: 'data-machina-'})
		var el = domify("<div><p data-machina-enter='click:lol'></p></div>")
		machina.init(el)
		assert.notEqual(machina('lol'), undefined)
	})

})
