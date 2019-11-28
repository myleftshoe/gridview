const Main = imports.ui.main;

const { GObject, Clutter, Meta, St } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();

const style_class = 'hot-top';

var HotTop = GObject.registerClass({},
    class HotTop extends St.Widget {
        _init({width = 10}) {
            super._init({
                height: width,
                width: 1920,
                style_class,
                reactive:true
            });
            log('ttttttttttttt',Main.uiGroup.get_width())
            Main.layoutManager.addChrome(this, { affectsStruts: true });
            global.stage.add_child(this);
        }
        // destroy() {
        //     this.remove_all_children();
        // }
    }
);
