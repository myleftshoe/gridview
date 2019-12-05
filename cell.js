const Main = imports.ui.main;

const { GObject, Clutter, Meta, St } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DnD = Extension.imports.dnd;
const { Clone } = Extension.imports.clone;
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
            WindowUtils.setTitleBarVisibility(this.metaWindow, false);
            this.metaWindowActor = this.metaWindow.get_compositor_private();
            this.metaWindow.maximize(Meta.MaximizeFlags.VERTICAL);
            this.clone = new Clone(this.metaWindow);
            const b = new St.Label({
                text: this.metaWindow.title,
                style_class: 'button',
                x_align: St.Align.END,
            });
            // b.set_x_align(2)
            this.add_child(b);
            
            // if (metaWindow.has_focus())
            //     this.add_style_pseudo_class('focused');
            this.add_child(this.clone);
        }
    }
);