const Main = imports.ui.main;

const { GObject, Clutter, Meta, St, Shell } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DnD = Extension.imports.dnd;
const { decorateMetaWindow } = Extension.imports.decoratedMetaWindow;
// const { Clone } = Extension.imports.clone;
const { Log } = Extension.imports.utils.logger;

const WindowUtils = Extension.imports.windows;


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
            WindowUtils.setTitleBarVisibility(this.metaWindow, false);
            this.metaWindow.maximize(Meta.MaximizeFlags.VERTICAL);
            this.metaWindow.unmaximize(Meta.MaximizeFlags.HORIZONTAL);
            this.metaWindowActor = this.metaWindow.get_compositor_private();
            // this.metaWindowActor.no_shadow = true;
            this.metaWindowActor.shadow_mode = Meta.ShadowMode.FORCED_OFF;
            this.clone = new Clutter.Clone({source: this.metaWindowActor});
            const bufferRect = this.metaWindow.get_buffer_rect();
            const frameRect = this.metaWindow.get_frame_rect();
            this.clone.translation_y = bufferRect.y - frameRect.y;
            Log.properties(this.metaWindowActor);
            this.add_child(this.clone);

            decorateMetaWindow(this.metaWindow);

        }
        alignMetaWindow() {
            const br = this.metaWindow.get_buffer_rect();
            const fr = this.metaWindow.get_frame_rect();
            const [nx, ny] = this.get_transformed_position();
            this.metaWindow.move_frame(true, nx + (br.width - fr.width) / 2 + this.clone.get_margin_left(), ny);
        }
    }
);


