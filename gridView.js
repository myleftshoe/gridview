const { GObject, Meta, St, Shell } = imports.gi;
const Tweener = imports.ui.tweener;
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
var ANIMATION_TIME = 0.25;

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
            const {width, height} = Display.get_monitor_geometry(Display.get_primary_monitor());
            super._init({
                style_class,
                opacity:0,
                vertical: true,
                reactive: true,
                width,
                height,
            });
            makeSortable(this);
            makeZoomable(this);
            makePannable(this);
            this.populate();
            this.show();
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
        show() {
            // Make this respond to events reliably. trackChrome stops underlying
            // windows stealing pointer events.
            Main.layoutManager.trackChrome(this);
            Main.pushModal(this, { actionMode: Shell.ActionMode.OVERVIEW })
            Tweener.addTween(this, {
                opacity: 255,
                time: ANIMATION_TIME,
                transition: 'easeOutQuad'
            });
        }
        hide() {
            this.get_children().forEach((row, rowIndex) => {
                // log(`--- row: ${rowIndex+ 1}`);
                [...row.get_children()].reverse().forEach(cell => {
                    // log(cell.id);
                    cell.metaWindow.change_workspace(row.workspace);
                    cell.metaWindow.focus(global.get_current_time());
                });
            });
            Main.layoutManager.untrackChrome(this);
            Main.popModal(this);
        }
        destroy() {
            this.hide();
            unmakeSortable(this);
            unmakeZoomable(this);
            unmakePannable(this);
            this.destroy_all_children();
        }
    }
);


