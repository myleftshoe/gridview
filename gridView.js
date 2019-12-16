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
                // y: 5,
            });
            this.activeCell = null;
            makeSortable(this);
            // makeZoomable(this);
            // makePannable(this);
        }
        get cells() {
            return this.get_children().filter(child => (child instanceof Cell));
        }
        getCellForMetaWindow(metaWindow) {
            return this.cells.find(cell => cell.metaWindow === metaWindow);
        }
        getFocusedCell() {
            return this.cells.find(cell => cell.metaWindow.has_focus());
        }
        get focusedCell() {
            return this.getFocusedCell();
        }
        getFirstVisibleCell() {
            return this.cells.find(cell => {
                const [x,y] = cell.get_transformed_position();
                // log('getFirstVisibleCell', x, cell.id, x >= 0);
                return (x >= -1);
            })
        }
        addCell(metaWindow) {
            const cell = new Cell(metaWindow);
            cell.connect('button-release-event', (actor) => {
                Main.activateWindow(actor.metaWindow);
            });
            cell.metaWindow.connect('focus', (a,b,c) => {
                // log('focus',a,b,c)
                this.activeCell = cell;
                this.emit('focused', cell);
            })
            cell.metaWindow.connect('unmanaged', () => {
                log('*****************************************************************');
                log('UNMANAGED window', cell.id);
            })
            cell.metaWindowActor.connect('destroy', () => {
                log('*****************************************************************');
                log('DESTROYED window', cell.id);
                this.remove_child(cell);
            })
            // row.add_child(cell);
            cell.metaWindowActor.hide();
            // this.add_child(cell);
            this.insert_child_at_index(cell,0);
            return cell;
        }
        populate() {
            log('populate')
            this.remove_all_children();
            // UI.workspaces.forEach((workspace) => {this.get_parent().width
                // const windows = workspace.list_windows();
                // const windows = UI.getWorkspaceWindows(workspace);
                // const windows = global.display.get_tab_list(Meta.TabList.NORMAL, workspace);
                // const row = new Row(workspace);
                UI.windows.forEach(this.addCell.bind(this));
                // this.add_child(row);
            // });
            if (this.cells.length) {
                this.activeCell = this.cells[0];
                Main.activateWindow(this.activeCell.metaWindow);
            }
        }
        setEasingOff() {
            this.cells.forEach(cell => {
                cell.save_easing_state();
                cell.set_easing_duration(0);
            });
        }
        setEasingOn() {
            this.cells.forEach(cell => {
                cell.restore_easing_state();
            });
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


