const { Clutter, GLib, Meta, Shell, St } = imports.gi;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Signals = imports.signals;
const Background = imports.ui.background;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
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
let hotTop;
function enable() {
    log(`${Extension.metadata.uuid} enable()`);
    addAccelerator("<super><alt>o")
    acceleratorSignal = global.display.connect('accelerator-activated', toggle);
    global.stage.connect('scroll-event', (source, event) => {
        if (event.get_state() & Clutter.ModifierType.SHIFT_MASK && !global.gridView) {
            show();
        }
    });

    global.stage.connect('key-press-event', () => {
        log('global.stage.key-press-event')
    });


    hotTop = new St.Widget({
        height: 46,
        width: 1920,
        style_class: 'overlay',
        reactive: true
    });
    // global.window_group.set_margin(new Clutter.Margin({top:60}));
    Main.layoutManager.addChrome(hotTop, { affectsStruts: true });
    hotTop.connect('enter-event', (actor, event) => {
        if (!global.gridView) {
            show();
            return;
        }
    });
    global.stage.add_child(hotTop);
}

function toggle() {
    global.gridView ? hide() : show();
}

let container;
let scrollable;
let thumb;

function show() {
    container = new St.Widget({y:10});
    const backgroundManager = new Background.BackgroundManager({
        monitorIndex: Main.layoutManager.primaryIndex,
        container: container,
        vignette: false
    });

    global.gridView = new GridView();
    global.gridView.connect('key-press-event', (actor, event) => {
        if (event.get_key_symbol() === Clutter.Escape) {
            if (global.gridView) {
                hide();
            }
        }
    });
    global.gridView.connect('key-release-event', (actor, event) => {
        log('key-release-event');
        if (event.get_state() & Clutter.ModifierType.SHIFT_MASK) {
            log('released shift key')
            if (global.gridView) {
                hide();
            }
        }
    });
    scrollable = new Scrollable(global.gridView,{});
    hotTop.add_child(scrollable.scrollbar);
    Main.uiGroup.add_child(container);
    container.add_child(scrollable);
}

function hide() {
    Tweener.addTween(global.gridView, {
        scale_x: 1,
        scale_y: 1,
        time: .25,
        transition: 'easeOutQuad',
        onComplete: () => {
                Main.uiGroup.remove_child(container);
                global.gridView.destroy();
                delete global.gridView;
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
