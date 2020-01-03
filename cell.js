const Main = imports.ui.main;
const { GObject, Clutter, Meta, St, Shell } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DnD = Extension.imports.dnd;
const { decorateMetaWindow } = Extension.imports.decorateMetaWindow;
const WindowUtils = Extension.imports.windows;
const { content } = Extension.imports.sizing;
// const { Clone } = Extension.imports.clone;
const { Log } = Extension.imports.utils.logger;

const style_class = 'gridview-cell';

const layout_manager = new Clutter.BinLayout({
    x_align: Clutter.BinAlignment.FILL,
    y_align: Clutter.BinAlignment.START,
});

var Cell = GObject.registerClass(
    {},
    class Cell extends St.Widget {
        _init(metaWindow) {
            super._init({
                style_class,
                reactive: true,
                layout_manager,
                y_align: Clutter.ActorAlign.CENTER,

            });
            this.metaWindow = metaWindow;
            WindowUtils.setTitleBarVisibility(this.metaWindow, false);
            this.metaWindow.unmaximize(Meta.MaximizeFlags.BOTH);

            const { x, width } = WindowUtils.getGeometry(this.metaWindow);
            this.metaWindow.move_resize_frame(true, x, content.margin, width, content.height);

            this.metaWindowActor = this.metaWindow.get_compositor_private();
            this.metaWindowActor.hide();
    
            // this.metaWindowActor.no_shadow = true;
            this.metaWindowActor.shadow_mode = Meta.ShadowMode.FORCED_OFF;
            this.clone = new Clutter.Clone({source: this.metaWindowActor});
            const { padding } = WindowUtils.getGeometry(this.metaWindow);
            this.clone.translation_y = -padding.top;
            this.add_child(this.clone);

            decorateMetaWindow(this.metaWindow);
            this.isFullscreen = false;
            // this.metaWindow.connect('size-changed', () => {
            //     log('is_fullscreen', this.metaWindow.is_fullscreen())
            //     log('is_monitor_sized', this.metaWindow.is_monitor_sized())
            //     log('is_maximized', this.metaWindow.get_maximized());
            //     this.isFullscreen = true;
            // });
        }
        isFullsized() {
            return (this.metaWindow.is_fullscreen() || this.metaWindow.is_monitor_sized())
        }
        alignMetaWindow() {
            const [x, y] = this.get_transformed_position();
            const { padding } = WindowUtils.getGeometry(this.metaWindow);
            this.metaWindow.move_frame(true, x + padding.left, y);
        }
        showMetaWindow() {
            this.alignMetaWindow();
            this.metaWindowActor.show();
            this.metaWindowActor.raise_top();
        }
        get isPartiallyVisible() {
            const [x] = this.get_transformed_position();
            return (x >= -20);
        }
        get isFullyVisible() {
            const [x] = this.get_transformed_position();
            const [width] = this.get_transformed_size();
            return (x > -20 && x + width <= global.stage.get_width() + 20);
        }
    }
);


