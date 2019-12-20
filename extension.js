const Main = imports.ui.main;
const Signals = imports.signals;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const fluidWM = Extension.imports.fluidWM;

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
    fluidWM.stop();
}

function wait() {
    if (Main.layoutManager._startingUp)
        Main.layoutManager.connect('startup-complete', fluidWM.start);
    else
        fluidWM.start();
}

