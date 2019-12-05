const { Clutter, GLib, GObject, Meta, Shell, St } = imports.gi;
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
let hotTop;

function hidePanelBox() {
    const panelBox = Main.layoutManager.panelBox;
    panelBox.translation_y = -panelBox.get_height();
    Main.overview.connect('showing', () => {
        container.hide();
    });
    Main.overview.connect('shown', () => {
        Tweener.addTween(panelBox, {
            translation_y:0,
            time:.25,
        });
    });
    Main.overview.connect('hidden', () => {
        Tweener.addTween(panelBox, {
            translation_y:-27,
            time:.25,
        })
        container.show();
    });
}

function prepare() {
    hidePanelBox();
    hotTop = new HotTop({width: 36});
    hotTop.connect('enter-event', (actor, event) => {
        log('enter-event')
        show();
    });
    const hotBottom = new HotBottom({width: 36});
    global.display.connect('window-created', (display, metaWindow) => {
        // log('cscscscscscsc',display,metaWindow);
        // if (!metaWindow.get_transient_for()) return;
        log('ft',metaWindow.title,metaWindow.get_frame_type())
        if (metaWindow.get_window_type() < 2) {
            gridView.populate();
            metaWindow.get_compositor_private().hide();
            return;
        }
        /*
            Make dialogs, popups, tooltips, etc visible by reparenting
            them to the global stage.
        */
        const metaWindowActor = metaWindow.get_compositor_private();
        const parent = metaWindowActor.get_parent();
        parent.remove_child(metaWindowActor);
        global.stage.add_child(metaWindowActor)
    });

    global.display.connect('grab-op-begin', (display, screen, window, op) => {
        // log(window.titlebar_is_onscreen())
        if (op == Meta.GrabOp.MOVING || op == Meta.GrabOp.KEYBOARD_MOVING) {
            display.end_grab_op(display);
            gridView.cells.forEach(cell => {
                cell.save_easing_state();
                cell.set_easing_duration(0);
                cell.set_opacity(255);
                cell.restore_easing_state();
                cell.metaWindowActor.hide();
            });
        }
    })
    // const hotLeft = new HotLeft({width:64});
    container = new Container();
    container.connect('captured-event', (actor, event) => {
        // log(event.type())
        if (event.type() == 6) {
            gridView.cells.forEach(cell => {
                cell.metaWindowActor.hide();
                cell.set_opacity(255);
            })
        }
    });
    gridView = new GridView();
    const scrollable = new Scrollable(gridView,{height:1, width:Main.uiGroup.get_width()});
    scrollable.connect('scroll-begin', () => {
        log('scroll-begin')
        gridView.cells.forEach(cell => {
            cell.set_opacity(255);
            cell.metaWindowActor.lower_bottom();
        });
    })
    container.add_child(scrollable);
    Main.uiGroup.add_child(scrollable.scrollbar);
    gridView.connect('focused', (gridViewActor, actor) => {
        log('focused', actor.id)
        actor.metaWindowActor.raise_top();
        // hideBoxes();
        gridView.cells.forEach(cell => cell.set_opacity(255));
        gridView.cells.forEach(cell => cell.metaWindowActor.hide())
        scrollable.scrollToActor(actor);
        scrollable.onScrollEnd(() => {
            log('onScrollEnd');
            const br = actor.metaWindow.get_buffer_rect();
            const fr = actor.metaWindow.get_frame_rect(); 
            let [nx,ny] = actor.get_transformed_position();
            actor.metaWindow.move_frame(true, nx + (br.width - fr.width)/2 + actor.clone.get_margin_left(), ny);
            actor.metaWindowActor.raise_top();
            actor.metaWindowActor.show();
            actor.set_opacity(120);
            // showBoxes(actor.metaWindow);
            // global.display.focus_default_window(global.get_current_time());
        });
    });
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
            super._init({reactive:true});
        }
        get isOnStage() {
            return global.window_group.contains(this);
        }
        show() {
            global.window_group.add_child(this);
            // Main.pushModal(this, { actionMode: Shell.ActionMode.OVERVIEW })
        }
        hide() {
            // Main.popModal(this);
            global.window_group.remove_child(this);
        }
        destroy() {
            this.disconnect(this._hideSignal);
        }        
    }
);

let boxes = [];

function hideBoxes() {
    boxes.forEach(box => {
        global.stage.remove_child(box);
    });            
    boxes = [];
}

function showBoxes(metaWindow) {
    let frame = metaWindow.get_frame_rect()
    let inputFrame = metaWindow.get_buffer_rect()
    let actor = metaWindow.get_compositor_private();

    hideBoxes();
    const makeFrameBox = function({x, y, width, height}, color) {
        let frameBox = new St.Widget();
        frameBox.set_position(x, y)
        frameBox.set_size(width, height)
        frameBox.set_style("border: 2px" + color + " solid");
        return frameBox;
    }

    boxes.push(makeFrameBox(frame, "rgba(255,0,0,0.5)"));
    boxes.push(makeFrameBox(inputFrame, "rgba(0,100,255,0.5)"));

    if(inputFrame.x !== actor.x || inputFrame.y !== actor.y
       || inputFrame.width !== actor.width || inputFrame.height !== actor.height) {
        boxes.push(makeFrameBox(actor, "yellow"));
    }

    boxes.forEach(box => global.stage.add_child(box));            
}
