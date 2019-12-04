const { Clutter } = imports.gi;
const Tweener = imports.ui.tweener;
const Main = imports.ui.main;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Log } = Extension.imports.utils.logger;

const [scale_x, scale_y] = [1, 1];

var Clone = class Clone extends Clutter.Actor {

    constructor(metaWindow) {

        super({ reactive: false });

        const source = metaWindow.get_compositor_private();
        const clone = new Clutter.Clone({ source });

        const br = metaWindow.get_buffer_rect();
        const fr = metaWindow.get_frame_rect(); 

        this.translation_y = br.y - fr.y + 36;
        
        const marginX = 50 - Math.round((br.width - fr.width) / 2);
        // this.set_margin(new Clutter.Margin({left:marginX, right:marginX}))
        this.set_margin_left(marginX);
        this.set_margin_right(marginX);

        // Show entire window even if part of it is offscreen.
        clone.remove_clip();
        this.add_child(clone);
        
        Tweener.addTween(clone, {
            scale_x,
            scale_y,
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
}
