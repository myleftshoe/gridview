const { Clutter } = imports.gi;
const Main = imports.ui.main;


let sid = null;

function makeZoomable(actor) {

    sid = actor.connect('scroll-event', (source, event) => {
        const direction = event.get_scroll_direction();
        if (direction > 1) return;
        let amount = 0.1;
        const [scaleX, scaleY] = source.get_scale();
        if (direction === Clutter.ScrollDirection.DOWN) {
            if (scaleX < 0.2) return;
            amount = -amount;
        }
        if (direction === Clutter.ScrollDirection.UP) {
            if (scaleX > 0.9) return;
        }
        const [sx, sy] = source.get_transformed_position();
        const [sw, sh] = source.get_transformed_size();
        const [x, y] = event.get_coords();
        // source.set_pivot_point((x - sx) / sw, (y - sy) / sh);
        source.set_pivot_point((x - sx) / sw, 40 / 1200);
        source.set_scale(scaleX + amount, scaleY + amount);
        // source.set_scale_with_gravity(scaleX + amount, scaleY + amount, Clutter.Gravity.NORTH_WEST);
        // this.set_size(...this.get_size());
    });
}

function unmakeZoomable(actor) {
    actor.disconnect(sid);
}
