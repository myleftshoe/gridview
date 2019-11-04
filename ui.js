var UI = class UI {

    static get WorkspaceManager() { 
        return global.workspace_manager 
    }
    
    static get workspaces() {
        const workspaces = [];
        for(let i = 0; i < UI.WorkspaceManager.n_workspaces; i++) {
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
        return global.get_window_actors().map((actor) => actor.get_meta_window());
    }
    
    // static get fullscreenWindows() {
    //     return UI.windows.filter(win => win.is_fullscreen());
    // }

    static get inFullscreen() {
        let nb_monitors = Display.get_n_monitors();
        let inFullscreen = false;
        for (let i=0; i<nb_monitors; i++) {
            if (Display.get_monitor_in_fullscreen(i)) {
                inFullscreen = true;
                break;
            }
        }
        return inFullscreen;
    }

}
