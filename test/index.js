var assert = require('assert')
var domify = require('domify')
var machina = require('machina')

describe('machina', function() {

	it ('should initialize states based on enters in the dom', function() {
		var el = domify("<div><p data-state-enter='click:a'></p></div>")
		machina.init(el)
		assert(machina('a') !== undefined)
	})

	it ('should initialize states based on attrs in the dom', function() {
		var el = domify("<div><p data-state-enter='click:b'></p></div>")
		machina.init(el)
		assert(machina('b') !== undefined)
	})

	it ('should initialize states based on exits in the dom', function() {
		var el = domify("<div><p data-state-exit='b:c'></p></div>")
		machina.init(el)
		assert(machina('c') !== undefined)
	})

	it ('should initialize states when it is called in js', function() {
		machina('d')
		assert(machina('d') !== undefined)
	})

	it ('should enter a state and set attrs on an event', function() {
		var el = domify("<div data-state-class='lol:clicked'><p data-state-enter='click:lol'></p></div>")
		machina.init(el)
		el.firstChild.click()
		assert(el.getAttribute('class') === 'clicked')
	})

	it ('should enter a state when enter called', function() {
		var el = domify("<div data-state-class='lol:clicked'><p data-state-enter='click:lol'></p></div>")
		machina.init(el)
		machina('lol').enter()
		assert(el.getAttribute('class') === 'clicked')
	})

	it ('should exit a state and remove attrs on an event', function() {
		var el = domify("<div data-state-class='lol:clicked'><p data-state-enter='click:lol'></p><p data-state-exit='click:lol'></p></div>")
		machina.init(el)
		el.firstChild.click()
		assert(el.getAttribute('class') === 'clicked')
		el.lastChild.click()
		assert(el.getAttribute('class') === null)
	})

	it ('should exit a state when exit called', function() {
		var wrapper = domify("<div data-state-class='lol:clicked'></div>")
		var enter = domify("<a data-state-enter='click:lol'></a>")
		var exit = domify("<a data-state-exit='click:lol'></a>")
		wrapper.appendChild(enter)
		wrapper.appendChild(exit)
		machina.init(wrapper)

		machina('lol').enter()
		assert(wrapper.getAttribute('class') === 'clicked')
		machina('lol').exit()
		assert(wrapper.getAttribute('class') === null)
	})

	it ('runs the callbacks', function() {
		machina.config({prefix: 'data-machina-'})
		var el = domify("<div><p --enter='click:lol'></p></div>")
		machina.init(el)
		var x = 0
		machina('lol').on('enter', function(e) { ++x })
		machina('lol').enter()
		machina('lol').on('exit', function(e) { ++x })
		machina('lol').exit()
		assert(x === 2)
	})

	it ('can change the prefix with config', function() {
		machina.config({prefix: 'mm-'})
		var el = domify("<div><p mm-enter='click:x'></p></div>")
		machina.init(el)
		assert(machina('x') !== undefined)
	})

})
