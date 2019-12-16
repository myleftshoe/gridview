const Main = imports.ui.main;
const { GObject, Clutter, Meta, St, Shell } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DnD = Extension.imports.dnd;
const { decorateMetaWindow } = Extension.imports.decorateMetaWindow;
const WindowUtils = Extension.imports.windows;
// const { Clone } = Extension.imports.clone;
const { Log } = Extension.imports.utils.logger;

const style_class = 'gridview-cell';

var Cell = GObject.registerClass(
    {},
    class Cell extends St.Widget {
        _init(metaWindow) {
            super._init({
                style_class,
                reactive: true,
            });
            this.layout_manager = new Clutter.BinLayout({
                x_align: Clutter.BinAlignment.FILL,
                y_align: Clutter.BinAlignment.START,

            });
            this.id = metaWindow.title;
            this.metaWindow = metaWindow;
            WindowUtils.setTitleBarVisibility(this.metaWindow, true);
            this.metaWindow.maximize(Meta.MaximizeFlags.VERTICAL);
            this.metaWindow.unmaximize(Meta.MaximizeFlags.HORIZONTAL);
            this.metaWindowActor = this.metaWindow.get_compositor_private();
            // this.metaWindowActor.no_shadow = true;
            this.metaWindowActor.shadow_mode = Meta.ShadowMode.FORCED_OFF;
            this.clone = new Clutter.Clone({source: this.metaWindowActor});
            const { padding } = WindowUtils.getGeometry(this.metaWindow);
            this.clone.translation_y = -padding.top;
            // Log.properties(this.metaWindowActor);
            this.add_child(this.clone);

            decorateMetaWindow(this.metaWindow);

        }
        alignMetaWindow() {
            const [x, y] = this.get_transformed_position();
            const { padding } = WindowUtils.getGeometry(this.metaWindow);
            this.metaWindow.move_frame(true, x + padding.left, y);
        }
    }
);


