/* Stripped-down version of https://github.com/GNOME/gnome-shell/blob/master/js/ui/dnd.js */

const { Clutter, GLib, Meta, Shell, St } = imports.gi;
const Signals = imports.signals;

const Main = imports.ui.main;
const Tweener = imports.ui.tweener;


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


var _Draggable = class _Draggable {

    constructor(actor) {

        this.actor = actor;

        this.isDragging = false;

        this.actor.connect('button-press-event', this._onButtonPress.bind(this));
        this.actor.connect('touch-event', this._onTouchEvent.bind(this));

        this._onEventId = null;
        this._touchSequence = null;

        this._eventsGrabbed = false;
        this._capturedEventId = 0;
    }

    _handleStartEvent(event) {

        if (Tweener.getTweenCount(this.actor))
            return;

        this._grabActor(event.get_device(), event.get_event_sequence());

        const [stageX, stageY] = event.get_coords();
        this._dragStartX = stageX;
        this._dragStartY = stageY;

    }

    _onButtonPress(actor, event) {
        if (event.get_button() == 1)
            this._handleStartEvent(event);
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
        if (Meta.is_wayland_compositor()) {
            if (event.type() === Clutter.EventType.TOUCH_BEGIN && global.display.is_pointer_emulating_sequence(event.get_event_sequence())) {
                this._handleStartEvent(event);
            }
        }
        return Clutter.EVENT_PROPAGATE;
    }

    _isGrabbedDevice(device) {
        return (this._grabbedDevice && device === this._grabbedDevice || device.get_device_type() === Clutter.InputDeviceType.KEYBOARD_DEVICE);
    }

    _grabDevice(actor, pointer, touchSequence) {
        if (touchSequence)
            pointer.sequence_grab(touchSequence, actor);
        else if (pointer)
            pointer.grab(actor);

        this._grabbedDevice = pointer;
        this._touchSequence = touchSequence;

        this._capturedEventId = global.stage.connect('captured-event', (actor, event) => {
            if (!this._isGrabbedDevice(event.get_device()))
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
            const buttonMask = (
                Clutter.ModifierType.BUTTON1_MASK |
                Clutter.ModifierType.BUTTON2_MASK |
                Clutter.ModifierType.BUTTON3_MASK
            );
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

    _eventIsMotion(event) {
        return (
            event.type() == Clutter.EventType.MOTION || (
                event.type() == Clutter.EventType.TOUCH_UPDATE &&
                global.display.is_pointer_emulating_sequence(event.get_event_sequence())
            ));
    }

    _eventIsKeypress(event) {
        return event.type() == Clutter.EventType.KEY_PRESS
    }

    _onEvent(actor, event) {

        if (!this._isGrabbedDevice(event.get_device()))
            return Clutter.EVENT_PROPAGATE;

        // We intercept BUTTON_RELEASE event to know that the button was released in case we
        // didn't start the drag, to drop the draggable in case the drag was in progress, and
        // to complete the drag and ensure that whatever happens to be under the pointer does
        // not get triggered if the drag was cancelled with Esc.
        if (this._eventIsRelease(event)) {
            if (this.isDragging) {
                return this._dragActorDropped(event);
            }
            // Drag has never started.
            this._ungrabActor();
        }
        else if (this._eventIsMotion(event)) {
            // We intercept MOTION event to figure out if the drag has started and to draw
            // this._dragActor under the pointer when dragging is in progress
            if (this._dragActor && this.isDragging)
                return this._updateDragPosition(event);
            if (this._dragActor == null)
                return this._maybeStartDrag(event);
        }
        else if (this._eventIsKeypress(event) && this.isDragging) {
            // We intercept KEY_PRESS event so that we can process Esc key press to cancel
            // dragging and ignore all other key presses.
            const symbol = event.get_key_symbol();
            if (symbol == Clutter.Escape) {
                this._dragActorDropped(event);
                return Clutter.EVENT_STOP;
            }
        }

        return Clutter.EVENT_PROPAGATE;
    }

    startDrag(event) {

        const [stageX, stageY] = event.get_coords();

        const target = this.actor.get_stage().get_actor_at_pos(
            Clutter.PickMode.ALL,
            stageX,
            stageY
        );

        currentDraggable = this;
        this.isDragging = true;

        this.emit('drag-begin', event, {
            targetActor: target,
        });

        if (this._onEventId)
            this._ungrabActor();

        this._grabEvents(event.get_device(), this._touchSequence);
        global.display.set_cursor(Meta.Cursor.DND_IN_DRAG);

        this._dragX = this._dragStartX = stageX;
        this._dragY = this._dragStartY = stageY;

        this._dragActor = this.actor;

        this._dragOrigParent = this.actor.get_parent();

        const [actorStageX, actorStageY] = this.actor.get_transformed_position();
        this._dragOffsetX = actorStageX - this._dragStartX;
        this._dragOffsetY = actorStageY - this._dragStartY;

        this._originalScale = this.actor.get_scale();
        // Set the actor's scale such that it will keep the same
        // transformed size when it's reparented to the uiGroup
        const [scaledWidth, scaledHeight] = this.actor.get_transformed_size();
        this._dragActor.set_scale(
            scaledWidth / this.actor.width,
            scaledHeight / this.actor.height
        );

        this._dragOrigParent.remove_actor(this._dragActor);
        Main.uiGroup.add_child(this._dragActor);
        this._dragActor.raise_top();
        Shell.util_set_hidden_from_pick(this._dragActor, true);

        return true;
    }

    _maybeStartDrag(event) {
        if (currentDraggable)
            return true;

        const [stageX, stageY] = event.get_coords();

        // See if the user has moved the mouse enough to trigger a drag
        const scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        const threshold = St.Settings.get().drag_threshold * scaleFactor;
        if ((Math.abs(stageX - this._dragStartX) > threshold) || Math.abs(stageY - this._dragStartY) > threshold) {
            this.startDrag(event);
            this._updateDragPosition(event);
        }

        return true;
    }

    _pickTargetActor(x, y) {
        return this._dragActor.get_stage().get_actor_at_pos(Clutter.PickMode.ALL, x, y);
    }

    _updateDragHover(event) {
        this._updateHoverId = 0;
        const [x, y] = [this._dragX, this._dragY];
        const targetActor = this._pickTargetActor(x, y);

        this.emit('drag-motion', event, {
            x,
            y,
            dragActor: this._dragActor,
            targetActor,
        });

        global.display.set_cursor(Meta.Cursor.DND_IN_DRAG);
        return GLib.SOURCE_REMOVE;
    }

    _queueUpdateDragHover(event) {
        if (this._updateHoverId)
            return;

        this._updateHoverId = GLib.idle_add(
            GLib.PRIORITY_DEFAULT,
            this._updateDragHover.bind(this, event)
        );
        GLib.Source.set_name_by_id(this._updateHoverId, '[gnome-shell] this._updateDragHover');
    }

    _updateDragPosition(event) {
        if (!this._dragActor)
            return true;
        const [stageX, stageY] = event.get_coords();
        this._dragX = stageX;
        this._dragY = stageY;
        this._dragActor.set_position(
            stageX + this._dragOffsetX,
            stageY + this._dragOffsetY
        );

        this._queueUpdateDragHover(event);
        return true;
    }

    _dragActorDropped(event) {
        const targetActor = this._pickTargetActor(...event.get_coords());

        this.emit('drag-dropped', event, {
            dropActor: this._dragActor,
            targetActor,
            clutterEvent: event,
            scale: this._originalScale
        });

        this.isDragging = false;
        global.display.set_cursor(Meta.Cursor.DEFAULT);
        this.emit('drag-end');
        this._dragComplete();
        return true;
    }

    _dragComplete() {
        if (this._dragActor) {
            Shell.util_set_hidden_from_pick(this._dragActor, false);
        }

        this._ungrabEvents();
        global.sync_pointer();

        if (this._updateHoverId) {
            GLib.source_remove(this._updateHoverId);
            this._updateHoverId = 0;
        }

        if (this._dragActor) {
            this._dragActor = null;
        }

        this.isDragging = false;
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
