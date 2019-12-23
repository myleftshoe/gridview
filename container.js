const { GObject, St } = imports.gi;
const Main = imports.ui.main;
const Background = imports.ui.background;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { stage } = Extension.imports.sizing;

const Container = GObject.registerClass({},
    class Container extends St.Widget {
        _init() {
            super._init({
                style_class: 'container',
                reactive: true,
                height: stage.height,
                min_width: stage.width,
                // y: CHROME_SIZE
            });
            const backgroundManager = new Background.BackgroundManager({
                monitorIndex: Main.layoutManager.primaryIndex,
                container: this,
                vignette: false, // darken if true
            });
        }
        get isOnStage() {
            return global.window_group.contains(this);
        }
        show() {
            global.window_group.add_child(this);
        }
        hide() {
            global.window_group.remove_child(this);
        }
    }
);

