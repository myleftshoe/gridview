const { Clutter, GObject, Meta, St, Shell } = imports.gi;
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
            super._init({
                style_class,
                opacity:255,
                reactive: true,
                vertical: true,
                x_expand: true,
            });
            makeSortable(this);
            makeZoomable(this);
            makePannable(this);
            this.populate();
            // this.show();

        }
        populate() {
            UI.workspaces.forEach((workspace) => {
                // const windows = workspace.list_windows();
                // const windows = UI.getWorkspaceWindows(workspace);
                const windows = global.display.get_tab_list(Meta.TabList.NORMAL, workspace);
                if (!windows.length) return;
                const row = new Row(workspace);
                windows.forEach(metaWindow => {
                    const cell = new Cell(metaWindow);
                    row.add_child(cell);
                    this.emit('cell-added', cell);
                });
                this.add_child(row);
            });
        }
        // show() {
        //     Main.pushModal(this, { actionMode: Shell.ActionMode.OVERVIEW })
        // }
        hide() {
            this.get_children().forEach((row, rowIndex) => {
                const cells = row.get_children();
                cells.forEach(cell => {
                    let [x,y] = cell.get_position();
                    cell.metaWindow.move_frame(true,x + 13, 0);
                })
            });
            // Main.popModal(this);
        }
        destroy() {
            // this.hide();
            // unmakeSortable(this);
            // unmakeZoomable(this);
            // unmakePannable(this);
            // this.destroy_all_children();
        }
    }
);


