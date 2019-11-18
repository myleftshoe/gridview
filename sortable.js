const { St } = imports.gi;

const Tweener = imports.ui.tweener;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DnD = Extension.imports.dnd;
const { Cell } = Extension.imports.cell;
const { Log } = Extension.imports.utils.logger;

const dragMonitor = {
    dragBegin: handleDragBegin,
    dragDrop: handleDragDrop,
    dragMotion: handleDragMotion,
};
const signals = new Map();
const dropPlaceholder = new St.Widget();

let lastCell = null;

function makeSortable(actor) {
    DnD.addDragMonitor(dragMonitor);
    actor.connect('cell-added', (source, cell) => makeCellDraggable(cell));
}

function unmakeSortable(actor) {
    DnD.removeDragMonitor(dragMonitor);
    removeSignals();
}

function makeCellDraggable(cell) {
    cell.set_easing_duration(300)
    cell.draggable = DnD.makeDraggable(cell);
    addSignal(cell.draggable, 'drag-begin', () => {
        cell.set_easing_duration(0);
    });
    addSignal(cell.draggable, 'drag-end', () => {
        cell.set_easing_duration(300);
    });
}

function addSignal(actor, name, callback) {
    const sid = actor.connect(name, callback);
    signals.set(sid, actor);
}

function removeSignals() {
    [...signals.entries()].forEach(([sid, actor]) => actor.disconnect(sid));
    signals.clear();
}

function getDraggableActor(actor) {
    if (!actor) return;
    if (actor.draggable) return actor;
    return getDraggableActor(actor.get_parent());
}

function handleDragBegin(event) {
    if (event.targetActor.constructor.name !== 'Clutter_Clone')
        return false;
    const targetCell = getDraggableActor(event.targetActor);
    const row = targetCell.get_parent();
    const c = row.get_children().indexOf(targetCell);
    this.initialIndex = c;
    dropPlaceholder.unparent();
    const [width, height] = targetCell.get_size();
    dropPlaceholder.width = width;
    dropPlaceholder.height = height;
    row.insert_child_at_index(dropPlaceholder, c);
    return true;
}

function handleDragMotion(event) {
    // log('drag-monitor');
    // log(JSON.stringify(event, [
    //     'source',
    //     'x',
    //     'y',
    //     'targetActor', 
    //     'dragActor']
    // ));
    const targetCell = getDraggableActor(event.targetActor);
    if (targetCell instanceof Cell) {
        if (lastCell === targetCell)
            return DnD.DragMotionResult.NO_DROP;
        lastCell = targetCell;
        const dragActor = event.dragActor;
        const row = targetCell.get_parent();
        const cell = row.get_children().indexOf(targetCell);
        dropPlaceholder.unparent();
        const [width, height] = dragActor.get_size();
        dropPlaceholder.width = width;
        dropPlaceholder.height = height;
        row.insert_child_at_index(dropPlaceholder, cell);
    }
    else {
        lastCell = null;
    }
    return DnD.DragMotionResult.MOVE_DROP;
}

function handleDragDrop(event) {
    const [x1, y1] = event.dropActor.get_transformed_position();
    const [x0, y0] = dropPlaceholder.get_transformed_position();
    const tx = x1 - x0 - 10;
    const ty = y1 - y0 - 10;
    event.dropActor.set_easing_duration(300);
    const row = dropPlaceholder.get_parent();
    event.dropActor.unparent();
    event.dropActor.translation_x = tx;
    event.dropActor.translation_y = ty;
    row.replace_child(dropPlaceholder, event.dropActor);
    Tweener.addTween(event.dropActor, {
        translation_x: 0,
        translation_y: 0,
        time: .15,
        transition: 'easeOutQuad',
    })
    dropPlaceholder.unparent();
    lastCell = null;
    return DnD.DragDropResult.CONTINUE;
}