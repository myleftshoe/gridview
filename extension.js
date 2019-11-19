const { Clutter, GLib, Meta, Shell, St } = imports.gi;
const Main = imports.ui.main;
const Signals = imports.signals;
const Background = imports.ui.background;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { GridView } = Extension.imports.gridView;
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
    acceleratorSignal = global.display.connect('accelerator-activated', toggle);
}

function toggle() {
    global.gridView ? hide() : show();
}

let container;

function show() {
    container = new St.Widget();
    const backgroundManager = new Background.BackgroundManager({ 
        monitorIndex: Main.layoutManager.primaryIndex,
        container: container,
        vignette: false 
    });
    
    global.gridView = new GridView();
    global.gridView.connect('key-press-event', (actor, event) => {
        if (event.get_key_symbol() === Clutter.Escape) {
            hide();
        }
    })

    container.add_child(global.gridView);
    Main.uiGroup.add_child(container);
}

function hide() {
    Main.uiGroup.remove_child(container);
    global.gridView.destroy();
    delete global.gridView;
}

function disable() {
    log(`${Extension.metadata.uuid} disable()`);
    global.display.disconnect(acceleratorSignal);
    if (global.gridView) {
        hide();
    }
}
