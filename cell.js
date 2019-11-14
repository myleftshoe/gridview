const Main = imports.ui.main;

const { GObject, Clutter, St } = imports.gi;

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
                reactive: true
            });
            this.id = metaWindow.title;
            this.metaWindow = metaWindow;
            this.connect('button-release-event', () => {
                Main.activateWindow(this.metaWindow);
            });
            if (metaWindow.has_focus())
                this.add_style_pseudo_class('focused');
            this.set_child(new Clone(metaWindow));
        }
    }
);