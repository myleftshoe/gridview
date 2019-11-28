const Main = imports.ui.main;
const { GObject, Clutter, Meta, St } = imports.gi;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

const style_class = 'scrollbar';

class Scrollable extends Clutter.ScrollActor {
    constructor(actor, { 
        width = Main.uiGroup.get_width(),
        height = 10
    }) {
        super();
        this.scrollbar = new St.Widget({
            height,
            width,
            style_class
        });
        const thumbWidth = width * width/actor.get_width();
        const thumb = new St.Widget({
            height, 
            width:thumbWidth, 
            style_class: 'scrollbar-thumb', 
            reactive:true
        });
        this.scrollbar.add_child(thumb);
        const dragAction = new Clutter.DragAction({
            dragAxis:Clutter.DragAxis.X_AXIS,
            dragArea: new Clutter.Rect({
                origin: {x:0, y:0}, 
                size: {width:width - thumbWidth, height}
            })
        });
        dragAction.connect('drag-motion', (_dragAction, _thumb, _x, _y) => {
            const [x,y] = _thumb.get_position();
            this.scroll_to_point(new Clutter.Point({x: x * this.get_width()/width ,y: 0}))
        });
        this.set_easing_duration(250);
        thumb.add_action(dragAction);
        this.add_child(actor);
    }
}
