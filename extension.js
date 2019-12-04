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

let acceleratorSignal;

function addAccelerator(accelerator) {
    const action = global.display.grab_accelerator(accelerator, Meta.KeyBindingFlags.NONE);
    if (action == Meta.KeyBindingAction.NONE) {
        log('Unable to grab accelerator [binding={}]', accelerator);
    }
    else {
        const name = Meta.external_binding_name_for_action(action);
        Main.wm.allowKeybinding(name, Shell.ActionMode.ALL)
    }
}

function init() {
    log(`***************************************************************`);
    log(`${Extension.metadata.uuid} init()`);
    Signals.addSignalMethods(Extension);
}

function enable() {
    log(`${Extension.metadata.uuid} enable()`);
    addAccelerator("<super><alt>o")
    acceleratorSignal = global.display.connect('accelerator-activated', show);
    // stage actors do not report correct sizes before startup-complete
    if (Main.layoutManager._startingUp) 
        Main.layoutManager.connect('startup-complete', prepare);
    else
        prepare();
}

function disable() {
    log(`${Extension.metadata.uuid} disable()`);
    global.display.disconnect(acceleratorSignal);
    hide();
}

let container;
let gridView;
let hotTop;

function prepare() {
    hotTop = new HotTop({width: 36});
    hotTop.connect('enter-event', (actor, event) => {
        log('enter-event')
        show();
    });
    const hotBottom = new HotBottom({width: 36});
    global.display.connect('window-created', (display, metaWindow) => {
        // log('cscscscscscsc',display,metaWindow);
        // if (!metaWindow.get_transient_for()) return;
        if (metaWindow.get_window_type() < 2) {
            gridView.populate();
            metaWindow.hide();
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
    // const hotLeft = new HotLeft({width:64});
    container = new Container();
    gridView = new GridView();
    const scrollable = new Scrollable(gridView,{height:1, width:Main.uiGroup.get_width()});
    container.add_child(scrollable);
    container.add_child(scrollable.scrollbar);
    gridView.connect('focused', (gridViewActor, actor) => {
        log('focused', actor.id)
        // hideBoxes();
        const [x,y] = actor.get_position();
        const [width, height] = actor.get_size();
        log(x,y, width,height)
        gridView.cells.forEach(cell => cell.set_reactive(true));
        actor.set_reactive(false);
        scrollable.scroll_to_rect(new Clutter.Rect({origin: {x, y}, size: {width, height}}));
        const sig = scrollable.connect('transitions-completed', () => {
            log('transitions-completed');
            scrollable.disconnect(sig);
            const br = actor.metaWindow.get_buffer_rect();
            const fr = actor.metaWindow.get_frame_rect(); 
            let [nx,ny] = actor.get_transformed_position();
            actor.metaWindow.move_frame(true, nx + (br.width - fr.width)/2 + actor.clone.get_margin_left(), ny);
            // showBoxes(actor.metaWindow);
        })
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
            super._init();
            this._hideSignal = this.connect('key-press-event', (actor, event) => {
                if (event.get_key_symbol() === Clutter.Escape) {
                    hide();
                }
            });
            const backgroundManager = new Background.BackgroundManager({
                monitorIndex: Main.layoutManager.primaryIndex,
                container: this,
                vignette: true
            });
        }
        get isOnStage() {
            return Main.uiGroup.contains(this);
        }
        show() {
            Main.uiGroup.add_child(this);
            // Main.pushModal(this, { actionMode: Shell.ActionMode.OVERVIEW })
        }
        hide() {
            // Main.popModal(this);
            Main.uiGroup.remove_child(this);
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
