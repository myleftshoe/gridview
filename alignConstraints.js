const { Clutter } = imports.gi;

function alignLeft(source, actor) {
    const constraint = new Clutter.AlignConstraint({
        source,
        align_axis: Clutter.AlignAxis.X_AXIS,
        factor: 0,
    });
    actor.add_constraint(constraint);
    return actor;
}

function alignCenter(source, actor) {
    const constraint = new Clutter.AlignConstraint({
        source,
        align_axis: Clutter.AlignAxis.X_AXIS,
        factor: 0.5,
    });
    actor.add_constraint(constraint);
    return actor;
}

function alignRight(source, actor) {
    const constraint = new Clutter.AlignConstraint({
        source,
        align_axis: Clutter.AlignAxis.X_AXIS,
        factor: 1,
    });
    actor.add_constraint(constraint);
    return actor;
}
