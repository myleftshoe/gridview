const { Clutter, Meta } = imports.gi;
const Main = imports.ui.main;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Page } = Extension.imports.page;
const { Log } = Extension.imports.utils.logger;

const WorkspaceManager = global.workspace_manager;
const Display = global.display;

var FluidShell = class FuildShell {

    constructor() {

        const activeWorkspace = WorkspaceManager.get_active_workspace();

        WorkspaceManager.connect('active-workspace-changed', (workspace) => {
            log('yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy')
            const activeWorkspace = WorkspaceManager.get_active_workspace();
            const windows = activeWorkspace.list_windows();
            // global.stage.remove_child(this.page);
            // this.page = new Page();
            this.page.remove_all_children();
            windows.forEach(metaWindow => {
                this.page.addWindow(metaWindow);
            });
            // global.stage.add_child(this.page);
        })

        this.page = new Page();
        global.stage.add_child(this.page);

        // activeWorkspace.connect('window-added', (workspace, metaWindow) => {
        Display.connect('window-created', (display, metaWindow) => {
            this.page.addWindow(metaWindow);
        });
    
        activeWorkspace.connect('window-removed', (workspace, metaWindow) => {
            this.page.removeWindow(metaWindow);
        });

    }

    destroy() {
        global.stage.remove_child(this.page);
    }
}
