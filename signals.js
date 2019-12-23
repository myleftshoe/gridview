const { GObject } = imports.gi;

var SignalManager = class SignalManager {
    constructor() {
        this.signals = new Map()
    }

    has(key) {
        return this.signals.has(key)
    }

    get size() { 
        return this.signals.size;
    }

    connect(object, name, callback) {
        const key = object.connect(name, callback)
        this.signals.set(key, { object, name })
        return key
    }

    connectOnce(object, name, callback) {
        const key = object.connect(name, (...args) => {
            this.disconnect(key)
            callback(...args)
        })
        this.signals.set(key, { object, name })
        return key
    }

    disconnect(key) {
        if (this.has(key)) {
            const signal = this.signals.get(key)
            signal.object.disconnect(key)
            this.signals.delete(key)
        }
    }

    disconnectMany(keys = []) {
        keys.forEach(this.disconnect.bind(this))
    }

    disconnectAll() {
        for (const key of this.signals.keys()) {
            this.disconnect(key)
        }
    }

    connectMany(objects = [], name, callback) {
        objects.forEach(object => this.connect(object, name, callback));
    }   
}


/**
 * Emits 'all-signals-complete' when all added signals have fired.
 * ONLY FOR ONESHOT EVENTS
 */
var SignalGroup = GObject.registerClass(
    {
        Signals: {
            'all-signals-complete': {
                param_types: []
            }            
        }
    },
    class SignalGroup extends GObject.Object {
        _init() {
            super._init();
            this.signals = new SignalManager();
        }
        add(object, name) {
            const key = this.signals.connectOnce(object, name, () => {
                log('----completed', object, name)
                if (!this.signals.size)
                    this.emit('all-signals-complete');
            });
            return key;
        }
    }
);



