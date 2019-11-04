const { GLib } = imports.gi;
const Main = imports.ui.main;
const Signals = imports.signals;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { FluidShell } = Extension.imports.fluidShell;
const { Log } = Extension.imports.utils.logger;

function init() {
    log(`***************************************************************`);
    log(`${Extension.metadata.uuid} init()`);
    Signals.addSignalMethods(Extension);
}

function enable() {
    log(`${Extension.metadata.uuid} enable()`);
    Main.layoutManager.connect('startup-complete', () => {
        global.fluidShell = new FluidShell();
        Extension.loaded = true;
    });
}

function disable() {
    log(`${Extension.metadata.uuid} disable()`);
    global.fluidShell && global.fluidShell.destroy();
    delete global.fluidShell;
    Extension.loaded = false;
}
