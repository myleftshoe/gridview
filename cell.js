const Main = imports.ui.main;
const DnD = imports.ui.dnd;

const { GObject, Clutter, St } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Clone } = Extension.imports.clone;
const { Log } = Extension.imports.utils.logger;


const style_class = 'fluidshell-cell';

var Cell = GObject.registerClass({}, 
    class Cell extends St.Bin {
        _init(metaWindow) {
            super._init({
                style_class, 
                y_fill:false,
                reactive:true
            });
            this.set_easing_duration(3000)
            this.draggable = DnD.makeDraggable(this);
            this.draggable.connect('drag-begin', () => {
                log('drag-begin')
            })
            // DnD.addDragMonitor({
            //     dragMotion: () => {
            //         log('cell-drag-monitor');
            //         return 2;
            // }});
            this.metaWindow = metaWindow;
            this.connect('button-release-event', () => {
                Main.activateWindow(this.metaWindow);
            });
            // const clickAction = new Clutter.ClickAction(); 
            // clickAction.connect('clicked', () => {
            //     Main.activateWindow(this.metaWindow)
            // }); 
            // this.add_action(clickAction);
            // Log.properties(this);
            if (metaWindow.has_focus())
                this.add_style_pseudo_class('focused');
            this.set_child(new Clone(metaWindow));
        }
    }
);