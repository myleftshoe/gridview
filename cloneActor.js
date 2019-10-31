const { Clutter } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Log } = Extension.imports.utils.logger;

const defaultHeight = 200;

var CloneActor = class CloneActor extends Clutter.Actor {

    constructor(metaWindow) {
        super();
        const source = metaWindow.get_compositor_private();
        const clone = new Clutter.Clone({source});
        const height = defaultHeight;
        // Log.properties(source);
        const scaleFactor = clone.get_height() / height;
        const width = clone.get_width() / scaleFactor;
        clone.set_size(width, height);
        this.add_actor(clone);
    }
}
