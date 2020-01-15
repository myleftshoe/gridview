const { Clutter, St } = imports.gi;
const Main = imports.ui.main;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const WindowUtils = Extension.imports.windows;
const { Titlebar } = Extension.imports.titlebar;


const decorateMetaWindow = function (metaWindow) {

    const metaWindowActor = metaWindow.get_compositor_private();
    const { padding } = WindowUtils.getGeometry(metaWindow);

    const titlebar = new Titlebar({
        name: 'titlebar',
        reactive: true,
        height: 38,
        scale_y: 1,
        visible: true,
        style: `margin: ${padding.top - 1}px ${padding.left - 1}px`,
        y: -38,
    },
        metaWindow
    );

    titlebar.closeButton.connect('clicked', () => {
        metaWindow.delete(global.get_current_time());
    });

    const widthConstraint = new Clutter.BindConstraint({
        source: metaWindowActor,
        coordinate: Clutter.BindCoordinate.WIDTH,
    });
    titlebar.add_constraint(widthConstraint);

    metaWindowActor.add_child(titlebar);
}