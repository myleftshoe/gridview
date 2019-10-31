const { GObject, Clutter } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Photo } = Extension.imports.photo;
const { WindowClone } = Extension.imports.windowClone;

var Page = GObject.registerClass({},
    class Page extends Clutter.Actor {
        _init() {
            super._init();
        }
    }
);