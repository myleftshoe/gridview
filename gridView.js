const { Clutter, GObject, Meta, St, Shell } = imports.gi;
const Main = imports.ui.main;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { SignalManager } = Extension.imports.signals;
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
            },
        }
    },
    class GridView extends St.BoxLayout {
        _init() {
            super._init({
                style_class,
                opacity: 255,
                reactive: true,
                // vertical: true,
                height: global.stage.get_height(),
                min_width: global.stage.get_width(),
                x_expand: true,
                // y: 5,
            });
            this.signals = new SignalManager();
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
            return this.cells.find(cell => cell.isPartiallyVisible)
        }
        get firstVisibleCell() {
            return this.getFirstVisibleCell();
        }
        getPreviousCell(cell = this.activeCell) {
            const i = this.cells.indexOf(cell);
            return this.cells[i - 1];
        }
        get previousCell() {
            return this.getPreviousCell();
        }
        getNextCell(cell = this.activeCell) {
            const i = this.cells.indexOf(cell);
            return this.cells[i + 1];
        }
        get nextCell() {
            return this.getNextCell();
        }
        focusNextCell () {
            Main.activateWindow(this.nextCell.metaWindow);
        }
        focusPreviousCell () {
            Main.activateWindow(this.previousCell.metaWindow);
        }
    
        addCell(metaWindow) {
            const cell = new Cell(metaWindow);
            this.signals.connect(cell, 'button-release-event', () => {
                if (cell.metaWindow.has_focus())
                    this.emit('focused', cell);
                else
                    Main.activateWindow(cell.metaWindow);
            });
            this.signals.connect(cell.metaWindow, 'focus', () => {
                this.activeCell = cell;
                this.emit('focused', cell);
            });
            this.signals.connect(cell.metaWindow, 'unmanaged', () => {
                log('*****************************************************************');
                log('UNMANAGED window', cell.id);
            });
            this.signals.connect(cell.metaWindowActor, 'destroy', () => {
                log('*****************************************************************');
                log('DESTROYED window', cell.id);
                this.remove_child(cell);
            });
            this.insert_child_at_index(cell, 0);
            return cell;
        }
        populate() {
            this.remove_all_children();
            UI.windows.forEach(this.addCell.bind(this));
            if (this.focusedCell) {
                this.emit('focused', this.focusedCell);
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
            this.signals.disconnectAll();
            // this.hide();
            // unmakeSortable(this);
            // unmakeZoomable(this);
            // unmakePannable(this);
            // this.destroy_all_children();
        }
    }
);
