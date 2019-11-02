const { GObject, Clutter, Meta, St } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
// const { Grid } = Extension.imports.grid;
const { CloneContainer } = Extension.imports.cloneContainer;

const style_class = 'fluidshell-page';

var Page = GObject.registerClass({},
    class Page extends Clutter.ScrollActor {
        _init() {
            super._init({ scroll_mode: 1, reactive: true });
            this.windows = new Map();
            this.container = new St.Widget({ style_class });
            this.layout = new Clutter.GridLayout({ column_spacing: 20 });
            this.container.set_layout_manager(this.layout);
            this.add_actor(this.container);
        }

        addWindow(metaWindow) {
            if (metaWindow.window_type !== Meta.WindowType.NORMAL)
                return;
            const cloneContainer = new CloneContainer(metaWindow);
            // cloneContainer.connect('button-press-event', () => {
            //     log('yyyyyyyyyyyyyyyyyyyyyyyyyyyy');
            // })

            this.container.add_child(cloneContainer);
            this.windows.set(metaWindow, cloneContainer)

        }

        removeWindow(metaWindow) {
            if (metaWindow.window_type !== Meta.WindowType.NORMAL)
                return;
            this.container.remove_child(this.windows.get(metaWindow));
            this.windows.delete(metaWindow);
        }

        destroy() {
            this.remove_all_children();
        }
    }
);
