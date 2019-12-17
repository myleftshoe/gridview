const { Atk, Clutter, GLib, GObject, Meta, Shell, St } = imports.gi;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Signals = imports.signals;
const Background = imports.ui.background;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { HotTop, HotLeft, HotBottom, HotRight } = Extension.imports.hotEdge;
const { GridView } = Extension.imports.gridView;
const { Scrollable } = Extension.imports.scrollable;
const { Cell } = Extension.imports.cell;
const { Titlebar } = Extension.imports.titlebar;
const { addChrome } = Extension.imports.addChrome;
const { Log } = Extension.imports.utils.logger;
const { showBoxes, hideBoxes } = Extension.imports.debug;

const CHROME_SIZE = 32;


function init() {
    log(`***************************************************************`);
    log(`${Extension.metadata.uuid} init()`);
    Signals.addSignalMethods(Extension);
}

function enable() {
    log(`${Extension.metadata.uuid} enable()`);
    // stage actors do not report correct sizes before startup-complete
    if (Main.layoutManager._startingUp)
        Main.layoutManager.connect('startup-complete', prepare);
    else
        prepare();
}

function disable() {
    log(`${Extension.metadata.uuid} disable()`);
    hide();
}

let container;
let gridView;
let scrollable;

function hidePanelBox() {
    const panelBox = Main.layoutManager.panelBox;
    panelBox.translation_y = -panelBox.get_height();
    Main.overview.connect('showing', () => {
        Main.uiGroup.remove_child(scrollable.scrollbar);
    });
    Main.overview.connect('shown', () => {
        // Tweener.addTween(panelBox, {
        //     translation_y: 0,
        //     time: .25,
        // });
    });
    Main.overview.connect('hidden', () => {
        log('hiding')
        // Main.overview._overview.remove_all_transitions();
    });
    Main.overview.connect('hidden', () => {
        // Tweener.addTween(panelBox, {
        //     translation_y: -27,
        //     time: .25,
        //     // onComplete: () => container.show()
        // })
        Main.uiGroup.add_child(scrollable.scrollbar);
    });
}


