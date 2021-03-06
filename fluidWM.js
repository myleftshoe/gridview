const { Clutter, GObject, Meta, St } = imports.gi;
const Main = imports.ui.main;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { SignalManager, SignalGroup } = Extension.imports.signals;
const { createChrome } = Extension.imports.chrome;
const { Container } = Extension.imports.container;
const { GridView } = Extension.imports.gridView;
const { Scrollable } = Extension.imports.scrollable;
const { Cell } = Extension.imports.cell;
const { UI } = Extension.imports.ui;
const { panelBox } = Extension.imports.panelBox;
const WindowUtils = Extension.imports.windows;
const { stage } = Extension.imports.sizing;

const { Log } = Extension.imports.utils.logger;
const { showBoxes, hideBoxes } = Extension.imports.debug;


let container;
let gridView;
let chrome;
let scrollable;
let modal = false;
let signals = new SignalManager();


function start() {
    modal = false;
    signals.disconnectAll();
    panelBox.hide();

    connectDisplaySignals();

    container = new Container();
    gridView = new GridView();
    chrome = addChrome();
    scrollable = new Scrollable(gridView, { height: 5 });
    container.add_child(scrollable);
    chrome.bottom.add_child(scrollable.scrollbar);

    gridView.connect('focused', (_, cell) => {
        log('focused', cell.id);
        activateCell(cell);
    });

    Main.overview.connect('shown', hideChrome);
    Main.overview.connect('hidden', resizeChrome);


    // global.stage.connect('captured-event', () => {
    //     log('ggggggggggggggggggggggggggggggg')

    // });

    // global.stage.connect('key-press-event', (actor, event) => {
    //     let symbol = event.get_key_symbol();
    //     log('event.get_key_symbol', event.get_key_symbol())
    //     if (symbol == Clutter.KEY_Escape) {
    //         log('Escape key pressed!!!!!!!!!!!!!!!')
    //         // global.screen.focus_default_window(event.get_time());
    //         return Clutter.EVENT_STOP;
    //     }

    //     return Clutter.EVENT_PROPAGATE;
    // })

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
}

function hide() {
    if (!container.isOnStage) return;
    gridView.destroy();
    gridView.ease({
        scale_x: 1,
        scale_y: 1,
        time: .25,
        transition: 'easeOutQuad',
        onComplete: () => container.hide()
    });
}

function pushModal() {
    if (modal) return;
    Main.pushModal(container);
    modal = true;
    global.display.set_cursor(Meta.Cursor.BUSY);
}

function popModal() {
    if (!modal) return;
    Main.popModal(container);
    modal = false;
    global.display.set_cursor(Meta.Cursor.DEFAULT);
}


function actorIsScaled(actor) {
    const [scaleX, scaleY] = actor.get_scale();
    return (scaleX !== 1 || scaleY !== 1);
}

