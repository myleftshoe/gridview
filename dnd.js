// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const { Clutter, GLib, Meta, Shell, St } = imports.gi;
const Signals = imports.signals;

const Main = imports.ui.main;
const Params = imports.misc.params;
const Tweener = imports.ui.tweener;

// Time to animate to original position on success
var REVERT_ANIMATION_TIME = 0.75;

var DragMotionResult = {
    NO_DROP: 0,
    COPY_DROP: 1,
    MOVE_DROP: 2,
    CONTINUE: 3
};

var DragState = {
    INIT: 0,
    DRAGGING: 1,
    CANCELLED: 2,
};

var DRAG_CURSOR_MAP = {
    0: Meta.Cursor.DND_UNSUPPORTED_TARGET,
    1: Meta.Cursor.DND_COPY,
    2: Meta.Cursor.DND_MOVE
};

var DragDropResult = {
    FAILURE: 0,
    SUCCESS: 1,
    CONTINUE: 2
};

let eventHandlerActor = null;
let currentDraggable = null;

function _getEventHandlerActor() {
    if (!eventHandlerActor) {
        eventHandlerActor = new Clutter.Actor({ width: 0, height: 0 });
        Main.uiGroup.add_actor(eventHandlerActor);
        // We connect to 'event' rather than 'captured-event' because the capturing phase doesn't happen
        // when you've grabbed the pointer.
        eventHandlerActor.connect('event', (actor, event) => {
            return currentDraggable._onEvent(actor, event);
        });
    }
    return eventHandlerActor;
}


var dragMonitors = [];

function addDragMonitor(monitor) {
    dragMonitors.push(monitor);
}

function removeDragMonitor(monitor) {
    for (let i = 0; i < dragMonitors.length; i++)
        if (dragMonitors[i] == monitor) {
            dragMonitors.splice(i, 1);
            return;
        }
}

