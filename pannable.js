
const { Clutter } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DnD = imports.ui.dnd;
const { Row } = Extension.imports.row;

const Stage = global.stage;

let sid = null;

function makePannable(actor) {
    // allow drag only if drag not started on child
    const draggable = DnD.makeDraggable(actor, { manualMode: true });

    sid = Stage.connect('button-press-event', (source, event) => {
        const coords = event.get_coords();
        const sequence = event.get_event_sequence();
        const actor = Stage.get_actor_at_pos(Clutter.PickMode.ALL, ...coords);
        if (actor instanceof Row) {
            draggable.startDrag(
                ...coords,
                global.get_current_time(),
                sequence
            );
        }
    });
}

function unmakePannable(actor) {
    actor.disconnect(sid);
}
