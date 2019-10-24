const { GObject, Clutter, St } = imports.gi;
const { Tweener } = imports.ui.tweener;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const { Log } = Me.imports.utils.logger;

var RightPanel = GObject.registerClass(
    class RightPanel extends St.Widget {

        _init(monitor) {
            super._init({
                width:100,
                height: monitor.height,
                x: monitor.width - 1,
                style_class: 'right-panel',
                reactive:true
            });

            Log.properties(this);
            this.isOpen = false;
            this.connect('enter-event', (actor, event) => {
                log('enter', actor, event.get_coords())
                if (!this.isOpen) { 
                    Tweener.addTween(this, {
                        translation_x: -99,
                        time: .2,
                        // delay: 0,
                        transition: 'easeOutQuad',
                        onComplete: () => {this.isOpen = true}
                    })
                    // this.isOpen = true;
                }
            });

            this.connect('leave-event', (actor, event) => {
                let [x,y] = event.get_coords();
                log('leave', actor, event.type() , x, y)
                if (this.isOpen) {
                    Tweener.addTween(this, {
                        translation_x: 0,
                        time: .2,
                        delay: 0,
                        transition: 'easeOutQuad',
                        onComplete: () => {this.isOpen = false}
                    })
                }
            });
        }
    }
);