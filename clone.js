const { Clutter, St } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { CloneActor } = Extension.imports.cloneActor;

const style_class = 'testb';

var Clone = class Page extends St.Bin {
    constructor(metaWindow) {
        super({
            style_class, 
            y_fill:false
        });
        this.set_child(new CloneActor(metaWindow));
    }
}