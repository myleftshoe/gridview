const { GObject, Clutter, Meta, St } = imports.gi;
const Main = imports.ui.main;
const DnD = imports.ui.dnd;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { UI } = Extension.imports.ui;
const { Page } = Extension.imports.page;
const { Log } = Extension.imports.utils.logger;

const Display = global.display;
const Stage = global.stage;

const style_class = 'fluidshell';

var FluidShell = GObject.registerClass({},

    class FuildShell extends St.BoxLayout {

        _init() {
            super._init({ style_class, vertical: true, reactive: true });
            // Make this respond to events reliably. trackChrome stops underlying
            // windows stealing pointer events.
            Main.layoutManager.trackChrome(this);
            this.draggable = DnD.makeDraggable(this);
            Log.properties(this);
            this.signals = [];
            this.signals.push(Display.connect('in-fullscreen-changed', () => this.refresh()));
            this.signals.push(Display.connect('notify::focus-window', () => this.refresh()));
            this.connect('scroll-event', (source, event) => {
                const direction = event.get_scroll_direction();
                if (direction > 1) return;
                let amount = 0.5;
                const [scaleX, scaleY] = source.get_scale();
                if (direction === Clutter.ScrollDirection.DOWN) {
                    if (scaleX < 1) return;
                    amount = -amount;
                }
                const [sx, sy] = source.get_transformed_position();
                const [sw, sh] = source.get_transformed_size();
                const [x, y] = event.get_coords();
                log([x, y, sx, sy, sw, sh]);
                // source.set_pivot_point((x - sx) / sw, (y - sy) / sh);
                // source.set_scale(scaleX + amount, scaleY + amount);
                source.set_scale_with_gravity(scaleX + amount, scaleY + amount, Clutter.Gravity.CENTER);
                // this.set_size(...this.get_size());
            });

            this.refresh();
        }

        refresh() {
            log('refreshing...............................................')
            this.destroy_all_children();
            UI.workspaces.forEach((workspace, i) => {
                const windows = workspace.list_windows();
                if (!windows.length) return;
                const page = new Page();
                windows.forEach((metaWindow, j) => page.addWindow(metaWindow, j + 1, 1));
                this.add_child(page);
            });
        }

        destroy() {
            this.signals.forEach(signal => Display.disconnect(signal));
            this.remove_all_children();
        }
    }
);


