const Main = imports.ui.main;

const { GObject, Clutter, Meta, St } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DnD = Extension.imports.dnd;
const { Clone } = Extension.imports.clone;
const { Log } = Extension.imports.utils.logger;


const style_class = 'gridview-cell';

var Cell = GObject.registerClass(
    {},
    class Cell extends Clutter.Actor {
        _init(metaWindow) {
            super._init({
                // style_class,
                reactive: true,
            });
            this.id = metaWindow.title;
            this.metaWindow = metaWindow;
            this.metaWindowActor = this.metaWindow.get_compositor_private();
            this.metaWindow.maximize(Meta.MaximizeFlags.VERTICAL);
            this.clone = new Clone(this.metaWindow);
            
            // if (metaWindow.has_focus())
            //     this.add_style_pseudo_class('focused');
            this.add_child(this.clone);
        }
    }
);