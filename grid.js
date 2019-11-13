const { GObject } = imports.gi;
const { Row } = Extension.imports.row;

const defaultProps = {
    sortable: false,
    vertical: true
}

var Grid = GObject.registerClass({},
    class Grid extends St.BoxLayout {
        _init(props) {
            const { sortable = false, ...superProps } = { ...props, ...defaultProps };
            const { vertical } = { ...superProps };
            super._init({ vertical });
            this.rows = [];
            this.cells = [];
            this.children = [];
        }
        appendRow(row) {
            this.rows.push(row);
            return row;
        }
    }
);

Grid.prototype.Row = GObject.registerClass({},
    class Row {
        _init({ children }) {

        }
    }
);

Grid.prototype.Cell = GObject.registerClass({},
    class Row {
        _init({ children }) {

        }
    }
);