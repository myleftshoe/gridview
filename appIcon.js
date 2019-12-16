const { Clutter, Shell, St } = imports.gi;

const ICON_SIZE = 24;

var createAppIcon = function (metaWindow, size = ICON_SIZE) {
    let tracker = Shell.WindowTracker.get_default();
    let app = tracker.get_window_app(metaWindow);
    let appIcon = app ? app.create_icon_texture(size)
        : new St.Icon({
            icon_name: 'icon-missing',
            icon_size: size
        });
    appIcon.x_expand = appIcon.y_expand = true;
    appIcon.x_align = appIcon.y_align = Clutter.ActorAlign.END;

    return appIcon;
}
