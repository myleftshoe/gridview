const { GObject, St } = imports.gi;
const Main = imports.ui.main;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { UI } = Extension.imports.ui;
const { Row } = Extension.imports.row;
const { Cell } = Extension.imports.cell;
const { Log } = Extension.imports.utils.logger;
const { makeSortable, unmakeSortable } = Extension.imports.sortable;
const { makeZoomable, unmakeZoomable } = Extension.imports.zoomable;
const { makePannable, unmakePannable } = Extension.imports.pannable;

const Display = global.display;
const Stage = global.stage;

const style_class = 'gridview';

var GridView = GObject.registerClass(
    {
        Signals: {
            'cell-added': {
                param_types: [GObject.TYPE_OBJECT]
            }
        }
    },
    class GridView extends St.BoxLayout {
        _init() {
            super._init({ style_class, vertical: true, reactive: true });
            // Make this respond to events reliably. trackChrome stops underlying
            // windows stealing pointer events.
            Main.layoutManager.trackChrome(this);
            makeSortable(this);
            makeZoomable(this);
            makePannable(this);
            this.populate();
        }
        populate() {
            UI.workspaces.forEach((workspace) => {
                const windows = workspace.list_windows();
                if (!windows.length) return;
                const row = new Row();
                windows.forEach(metaWindow => {
                    const cell = new Cell(metaWindow);
                    row.add_child(cell);
                    this.emit('cell-added', cell);
                });
                this.add_child(row);
            });
        }
        destroy() {
            unmakeSortable(this);
            unmakeZoomable(this);
            unmakePannable(this);
            Main.layoutManager.untrackChrome(this);
            this.destroy_all_children();
        }
    }
);


