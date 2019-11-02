const Main = imports.ui.main;
const { Clutter } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Log } = Extension.imports.utils.logger;

const defaultHeight = 300;

var Clone = class Clone extends Clutter.Actor {

    constructor(metaWindow) {

        super({reactive:true});

        const source = metaWindow.get_compositor_private();
        const clone = new Clutter.Clone({source});

        const height = defaultHeight;
        const scaleFactor = clone.get_height() / height;
        const width = clone.get_width() / scaleFactor;
        clone.set_size(width, height);
        // Show entire window even if part of it is offscreen.
        clone.remove_clip();

        // Make this respond to events reliably. trackChrome stops underlying
        // windows stealing pointer events.
        Main.layoutManager.trackChrome(this);

        const clickAction = new Clutter.ClickAction(); 
        clickAction.connect('clicked', () => {
            Main.activateWindow(metaWindow)
        }); 
        this.add_action(clickAction);

        Log.properties(metaWindow);
        this.add_actor(clone);
    }
    destroy() {
        // TODO: disconnect events
    }
}
