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


function scroll(scrollable, cell) {
    gridView.cells.forEach(cell => {
        cell.save_easing_state();
        cell.set_easing_duration(0);
        cell.set_opacity(255);
        cell.metaWindowActor.hide();
    });
    scrollable.scrollToActor(cell);
    scrollable.onScrollEnd(() => {
        log('onScrollEnd');
        const br = cell.metaWindow.get_buffer_rect();
        const fr = cell.metaWindow.get_frame_rect();
        const [x, y] = cell.get_transformed_position();
        const [nx, ny] = [Math.round(x), Math.round(y)];
        log("ny", nx, ny)
        cell.metaWindow.move_frame(true, nx + (br.width - fr.width) / 2 + cell.clone.get_margin_left(), ny);
        // actor.metaWindowActor.raise_top();
        cell.metaWindowActor.show();
        cell.set_opacity(0);
        cell.restore_easing_state();
        const fc = gridView.getFocusedCell();
        log('focused:', fc.id)
        // showBoxes(actor.metaWindow);
    });
}


function prepare() {
    hidePanelBox();
    log('yyyyyyy', global.display.focus_window.title);
    const hotTop = new HotTop({ width: 32 });


    let gearIcon = new St.Icon({ icon_name: 'emblem-system-symbolic' });
    const fullscreenButton = new St.Button({ 
        style_class: 'login-dialog-session-list-button',
        reactive: true,
        track_hover: true,
        can_focus: true,
        accessible_name: _("Choose Session"),
        accessible_role: Atk.Role.MENU,
        child: gearIcon 
    });


    // const fullscreenButton = new St.Button({label:'test'});
    fullscreenButton.connect('clicked', () => {
        log('clicked');
        gridView.cells.forEach(({metaWindow, metaWindowActor}) => {
            if (metaWindow.is_fullscreen())
                metaWindow.unmake_fullscreen();
            else
                metaWindow.make_fullscreen();
        });
        gridView.populate();
    });
    hotTop.add_child(fullscreenButton);
    const hotBottom = new HotBottom({ width: 5 });
    global.display.connect('in-fullscreen-changed', (a,b,c,d) => {
        log('in-fullscreen-changed')
        log(a,b,c,d)
    });
    // global.display.connect('window-created', (display, metaWindow) => {
    //     log('ft', metaWindow.title, metaWindow.get_frame_type())
    //     if (metaWindow.get_window_type() < 2) {
    //         gridView.populate();
    //         // metaWindow.get_compositor_private().hide();
    //     }
    // });
    global.display.connect('window-left-monitor', () => {
        log('window-left-monitor');
        gridView.populate();
    })
    global.display.connect('window-entered-monitor', () => {
        log('window-entered-monitor')
        gridView.populate();
    })

    global.display.connect('grab-op-begin', (display, screen, window, op) => {
        log('fffffff', op)
        if (!window) return;
        log('grab-op-begin', op, window.title)
        if (op === Meta.GrabOp.WINDOW_BASE) {
            log('grab-op-window-base', window.title)
            display.end_grab_op(display);
            const cell = gridView.getCellForMetaWindow(window);
            cell.save_easing_state();
            cell.set_easing_duration(0);
            cell.set_opacity(255);
            cell.restore_easing_state();
            cell.metaWindowActor.lower_bottom();
            const coords = global.get_pointer();
            cell.draggable.startDrag(null, coords);
        }
    })
    container = new Container();
    container.connect('captured-event', (actor, event) => {
        if (event.type() == 6) {
            gridView.cells.forEach(cell => {
                cell.metaWindowActor.lower_bottom();
                cell.set_opacity(255);
            })
        }
    });
    gridView = new GridView();
    scrollable = new Scrollable(gridView, { height: 5, width: Main.uiGroup.get_width() });


    scrollable.connect('scroll-begin', () => {
        const cell = gridView.getCellForMetaWindow(global.display.focus_window);
        log('scroll-begin', cell.id)
        scroll(scrollable, cell);
    })
    container.add_child(scrollable);
    hotBottom.add_child(scrollable.scrollbar);
    gridView.connect('focused', (gridViewActor, cell) => {
        log('focused', cell.id);
        scroll(scrollable, cell);
    });
    show();
    scrollable.update();
    // const fc = gridView.getFocusedCell();
    // log('tttttttttt', fc.id)
    // scroll(scrollable, fc);
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
            super._init({ reactive: true });
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
