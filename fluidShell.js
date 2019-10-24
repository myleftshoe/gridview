const { Clutter, GLib, St } = imports.gi;
const Main = imports.ui.main;
const { Tweener } = imports.ui.tweener;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const { RightPanel } = Me.imports.components.rightPanel;
const { Log } = Me.imports.utils.logger;

var FluidShell = class FuildShell {

    constructor() {

        const monitor = Main.layoutManager.primaryMonitor;

        Log.properties(Main);
        this.rightPanel = new RightPanel(monitor);
        Main.layoutManager.addChrome(this.rightPanel, {
            affectsStruts: true,
            trackFullscreen: true
        });
        // Main.uiGroup.add_actor(this.rightPanel);

    }

    destroy() {
        Main.layoutManager.removeChrome(this.rightPanel);
    }
}