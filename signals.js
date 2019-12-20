var Signals = class Signals {
    constructor() {
        this.signals = new Map()
    }

    has(key) {
        return this.signals.has(key)
    }

    connect(object, name, callback) {
        const key = object.connect(name, callback)
        this.signals.set(key, { object, name })
        return key
    }

    connectOnce(object, name, callback) {
        const key = object.connect(name, (...args) => {
            object.disconnect(key)
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

    disconnectMany(keys) {
        keys.forEach(this.disconnect.bind(this))
    }

    disconnectAll() {
        for (const key of this.signals.keys()) {
            this.disconnect(key)
        }
    }
}

