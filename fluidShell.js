const { GObject, Clutter, Meta, St } = imports.gi;
const Main = imports.ui.main;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DnD = Extension.imports.dnd;
const { UI } = Extension.imports.ui;
const { Row } = Extension.imports.row;
const { Cell } = Extension.imports.cell;
const { Log } = Extension.imports.utils.logger;
const { handleDragBegin, handleDragDrop, handleDragMotion } = Extension.imports.sortable;

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
            this.dropPlaceholder = new St.Widget();
            this.lastCell = null;
            this.dragMonitor = DnD.addDragMonitor({
                dragBegin: handleDragBegin.bind(this),
                dragDrop: handleDragDrop.bind(this),
                dragMotion: handleDragMotion.bind(this),
            });
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
            UI.workspaces.forEach((workspace) => {
                const windows = workspace.list_windows();
                if (!windows.length) return;
                const row = new Row();
                windows.forEach(metaWindow => row.add_child(new Cell(metaWindow)));
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


