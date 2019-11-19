const { Clutter } = imports.gi;
const Tweener = imports.ui.tweener;
const Main = imports.ui.main;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Log } = Extension.imports.utils.logger;

const initialScale = [.1, .1];

var Clone = class Clone extends Clutter.Actor {

    constructor(metaWindow) {

        super({ reactive: false });

        const source = metaWindow.get_compositor_private();
        const clone = new Clutter.Clone({ source });

        // Show entire window even if part of it is offscreen.
        clone.remove_clip();
        this.add_actor(clone);
        Tweener.addTween(clone, {
            scale_x: initialScale[0],
            scale_y: initialScale[1],
            delay: 0,
            time: .3,
            transition: 'easeOutQuad',
            onUpdate: () => {
                const { width, height, scale_x, scale_y } = clone;
                this.set_size(width * scale_x, height * scale_y);
            },
            // onUpdateScope: this,
        });

    }
    destroy() {
        // TODO: disconnect events
    }
}
