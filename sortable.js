const { St } = imports.gi;
const Tweener = imports.ui.tweener;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DnD = Extension.imports.dnd;
const { Cell } = Extension.imports.cell;
const { Log } = Extension.imports.utils.logger;

const signals = new Map();
const dropPlaceholder = new St.Widget();

let lastCell = null;

function makeSortable(actor) {
    actor.connect('cell-added', (source, cell) => makeCellDraggable(cell));
}

function unmakeSortable(actor) {
    removeSignals();
}

function makeCellDraggable(cell) {
    cell.set_easing_duration(300)
    cell.draggable = DnD.makeDraggable(cell);
    addSignal(cell.draggable, 'drag-begin', (actor, event, args) => {
        cell.set_easing_duration(0);
        handleDragBegin(actor, event, args);
    });
    addSignal(cell.draggable, 'drag-motion', handleDragMotion);
    addSignal(cell.draggable, 'drag-dropped', handleDragDrop);
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

function handleDragBegin(actor, event, args) {
    if (args.targetActor.constructor.name !== 'Clutter_Clone')
        return false;
    const targetCell = getDraggableActor(args.targetActor);
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

function handleDragMotion(actor, event, args) {
    const targetCell = getDraggableActor(args.targetActor);
    if (targetCell instanceof Cell) {
        if (lastCell === targetCell)
            return;
        lastCell = targetCell;
        const dragActor = args.dragActor;
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
}

function handleDragDrop(actor, event, args) {
    const [x0, y0] = dropPlaceholder.get_transformed_position();
    const row = dropPlaceholder.get_parent();
    Tweener.addTween(args.dropActor, {
        x: x0,
        y: y0,
        time: .3,
        transition: 'easeOutQuad',
        onComplete: () => {
            args.dropActor.unparent();
            args.dropActor.set_scale(...args.scale)
            row.replace_child(dropPlaceholder, args.dropActor);
            dropPlaceholder.unparent();
        }
    })
    lastCell = null;
}