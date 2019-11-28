const Main = imports.ui.main;
const { GObject, Clutter, Meta, St } = imports.gi;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

const style_class = 'scrollbar';


var Scrollbar = GObject.registerClass({},
    class Scrollbar extends St.Widget {
        _init(actor, { 
            width = 1920,
            height = 10 
        }) {
            super._init({
                height,
                width,
                style_class
            });
            this.scrollActor = new Clutter.ScrollActor();
            const thumbWidth = width * width/actor.get_width();
            this.thumb = new St.Widget({
                height, 
                width:thumbWidth, 
                style_class: 'scrollbar-thumb', 
                reactive:true
            });
            this.add_child(this.thumb);
            const dragAction = new Clutter.DragAction({
                dragAxis:Clutter.DragAxis.X_AXIS,
                dragArea: new Clutter.Rect({origin: {x:0, y:0}, size: {width:width - thumbWidth, height}})
            });
            dragAction.connect('drag-motion', (_dragAction, _thumb, _x, _y) => {
                // const [x,y] = event.get_coords();
                const [x,y] = _thumb.get_position();
                log(x, this.scrollActor.get_width(), x * this.scrollActor.get_width()/1920) 
                this.scrollActor.scroll_to_point(new Clutter.Point({x: x * this.scrollActor.get_width()/1920 ,y: 0}))
            })
            this.thumb.add_action(dragAction);
            this.scrollActor.add_child(actor);
        }
    }
);
