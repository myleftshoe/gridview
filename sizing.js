var stage = {
    get width() { return global.stage.get_width() },
    get height() { return global.stage.get_height() },
}

var content = {
    margin: 80,
    get height() { return stage.height - this.margin * 2 },
    // get scale() { return this.height / stage.height },
}
