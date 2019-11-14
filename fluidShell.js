const { GObject, Clutter, Meta, St } = imports.gi;
const Main = imports.ui.main;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DnD = Extension.imports.dnd;
const { UI } = Extension.imports.ui;
const { Row } = Extension.imports.row;
const { Cell } = Extension.imports.cell;
const { Log } = Extension.imports.utils.logger;
const { makeSortable, unmakeSortable } = Extension.imports.sortable;
const { makeZoomable } = Extension.imports.zoomable;

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
            makeSortable();
            makeZoomable(this);
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
            unmakeSortable();
            this.cellSignals.forEach(([cell, sid]) => {
                cell.disconnect(sid);
            });
            this.destroy_all_children();
        }
    }
);


