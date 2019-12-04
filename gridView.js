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
                opacity:255,
                reactive: true,
                vertical: true,
                x_expand: true,
            });
            makeSortable(this);
            makeZoomable(this);
            this.boxes = [];
            this.cells = [];

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
            log('populate')
            this.remove_all_children();
            this.cells = [];
            UI.workspaces.forEach((workspace) => {
                // const windows = workspace.list_windows();
                // const windows = UI.getWorkspaceWindows(workspace);
                const windows = global.display.get_tab_list(Meta.TabList.NORMAL, workspace);
                if (!windows.length) return;
                const row = new Row(workspace);
                windows.forEach(metaWindow => {
                    metaWindow.connect('focus', () => {
                        const cell = this.cells.find(cell => cell.metaWindow === metaWindow);
                        this.emit('focused', cell);
                    })
                    const cell = new Cell(metaWindow);
                    cell.connect('button-release-event', (actor) => {
                        Main.activateWindow(actor.metaWindow);
                    });
                    this.cells.push(cell);
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


