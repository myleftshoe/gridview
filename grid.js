const { Clutter } = imports.gi;

var Grid = class Grid extends Clutter.GridLayout{
    constructor(props = {column_spacing:40}) {
        super(props);
    }
}