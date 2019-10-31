const { Clutter } = imports.gi;

const size = [200, 100];

var CloneActor = class CloneActor extends Clutter.Actor {

    constructor(metaWindow) {
        super();
        const source = metaWindow.get_compositor_private();
        const clone = new Clutter.Clone({source});
        clone.set_size(...size);
        this.add_actor(clone);
    }
}
