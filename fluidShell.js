const { Clutter, Meta } = imports.gi;
const Main = imports.ui.main;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { UI } = Extension.imports.ui;
const { Page } = Extension.imports.page;
const { Log } = Extension.imports.utils.logger;

const Display = global.display;
const Stage = global.stage;

var FluidShell = class FuildShell {

    constructor() {
        this.page = null;
        this.signals = [];
        this.refresh();
    }

    refresh() {
        if (this.page) this.destroy();
        this.page = new Page();
        this.signals.push(Display.connect('in-fullscreen-changed', () => this.refresh()));
        this.signals.push(Display.connect('notify::focus-window', () => this.refresh()));
        UI.workspaces.forEach((workspace, i) => workspace.list_windows().forEach((metaWindow,j) => {
            // if (metaWindow.is_fullscreen() && !metaWindow.has_focus())
                this.page.addWindow(metaWindow, j + 1, i + 1);
        }));
        Stage.add_child(this.page);
    }

    destroy() {
        this.signals.forEach(signal => Display.disconnect(signal));
        Stage.remove_child(this.page);
    }
}



