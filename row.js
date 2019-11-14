const Main = imports.ui.main;

const { GObject, Clutter, Meta, St } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();

const style_class = 'gridview-row';

var Row = GObject.registerClass({},
    class Row extends St.BoxLayout {
        _init() {
            super._init({style_class});
        }
        // destroy() {
        //     this.remove_all_children();
        // }
    }
);