var _Draggable = class _Draggable {
    constructor(actor) {

        this.actor = actor;
        this._dragState = DragState.INIT;

        this.actor.connect(
            'button-press-event',
            this._onButtonPress.bind(this)
        );
        this.actor.connect(
            'touch-event',
            this._onTouchEvent.bind(this)
        );

        this._onEventId = null;
        this._touchSequence = null;

        this._buttonDown = false; // The mouse button has been pressed and has not yet been released.
        this._animationInProgress = false; // The drag is over and the item is in the process of animating to its original position (snapping back or reverting).

        this._eventsGrabbed = false;
        this._capturedEventId = 0;
    }

    _onButtonPress(actor, event) {
        if (event.get_button() != 1)
            return Clutter.EVENT_PROPAGATE;

        if (Tweener.getTweenCount(actor))
            return Clutter.EVENT_PROPAGATE;

        this._buttonDown = true;
        this._grabActor(event.get_device());

        let [stageX, stageY] = event.get_coords();
        this._dragStartX = stageX;
        this._dragStartY = stageY;

        return Clutter.EVENT_PROPAGATE;
    }

    _onTouchEvent(actor, event) {
        // We only handle touch events here on wayland. On X11
        // we do get emulated pointer events, which already works
        // for single-touch cases. Besides, the X11 passive touch grab
        // set up by Mutter will make us see first the touch events
        // and later the pointer events, so it will look like two
        // unrelated series of events, we want to avoid double handling
        // in these cases.
        if (!Meta.is_wayland_compositor())
            return Clutter.EVENT_PROPAGATE;

        if (event.type() != Clutter.EventType.TOUCH_BEGIN ||
            !global.display.is_pointer_emulating_sequence(event.get_event_sequence()))
            return Clutter.EVENT_PROPAGATE;

        if (Tweener.getTweenCount(actor))
            return Clutter.EVENT_PROPAGATE;

        this._buttonDown = true;
        this._grabActor(event.get_device(), event.get_event_sequence());

        let [stageX, stageY] = event.get_coords();
        this._dragStartX = stageX;
        this._dragStartY = stageY;

        return Clutter.EVENT_PROPAGATE;
    }

    _grabDevice(actor, pointer, touchSequence) {
        if (touchSequence)
            pointer.sequence_grab(touchSequence, actor);
        else if (pointer)
            pointer.grab(actor);

        this._grabbedDevice = pointer;
        this._touchSequence = touchSequence;

        this._capturedEventId = global.stage.connect('captured-event', (actor, event) => {
            let device = event.get_device();
            if (device != this._grabbedDevice &&
                device.get_device_type() != Clutter.InputDeviceType.KEYBOARD_DEVICE)
                return Clutter.EVENT_STOP;
            return Clutter.EVENT_PROPAGATE;
        });
    }

    _ungrabDevice() {
        if (this._capturedEventId != 0) {
            global.stage.disconnect(this._capturedEventId);
            this._capturedEventId = 0;
        }

        if (this._touchSequence)
            this._grabbedDevice.sequence_ungrab(this._touchSequence);
        else
            this._grabbedDevice.ungrab();

        this._touchSequence = null;
        this._grabbedDevice = null;
    }

    _grabActor(device, touchSequence) {
        this._grabDevice(this.actor, device, touchSequence);
        this._onEventId = this.actor.connect('event',
            this._onEvent.bind(this));
    }

    _ungrabActor() {
        if (!this._onEventId)
            return;

        this._ungrabDevice();
        this.actor.disconnect(this._onEventId);
        this._onEventId = null;
    }

    _grabEvents(device, touchSequence) {
        if (!this._eventsGrabbed) {
            this._eventsGrabbed = Main.pushModal(_getEventHandlerActor());
            if (this._eventsGrabbed)
                this._grabDevice(_getEventHandlerActor(), device, touchSequence);
        }
    }

    _ungrabEvents() {
        if (this._eventsGrabbed) {
            this._ungrabDevice();
            Main.popModal(_getEventHandlerActor());
            this._eventsGrabbed = false;
        }
    }

    _eventIsRelease(event) {
        if (event.type() == Clutter.EventType.BUTTON_RELEASE) {
            let buttonMask = (Clutter.ModifierType.BUTTON1_MASK |
                Clutter.ModifierType.BUTTON2_MASK |
                Clutter.ModifierType.BUTTON3_MASK);
            /* We only obey the last button release from the device,
             * other buttons may get pressed/released during the DnD op.
             */
            return (event.get_state() & buttonMask) == 0;
        } else if (event.type() == Clutter.EventType.TOUCH_END) {
            /* For touch, we only obey the pointer emulating sequence */
            return global.display.is_pointer_emulating_sequence(event.get_event_sequence());
        }

        return false;
    }

    _onEvent(actor, event) {
        let device = event.get_device();

        if (this._grabbedDevice &&
            device != this._grabbedDevice &&
            device.get_device_type() != Clutter.InputDeviceType.KEYBOARD_DEVICE)
            return Clutter.EVENT_PROPAGATE;

        // We intercept BUTTON_RELEASE event to know that the button was released in case we
        // didn't start the drag, to drop the draggable in case the drag was in progress, and
        // to complete the drag and ensure that whatever happens to be under the pointer does
        // not get triggered if the drag was cancelled with Esc.
        if (this._eventIsRelease(event)) {
            this._buttonDown = false;
            if (this._dragState == DragState.DRAGGING) {
                return this._dragActorDropped(event);
            } else if ((this._dragActor != null || this._dragState == DragState.CANCELLED) &&
                !this._animationInProgress) {
                // Drag must have been cancelled with Esc.
                this._dragComplete();
                return Clutter.EVENT_STOP;
            } else {
                // Drag has never started.
                this._ungrabActor();
                return Clutter.EVENT_PROPAGATE;
            }
            // We intercept MOTION event to figure out if the drag has started and to draw
            // this._dragActor under the pointer when dragging is in progress
        } else if (event.type() == Clutter.EventType.MOTION ||
            (event.type() == Clutter.EventType.TOUCH_UPDATE &&
                global.display.is_pointer_emulating_sequence(event.get_event_sequence()))) {
            if (this._dragActor && this._dragState == DragState.DRAGGING) {
                return this._updateDragPosition(event);
            } else if (this._dragActor == null && this._dragState != DragState.CANCELLED) {
                return this._maybeStartDrag(event);
            }
            // We intercept KEY_PRESS event so that we can process Esc key press to cancel
            // dragging and ignore all other key presses.
        } else if (event.type() == Clutter.EventType.KEY_PRESS && this._dragState == DragState.DRAGGING) {
            let symbol = event.get_key_symbol();
            if (symbol == Clutter.Escape) {
                this._dragActorDropped(event);
                return Clutter.EVENT_STOP;
            }
        }

        return Clutter.EVENT_PROPAGATE;
    }

    /**
     * fakeRelease:
     *
     * Fake a release event.
     * Must be called if you want to intercept release events on draggable
     * actors for other purposes (for example if you're using
     * PopupMenu.ignoreRelease())
     */
    fakeRelease() {
        this._buttonDown = false;
        this._ungrabActor();
    }

    /**
     * startDrag:
     * @stageX: X coordinate of event
     * @stageY: Y coordinate of event
     * @time: Event timestamp
     *
     * Directly initiate a drag and drop operation from the given actor.
     */
    startDrag(stageX, stageY, time, sequence, device) {

        let target = this.actor.get_stage().get_actor_at_pos(Clutter.PickMode.ALL,
            stageX, stageY);

        let beginEvent = {
            // actor: this._dragActor,
            targetActor: target,
            // clutterEvent: event,
            draggable: this,
        };

        for (let i = 0; i < dragMonitors.length; i++) {
            let beginFunc = dragMonitors[i].dragBegin;
            if (beginFunc) {
                const success = beginFunc(beginEvent);
                if (!success) return false;
                // if (result != DragMotionResult.CONTINUE) {
                //     global.display.set_cursor(DRAG_CURSOR_MAP[result]);
                //     return GLib.SOURCE_REMOVE;
                // }
            }
        }

        currentDraggable = this;
        this._dragState = DragState.DRAGGING;

        this.emit('drag-begin', time);
        if (this._onEventId)
            this._ungrabActor();

        this._grabEvents(device, sequence);
        global.display.set_cursor(Meta.Cursor.DND_IN_DRAG);

        this._dragX = this._dragStartX = stageX;
        this._dragY = this._dragStartY = stageY;

        this._dragActor = this.actor;

        this._dragActorSource = undefined;
        this._dragOrigParent = this.actor.get_parent();
        this._dragOrigX = this._dragActor.x;
        this._dragOrigY = this._dragActor.y;
        this._dragOrigScale = this._dragActor.scale_x;

        // Set the actor's scale such that it will keep the same
        // transformed size when it's reparented to the uiGroup
        // let [scaledWidth, scaledHeight] = this.actor.get_transformed_size();
        // this._dragActor.set_scale(scaledWidth / this.actor.width,
        //                             scaledHeight / this.actor.height);

        let [actorStageX, actorStageY] = this.actor.get_transformed_position();
        this._dragOffsetX = actorStageX - this._dragStartX;
        this._dragOffsetY = actorStageY - this._dragStartY;

        this._dragOrigParent.remove_actor(this._dragActor);
        Main.uiGroup.add_child(this._dragActor);
        this._dragActor.raise_top();
        Shell.util_set_hidden_from_pick(this._dragActor, true);

        this._dragActorDestroyId = this._dragActor.connect('destroy', () => {
            // Cancel ongoing animation (if any)
            this._finishAnimation();

            this._dragActor = null;
            if (this._dragState == DragState.DRAGGING)
                this._dragState = DragState.CANCELLED;
        });

        return true;
    }

    _maybeStartDrag(event) {
        let [stageX, stageY] = event.get_coords();

        // See if the user has moved the mouse enough to trigger a drag
        let scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        let threshold = St.Settings.get().drag_threshold * scaleFactor;
        if (!currentDraggable &&
            (Math.abs(stageX - this._dragStartX) > threshold) ||
                Math.abs(stageY - this._dragStartY) > threshold) {
            if (this.startDrag(stageX, stageY, event.get_time(), this._touchSequence, event.get_device()))
                this._updateDragPosition(event);
        }

        return true;
    }

    _pickTargetActor() {
        return this._dragActor.get_stage().get_actor_at_pos(Clutter.PickMode.ALL,
            this._dragX, this._dragY);
    }

    _updateDragHover() {
        this._updateHoverId = 0;
        let target = this._pickTargetActor();

        let dragEvent = {
            x: this._dragX,
            y: this._dragY,
            dragActor: this._dragActor,
            source: this.actor._delegate,
            targetActor: target,
            draggable: this,
        };


        for (let i = 0; i < dragMonitors.length; i++) {
            let motionFunc = dragMonitors[i].dragMotion;
            if (motionFunc) {
                let result = motionFunc(dragEvent);
                if (result != DragMotionResult.CONTINUE) {
                    global.display.set_cursor(DRAG_CURSOR_MAP[result]);
                    return GLib.SOURCE_REMOVE;
                }
            }
        }
        global.display.set_cursor(Meta.Cursor.DND_IN_DRAG);
        return GLib.SOURCE_REMOVE;
    }

    _queueUpdateDragHover() {
        if (this._updateHoverId)
            return;

        this._updateHoverId = GLib.idle_add(
            GLib.PRIORITY_DEFAULT,
            this._updateDragHover.bind(this)
        );
        GLib.Source.set_name_by_id(this._updateHoverId, '[gnome-shell] this._updateDragHover');
    }

    _updateDragPosition(event) {
        let [stageX, stageY] = event.get_coords();
        this._dragX = stageX;
        this._dragY = stageY;
        this._dragActor.set_position(
            stageX + this._dragOffsetX,
            stageY + this._dragOffsetY
        );

        this._queueUpdateDragHover();
        return true;
    }

    _dragActorDropped(event) {
        let [dropX, dropY] = event.get_coords();
        let target = this._dragActor.get_stage().get_actor_at_pos(Clutter.PickMode.ALL,
            dropX, dropY);

        // We call observers only once per motion with the innermost
        // target actor. If necessary, the observer can walk the
        // parent itself.
        let dropEvent = {
            dropActor: this._dragActor,
            targetActor: target,
            clutterEvent: event,
            draggable: this,
        };
        for (let i = 0; i < dragMonitors.length; i++) {
            let dropFunc = dragMonitors[i].dragDrop;
            if (dropFunc)
                switch (dropFunc(dropEvent)) {
                    case DragDropResult.FAILURE:
                    case DragDropResult.SUCCESS:
                        return true;
                    case DragDropResult.CONTINUE:
                        continue;
                }
        }

        this._dragState = DragState.INIT;
        global.display.set_cursor(Meta.Cursor.DEFAULT);
        this.emit('drag-end', event.get_time(), true);
        this._dragComplete();
        return true;
    }

    _finishAnimation() {
        if (!this._animationInProgress)
            return

        this._animationInProgress = false;
        if (!this._buttonDown)
            this._dragComplete();

        global.display.set_cursor(Meta.Cursor.DEFAULT);
    }

    _dragComplete() {
        if (!this._actorDestroyed && this._dragActor)
            Shell.util_set_hidden_from_pick(this._dragActor, false);

        this._ungrabEvents();
        global.sync_pointer();

        if (this._updateHoverId) {
            GLib.source_remove(this._updateHoverId);
            this._updateHoverId = 0;
        }

        if (this._dragActor) {
            this._dragActor.disconnect(this._dragActorDestroyId);
            this._dragActor = null;
        }

        this._dragState = DragState.INIT;
        currentDraggable = null;
    }
};
Signals.addSignalMethods(_Draggable.prototype);

/**
 * makeDraggable:
 * @actor: Source actor
 *
 * Create an object which controls drag and drop for the given actor.
 *
 */
function makeDraggable(actor) {
    return new _Draggable(actor);
}
