const { Atk, Clutter, GLib, GObject, Meta, Shell, St } = imports.gi;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Signals = imports.signals;
const Background = imports.ui.background;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { HotTop, HotLeft, HotBottom } = Extension.imports.hotEdge;
const { GridView } = Extension.imports.gridView;
const { Scrollable } = Extension.imports.scrollable;
const { Cell } = Extension.imports.cell;
const { Log } = Extension.imports.utils.logger;
const { showBoxes, hideBoxes } = Extension.imports.debug;

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
    log('initial focused window', global.display.focus_window.title);
    const hotTop = new HotTop({ width: 32 });

    const layout = new Clutter.BoxLayout({spacing:20});
    const bin = new St.Widget({layout_manager: layout});
    let gearIcon = new St.Icon({ icon_name: 'view-fullscreen-symbolic' });
    const fullscreenButton = new St.Button({ 
        style_class: 'login-dialog-session-list-button',
        reactive: true,
        track_hover: true,
        can_focus: true,
        accessible_name: _("Choose Session"),
        accessible_role: Atk.Role.MENU,
        child: gearIcon 
    });

    fullscreenButton.connect('clicked', () => {
        gridView.cells.forEach(({metaWindow, metaWindowActor}) => {
            if (metaWindow.is_fullscreen())
                metaWindow.unmake_fullscreen();
            else
                metaWindow.make_fullscreen();
        });
        gridView.populate();
    });

    const title = new St.Label({text:'test'});

    bin.add_child(fullscreenButton);
    bin.add_child(title);
    hotTop.add_child(bin);

    const hotBottom = new HotBottom({ width: 5 });
    global.display.connect('window-created', (display, metaWindow) => {
        log('ft', metaWindow.title, metaWindow.get_frame_type())
        if (metaWindow.get_window_type() < 2) {
            const cell = gridView.addCell(metaWindow);
            return;
        }
        metaWindow.get_compositor_private().raise_top();
    });
    global.display.connect('grab-op-begin', (display, screen, window, op) => {
        log('grab-op-begin', op)
        // gridView.setEasingOff();
        if (!window) return;
        log('grab-op-begin', op, window.title);
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
        }
        if (op !== Meta.GrabOp.RESIZING_E) {
            display.end_grab_op(display);
        }
    })
    // global.display.connect('grab-op-end', (display, screen, window, op) => {
    //     log('grab-op-end')
    //     gridView.setEasingOn();
    // });
    container = new Container();
    // container.connect('captured-event', (actor, event) => {
    //     // log('captured-event', event.type())
    //     if (event.type() == 6) {
    //         gridView.cells.forEach(cell => {
    //             cell.metaWindowActor.lower_bottom();
    //             cell.set_opacity(255);
    //         })
    //     }
    // });
    gridView = new GridView();
    scrollable = new Scrollable(gridView, { height: 5, width: Main.uiGroup.get_width() });
    container.add_child(scrollable);
    hotBottom.add_child(scrollable.scrollbar);
    gridView.connect('focused', (gridView, cell) => {
        log('focused', cell.id);
        scrollable.scrollToActor(cell);
    });
    scrollable.connect('scroll-begin', () => {
        hideBoxes();
        gridView.cells.forEach(cell => {
            cell.metaWindowActor.hide();
        })
    });
    scrollable.connect('scroll-end', () => {
        log('scroll-end');
        const cell = gridView.getFirstVisibleCell();
        const focusedCell = gridView.getFocusedCell();
        log('cell:', cell.id);
        log('focu', focusedCell.id);
        if (cell !== focusedCell) {
            Main.activateWindow(cell.metaWindow);
            return;
        }
        cell.alignMetaWindow();
        // cell.set_opacity(150);
        // cell.metaWindowActor.raise_top();
        // cell.metaWindowActor.show();
        // cell.lower_bottom();
        title.set_text(cell.id);
        // showBoxes(cell.metaWindow)
    })
    show();
    scrollable.update();
}

function show() {
    if (container.isOnStage) return;
    gridView.populate();
    container.show();
}

function hide() {
    if (!container.isOnStage) return;
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
                reactive: true 
            });
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
