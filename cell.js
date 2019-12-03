const Main = imports.ui.main;

const { GObject, Clutter, Meta, St } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DnD = Extension.imports.dnd;
const { Clone } = Extension.imports.clone;
const { Log } = Extension.imports.utils.logger;


const style_class = 'gridview-cell';

var Cell = GObject.registerClass(
    {},
    class Cell extends St.Bin {
        _init(metaWindow) {
            super._init({
                style_class,
                y_fill: false,
                reactive: true,
            });
            this.id = metaWindow.title;
            this.metaWindow = metaWindow;
            this.metaWindowActor = this.metaWindow.get_compositor_private();
            this.metaWindow.maximize(Meta.MaximizeFlags.VERTICAL);
            // this.metaWindow.maximize(3);
            // this.connect('button-release-event', () => {
            //     this.metaWindow.move_frame(false,0,0);
            //     // Main.activateWindow(this.metaWindow);
            //     this.active = true;
            // });
            
            
            if (metaWindow.has_focus())
                this.add_style_pseudo_class('focused');
            this.set_child(new Clone(metaWindow));
        }
    }
);