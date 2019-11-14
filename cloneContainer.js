const Main = imports.ui.main;
const DND = imports.ui.dnd;

const { Clutter, St } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Clone } = Extension.imports.clone;
const { Log } = Extension.imports.utils.logger;

const style_class = 'clone-container';

var CloneContainer= class CloneContainer extends St.Bin {
    constructor(metaWindow) {
        super({
            style_class, 
            y_fill:false,
            reactive:true
        });
        this.draggable = DND.makeDraggable(this);
        this.metaWindow = metaWindow;
        this.connect('button-release-event', () => {
            Main.activateWindow(this.metaWindow);
        });
        if (metaWindow.has_focus())
            this.add_style_pseudo_class('focused');
        this.set_child(new Clone(metaWindow));
    }
}