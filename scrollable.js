const Main = imports.ui.main;
const { GObject, Clutter, Meta, St } = imports.gi;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

const style_class = 'scrollbar';

var Scrollable = GObject.registerClass(
    {
        Signals: {
            'scroll-begin': {
                param_types: []
            },
        }
    }, 
    class Scrollable extends Clutter.ScrollActor {
        _init(actor, { 
            width = Main.uiGroup.get_width(),
            height = 10
        }) {
            super._init({scroll_mode: Clutter.ScrollMode.HORIZONTALLY});
            this._content = actor;
            this._width = width;
            this._height = height;
            this.scrollbar = new St.Widget({
                height: this._height,
                width: this._width,
                style_class
            });
            this.thumb = new St.Widget({
                height: this._height - 3,
                width: this._width,
                style_class: 'scrollbar-thumb', 
                reactive:true
            });
            this.makeThumbDraggable();
            this.scrollbar.add_child(this.thumb);
            this.set_easing_duration(250);
            this.add_child(this._content);
        }
        makeThumbDraggable() {
            this.dragAction = new Clutter.DragAction({
                dragAxis:Clutter.DragAxis.X_AXIS,
            });
            this.dragAction.connect('drag-begin', (a,b) => {
                this.emit('scroll-begin');
                this.scrollbar.add_style_pseudo_class('pressed');
                this.thumb.add_style_pseudo_class('pressed');
            });
            this.dragAction.connect('drag-end', () => {
                this.scrollbar.remove_style_pseudo_class('pressed');
                this.thumb.remove_style_pseudo_class('pressed');
            });
            this.dragAction.connect('drag-motion', () => {
                const [x] = this.thumb.get_position();
                this.scroll_to_point(new Clutter.Point({x: x * this.get_parent().width/this._width, y: 6}))
            });
            this.thumb.add_action(this.dragAction);
        }
        update() {
            const thumbWidth = this._width * this._width/this._content.get_width();
            log(this._content.get_width())
            this.thumb.set_width(thumbWidth);
            this.dragAction.set_drag_area(new Clutter.Rect({
                origin: {x:0, y:0}, 
                size: {width: this._width - thumbWidth, height: this._height}
            }));
        }
        scrollToActor(actor) {
            const [x,y] = actor.get_position();
            const [width, height] = actor.get_size();
            log(x,y, width,height)
            this.scroll_to_rect(new Clutter.Rect({origin: {x: x - (Main.uiGroup.get_width() - width) / 2, y}, size: {width, height}}));
            this.thumb.set_easing_duration(750)
            this.thumb.set_x(x / this.width * this.scrollbar.width);
            this.thumb.set_easing_duration(0)
        }
        onScrollEnd(callback) {
            const sig = this.connect('transitions-completed', () => {
                log('transitions-completed');
                this.disconnect(sig);
                callback();
            });
        }
    }
);