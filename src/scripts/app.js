"use strict";

// Libraries
var Immutable = require("immutable");
var React = require("react/addons");
var ReactBaconMixin = require("react-bacon").BaconMixin;
// Stores
var todoStore = require("scripts/stores/todo-list");
// Components
var TodoList = require("scripts/components/todo-list");

var D = React.DOM;

// CSS
require("styles/main.less");

var App = React.createClass({

    mixins:[ ReactBaconMixin ],

    componentWillMount() {
        this.plug(todoStore.items, 'todoItems');
        this.plug(todoStore.checkedItemIds, 'todoCheckedItemIds');
    },

    render() {
        return D.div(
            { className:"main" },
            TodoList({
                items:this.state.todoItems,
                checkedItemIds:this.state.todoCheckedItemIds
            })
        );
    }
});

module.exports = App;