const { Clutter } = imports.gi;

var CloneActor = class CloneActor extends Clutter.Actor {

    constructor(metaWindow) {
        super();
        const source = metaWindow.get_compositor_private();
        const clone = new Clutter.Clone({source});
        clone.set_size(200,200);
        this.add_actor(clone);
    }
}
