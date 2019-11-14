const { GLib, Meta, Shell } = imports.gi;
const Main = imports.ui.main;
const Signals = imports.signals;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { FluidShell } = Extension.imports.fluidShell;
const { Log } = Extension.imports.utils.logger;

function addAccelerator(accelerator, callback) {
    let action = global.display.grab_accelerator(accelerator, Meta.KeyBindingFlags.NONE)

    if (action == Meta.KeyBindingAction.NONE) {
        log('Unable to grab accelerator [binding={}]', accelerator)
    } else {
        log('Grabbed accelerator [action={}]', action)
        let name = Meta.external_binding_name_for_action(action)
        log('Received binding name for action [name={}, action={}]',
            name, action)

        log('Requesting WM to allow binding [name={}]', name)
        Main.wm.allowKeybinding(name, Shell.ActionMode.ALL)
    }

}


function init() {
    log(`***************************************************************`);
    log(`${Extension.metadata.uuid} init()`);
    Signals.addSignalMethods(Extension);
}

var acceleratorSignal;
function enable() {
    log(`${Extension.metadata.uuid} enable()`);
    addAccelerator("<super><alt>o")
    acceleratorSignal = global.display.connect('accelerator-activated', (display, action, deviceId, timestamp) => {
        if (global.fluidShell) {
            remove();
            return;
        }
        global.fluidShell = new FluidShell();
        global.stage.add_child(global.fluidShell);
    });
}

function remove() {
    global.stage.remove_child(global.fluidShell);
    global.fluidShell.destroy();
    delete global.fluidShell;
}

function disable() {
    log(`${Extension.metadata.uuid} disable()`);
    global.display.disconnect(acceleratorSignal);
    if (global.fluidShell) {
        remove();
    }
}
