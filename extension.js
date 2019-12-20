const { Atk, Clutter, GLib, GObject, Meta, Shell, St } = imports.gi;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Tweener = imports.ui.tweener;
const Signals = imports.signals;
const Background = imports.ui.background;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { SignalManager, SignalGroup } = Extension.imports.signals;
const { createChrome } = Extension.imports.chrome;
const { GridView } = Extension.imports.gridView;
const { Scrollable } = Extension.imports.scrollable;
const { Cell } = Extension.imports.cell;
const { Titlebar } = Extension.imports.titlebar;
const { Log } = Extension.imports.utils.logger;
const { showBoxes, hideBoxes } = Extension.imports.debug;
const { UI } = Extension.imports.ui;
const WindowUtils = Extension.imports.windows;




var stage_width = global.stage.get_width();
var stage_height = global.stage.get_height();
var grid_margin = 20;
var grid_height  = stage_height - grid_margin * 2;
var grid_stage_scale = grid_height/stage_height;

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

let modal = false;

let signals = new SignalManager();

function prepare() {
    modal = false;
    signals.disconnectAll();
    stage_width = global.stage.get_width();
    stage_height = global.stage.get_height();
    grid_margin = 40;
    grid_height  = stage_height - grid_margin * 2;
    grid_stage_scale = grid_height/stage_height;
    hidePanelBox();
    prepareMetaWindows();
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

    const chrome = createChrome({left:1, right:1, bottom: 5, top:1});
    chrome.left.onClick = function() {
        const focusedCell = gridView.focusedCell;
        const i = gridView.cells.indexOf(focusedCell);
        log('hotLeft clicked', i, focusedCell.id);
        const prevCell = gridView.cells[i - 1] || focusedCell;
        Main.activateWindow(prevCell.metaWindow);
    }
    chrome.right.onClick = function() {
        const focusedCell = gridView.focusedCell;
        const i = gridView.cells.indexOf(focusedCell);
        log('hotRight clicked', i, focusedCell.id);
        const nextCell = gridView.cells[i + 1] || focusedCell;
        Main.activateWindow(nextCell.metaWindow);
    }

    // const hotBottom = new HotBottom({ width: 5 });

    container = new Container();
    gridView = new GridView();
    scrollable = new Scrollable(gridView, { height: 5 });
    container.add_child(scrollable);
    chrome.bottom.add_child(scrollable.scrollbar);


    chrome.top.onClick = function() {
        log('>>>>>>>>>>>>>>>>>>>>>>>> popping modal')
        global.display.set_cursor(Meta.Cursor.DEFAULT);
        if (modal) { 
            Main.popModal(container);
            modal = false;
        }
    }

    
    function activateCell(cell) {
        const animator = new Animator();
        animator.animateToCell(cell);

        signals.connectOnce(animator, 'animation-complete', () => {
            cell.showMetaWindow();
            if (modal) { 
                Main.popModal(container);
                modal = false;
            }
            log('activateCell complete ===============================================')
        });
    }

    gridView.connect('focused', (_, cell) => {
        log('focused', cell.id);
        activateCell(cell);
    });
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

    show();
    scrollable.update();

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
                height: stage_height,
                min_width: stage_width,
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
        const { x, y, width, height, padding } = WindowUtils.getGeometry(metaWindow);
        metaWindow.move_resize_frame(true, x, grid_margin, width, grid_height);
        metaWindow.get_compositor_private().hide();
    });
}


var Animator = GObject.registerClass(
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
            if (!modal) {
                Main.pushModal(container);
                modal = true;
                global.display.set_cursor(Meta.Cursor.BUSY);
            }

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
            const [scaleX, scaleY]  = gridView.get_scale(); 
            if (scaleX !== 1 || scaleY !== 1) {
                Tweener.addTween(gridView, {
                    scale_x: 1,
                    scale_y: 1,
                    time:.5,
                    onComplete: () => gridView.emit('transitions-completed'),
                });
            }
            else {
                gridView.emit('transitions-completed');
            }
        }
        zoom(direction = 'in') {
            const scale = direction === 'in' ? 1 : 0.5;
            const pivotX = (gridView.firstVisibleCell.get_x() + gridView.firstVisibleCell.get_width()/2) / container.get_width();
            log('>>>>>>>>>>>>>>>>>>>>>>>>>>', pivotX, gridView.get_width(), container.get_width())
            gridView.set_easing_duration(250);
            gridView.set_pivot_point(pivotX,.5);
            gridView.set_scale(scale, scale);
            scrollable.emit('transitions-completed');
        }
    }
);

