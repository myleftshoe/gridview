const Main = imports.ui.main;
const Signals = imports.signals;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const FluidWM = Extension.imports.fluidWM;

function init() {
    log(`***************************************************************`);
    log(`${Extension.metadata.uuid} init()`);
    Signals.addSignalMethods(Extension);
}

function enable() {
    log(`${Extension.metadata.uuid} enable()`);
    // stage actors do not report correct sizes before startup-complete
    wait();
}

function disable() {
    log(`${Extension.metadata.uuid} disable()`);
    FluidWM.stop();
}

function wait() {
    if (Main.layoutManager._startingUp)
        Main.layoutManager.connect('startup-complete', FluidWM.start);
    else
        FluidWM.start();
}

