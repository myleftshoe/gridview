const { Clutter, GLib, St } = imports.gi;
const Main = imports.ui.main;
const { Tweener } = imports.ui.tweener;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const { RightPanel } = Me.imports.components.rightPanel;
const { Log } = Me.imports.utils.logger;

var FluidShell = class FuildShell {

    constructor() {

        const monitor = Main.layoutManager.primaryMonitor;

        Log.properties(monitor);
        this.rightPanel = new RightPanel(monitor);

        Main.uiGroup.add_actor(this.rightPanel);

    }

    destroy() {
        Main.uiGroup.remove_actor(this.rightPanel);
    }
}