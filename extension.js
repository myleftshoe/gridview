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

    // const hotLeft = new HotLeft({width:64});
    container = new Container();
    gridView = new GridView();
    const scrollable = new Scrollable(gridView,{height:10, width:Main.uiGroup.get_width()});
    container.add_child(scrollable);
    // container.add_child(scrollable.scrollbar);
    gridView.connect('focused', (gridViewActor, actor) => {
        log('focused', actor.id)
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
            actor.metaWindow.move_frame(true, nx + (br.width - fr.width)/2, ny)
        })
    })
    scrollable.update();
    show();
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
            // const backgroundManager = new Background.BackgroundManager({
            //     monitorIndex: Main.layoutManager.primaryIndex,
            //     container: this,
            //     vignette: true
            // });
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
