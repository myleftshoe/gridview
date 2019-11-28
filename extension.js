const { Clutter, GLib, Meta, Shell, St } = imports.gi;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Signals = imports.signals;
const Background = imports.ui.background;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { HotTop, HotLeft } = Extension.imports.hotEdge;
const { GridView } = Extension.imports.gridView;
const { Scrollable } = Extension.imports.scrollable;
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
    Main.layoutManager.connect('startup-complete', prepare);
}

let hotTop;
let container;
let scrollable;

function prepare() {
    hotTop = new HotTop({width: 36});
    hotTop.connect('enter-event', (actor, event) => {
        log('enter-event')
        if (!global.stage.contains(global.gridView)) {
            show();
            return;
        }
    });
    const hotLeft = new HotLeft({width:13}) 
    container = new St.Widget();
    container.connect('key-press-event', (actor, event) => {
        if (event.get_key_symbol() === Clutter.Escape) {
            if (global.gridView) {
                hide();
            }
        }
    });
    const backgroundManager = new Background.BackgroundManager({
        monitorIndex: Main.layoutManager.primaryIndex,
        container: container,
        vignette: false
    });
    global.gridView = new GridView();
    scrollable = new Scrollable(global.gridView,{height:10, width:Main.uiGroup.get_width()});
    container.add_child(scrollable);
    container.add_child(scrollable.scrollbar);
    show();
}

function show() {
    if (global.stage.contains(global.gridView)) return;
    global.gridView.populate();
    global.stage.add_child(container);
    Main.pushModal(container, { actionMode: Shell.ActionMode.OVERVIEW })
}

function hide() {
    if (!global.stage.contains(global.gridView)) return;
    Tweener.addTween(container, {
        scale_x: 1,
        scale_y: 1,
        time: .25,
        transition: 'easeOutQuad',
        onComplete: () => {
            Main.popModal(container);
            global.stage.remove_child(container);
        }
    });
}

function disable() {
    log(`${Extension.metadata.uuid} disable()`);
    global.display.disconnect(acceleratorSignal);
    if (global.gridView) {
        hide();
    }
}
