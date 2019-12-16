const Main = imports.ui.main;
const { GObject, Clutter, Meta, St } = imports.gi;
const Tweener = imports.ui.tweener;

const Extension = imports.misc.extensionUtils.getCurrentExtension();

const style_class = 'hot-edge';

var HotTop = GObject.registerClass({},
    class HotTop extends St.BoxLayout {
        _init({width = 10, onClick}) {
            super._init({
                height: width,
                width: global.stage.get_width(),
                style_class,
                reactive:true,
                y: 1 - width,
            });
            // this.connect('enter-event', () => {
            //     Tweener.addTween(this, {
            //         y:0,
            //         time:.25,
            //     });
            // });
            // this.connect('leave-event', () => {
            //     Tweener.addTween(this, {
            //         y: 1 - width,
            //         time:.25,
            //     });
            // });
            Main.layoutManager.addChrome(this, { affectsStruts: false });
            makeClickable(this, onClick);
        }
    }
);

var HotBottom = GObject.registerClass({},
    class HotBottom extends St.Widget {
        _init({width = 10, onClick}) {
            super._init({
                height: width,
                width: global.stage.get_width(),
                y: global.stage.get_height() - width,
                style_class,
                reactive:true
            });
            Main.layoutManager.addChrome(this, { affectsStruts: false });
            makeClickable(this, onClick);
        }
    }
);

var HotLeft = GObject.registerClass({},
    class HotLeft extends St.Widget {
        _init({width = 10, onClick}) {
            super._init({
                height: global.stage.get_height(),
                width: width,
                style_class,
            });
            Main.layoutManager.addChrome(this, { affectsStruts: true });
            makeClickable(this, onClick);
        }
    }
);

var HotRight = GObject.registerClass({},
    class HotRight extends St.Widget {
        _init({width = 10, onClick}) {
            super._init({
                height: global.stage.get_height(),
                width: width,
                x: global.stage.get_width() - width,
                style_class,
            });
            Main.layoutManager.addChrome(this, { affectsStruts: true });
            makeClickable(this, onClick);
        }
    }
);

function makeClickable(actor, onClick) {
    if (typeof onClick !== 'function') return;
    actor.set_reactive(true);
    const clickAction = new Clutter.ClickAction();
    clickAction.connect('clicked', onClick); 
    actor.add_action(clickAction);
    return actor;
}