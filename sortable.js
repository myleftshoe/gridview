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
        log('drag-end')
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
    const targetCell = getDraggableActor(args.targetActor);
    if (!(targetCell instanceof Cell)) 
        return;
    dropPlaceholder.set_size(...targetCell.get_size());
    positionPlaceholder(targetCell);
}

function handleDragMotion(actor, event, args) {
    const targetCell = getDraggableActor(args.targetActor);
    if (!(targetCell instanceof Cell)) {
        lastCell = null;
        return;
    }
    if (lastCell === targetCell)
        return;
    lastCell = targetCell;
    positionPlaceholder(targetCell);
}

function handleDragDrop(actor, event, args) {
    const [x0, y0] = dropPlaceholder.get_transformed_position();
    Tweener.addTween(args.dropActor, {
        x: x0,
        y: y0,
        time: .3,
        transition: 'easeOutQuad',
        onComplete: () => {
            args.dropActor.unparent();
            args.dropActor.set_scale(...args.scale)
            const row = dropPlaceholder.get_parent();
            row.replace_child(dropPlaceholder, args.dropActor);
            dropPlaceholder.unparent();
        }
    })
    lastCell = null;
}

function positionPlaceholder(targetCell) {
    const row = targetCell.get_parent();
    const cell = row.get_children().indexOf(targetCell);
    dropPlaceholder.unparent();
    row.insert_child_at_index(dropPlaceholder, cell);
}
