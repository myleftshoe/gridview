const { St } = imports.gi;

const Tweener = imports.ui.tweener;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DnD = Extension.imports.dnd;
const { Cell } = Extension.imports.cell;
const { Log } = Extension.imports.utils.logger;


const dropPlaceholder = new St.Widget();
let lastCell = null;
// this.dragMonitor = DnD.addDragMonitor({
//     dragBegin: handleDragBegin.bind(this),
//     dragDrop: handleDragDrop.bind(this),
//     dragMotion: handleDragMotion.bind(this),
// });

function makeSortable() {
    dragMonitor = DnD.addDragMonitor({
        dragBegin: handleDragBegin.bind(this),
        dragDrop: handleDragDrop.bind(this),
        dragMotion: handleDragMotion.bind(this),
    });

}


function handleDragBegin(event) {
    // const targetCell = event.targetActor.get_parent().get_parent();
    const targetCell =getDraggableActor(event.targetActor);
    log('res:',targetCell.constructor.name)
    Log.properties(targetCell);
    const row = targetCell.get_parent();
    const c = row.get_children().indexOf(targetCell);
    this.initialIndex = c;
    dropPlaceholder.unparent();
    const [width, height] = targetCell.get_size();
    dropPlaceholder.width = width;
    dropPlaceholder.height = height;
    row.insert_child_at_index(dropPlaceholder, c);

}

function getDraggableActor(actor) {
    if (actor.draggable) {
        return actor;
    }
    return getDraggableActor(actor.get_parent());
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
    // try {
    //     log(event.targetActor.constructor.name);
    // } catch {}
    const targetCell = getDraggableActor(event.targetActor);
    if (targetCell instanceof Cell ) {
        if (lastCell === targetCell)
            return 2;
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
    return 2;
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
        time:.15,
        transition: 'easeOutQuad',
    })
    dropPlaceholder.unparent();
    lastCell = null;
    return 2;
}