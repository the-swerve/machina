# machina

machina is a minimal lib that allows you to abstract procedural UI into a declarative state machine in the DOM.

You can declare what events in the DOM cause either a new state or an exit from an existing state, and you can declare what attributes certain elements will have on certain states.

Finally, you can use callbacks to hook into your state transitions in the js layer.

It is best used in combination with a templating library, a data model library, and any other components.

Works with IE6+.

# installation

with component

```sh
component install machina
```

# usage

Declare that an event enters a state using `data-state-enter='event:state'`

```html
<a data-state-enter='click:creating-user'>New User</a>
```

By default, We use the `data-state-` prefix for machina attributes, which can be customized (see 'config') to anything else.

`data-state-enter` indicates that we want to enter a new state on an event. In the attribute, separate the event from the state with a colon.

`data-state-exit` indicates that we want to exit a state on an event.

We can define elements that have certain attributes based on their state using `data-state-{attr}='state:value'`.

```html
<a data-state-enter='click:creating-user'>New User</a>

<form data-state-class='creating-user:show'>
	<a data-state-exit='click:creating-user'>Close</a>
	... <!-- a bunch of fields -->
	<input type='submit' data-state-enter='click:saving-user' data-state-class='saving-user:disabled' />
	<p data-state-class='saving-user:show'>Saving...</p>
</form>
```

In the above example, the `New User` button will show the new user form when
clicked; the close button will hide the new user form; and the submit button
will transition to the `saving-user` state, disabling itself, and showing the
"Saving..." text, which could be an animation. All of this procedure happens
entirely through declarations in the dom without any js code.

#### machina(state_name)

In our javascript, we can hook into these state transitions.

```js
var machina = require('machina');

var creating_user = machina('creating-user'); // access the 'creating-user' state
```

`machina(state)` returns a state object, which will have been already automatically instantiate once the dom loaded.

#### state.on('enter', fn), state.on('exit', fn)

You can define functions that run when the state enters or exits.

```js
creating_user.on('enter', function(e) {
	// e is the event, which may or may not be defined
	console.log('the form is about to show');
});

creating_user.on('exit', function(e) {
	console.log('the form is about to hide');
});

```

#### state.enter(), state.exit()

We can initiate state transitions manually in the js

```js
creating_user.enter();
creating_user.exit();

// or:

machina('creating-user').enter();
machina('creating-user').exit();
```

# config

```js
machina.config({
	prefix: 'data-state-' // your custom machina attribute prefix
});
