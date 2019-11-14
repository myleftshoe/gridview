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

const style_class = 'fluidshell';

var FluidShell = GObject.registerClass({},

    class FluidShell extends St.BoxLayout {
        _init() {
            super._init({ style_class, vertical: true, reactive: true });
            // Make this respond to events reliably. trackChrome stops underlying
            // windows stealing pointer events.
            Main.layoutManager.trackChrome(this);
            makeSortable();
            makeZoomable(this);
            makePannable(this);
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
            unmakeZoomable(this);
            unmakePannable(this);
            this.destroy_all_children();
        }
    }
);


