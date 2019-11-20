
const { Clutter } = imports.gi;

function makePannable(actor) {
    const dragAction = new Clutter.DragAction();
    actor.add_action(dragAction);
}

function unmakePannable(actor) {
}
