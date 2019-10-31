const { GObject, Clutter, Meta, St } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Grid } = Extension.imports.grid;
const { Clone } = Extension.imports.clone;

const style_class = 'fluidshell-page'; 

var Page = GObject.registerClass({},
    class Page extends Clutter.ScrollActor {
        _init() {
            super._init({scroll_mode:1, reactive:true});
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
            if (metaWindow.window_type !== Meta.WindowType.NORMAL)
                return;            
            this.remove_child(this.windows.get(metaWindow));
            this.windows.delete(metaWindow);
        }

        destroy() {
            this.remove_all_children();
        }
    }
);