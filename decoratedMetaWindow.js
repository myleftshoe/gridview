const { Clutter, St } = imports.gi;
const Main = imports.ui.main;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const WindowUtils = Extension.imports.windows;
const { TitleBar } = Extension.imports.titleBar;
const Tweener = imports.ui.tweener;


const decorateMetaWindow = function(metaWindow) {
    
    const metaWindowActor = metaWindow.get_compositor_private();
    const { width, padding } = WindowUtils.getGeometry(metaWindow);
    
    const hotTop = new St.Widget({
        reactive:true,
        style_class: 'titlebar-hotspot',
        width: width,
        height: padding.top + 20,
        x: padding.left,
        y: -20
    });
    let isexpanded = false;
    hotTop.connect('enter-event', () => {
        if (isexpanded) return;
        Tweener.addTween(titleBar, {
            scale_y: 1,
            time: .25,
            onComplete: () => {
                isexpanded = true;
                Main.layoutManager.trackChrome(titleBar);
            }
        });
    });

    const titleBar = new TitleBar({
            reactive:true,
            height:40,
            scale_y: 0,
            style: `margin: ${padding.top -1}px ${padding.left-1}px`
        },
        metaWindow
    );
    titleBar.title = metaWindow.title;
    titleBar.connect('leave-event', (actor, event) => {
        const r = event.get_related(); 
        if (titleBar.contains(event.get_related())) return;
        Tweener.addTween(titleBar, {
            scale_y: 0,
            time: .25,
            delay: 1,
            onComplete: () => {
                isexpanded = false;
                Main.layoutManager.untrackChrome(titleBar);
            }
        });
    })

    titleBar.closeButton.connect('clicked', () => {
        // log('fffffffsfsdfsdfsdfsdfds');
        metaWindow.delete(global.get_current_time());
    });

    const widthConstraint = new Clutter.BindConstraint({
        source: metaWindowActor,
        coordinate: Clutter.BindCoordinate.WIDTH,
    });
    titleBar.add_constraint(widthConstraint);

    metaWindowActor.add_child(hotTop);
    metaWindowActor.add_child(titleBar);
}