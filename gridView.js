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
            },
            'focused': {
                param_types: [GObject.TYPE_OBJECT]
            }            
        }
    },
    class GridView extends St.BoxLayout {
        _init() {
            super._init({
                style_class,
                opacity: 255,
                reactive: true,
                // vertical: true,
                x_expand: true,
                y: 5,
            });
            makeSortable(this);
            makeZoomable(this);
            this.boxes = [];
            this.cells = [];

        }
        getCellForMetaWindow(metaWindow) {
            return this.cells.find(cell => cell.metaWindow === metaWindow);
        }
        populate() {
            log('populate')
            this.remove_all_children();
            this.cells = [];
            // UI.workspaces.forEach((workspace) => {this.get_parent().width
                // const windows = workspace.list_windows();
                // const windows = UI.getWorkspaceWindows(workspace);
                // const windows = global.display.get_tab_list(Meta.TabList.NORMAL, workspace);
                const windows = UI.windows;
                if (!windows.length) return;
                // const row = new Row(workspace);
                windows.forEach(metaWindow => {
                    const cell = new Cell(metaWindow);
                    cell.connect('button-release-event', (actor) => {
                        Main.activateWindow(actor.metaWindow);
                    });
                    cell.metaWindow.connect('focus', () => {
                        log('focus')
                        this.emit('focused', cell);
                    })
                    cell.metaWindow.connect('unmanaged', () => {
                        log('*****************************************************************');
                        log('UNMANAGED window', cell.id);
                    })
                    this.cells.push(cell);
                    // row.add_child(cell);
                    cell.metaWindowActor.hide();
                    this.add_child(cell);
                    this.emit('cell-added', cell);
                });
                // this.add_child(row);
            // });
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


