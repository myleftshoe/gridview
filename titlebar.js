const { Atk, Clutter, GObject, St } = imports.gi;
const Main = imports.ui.main;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const { alignLeft, alignCenter, alignRight } = Extension.imports.alignConstraints;
const { createAppIcon } = Extension.imports.appIcon;

const Titlebar = GObject.registerClass({},
    class Titlebar extends St.Widget {
        _init(props = {}, metaWindow) {
            super._init({
                style_class: 'titlebar',
                reactive: true,
                layout_manager: new Clutter.BoxLayout({ spacing: 20 }),
                ...props
            });

            const leftBox = alignLeft(this, new St.BoxLayout());
            if (metaWindow) {
                const appIcon = createAppIcon(metaWindow, 24);
                leftBox.add_child(appIcon);
            }

            const closeIcon = new St.Icon({ icon_name: 'cancel-symbolic' });
            this.closeButton = new St.Button({
                style_class: 'login-dialog-session-list-button',
                reactive: true,
                track_hover: true,
                can_focus: true,
                accessible_name: _("Close Window"),
                accessible_role: Atk.Role.MENU,
                child: closeIcon
            });

            const centerBox = alignCenter(this, new St.BoxLayout());
            this._title = new St.Label({
                text: 'Untitled',
                y_expand: true,
            });
            centerBox.add_child(this._title);

            const rightBox = alignRight(this, new St.BoxLayout());
            rightBox.add_child(this.closeButton);

            this.add_child(leftBox);
            this.add_child(centerBox);
            this.add_child(rightBox);
        }

        set title(text) {
            this._title.set_text(text);
        }

        show(animate = true, onComplete = () => {}) {
            if (this.visible) return;
            super.show();
            if (animate) {
                this.ease({
                    scale_y: 1,
                    time: .25,
                    onComplete,
                });
            }
        }

        hide(animate = true, onComplete = () => {}) {
            if (animate) {
                this.ease({
                    scale_y: 0,
                    time: .25,
                    delay: .5,
                    onComplete: () => {
                        super.hide();
                        onComplete();
                    },
                });
            }
        }

    }
);
