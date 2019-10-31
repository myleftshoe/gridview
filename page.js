const { GObject, Clutter, Meta } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Grid } = Extension.imports.grid;
const { Clone } = Extension.imports.clone;

var Page = GObject.registerClass({},
    class Page extends Clutter.Actor {
        _init() {
            super._init();
            this.set_layout_manager(new Grid());
            this.windows = new Map();
        }

        addWindow(metaWindow) {
            if (metaWindow.window_type !== Meta.WindowType.NORMAL)
                return;
            const clone = new Clone(metaWindow);    
            this.add_child(clone);
            this.windows.set(metaWindow, clone)

        }

        removeWindow(metaWindow) {
            this.remove_child(this.windows.get(metaWindow));
            this.windows.delete(metaWindow);
        }

        destroy() {
            this.remove_all_children();
        }
    }
);