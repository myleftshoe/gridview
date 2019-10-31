const { Clutter, Meta } = imports.gi;
const Main = imports.ui.main;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Page } = Extension.imports.page;
const { Clone } = Extension.imports.clone;
const { Log } = Extension.imports.utils.logger;

const WorkspaceManager = global.workspace_manager;
const Display = global.display;

var FluidShell = class FuildShell {

    constructor() {

        this.page = new Page();
        const windows  = new Map();
        const activeWorkspace = WorkspaceManager.get_active_workspace();
        // activeWorkspace.connect('window-added', (workspace, metaWindow) => {
        Display.connect('window-created', (display, metaWindow) => {
            if (metaWindow.window_type !== Meta.WindowType.NORMAL)
                return;
            // const windows = activeWorkspace.list_windows();
            // const windows = global.get_window_actors();
            const clone = new Clone(metaWindow);
            this.page.add_child(clone);
            windows.set(metaWindow, {page: this.page, clone})
        });

        global.stage.add_child(this.page);

        activeWorkspace.connect('window-removed', (workspace, metaWindow) => {
            const {page, clone} = windows.get(metaWindow);
            page.remove_child(clone);
            windows.delete(metaWindow);
        });

    }

    destroy() {
        global.stage.remove_child(this.page);
        // Main.layoutManager.removeChrome(this.rightPanel);
    }
}
