const Main = imports.ui.main;
const { Clutter } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Log } = Extension.imports.utils.logger;

const initialScale = [.1, .1];

var Clone = class Clone extends Clutter.Actor {

    constructor(metaWindow) {

        super({reactive:false});

        Log.properties(metaWindow);
        const source = metaWindow.get_compositor_private();
        const clone = new Clutter.Clone({source});

        // Show entire window even if part of it is offscreen.
        clone.remove_clip();
        this.add_actor(clone);
        clone.set_scale(...initialScale)
        const [width, height] = clone.get_size();
        this.set_size(width * initialScale[0], height * initialScale[1]);

    }
    destroy() {
        // TODO: disconnect events
    }
}
