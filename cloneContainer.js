const { Clutter, St } = imports.gi;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { Clone } = Extension.imports.clone;

const style_class = 'testb';

var CloneContainer= class CloneContainer extends St.Bin {
    constructor(metaWindow) {
        super({
            style_class, 
            y_fill:false,
            reactive:true
        });
        this.set_child(new Clone(metaWindow));
    }
}