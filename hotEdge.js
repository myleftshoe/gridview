const Main = imports.ui.main;
const { GObject, Clutter, Meta, St } = imports.gi;
const Tweener = imports.ui.tweener;

const Extension = imports.misc.extensionUtils.getCurrentExtension();

const style_class = 'hot-edge';

var HotTop = GObject.registerClass({},
    class HotTop extends St.BoxLayout {
        _init({width = 10}) {
            super._init({
                height: width,
                width: global.stage.get_width(),
                style_class,
                reactive:true,
                y: 1 - width,
            });
            this.connect('enter-event', () => {
                log('enter')
                Tweener.addTween(this, {
                    y:0,
                    time:.25,
                });
            });
            this.connect('leave-event', () => {
                log('leave')
                Tweener.addTween(this, {
                    y: 1 - width,
                    time:.25,
                });
            });
            Main.layoutManager.addChrome(this, { affectsStruts: false });
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
            Main.layoutManager.addChrome(this, { affectsStruts: false });
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
        }
    }
);

