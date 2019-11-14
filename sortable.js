const Tweener = imports.ui.tweener;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Cell } = Extension.imports.cell;
const { Log } = Extension.imports.utils.logger;

function handleDragBegin(event) {
    // const targetCell = event.targetActor.get_parent().get_parent();
    const targetCell =getDraggableActor(event.targetActor);
    log('res:',targetCell.constructor.name)
    Log.properties(targetCell);
    const row = targetCell.get_parent();
    const c = row.get_children().indexOf(targetCell);
    this.initialIndex = c;
    this.dropPlaceholder.unparent();
    const [width, height] = targetCell.get_size();
    this.dropPlaceholder.width = width;
    this.dropPlaceholder.height = height;
    row.insert_child_at_index(this.dropPlaceholder, c);

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
        if (this.lastCell === targetCell)
            return 2;
        this.lastCell = targetCell;
        const dragActor = event.dragActor;
        const row = targetCell.get_parent();
        const cell = row.get_children().indexOf(targetCell);
        this.dropPlaceholder.unparent();
        const [width, height] = dragActor.get_size();
        this.dropPlaceholder.width = width;
        this.dropPlaceholder.height = height;
        row.insert_child_at_index(this.dropPlaceholder, cell);
    }
    else {
        this.lastCell = null;
    }
    return 2;
}

function handleDragDrop(event) {
    const [x1, y1] = event.dropActor.get_transformed_position();
    const [x0, y0] = this.dropPlaceholder.get_transformed_position();
    const tx = x1 - x0 - 10;
    const ty = y1 - y0 - 10;
    event.dropActor.set_easing_duration(300);
    const row = this.dropPlaceholder.get_parent(); 
    event.dropActor.unparent();
    event.dropActor.translation_x = tx;
    event.dropActor.translation_y = ty;
    row.replace_child(this.dropPlaceholder, event.dropActor);
    Tweener.addTween(event.dropActor, {
        translation_x: 0,
        translation_y: 0,
        time:.15,
        transition: 'easeOutQuad',
    })
    this.dropPlaceholder.unparent();
    this.lastCell = null;
    return 2;
}