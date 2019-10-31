const { Clutter } = imports.gi;

var WindowClone = class WindowClone extends Clutter.Actor {

    constructor(metaWindow) {
        super();
        const metaWindowActor = metaWindow.get_compositor_private();
        const clone = new Clutter.Clone({source: metaWindowActor});
        clone.set_size(200,200);
        this.add_actor(clone);

    }
}
