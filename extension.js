const { GLib, Meta, Shell } = imports.gi;
const Main = imports.ui.main;
const Signals = imports.signals;

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

function show() {
    global.gridView = new GridView();
    global.stage.add_child(global.gridView);
}

function hide() {
    global.stage.remove_child(global.gridView);
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
