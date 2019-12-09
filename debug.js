const { St } = imports.gi;


let boxes = [];

function hideBoxes() {
    boxes.forEach(box => {
        global.stage.remove_child(box);
    });
    boxes = [];
}

function showBoxes(metaWindow) {
    let frame = metaWindow.get_frame_rect()
    let inputFrame = metaWindow.get_buffer_rect()
    let actor = metaWindow.get_compositor_private();

    hideBoxes();
    const makeFrameBox = function ({ x, y, width, height }, color) {
        let frameBox = new St.Widget();
        frameBox.set_position(x, y)
        frameBox.set_size(width, height)
        frameBox.set_style("border: 2px" + color + " solid");
        return frameBox;
    }

    boxes.push(makeFrameBox(frame, "rgba(255,0,0,0.5)"));
    boxes.push(makeFrameBox(inputFrame, "rgba(0,100,255,0.5)"));

    if (inputFrame.x !== actor.x || inputFrame.y !== actor.y
        || inputFrame.width !== actor.width || inputFrame.height !== actor.height) {
        boxes.push(makeFrameBox(actor, "yellow"));
    }

    boxes.forEach(box => global.stage.add_child(box));
}
