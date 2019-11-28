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

let container;
let gridView;

function prepare() {
    const hotTop = new HotTop({width: 36});
    hotTop.connect('enter-event', (actor, event) => {
        log('enter-event')
        show();
    });
    const hotLeft = new HotLeft({width:13});
    container = createContainer();
    gridView = new GridView();
    const scrollable = new Scrollable(gridView,{height:10, width:Main.uiGroup.get_width()});
    container.add_child(scrollable);
    container.add_child(scrollable.scrollbar);
    show();
}

function show() {
    if (global.stage.contains(container)) return;
    gridView.populate();
    global.stage.add_child(container);
    Main.pushModal(container, { actionMode: Shell.ActionMode.OVERVIEW })
}

function hide() {
    if (!global.stage.contains(container)) return;
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
    hide();
}

function createContainer() {
    const container = new St.Widget();
    container.connect('key-press-event', (actor, event) => {
        if (event.get_key_symbol() === Clutter.Escape) {
            hide();
        }
    });
    const backgroundManager = new Background.BackgroundManager({
        monitorIndex: Main.layoutManager.primaryIndex,
        container: container,
        vignette: false
    });
    return container;
}