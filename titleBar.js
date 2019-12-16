const { Atk, Clutter, GObject, Shell, St } = imports.gi;

const Tweener = imports.ui.tweener;


const TitleBar = GObject.registerClass({},
    class TitleBar extends St.Widget {
        _init(props = {}, metaWindow) {
            super._init({
                style_class:'overlay',
                reactive: true,
                layout_manager: new Clutter.BoxLayout({spacing:20}),
                ...props
                // width:1920
            });      

            const leftBox = alignLeft(this, new St.BoxLayout());
            if (metaWindow) {
                const appIcon = createAppIcon(metaWindow, 24);
                leftBox.add_child(appIcon);
            }
            

            this.closeButton = this._createCloseButton();
            // this.closeButtonClickAction = new Clutter.ClickAction();
            // clickAction.connect('clicked', this.handleCloseClick.bind(this));
            // closeButton.add_action(this.closeButtonClickAction);

            const centerBox = alignCenter(this, new St.BoxLayout());
            this._title = new St.Label({
                text:'Untitled',
                y_expand:true,
            });
            centerBox.add_child(this._title);

            const rightBox = alignRight(this, new St.BoxLayout());

            rightBox.add_child(this.closeButton);
            this.add_child(leftBox);
            this.add_child(centerBox);
            this.add_child(rightBox);
            this.showing = false;
        }
        set title(text) {
            this._title.set_text(text);
        }

        toggle() {
            if (!this.showing) {
                Tweener.addTween(this, {
                    // height: 40,
                    scale_y:1,
                    time: .25,
                });
                this.get_parent().metaWindowActor.hide();
                this.showing = true;
            }
            else {
                Tweener.addTween(this, {
                    scale_y:0,
                    // height: 0,
                    time: .25,
                });
                this.showing = false;
            }
        }
        
        _createCloseButton() {
            const closeIcon = new St.Icon({ icon_name: 'cancel-symbolic' });
            const closeButton = new St.Button({ 
                style_class: 'login-dialog-session-list-button',
                reactive: true,
                track_hover: true,
                can_focus: true,
                accessible_name: _("Close Window"),
                accessible_role: Atk.Role.MENU,
                child: closeIcon
            });
            // this.onCloseClick = () => {
            //     log('tttttttttttttttttttttttt')
            // };
            // this.handleCloseClick = () => {
            //     this.onCloseClick();
            // }
            // const clickAction = new Clutter.ClickAction();
            // clickAction.connect('clicked', this.handleCloseClick.bind(this));
            // closeButton.add_action(clickAction);
            return closeButton;
        }
    }
);



function alignLeft(source, actor) {
    const constraint = new Clutter.AlignConstraint({
        source,
        align_axis: Clutter.AlignAxis.X_AXIS,
        factor:0,
    });
    actor.add_constraint(constraint);
    return actor;
} 

function alignCenter(source, actor) {
    const constraint = new Clutter.AlignConstraint({
        source,
        align_axis: Clutter.AlignAxis.X_AXIS,
        factor:0.5,
    });
    actor.add_constraint(constraint);
    return actor;
} 

function alignRight(source, actor) {
    const constraint = new Clutter.AlignConstraint({
        source,
        align_axis: Clutter.AlignAxis.X_AXIS,
        factor:1,
    });
    actor.add_constraint(constraint);
    return actor;
} 



function createAppIcon(metaWindow, size) {
    let tracker = Shell.WindowTracker.get_default();
    let app = tracker.get_window_app(metaWindow);
    let appIcon = app ? app.create_icon_texture(size)
        : new St.Icon({ icon_name: 'icon-missing',
                        icon_size: size });
    appIcon.x_expand = appIcon.y_expand = true;
    appIcon.x_align = appIcon.y_align = Clutter.ActorAlign.END;

    return appIcon;
}
