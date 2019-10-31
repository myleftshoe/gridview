const { Clutter } = imports.gi;
const Main = imports.ui.main;

var Grid = class Grid extends Clutter.GridLayout{
    constructor(props = {}) {
        super(props);
    }
}