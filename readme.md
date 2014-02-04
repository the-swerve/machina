# machina

machina is a tiny lil lib that allows you to abstract procedural UI into a declarative state machine in the DOM.

You can declare what events in the DOM cause either a new state or an exit from an existing state, and you can declare what attributes certain elements will have on certain states.

Finally, you can use callbacks to hook into your state transitions in the js layer.

It is best used in combination with a templating library, a data model library, and any other components.

# installation

with component

```sh
component install machina
```
with npm and browserify

```sh
npm install machina-component
```

# usage

Declare that an event enters a state using `mm-enter='event:state'`.

```html
<a mm-enter='click:creating-user'>New User</a>
```

We use the `mm-` prefix for machina attributes, which can be customized (see 'config') to anything else. ``mm-enter` indicates that we want to enter a new state on an action. In the attribute, separate the action from the state with a colon.

We can then define elements that have certain attributes based on their state using `mm-{attr}="state:value"`.

```html
<a mm-enter='click:creating-user'>New User</a>

<form mm-class='new-user:show'>
	<a mm-exit='click:creating-user'>Close</a>
	... <!-- a bunch of fields -->
	<input type='submit' mm-enter='click:saving-user' mm-class='saving-user:disabled' />
	<p mm-class='saving-user:show'>Saving...</p>
</form>
```

In the above example, the `New User` button will show the new user form and disable itself; the close button will hide the new user form; and the submit button will transition to the `saving-user` state, disabling itself, and showing the "Saving..." text, which could be an animation. All of this procedure happens entirely through declarations in the dom and no js code at all.
```

In our javascript, we can hook into these state transitions.

```js
var machina = require('machina');

var new_user_state = machina('creating-user');

new_user_state.on_enter(function(e) {
	// e is the event
	console.log('the form is about to show');
});

new_user_state.on_exit(function(e) {
	console.log('the form is about to hide');
});

```

We can also cause the state transitions in js:

```js
new_user_state.enter();
new_user_state.exit();

// or:

machina('creating-user').enter();
machina('creating-user').exit();
```

# config

```js
machina.config({
	prefix: '--', // your custom machina attribute prefix
});
