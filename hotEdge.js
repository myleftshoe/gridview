const Main = imports.ui.main;

const { GObject, Clutter, Meta, St } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();

const style_class = 'hot-edge';

var HotTop = GObject.registerClass({},
    class HotTop extends St.Widget {
        _init({width = 10}) {
            super._init({
                height: width,
                width: global.stage.get_width(),
                style_class,
                reactive:true
            });
            Main.layoutManager.addChrome(this, { affectsStruts: true });
            global.stage.add_child(this);
        }
        _destroy() {
            Main.layoutManager.removeChrome();
            global.stage.remove_child(this);
        }
    }
);

var HotBottom = GObject.registerClass({},
    class HotBottom extends St.Widget {
        _init({width = 10}) {
            super._init({
                height: width,
                width: global.stage.get_width(),
                y: global.stage.get_height() - width,
                style_class,
                reactive:true
            });
            Main.layoutManager.addChrome(this, { affectsStruts: true });
            global.stage.add_child(this);
        }
    }
);

var HotLeft = GObject.registerClass({},
    class HotLeft extends St.Widget {
        _init({width = 10}) {
            super._init({
                height: global.stage.get_height(),
                width: width,
                style_class,
                reactive:true
            });
            Main.layoutManager.addChrome(this, { affectsStruts: true });
            global.stage.add_child(this);
        }
    }
);

var HotRight = GObject.registerClass({},
    class HotRight extends St.Widget {
        _init({width = 10}) {
            super._init({
                height: global.stage.get_height(),
                width: width,
                x: global.stage.get_width() - width,
                style_class,
                reactive:true
            });
            Main.layoutManager.addChrome(this, { affectsStruts: true });
            global.stage.add_child(this);
        }
    }
);

