export var Action;
(function (Action) {
    Action[Action["Add"] = 0] = "Add";
    Action[Action["Remove"] = 1] = "Remove";
})(Action || (Action = {}));
var SelectionEvent = (function () {
    function SelectionEvent(action, value) {
        this.action = action;
        this.value = value;
    }
    return SelectionEvent;
}());
export default SelectionEvent;
//# sourceMappingURL=/Users/tapio.jaakkola/code/chipster/chipster-web/src/app/model/events/selectionevent.js.map