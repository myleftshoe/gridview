var Signals = class Signals {
    constructor() {
        this.signals = new Map()
    }

    registerHandler(object, name, callback) {
        const key = `${object}[${name}]`

        if (!this.hasSignal(key)) {
            this.signals.set(key, {
                object: object,
                signalId: object.connect(name, callback)
            })
        }

        return key
    }

    hasSignal(key) {
        return this.signals.has(key)
    }

    connect(object, name, callback) {
        return this.registerHandler(object, name, callback)
    }

    disconnect(key) {
        if (this.hasSignal(key)) {
            const data = this.signals.get(key)
            data.object.disconnect(data.signalId)

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

