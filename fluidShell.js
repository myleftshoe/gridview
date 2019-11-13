const { GObject, Clutter, Meta, St } = imports.gi;
const Main = imports.ui.main;
const DnD = imports.ui.dnd;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { UI } = Extension.imports.ui;
const { Row } = Extension.imports.row;
const { Cell } = Extension.imports.cell;
const { Log } = Extension.imports.utils.logger;

const Display = global.display;
const Stage = global.stage;

const style_class = 'fluidshell';

var FluidShell = GObject.registerClass({},

    class FuildShell extends St.BoxLayout {

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
            DnD.addDragMonitor({
                dragDrop: (event) => {
                    const row = this.dropPlaceholder.get_parent(); 
                    const i = row.get_children().indexOf(this.dropPlaceholder);
                    log('<<<<<<<<<<<',i, event.dropActor.constructor.name);
                    this.dropPlaceholder.unparent();
                    // row.remove_child(event.dropActor)
                    event.dropActor.unparent();
                    row.insert_child_at_index(event.dropActor, i);
                    try {
                        log('ttttttttttt',event.clutterEvent.get_source())
                    } catch {}
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
                    const { x,y } = event;
                    const actor = Stage.get_actor_at_pos(Clutter.PickMode.ALL, x, y);
                    const cell = actor.get_parent().get_parent(); 
                    const targetCell = event.targetActor.get_parent().get_parent();
                    if (cell instanceof Cell && targetCell instanceof Cell ) {
                        log(targetCell.get_position())
                        const dragActor = event.dragActor;
                        // dragActor.set_easing_duration(0);
                        const row = cell.get_parent();
                        const c = row.get_children().indexOf(cell);
                        const d = row.get_children().indexOf(event.dragActor)
                        // if (c === d) return;
                        log('ggggggggggggggggggg',c,d);
                        // event.dragActor.unparent();
                        this.dropPlaceholder.unparent();
                        const [width, height] = dragActor.get_size();
                        // row.insert_child_at_index(dragActor,c);
                        this.dropPlaceholder.width = width;
                        this.dropPlaceholder.height = height;
                        row.insert_child_at_index(this.dropPlaceholder, c);
                        log(event.dragActor.constructor.name);
                        if (actor instanceof FluidShell) {
                        }                        
                    }
                    return 2;
            }});
            // Log.properties(this.draggable);
            this.signals = [];
            this.signals.push(Display.connect('in-fullscreen-changed', () => this.refresh()));
            this.signals.push(Display.connect('notify::focus-window', () => this.refresh()));
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

            this.refresh();
        }
        refresh() {
            log('refreshing...............................................')
            this.destroy_all_children();
            UI.workspaces.forEach((workspace, r) => {
                const windows = workspace.list_windows();
                if (!windows.length) return;
                const row = new Row({id:r});
                windows.forEach((metaWindow,c) => {
                    const cell = new Cell(metaWindow);
                    row.add_child(cell);
                });
                this.add_child(row);
            });
        }

        destroy() {
            this.signals.forEach(signal => Display.disconnect(signal));
            this.remove_all_children();
        }
    }
);