function prepare() {
    hidePanelBox();
    addChrome(CHROME_SIZE);
    global.display.connect('in-fullscreen-changed', (a,b,c) => {
        log('-----------------------------------------fullscreen',a,b,c);
    });
    // Ensure transient windows: popups, dialogs, etc are displayed on top
    // !!!This includes broswer dropdown menus and comboboxes!!!
    global.display.connect('notify::focus-window', (display, paramSpec) => {
        const metaWindow = global.display.focus_window;
        log('focus-window', metaWindow.title);
        if (metaWindow.is_client_decorated()) {
            metaWindow.get_compositor_private().raise_top();
        }
    });
    global.display.connect('window-created', (display, metaWindow) => {
        log('ft', metaWindow.title, metaWindow.get_frame_type())
        if (metaWindow.is_client_decorated()) return;
        if (metaWindow.get_window_type() < 2) {
            const cell = gridView.addCell(metaWindow);
            return;
        }
        metaWindow.get_compositor_private().raise_top();
    });
    //
    global.display.connect('grab-op-begin', (display, screen, window, op) => {
        log('grab-op-begin', op)
        // gridView.setEasingOff();
        if (!window) return;
        log('grab-op-begin', op, window.title);
        if (window.is_client_decorated()) return;
        if (op === Meta.GrabOp.WINDOW_BASE) {
            log('grab-op-window-base', window.title)
            display.end_grab_op(display);
            const cell = gridView.getCellForMetaWindow(window);
            cell.save_easing_state();
            cell.set_easing_duration(0);
            cell.set_opacity(255);
            cell.restore_easing_state();
            // cell.metaWindowActor.lower_bottom();
            const coords = global.get_pointer();
            cell.draggable.startDrag(null, coords);
            return;
        }
        if (op === Meta.GrabOp.RESIZING_E) {
            gridView.cells.forEach(cell => {
                cell.set_easing_duration(0);
            });
        }
        else {
            display.end_grab_op(display);
        }
    });
    global.display.connect('grab-op-end', (display, screen, window, op) => {
        gridView.cells.forEach(cell => {
            cell.set_easing_duration(250);
        });
    });

    const hotLeft = new HotLeft({
        width:1,
        onClick: () => {
            const focusedCell = gridView.focusedCell;
            const i = gridView.cells.indexOf(focusedCell);
            log('hotLeft clicked', i, focusedCell.id);
            prevCell = gridView.cells[i - 1] || focusedCell;
            Main.activateWindow(prevCell.metaWindow);
        }, 
    });
    const hotRight = new HotRight({
        width:1,
        onClick: () => {
            const focusedCell = gridView.focusedCell;
            const i = gridView.cells.indexOf(focusedCell);
            log('hotRight clicked', i, focusedCell.id);
            nextCell = gridView.cells[i + 1] || focusedCell;
            Main.activateWindow(nextCell.metaWindow);
        }
    });
    const hotBottom = new HotBottom({ width: 5 });

    container = new Container();
    gridView = new GridView();
    gridView.y = CHROME_SIZE;
    scrollable = new Scrollable(gridView, { height: 5, width: Main.uiGroup.get_width() });
    container.add_child(scrollable);
    hotBottom.add_child(scrollable.scrollbar);

    gridView.connect('focused', (gridView, cell) => {
        log('focused', cell.id);
        if (cell !== gridView.firstVisibleCell)
            scrollable.scrollToActor(cell);
    });
    scrollable.connect('scroll-begin', () => {
        // hideBoxes();
        log('scroll-begin');
        gridView.cells.forEach(cell => {
            cell.metaWindow.unmake_fullscreen();
            cell.metaWindowActor.hide();
        });
    });
    scrollable.connect('scroll-end', () => {
        log('scroll-end');
        const visibleCell = gridView.firstVisibleCell;
        if (visibleCell !== gridView.activeCell) {
            log('**** activating')
            Main.activateWindow(visibleCell.metaWindow);
            gridView.activeCell = visibleCell;
        }
        log('******* same', visibleCell.id)
        visibleCell.showMetaWindow();
        // showBoxes(visibleCell.metaWindow);
    })
    scrollable.scrollbar.connect('scroll-event', (actor, event) => {
        const scrollDirection = event.get_scroll_direction();
        const {DOWN, UP} = Clutter.ScrollDirection;
        if (scrollDirection === DOWN) 
            scrollable.scrollToActor(gridView.previousCell)
        if (scrollDirection === UP)
            scrollable.scrollToActor(gridView.nextCell)
    });

    show();
    scrollable.update();
}

function show() {
    if (container.isOnStage) return;
    gridView.populate();
    container.show();
    scrollable.scrollToActor(gridView.focusedCell);
}

function hide() {
    if (!container.isOnStage) return;
    gridView.cells.forEach(cell => {
        cell.metaWindow.show();
    });
    Tweener.addTween(gridView, {
        scale_x: 1,
        scale_y: 1,
        time: .25,
        transition: 'easeOutQuad',
        onComplete: () => container.hide()
    });
}

const Container = GObject.registerClass({},
    class Container extends St.Widget {
        _init() {
            super._init({ 
                style_class: 'container',
                reactive: true,
                // y: CHROME_SIZE
            });
            // const backgroundManager = new Background.BackgroundManager({
            //     monitorIndex: Main.layoutManager.primaryIndex,
            //     container: this,
            //     vignette: false, // darken if true
            // });
        }
        get isOnStage() {
            return global.window_group.contains(this);
        }
        show() {
            global.window_group.add_child(this);
        }
        hide() {
            global.window_group.remove_child(this);
        }
        destroy() {
            this.disconnect(this._hideSignal);
        }
    }
);
