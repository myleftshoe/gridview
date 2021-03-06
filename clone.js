const { Clutter, Shell, St } = imports.gi;
const Tweener = imports.ui.tweener;
const Main = imports.ui.main;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Log } = Extension.imports.utils.logger;

const [scale_x, scale_y] = [1, 1];

const style_class = 'clone';

var Clone = class Clone extends St.Widget {

    constructor(metaWindow) {

        super({ 
            style_class,
            reactive: false 
        });

        const source = metaWindow.get_compositor_private();
        const clone = new Clutter.Clone({ source });



        const oldFrameRect = metaWindow.get_frame_rect();
        const actorContent = Shell.util_get_content_for_window_actor(source, oldFrameRect);
        this.set_content(source);
        this.set_offscreen_redirect(Clutter.OffscreenRedirect.ALWAYS);
        this.set_position(oldFrameRect.x, oldFrameRect.y);
        this.set_size(oldFrameRect.width, oldFrameRect.height);



        // const br = metaWindow.get_buffer_rect();
        // const fr = metaWindow.get_frame_rect(); 

        // this.translation_y = br.y - fr.y;
        
        // const marginX = 20 - Math.round((br.width - fr.width) / 2);
        // // this.set_margin(new Clutter.Margin({left:marginX, right:marginX}))
        // this.set_margin_left(marginX);
        // this.set_margin_right(marginX);

        // Show entire window even if part of it is offscreen.
        // clone.remove_clip();
        this.set_child(clone);
        
    //     Tweener.addTween(clone, {
    //         scale_x,
    //         scale_y,
    //         delay: 0,
    //         time: .3,
    //         transition: 'easeOutQuad',
    //         onUpdate: () => {
    //             const { width, height, scale_x, scale_y } = clone;
    //             this.set_size(width * scale_x, height * scale_y);
    //         },
    //         // onUpdateScope: this,
    //     });

    }
}
