const { Clutter, GLib, Meta, Shell, St } = imports.gi;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Signals = imports.signals;
const Background = imports.ui.background;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { GridView } = Extension.imports.gridView;
const { Scrollable } = Extension.imports.scrollable;
const { Log } = Extension.imports.utils.logger;

const style_class = 'gridview-container';

var Container = GObject.registerClass({},
    class Container extends St.Widget {
        _init() {
            super._init({y:10, style_class});
            hotTop = new St.Widget({
                height: 46,
                width: 1920,
                style_class: 'overlay',
                reactive: true
            });
            // global.window_group.set_margin(new Clutter.Margin({top:60}));
            Main.layoutManager.addChrome(hotTop, { affectsStruts: true });
            hotTop.connect('enter-event', (actor, event) => {
                if (!global.gridView) {
                    show();
                    return;
                }
            });
            global.stage.add_child(hotTop);
        
        }            
        show() {
        }
        hide() {
        }
    }
);
