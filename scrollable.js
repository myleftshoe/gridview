const Main = imports.ui.main;
const { GObject, Clutter, Meta, St } = imports.gi;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

const style_class = 'scrollable';

var Scrollable = GObject.registerClass({},
    class Scrollable extends St.Widget {
        _init() {
            super._init({style_class});
            scrollContainer = new Clutter.ScrollActor();

            const thumbWidth = 1920 * 1920/global.gridView.get_width();
            thumb = new St.Widget({height:10, width:thumbWidth, style_class: 'thumb', reactive:true});
            const dragAction = new Clutter.DragAction({
                dragAxis:Clutter.DragAxis.X_AXIS,
                dragArea: new Clutter.Rect({origin: {x:0, y:0}, size: {width:1920 - thumbWidth, height:10}})
            });
            dragAction.connect('drag-motion', (_dragAction, _thumb, _x, _y) => {
                // const [x,y] = event.get_coords();
                const [x,y] = _thumb.get_position();
                scrollContainer.scroll_to_point(new Clutter.Point({x: x * scrollContainer.get_width()/1920 ,y: 0}))
            })
            thumb.add_action(dragAction);
        
        }
        // destroy() {
        //     this.remove_all_children();
        // }
    }
);