class Animator {
    constructor() {
        gridView.focusedCell && gridView.focusedCell.metaWindowActor.hide();
        pushModal();
        const signalGroup = new SignalGroup();
        signalGroup.add(scrollable, 'transitions-completed');
        signalGroup.add(gridView, 'transitions-completed');
        signalGroup.connect('all-signals-complete', () => {
            if (typeof this.onComplete === 'function')
                this.onComplete();
        });
    }
    animateToCell(cell, align = 'center') {
        scrollable.scrollToActor(cell, align);
        // gridView.set_scale(.4,.4)
        if (actorIsScaled(gridView)) {
            gridView.ease({
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
        const scale = direction === 'in' ? 1 : 0.25;
        const pivotX = (gridView.firstVisibleCell.get_x() + gridView.firstVisibleCell.get_width() / 2) / container.get_width();
        log('>>>>>>>>>>>>>>>>>>>>>>>>>>', pivotX, gridView.get_width(), container.get_width())
        gridView.set_easing_duration(250);
        gridView.set_pivot_point(pivotX, .5);
        gridView.set_scale(scale, scale);
        scrollable.emit('transitions-completed');
    }
}


function addChrome() {
    const chrome = createChrome({ left: 1, right: 1, bottom: 5, top: 1 });
    chrome.left.onClick = gridView.focusPreviousCell.bind(gridView);
    chrome.right.onClick = gridView.focusNextCell.bind(gridView);
    chrome.top.onClick = popModal;
    return chrome;
}

function initScrollHandler(scrollable) {

    signals.connectMany([container, chrome.top, chrome.right, chrome.left], 'scroll-event', (_, event) => {
        const scrollDirection = event.get_scroll_direction();
        // const align = scrollDirection === Clutter.ScrollDirection.UP ? 'left' : 'right';
        let align = 'center';
        const focusedCellAlignment = gridView.focusedCell.alignment;
        if (scrollDirection === Clutter.ScrollDirection.UP) {
            if (focusedCellAlignment === 'right')
                align = 'center'
            if (focusedCellAlignment === 'center')
                align = 'left'
            if (focusedCellAlignment === 'left') {
                // gridView.nextCell && activateCell(gridView.nextCell);
                Main.activateWindow(gridView.nextCell.metaWindow)
                return;
            }
        }
        if (scrollDirection === Clutter.ScrollDirection.DOWN) {
            if (focusedCellAlignment === 'left')
                align = 'center'
            if (focusedCellAlignment === 'center')
                align = 'right'
            if (focusedCellAlignment === 'right') {
                // gridView.previousCell && activateCell(gridView.previousCell);
                Main.activateWindow(gridView.previousCell.metaWindow)
                return;
            }
        }
        activateCell(gridView.focusedCell, align);
    });
    signals.connect(container, 'button-release-event', () => {
        scrollable.scrollToActor(gridView.focusedCell, 'center');
        signals.connectOnce(scrollable, 'scroll-end', () => {
            log('>>>>>>>>>>>>>>>>>>>>');
            gridView.focusedCell.showMetaWindow();
            resizeChrome();
            popModal();
        });
    });
    scrollable.connect('scroll-begin', () => {
        const animator = new Animator();
    });
    scrollable.scrollbar.connect('scroll-event', (actor, event) => {
        const scrollDirection = event.get_scroll_direction();
        if (scrollDirection > 1) return;
        // if (event.has_shift_modifier())
        const { BUTTON1_MASK, SHIFT_MASK } = Clutter.ModifierType;
        const { DOWN, UP } = Clutter.ScrollDirection;
        if (event.get_state() & (BUTTON1_MASK | SHIFT_MASK)) {
            hideChrome();
            const animator = new Animator();
            const direction = scrollDirection === DOWN ? 'in' : 'out';
            animator.zoom(direction);
            return;
        };
        if (scrollDirection === DOWN)
            Main.activateWindow(gridView.previousCell.metaWindow)
        // scrollable.scrollToActor(gridView.previousCell)
        if (scrollDirection === UP)
            Main.activateWindow(gridView.nextCell.metaWindow)
        // scrollable.scrollToActor(gridView.nextCell)
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
    function grabOpIsResizingHorizontally(op) {
        return (op === Meta.GrabOp.RESIZING_E || op === Meta.GrabOp.RESIZING_W);

    }
    global.display.connect('grab-op-begin', (display, screen, metaWindow, op) => {
        log('grab-op-begin', op)
        // gridView.setEasingOff();
        if (!metaWindow) return;
        log('grab-op-begin', op, metaWindow.title);
        if (metaWindow.is_client_decorated()) return;
        const cell = gridView.getCellForMetaWindow(metaWindow);
        if (op === Meta.GrabOp.WINDOW_BASE) {
            log('grab-op-window-base', metaWindow.title)
            display.end_grab_op(display);
            cell.save_easing_state();
            cell.set_easing_duration(0);
            cell.set_opacity(255);
            cell.restore_easing_state();
            // cell.metaWindowActor.lower_bottom();
            const coords = global.get_pointer();
            cell.draggable.startDrag(null, coords);
            return;
        }
        if (grabOpIsResizingHorizontally(op)) {
            gridView.setEasingOff();
            const { width: startWidth } = metaWindow.get_frame_rect();
            metaWindow.connect('size-changed', () => {
                cell.metaWindowActor.set_opacity(0)
                const { width } = metaWindow.get_frame_rect();
                log(width, startWidth, startWidth - width);
                gridView.translation_x = (startWidth - width) / 2;
            });
        }
        else
            display.end_grab_op(display);
    });
    global.display.connect('grab-op-end', (display, screen, metaWindow, op) => {
        if (!metaWindow) return;
        const cell = gridView.getCellForMetaWindow(metaWindow);
        // cell.alignMetaWindow()
        cell.metaWindowActor.set_opacity(255);
        // container.set_animation_duration(0);
        gridView.translation_x = 0;
        gridView.setEasingOn();
        scrollable.set_easing_duration(0);
        if (grabOpIsResizingHorizontally(op)) {
            // Main.activateWindow(metaWindow)
            gridView.emit('focused', cell)
        }
        // resizeChrome();
    });

}

function hideChrome() {
    chrome.left.width = 0;
    chrome.right.width = 0;
}

function resizeChrome() {
    const { x, width } = gridView.focusedCell.metaWindow.get_buffer_rect();
    log('??????????', gridView.focusedCell.metaWindow.get_title())
    log(x, width)
    chrome.left.width = x;
    chrome.right.width = 1920 - (x + width);
    chrome.right.x = x + width
}


function activateCell(cell, align = 'center') {
    // chrome.left.set_easing_duration(250);
    // chrome.right.set_easing_duration(250);
    gridView.cells.forEach(cell => cell.metaWindowActor.hide())
    const halfWidth  = stage.width/2;
    chrome.left.width = halfWidth;
    chrome.right.width = halfWidth;
    chrome.right.x = halfWidth;
    log(';;;;;;', cell.metaWindow.get_title())
    const animator = new Animator();
    animator.animateToCell(cell, align);
    // popModal();
    // cell.showMetaWindow();
    // resizeChrome();
    animator.onComplete = () => {
        cell.showMetaWindow();
        popModal();
        log('activateCell complete ===============================================')
        resizeChrome();
    };

}
