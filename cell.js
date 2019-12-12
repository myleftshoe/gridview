const Main = imports.ui.main;

const { GObject, Clutter, Meta, St } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DnD = Extension.imports.dnd;
// const { Clone } = Extension.imports.clone;
const { Log } = Extension.imports.utils.logger;

const WindowUtils = Extension.imports.windows;


const style_class = 'gridview-cell';

var Cell = GObject.registerClass(
    {},
    class Cell extends St.BoxLayout {
        _init(metaWindow) {
            super._init({
                style_class,
                reactive: true,
                vertical:true,
            });
            this.id = metaWindow.title;
            this.metaWindow = metaWindow;
            WindowUtils.setTitleBarVisibility(this.metaWindow, true);
            this.metaWindow.maximize(Meta.MaximizeFlags.VERTICAL);
            this.metaWindowActor = this.metaWindow.get_compositor_private();
            this.clone = new Clutter.Clone({source: this.metaWindowActor});
            const bufferRect = this.metaWindow.get_buffer_rect();
            const frameRect = this.metaWindow.get_frame_rect();
            this.clone.translation_y = bufferRect.y - frameRect.y;
            this.add_child(this.clone);
        }
        alignMetaWindow() {
            const br = this.metaWindow.get_buffer_rect();
            const fr = this.metaWindow.get_frame_rect();
            const [nx, ny] = this.get_transformed_position();
            this.metaWindow.move_frame(true, nx + (br.width - fr.width) / 2 + this.clone.get_margin_left(), ny);
        }
    }
);