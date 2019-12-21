const { Clutter, GObject, Meta, St } = imports.gi;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Background = imports.ui.background;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { SignalManager, SignalGroup } = Extension.imports.signals;
const { createChrome } = Extension.imports.chrome;
const { GridView } = Extension.imports.gridView;
const { Scrollable } = Extension.imports.scrollable;
const { Cell } = Extension.imports.cell;
const { UI } = Extension.imports.ui;
const { panelBox } = Extension.imports.panelBox;
const WindowUtils = Extension.imports.windows;

const { Log } = Extension.imports.utils.logger;
const { showBoxes, hideBoxes } = Extension.imports.debug;


const stage = {
    get width() { return global.stage.get_width() },
    get height() { return global.stage.get_height() },
}

const content = {
    margin: 20,
    get height() { return stage.height - this.margin * 2 },
    // get scale() { return this.height / stage.height },
}


let container;
let gridView;
let scrollable;
let modal = false;
let signals = new SignalManager();


function start() {
    modal = false;
    signals.disconnectAll();
    panelBox.hide();

    prepareMetaWindows();
    connectDisplaySignals();

    const chrome = addChrome();

    container = new Container();
    gridView = new GridView();
    scrollable = new Scrollable(gridView, { height: 5, width: stage.width });
    container.add_child(scrollable);
    chrome.bottom.add_child(scrollable.scrollbar);

    gridView.connect('focused', (_, cell) => {
        log('focused', cell.id);
        activateCell(cell);
    });

    initScrollHandler(scrollable);

    show();
    scrollable.update();

}

function stop() {
    // TODO
    hide();
}

function show() {
    if (container.isOnStage) return;
    gridView.populate();
    container.show();
    // scrollable.scrollToActor(gridView.focusedCell);
    Main.activateWindow(gridView.focusedCell.metaWindow);
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
                height: stage.height,
                min_width: stage.width,
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

function prepareMetaWindows() {
    UI.windows.forEach(metaWindow => {
        metaWindow.unmaximize(Meta.MaximizeFlags.BOTH);
        const { x, width } = WindowUtils.getGeometry(metaWindow);
        metaWindow.move_resize_frame(true, x, content.margin, width, content.height);
        metaWindow.get_compositor_private().hide();
    });
}


function pushModal() {
    if (!modal) {
        Main.pushModal(container);
        modal = true;
        global.display.set_cursor(Meta.Cursor.BUSY);
    }
}

function popModal() {
    if (modal) {
        Main.popModal(container);
        modal = false;
        global.display.set_cursor(Meta.Cursor.DEFAULT);
    }
}

const Animator = GObject.registerClass(
    {
        Signals: {
            'animation-complete': {
                param_types: []
            }
        }
    },
    class Animator extends GObject.Object {
        _init(cell) {
            super._init();
            gridView.activeCell.metaWindowActor.hide();
            pushModal();
            const signalGroup = new SignalGroup();
            signalGroup.add(scrollable, 'transitions-completed');
            signalGroup.add(gridView, 'transitions-completed');
            signalGroup.connect('all-signals-complete', () => {
                this.emit('animation-complete');
            });
        }
        animateToCell(cell) {
            scrollable.scrollToActor(cell);
            // gridView.set_scale(.4,.4)
            const [scaleX, scaleY] = gridView.get_scale();
            if (scaleX !== 1 || scaleY !== 1) {
                Tweener.addTween(gridView, {
                    scale_x: 1,
                    scale_y: 1,
                    time: .5,
                    onComplete: () => gridView.emit('transitions-completed'),
                });
            }
            else {
                gridView.emit('transitions-completed');
            }
        }
        zoom(direction = 'in') {
            const scale = direction === 'in' ? 1 : 0.5;
            const pivotX = (gridView.firstVisibleCell.get_x() + gridView.firstVisibleCell.get_width() / 2) / container.get_width();
            log('>>>>>>>>>>>>>>>>>>>>>>>>>>', pivotX, gridView.get_width(), container.get_width())
            gridView.set_easing_duration(250);
            gridView.set_pivot_point(pivotX, .5);
            gridView.set_scale(scale, scale);
            scrollable.emit('transitions-completed');
        }
    }
);


function addChrome() {
    const chrome = createChrome({ left: 1, right: 1, bottom: 5, top: 1 });
    chrome.left.onClick = function () {
        const focusedCell = gridView.focusedCell;
        const i = gridView.cells.indexOf(focusedCell);
        log('hotLeft clicked', i, focusedCell.id);
        const prevCell = gridView.cells[i - 1] || focusedCell;
        Main.activateWindow(prevCell.metaWindow);
    }
    chrome.right.onClick = function () {
        const focusedCell = gridView.focusedCell;
        const i = gridView.cells.indexOf(focusedCell);
        log('hotRight clicked', i, focusedCell.id);
        const nextCell = gridView.cells[i + 1] || focusedCell;
        Main.activateWindow(nextCell.metaWindow);
    }
    chrome.top.onClick = popModal;
    return chrome;
}


function initScrollHandler(scrollable) {
    scrollable.connect('scroll-begin', () => {
        const animator = new Animator();
    });

    scrollable.scrollbar.connect('scroll-event', (actor, event) => {
        const scrollDirection = event.get_scroll_direction();
        log(scrollDirection)
        if (scrollDirection > 1) return;
        // if (event.has_shift_modifier())
        if (event.get_state() & (
            Clutter.ModifierType.BUTTON1_MASK |
            Clutter.ModifierType.SHIFT_MASK
        )) {
            const animator = new Animator();
            const direction = scrollDirection === Clutter.ScrollDirection.DOWN ? 'in' : 'out';
            animator.zoom(direction);
            return;
        };

        if (scrollDirection === Clutter.ScrollDirection.DOWN)
            scrollable.scrollToActor(gridView.previousCell)
        if (scrollDirection === Clutter.ScrollDirection.UP)
            scrollable.scrollToActor(gridView.nextCell)
    });
}

function connectDisplaySignals() {
    // global.display.connect('in-fullscreen-changed', (a, b, c) => {
    //     log('-----------------------------------------fullscreen', a, b, c);
    // });
    // Ensure transient windows: popups, dialogs, etc are displayed on top
    // !!!This includes broswer dropdown menus and comboboxes!!!
    global.display.connect('notify::focus-window', (display, paramSpec) => {
        const metaWindow = global.display.focus_window;
        if (!metaWindow) return;
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

}

function activateCell(cell) {
    const animator = new Animator();
    animator.animateToCell(cell);

    signals.connectOnce(animator, 'animation-complete', () => {
        cell.showMetaWindow();
        popModal();
        log('activateCell complete ===============================================')
    });
}
