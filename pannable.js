
const { Clutter } = imports.gi;

function makePannable(actor) {
    const dragAction = new Clutter.DragAction();
    dragAction.set_drag_axis(Clutter.DragAxis.X_AXIS);
    actor.add_action(dragAction);
}

function unmakePannable(actor) {
}
