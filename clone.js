const Main = imports.ui.main;
const { Clutter } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Log } = Extension.imports.utils.logger;

const initialScale = [.25, .25];

var Clone = class Clone extends Clutter.Actor {

    constructor(metaWindow) {

        super({reactive:true});

        const source = metaWindow.get_compositor_private();
        const clone = new Clutter.Clone({source});

        // Show entire window even if part of it is offscreen.
        clone.remove_clip();
        this.add_actor(clone);
        clone.set_scale(...initialScale)
        const [width, height] = clone.get_size();
        this.set_size(width * initialScale[0], height * initialScale[1]);

        // Make this respond to events reliably. trackChrome stops underlying
        // windows stealing pointer events.
        Main.layoutManager.trackChrome(this);

        const clickAction = new Clutter.ClickAction(); 
        clickAction.connect('clicked', () => {
            Main.activateWindow(metaWindow)
        }); 
        this.connect('scroll-event', (source, event) => {
            const direction = event.get_scroll_direction();
            if (direction > 1) return;
            let amount = 0.025;
            const [scaleX, scaleY] = clone.get_scale();
            if (direction === Clutter.ScrollDirection.UP) 
                amount = -amount;            
            clone.set_scale(scaleX + amount, scaleY + amount);
            this.set_size(...clone.get_transformed_size());

        }); 
        this.add_action(clickAction);

    }
    destroy() {
        // TODO: disconnect events
    }
}
