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
            this.focusedCell = null;
            makeSortable(this);
            // makeZoomable(this);
            // makePannable(this);
            this.populate();
            // this.show();

        }
        populate() {
            this.remove_all_children();
            UI.workspaces.forEach((workspace) => {
                // const windows = workspace.list_windows();
                // const windows = UI.getWorkspaceWindows(workspace);
                const windows = global.display.get_tab_list(Meta.TabList.NORMAL, workspace);
                if (!windows.length) return;
                const row = new Row(workspace);
                windows.forEach(metaWindow => {
                    const cell = new Cell(metaWindow);
                    cell.connect('button-press-event', (actor) => {
                        if (this.focusedCell) {
                            this.focusedCell.metaWindowActor.hide();
                        }
                    });
                    cell.connect('button-release-event', (actor) => {
                        // const rect = Meta.rect(1,1,200,200);
                        const br = actor.metaWindow.get_buffer_rect();
                        const fr = actor.metaWindow.get_frame_rect(); 
                        log(actor.id);
                        let [x,y] = actor.get_transformed_position();
                        // let [x,y] = actor.get_transformed_position();
                        // arr = actor.get_abs_allocation_vertices();
                        // let arr = actor.get_allocation_box();
                        // log( arr.x1, arr.y1)
                        log(br.x, fr.x, x);
                        log(br.y, fr.y, y);
                        log(br.width, fr.width, actor.width);
                        log(br.height, fr.height, actor.height);
                        let [x1, y1] = actor.get_position();
                        actor.metaWindow.move_frame(true, x + br.x - fr.x, y)
                        actor.metaWindowActor.show();
                        this.focusedCell = actor;
                    });
                    log(cell.id)
                    row.add_child(cell);
                    cell.metaWindowActor.hide();
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


