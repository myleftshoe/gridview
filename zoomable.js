const { Clutter } = imports.gi;

let sid = null;

function makeZoomable(actor) {
    sid = actor.connect('scroll-event', (source, event) => {
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
}

function umnmakeZoomable(actor) {
    actor.disconnect(sid);
}
