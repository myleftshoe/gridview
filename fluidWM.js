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
    animateToCell(cell) {
        scrollable.scrollToActor(cell);
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
        const scale = direction === 'in' ? 1 : 0.5;
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

    signals.connectMany([container, chrome.top], 'scroll-event', (_, event) => {
        const scrollDirection = event.get_scroll_direction();
        const align = scrollDirection === Clutter.ScrollDirection.DOWN ? 'left' : 'right';
        scrollable.scrollToActor(gridView.focusedCell, align);
    });
    signals.connect(container, 'button-release-event', () => {
        scrollable.scrollToActor(gridView.focusedCell, 'center');
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
            const animator = new Animator();
            const direction = scrollDirection === DOWN ? 'in' : 'out';
            animator.zoom(direction);
            return;
        };
        if (scrollDirection === DOWN)
            scrollable.scrollToActor(gridView.previousCell)
        if (scrollDirection === UP)
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
        if (op === Meta.GrabOp.RESIZING_E)
            gridView.setEasingOff();
        else
            display.end_grab_op(display);
    });
    global.display.connect('grab-op-end', (display, screen, window, op) => {
        gridView.setEasingOn();
    });

}

function activateCell(cell) {
    chrome.left.set_easing_duration(250);
    chrome.right.set_easing_duration(250);
    chrome.left.width = 960;
    chrome.right.width = 960;
    chrome.right.x = 960;
    const animator = new Animator();
    animator.animateToCell(cell);
    animator.onComplete = () => {
        cell.showMetaWindow();
        popModal();
        log('activateCell complete ===============================================')



        const { x, width } = cell.metaWindow.get_buffer_rect();

        log(x,width)
        chrome.left.width = x;
        chrome.right.width = 1920 - (x + width);
        chrome.right.x = x + width
        // Main.layoutManager.removeChrome(chrome.left);
        // Main.layoutManager.removeChrome(chrome.right);
        // Main.layoutManager.removeChrome(chrome.top);
        // Main.layoutManager.removeChrome(chrome.bottom);
        // chrome = createChrome({ left: x, right: 1920 - (x + width), bottom: 5, top: 1 });

    };

}
