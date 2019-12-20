
const Main = imports.ui.main;

const _panelBox = Main.layoutManager.panelBox;
const _autoHide = false;
const transitionTime = 1000;

_panelBox.set_easing_duration(transitionTime);

var panelBox = {
    hide() {
        _panelBox.translation_y = -_panelBox.get_height();
    },
    show() {
        _panelBox.translation_y = 0;
    }
}


// function hidePanelBox() {
//     const panelBox = Main.layoutManager.panelBox;
//     panelBox.translation_y = -panelBox.get_height();
//     Main.overview.connect('showing', () => {
//         Main.uiGroup.remove_child(scrollable.scrollbar);
//     });
//     Main.overview.connect('shown', () => {
//         // Tweener.addTween(panelBox, {
//         //     translation_y: 0,
//         //     time: .25,
//         // });
//     });
//     Main.overview.connect('hidden', () => {
//         log('hiding')
//         // Main.overview._overview.remove_all_transitions();
//     });
//     Main.overview.connect('hidden', () => {
//         // Tweener.addTween(panelBox, {
//         //     translation_y: -27,
//         //     time: .25,
//         //     // onComplete: () => container.show()
//         // })
//         Main.uiGroup.add_child(scrollable.scrollbar);
//     });
// }
