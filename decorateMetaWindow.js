const { Clutter, St } = imports.gi;
const Main = imports.ui.main;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const WindowUtils = Extension.imports.windows;
const { Titlebar } = Extension.imports.titlebar;


const decorateMetaWindow = function(metaWindow) {
    
    const metaWindowActor = metaWindow.get_compositor_private();
    const { width, padding } = WindowUtils.getGeometry(metaWindow);
    
    const hotspot = new St.Widget({
        name: 'hotspot',
        reactive:true,
        style_class: 'hotspot',
        width: width,
        height: padding.top + 20,
        x: padding.left,
        y: -20
    });
    hotspot.connect('enter-event', () => {
        titlebar.show(true, () => {
            Main.layoutManager.trackChrome(titlebar);
        });
    });
    hotspot.connect('leave-event', (actor, event) => {
        const enteredActor = event.get_related(); 
        if (enteredActor.name === 'titlebar') return;
        titlebar.hide(true, () => {
            Main.layoutManager.untrackChrome(titlebar);
        });
    });
    const titlebar = new Titlebar({
            name: 'titlebar',
            reactive:true,
            height:40,
            scale_y: 0,
            visible: false,
            style: `margin: ${padding.top -1}px ${padding.left-1}px`
        },
        metaWindow
    );
    titlebar.title = metaWindow.get_description();
    titlebar.connect('leave-event', (actor, event) => {
        const enteredActor = event.get_related(); 
        if (titlebar.contains(enteredActor) || enteredActor.name === 'hotspot' ) return;
        titlebar.hide(true, () => {
            Main.layoutManager.untrackChrome(titlebar);
        });
    })

    titlebar.closeButton.connect('clicked', () => {
        metaWindow.delete(global.get_current_time());
    });

    const widthConstraint = new Clutter.BindConstraint({
        source: metaWindowActor,
        coordinate: Clutter.BindCoordinate.WIDTH,
    });
    titlebar.add_constraint(widthConstraint);

    metaWindowActor.add_child(hotspot);
    metaWindowActor.add_child(titlebar);
}