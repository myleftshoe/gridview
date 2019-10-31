const { GObject, Clutter } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Grid } = Extension.imports.grid;

var Page = GObject.registerClass({},
    class Page extends Clutter.Actor {
        _init() {
            super._init();
            this.set_layout_manager(new Grid());
        }
        destroy() {
            this.remove_all_children();
        }
    }
);