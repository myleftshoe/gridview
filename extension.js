const { GLib } = imports.gi;
const Main = imports.ui.main;
const Signals = imports.signals;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const { FluidShell } = Me.imports.fluidShell;
const { Log } = Me.imports.utils.logger;

function init() {
    // Log.properties(Me.metadata)
    log(`***************************************************************`);
    log(`${Me.metadata.uuid} init()`);
    Signals.addSignalMethods(Me);
}

function enable() {
    log(`${Me.metadata.uuid} enable()`);
    global.fluidShell = new FluidShell();
    Me.loaded = true;
}

function disable() {
    log(`${Me.metadata.uuid} disable()`);
    global.fluidShell.destroy();
    delete global.fluidShell;
    Me.loaded = false;
}
