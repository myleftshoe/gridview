const Main = imports.ui.main;

const { GObject, Clutter, St } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const DnD = Extension.imports.dnd;
const { Clone } = Extension.imports.clone;
const { Log } = Extension.imports.utils.logger;


const style_class = 'fluidshell-cell';

var Cell = GObject.registerClass(
    {
        Signals: {
            'drag-begin': {
                param_types: [GObject.TYPE_OBJECT]
            },
            'drag-cancelled': {
                param_types: [GObject.TYPE_OBJECT]
            },
        }
    },
    class Cell extends St.Bin {
        _init(metaWindow) {
            super._init({
                style_class,
                y_fill: false,
                reactive: true
            });
            this.id = metaWindow.title;
            this.set_easing_duration(300)
            this.draggable = DnD.makeDraggable(this);
            // this.draggable._dragCancellable = false;
            this.draggable.connect('drag-begin', (dragActor) => {
                log('drag-begin')
                dragActor.actor.set_easing_duration(0);
                this.emit('drag-begin', this )
            })
            this.draggable.connect('drag-cancelled', (dragActor) => {
                log('drag-cancelled')
                dragActor.actor.set_easing_duration(300);
                this.emit('drag-cancelled', this )
            })
            this.draggable.connect('drag-end', (dragActor) => {
                log('drag-end')
                dragActor.actor.set_easing_duration(300);
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