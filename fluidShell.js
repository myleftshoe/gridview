const { GObject, Clutter, Meta, St } = imports.gi;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DnD = Extension.imports.dnd;
const { UI } = Extension.imports.ui;
const { Row } = Extension.imports.row;
const { Cell } = Extension.imports.cell;
const { Log } = Extension.imports.utils.logger;

const Display = global.display;
const Stage = global.stage;

const style_class = 'fluidshell';

var dropPlaceholder = new St.Widget();

var FluidShell = GObject.registerClass({},

    class FuildShell extends St.BoxLayout {
        static dropPlaceholder() {
            return dropPlaceholder;
        };
        _init() {
            super._init({ style_class, vertical: true, reactive: true });
            // Make this respond to events reliably. trackChrome stops underlying
            // windows stealing pointer events.
            Main.layoutManager.trackChrome(this);
            // drag this only if drag not started on child
            this.draggable = DnD.makeDraggable(this, { manualMode: true });
            Stage.connect('button-press-event', (source, event) => {
                const coords = event.get_coords();
                const sequence = event.get_event_sequence();
                const actor = Stage.get_actor_at_pos(Clutter.PickMode.ALL, ...coords);
                if (actor instanceof FluidShell) {
                    this.draggable.startDrag(
                        ...coords,
                        global.get_current_time(),
                        sequence
                    );
                }
            });
            this.draggable.connect('drag-begin', () => {
                log('---------------------------------------')
                log('---------------------------------------')
                log('---------------------------------------')
                log('---------------------------------------')
            });
            this.dropPlaceholder = new St.Widget();
            this.lastCell = null;
            this.dragMonitor = DnD.addDragMonitor({
                dragDrop: (event) => {
                    // try {
                    //     Log.properties(event.targetActor);
                    // } catch {}
                    // log(event.dropActor.get_position())
                    const [x1, y1] = event.dropActor.get_transformed_position();
                    const [x0, y0] = this.dropPlaceholder.get_transformed_position();
                    const tx = x1 - x0 - 10;
                    const ty = y1 - y0 - 10;
                    log(tx, ty);
                    event.dropActor.set_easing_duration(300);
                    const row = this.dropPlaceholder.get_parent(); 
                    const i = row.get_children().indexOf(this.dropPlaceholder);
                    log('<<<<<<<<<<<',i, event.dropActor.constructor.name);
                    // this.dropPlaceholder.unparent();
                    // row.remove_child(event.dropActor)
                    event.dropActor.unparent();
                    event.dropActor.translation_x = tx;
                    event.dropActor.translation_y = ty;
                    row.insert_child_at_index(event.dropActor, i);
                    // event.dropActor.translation_x = 0;
                    Tweener.addTween(event.dropActor, {
                        translation_x: 0,
                        translation_y: 0,
                        time:.15,
                        transition: 'easeOutQuad',
                    })
                    this.dropPlaceholder.unparent();
                    try {
                        log('ttttttttttt',event.clutterEvent.get_source())
                    } catch {}
                    this.lastCell = null;
                    return 2;
                },
                dragMotion: event => {
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
                    const targetCell = event.targetActor.get_parent().get_parent();
                    if (targetCell instanceof Cell ) {
                        if (this.lastCell === targetCell)
                            return 2;
                        this.lastCell = targetCell;
                        log(targetCell.id, targetCell.get_position())
                        const dragActor = event.dragActor;
                        const row = targetCell.get_parent();
                        const cell = row.get_children().indexOf(targetCell);
                        this.dropPlaceholder.unparent();
                        const [width, height] = dragActor.get_size();
                        this.dropPlaceholder.width = width;
                        this.dropPlaceholder.height = height;
                        row.insert_child_at_index(this.dropPlaceholder, cell);
                        log(event.dragActor.constructor.name);
                    }
                    else {
                        this.lastCell = null;
                    }
                    return 2;
            }});
            // Log.properties(this.draggable);
            this.connect('scroll-event', (source, event) => {
                const direction = event.get_scroll_direction();
                if (direction > 1) return;
                let amount = 0.5;
                const [scaleX, scaleY] = source.get_scale();
                if (direction === Clutter.ScrollDirection.DOWN) {
                    if (scaleX < 1) return;
                    amount = -amount;
                }
                const [sx, sy] = source.get_transformed_position();
                const [sw, sh] = source.get_transformed_size();
                const [x, y] = event.get_coords();
                log([x, y, sx, sy, sw, sh]);
                // source.set_pivot_point((x - sx) / sw, (y - sy) / sh);
                // source.set_scale(scaleX + amount, scaleY + amount);
                source.set_scale_with_gravity(scaleX + amount, scaleY + amount, Clutter.Gravity.CENTER);
                // this.set_size(...this.get_size());
            });
            this.cellSignals = [];

            this.refresh();
        }
        refresh() {
            log('refreshing...............................................')
            // this.destroy_all_children();
            UI.workspaces.forEach((workspace, r) => {
                const windows = workspace.list_windows();
                if (!windows.length) return;
                const row = new Row({id:r});
                windows.forEach((metaWindow,c) => {
                    const cell = new Cell(metaWindow);
                    this.cellSignals.push([cell, cell.connect('drag-begin', (actor) => {
                        log('yyyyyyyyyyyyyyyyyyy', actor)
                        const row = cell.get_parent();
                        const c = row.get_children().indexOf(cell);
                        this.initialIndex = c;
                        this.dropPlaceholder.unparent();
                        const [width, height] = cell.get_size();
                        this.dropPlaceholder.width = width;
                        this.dropPlaceholder.height = height;
                        row.insert_child_at_index(this.dropPlaceholder, c);
                    })]);
                    // cell.connect('drag-cancelled', (actor) => {
                    //     log('drag-calce');
                    //     const row = cell.get_parent();
                    //     cell.unparent();
                    //     row.insert_child_at_index(cell, this.initialIndex);
                    // });
                    row.add_child(cell);
                });
                this.add_child(row);
            });
        }


        destroy() {
            // DnD.removeDragMonitor(this.dragMonitor);
            DnD.dragMonitors = [];
            this.cellSignals.forEach(([cell, sid]) => {
                cell.disconnect(sid);
            });
            this.destroy_all_children();
        }
    }
);


