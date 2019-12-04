const Main = imports.ui.main;
const { GObject, Clutter, Meta, St } = imports.gi;
const Extension = imports.misc.extensionUtils.getCurrentExtension();

const style_class = 'scrollbar';

var Scrollable = GObject.registerClass({}, 
    class Scrollable extends Clutter.ScrollActor {
        _init(actor, { 
            width = Main.uiGroup.get_width(),
            height = 10
        }) {
            super._init();
            this._content = actor;
            this._width = width;
            this._height = height;
            this.scrollbar = new St.Widget({
                height: this._height,
                width: this._width,
                style_class
            });
            this.thumb = new St.Widget({
                height: this._height,
                width: this._width,
                style_class: 'scrollbar-thumb', 
                reactive:true
            });
            this.scrollbar.add_child(this.thumb);
            this.dragAction = new Clutter.DragAction({
                dragAxis:Clutter.DragAxis.X_AXIS,
            });
            this.dragAction.connect('drag-begin', () => {
                this.scrollbar.add_style_pseudo_class('pressed');
                this.thumb.add_style_pseudo_class('pressed');
            });
            this.dragAction.connect('drag-end', () => {
                this.scrollbar.remove_style_pseudo_class('pressed');
                this.thumb.remove_style_pseudo_class('pressed');
            });
            this.dragAction.connect('drag-motion', (_dragAction, _thumb, _x, _y) => {
                const [x,y] = _thumb.get_position();
                this.scroll_to_point(new Clutter.Point({x: x * this.get_width()/this._width, y: 0}))
            });
            this.set_easing_duration(250);
            this.thumb.add_action(this.dragAction);
            this.add_child(this._content);
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
    }
);