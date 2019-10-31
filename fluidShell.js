const { Clutter } = imports.gi;
const Main = imports.ui.main;
const { Tweener } = imports.ui.tweener;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Grid } = Extension.imports.grid;
const { Page } = Extension.imports.page;
const { Photo } = Extension.imports.photo;
const { WindowClone } = Extension.imports.windowClone;
const { Log } = Extension.imports.utils.logger;

const WorkspaceManager = global.workspace_manager;
const Display = global.display;

var FluidShell = class FuildShell {

    constructor() {

        const page = new Page();
        page.set_layout_manager(new Grid());

        const activeWorkspace = WorkspaceManager.get_active_workspace();
        // activeWorkspace.connect('window-added', (workspace, metaWindow) => {
        Display.connect('window-created', (display, metaWindow) => {
            // const windows = activeWorkspace.list_windows();
            // const windows = global.get_window_actors();
            // let mw = windows[1];
            // let mw = metaWindow;

            const cloneActor = new WindowClone(metaWindow);

            const photo = new Photo({
                style_class:'testb', 
                y_fill:false
            });

            photo.set_child(cloneActor);
            page.add_child(photo);
        });

        global.stage.add_child(page);

        // activeWorkspace.connect('window-removed', (display, metaWindow) => {
        //     log('fffffffffffffffffffffffffffffffffffffff');
        // });

    }

    destroy() {
        // Main.layoutManager.removeChrome(this.rightPanel);
    }
}
