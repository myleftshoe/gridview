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
            'clicked': {
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
            makeZoomable(this);
            // makePannable(this);
            this.populate();
            // this.show();
            this.boxes = [];

        }
        showBoxes(metaWindow) {
            let frame = metaWindow.get_frame_rect()
            let inputFrame = metaWindow.get_buffer_rect()
            let actor = metaWindow.get_compositor_private();

            this.boxes.forEach(box => {
                global.stage.remove_child(box);
            });            
            this.boxes = [];

            const makeFrameBox = function({x, y, width, height}, color) {
                let frameBox = new St.Widget();
                frameBox.set_position(x, y)
                frameBox.set_size(width, height)
                frameBox.set_style("border: 2px" + color + " solid");
                return frameBox;
            }
        
        
            this.boxes.push(makeFrameBox(frame, "red"));
            this.boxes.push(makeFrameBox(inputFrame, "blue"));
        
            if(inputFrame.x !== actor.x || inputFrame.y !== actor.y
               || inputFrame.width !== actor.width || inputFrame.height !== actor.height) {
                this.boxes.push(makeFrameBox(actor, "yellow"));
            }
        
            this.boxes.forEach(box => global.stage.add_child(box));            
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
                            this.focusedCell.set_reactive(true);
                        }
                    });
                    cell.connect('button-release-event', (actor) => {
                        this.emit('clicked', actor);
                        actor.set_reactive(false);
                        this.focusedCell = actor;
                    });
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


