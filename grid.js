const { Clutter } = imports.gi;

var Grid = class Grid extends Clutter.GridLayout{
    constructor(props = {}) {
        super(props);
    }
}