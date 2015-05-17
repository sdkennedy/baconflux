# baconflux
Proof of concept using Bacon.js to create a Flux-like architecture.

## Installing

Pull down dependancies
```
npm install
```

## Running

To run webpack-dev-server configured with the react-hot-loader

```
grunt serve
```

## Architecture

### Prerequisite concepts
This implementation is heavily influenced by Functional Reactive Programming (which is different than React). Netflix has produced a very good talk on the topic which can be viewed here: [https://www.youtube.com/watch?v=XRYN2xt11Ek](https://www.youtube.com/watch?v=XRYN2xt11Ek)

### Overview

Here is a diagram of how everything generally fits together:
![Overal Architecture Diagram](https://cloud.githubusercontent.com/assets/8094943/7668549/4167fe78-fbf3-11e4-92b0-6d5fc4352b85.png)

Data generally flows through the system in the following way:

1. React Component calls Action Function
2. Action Function pushes event on to Action Bus
3. Store Property recieves Action Bus event and updates its state accordingly
4. React Component listens for Store Property changes and rerenders its view when necessary

### Stores

#### Overview
The purpose of Flux stores is to hold and manage the modification application state. Flux stores contain Bacon Properties that listen to Action Buses for events which modify their internal state. Every time a property state changes it in turn emits its own event.

#### Creating Store Properties
Store properties have an initial state and can be mutated by incomming action events. Here is a simplified example:
```js
// Action Buses
var removeItemBus = new Bacon.Bus();
var setItemBus = new Bacon.Bus();

// Mutation Functions
var deleteItem = (previousItems, id) => previousItems.delete(id);
var setItem = (previousItems, item) => previousItems.set(item.get("id"), item);

// Store Property
var todoItems = Bacon.update(
    Immutable.OrderedMap(),
    [removeItemBus], deleteItem,
    [setItemBus], setItem
);
```

Properties can then be used in the following way:
```js
var unsubscribeFn = todoItems.onValue(
    (items) => console.log( JSON.stringify( items.toJS() ) )
);

setItemBus.push({ id:1, text:"First todo list item!"});
// { "1": { "id":1, "text":"First todo list item!" } }
setItemBus.push({ id:1, text:"Second todo list item!"});
// { "1": { "id":1, "text":"First todo list item!" }, "2": { "id":2, "text":"Second todo list item!" } }
removeItemBus.push(1);
// { "2": { "id":2, "text":"Second todo list item!" } }
```

#### Using Store Properties in React
Although React components can manually subscribe/unsubscribe on componentDidMount/componentWillUnmount respectively, the [react-bacon](https://github.com/jamesmacaulay/react-bacon) library provides a mixin that conveniently assigns the current value of a Bacon.js Property to a state key. When the property value changes so does the state property value.
This avoids the boilerplate of having to constantly subscribe and unsubscribe from properties.
```js
var App = React.createClass({
    mixins:[ ReactBaconMixin ],
    componentWillMount() {
        this.plug(todoStore.items, 'todoItems');
    },

    render() {
        return D.div(
            { className:"main" },
            TodoList({
                items:this.state.todoItems
            })
        );
    }
});
```

#### The Functional Part of FRP
The great thing about using FRP is that EventStreams (Action Buses) and Properties can be composed and transformed with functional operators.

#### Composed Properties
If we had two properties todoStore.items {Immutable.Map()} and todoStore.checkedItemIds {Immutable.Set()} would could compose those properties in a new function todoStore.checkedItems that stores all of the checked items and is updated when ever todoStore.items or todoStore.checkedItemIds updates.
```js
var checkedItems = Bacon.combineWith(
    (items, checkedItemIds) => items.filter( (item) => checkedItemIds.has(item.id) ),
    todoStore.items,
    todoStore.checkedItemIds
);
```

#### Interaction with Asyncronous APIs 
When making potentially slow API requests, it is some times useful to optimistically update the UI state before making the request and then reconciling the UI state after the request fails or succeeds. Being able to create derived action EventStreams can be solve this problem elegantly.

If we have an Action Bus (EventStream) ```loadItemsBusStarted``` we can create a derived Action Bus ``` loadItemsBusFinished``` that will fire an event after the api call has completed.

```js
var loadItemsBusFinished = loadItemsBusStarted.flatMap(
    (event) => {
        return Bacon.fromPromise($.get("api/todoItems"));
    }
);
```

It is easiest to think of FRP operators like functional array operators. Bacon.fromPromise creates a nested EventStream (think array) with [0..1] events. So for each incomming event (think element) we are creating a nested EventStream (think array) instead of a new event (think element). This is equivalent to:

```js
var initialArray = [1,2,3];
initialArray.map( (item) => [item] );
// [ [1], [2], [3] ]

// If javascript had flatMap it would do map, then concatenates all of the sub arrays
initialArray.flatMap( (item) => [item] );
// [ 1, 2, 3 ]
```
