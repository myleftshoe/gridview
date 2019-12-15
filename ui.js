const { Meta } = imports.gi;

var UI = class UI {

    static get WorkspaceManager() {
        return global.workspace_manager
    }

    static get workspaces() {
        const workspaces = [];
        for (let i = 0; i < UI.WorkspaceManager.n_workspaces; i++) {
            workspaces.push(UI.WorkspaceManager.get_workspace_by_index(i));
        }
        return workspaces;
    }

    static get activeWorkspace() {
        return UI.WorkspaceManager.get_active_workspace();
    }

    // static get windows() {
    //     const windows = [];
    //     UI.workspaces.forEach(workspace => windows.push(...workspace.list_windows()));
    //     return windows;        
    // }

    static get windows() {
        return global.get_window_actors()
            .map((actor) => actor.get_meta_window())
            .filter(metaWindow => !metaWindow.is_override_redirect())
            .filter(metaWindow => !metaWindow.is_client_decorated());
    }

    // static get fullscreenWindows() {
    //     return UI.windows.filter(win => win.is_fullscreen());
    // }

    static get inFullscreen() {
        let nb_monitors = Display.get_n_monitors();
        let inFullscreen = false;
        for (let i = 0; i < nb_monitors; i++) {
            if (Display.get_monitor_in_fullscreen(i)) {
                inFullscreen = true;
                break;
            }
        }
        return inFullscreen;
    }


    static getWorkspaceWindows(workspace) {
        // We ignore skip-taskbar windows in switchers, but if they are attached
        // to their parent, their position in the MRU list may be more appropriate
        // than the parent; so start with the complete list ...
        const windows = global.display.get_tab_list(Meta.TabList.NORMAL_ALL, workspace);
        // ... map windows to their parent where appropriate ...
        return windows.map(w => {
            return w.is_attached_dialog() ? w.get_transient_for() : w;
            // ... and filter out skip-taskbar windows and duplicates
        }).filter((w, i, a) => !w.skip_taskbar && a.indexOf(w) == i);
    }

}
