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

### Store Properties

#### Creating Properties
Store properties have an initial state and can be mutated by incomming action events.
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
// "2": { "id":2, "text":"Second todo list item!" } }
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
