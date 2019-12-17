const Main = imports.ui.main;
const { GObject, Clutter, Meta, St } = imports.gi;
const Tweener = imports.ui.tweener;

const Extension = imports.misc.extensionUtils.getCurrentExtension();

const style_class = 'chrome';



function addChrome(size = 32) {
    const topMargin = new St.Widget({
        style_class,
        x:0,
        y:0,
        height:size,
        width: global.stage.get_width(),
    });
    const bottomMargin = new St.Widget({
        style_class,
        x:0,
        y: global.stage.get_height() - size,
        height:size,
        width: global.stage.get_width(),
    });
    Main.layoutManager.addChrome(topMargin, { affectsStruts: true });
    Main.layoutManager.addChrome(bottomMargin, { affectsStruts: true });
    return [topMargin, bottomMargin];
}