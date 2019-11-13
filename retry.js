const {isFunction, isArray, cloneDeep, } = require('lodash/fp')

class RetryChain {
    constructor(fn, retryParams=undefined) {
        this.fn = fn
        this.paramCache = undefined
        if (! (retryParams instanceof RetryChain)
            && !( isArray(retryParams)
                  && retryParams[0] instanceof RetryChain)) {
            this.paramCache = retryParams
        }
        this.retryParams = retryParams
    }

    then(fn) {
        let longerChain = new RetryChain(fn, this)
        return longerChain
    }

    catch(fn) {
        let longerChain = new RetryChainCatch(fn, this)
        return longerChain
    }

    async _genParam(useArgs) {
        // if it's RetryChain, resolve it
        if (isArray(useArgs) && useArgs.length === 1 && useArgs[0] instanceof RetryChain) {
            useArgs = useArgs[0]
        }
        if (useArgs instanceof RetryChain) {
            useArgs = await useArgs.resolve(useArgs.retryParams)
        }

        return useArgs
    }

    async resolve() {
        try {
            // resolve this fn with paramCache
            // if no paramCache, get it from resolving retryParams, it maybe a previous chain
            if(! this.paramCache) {
                this.paramCache = await this._genParam(this.retryParams)
            }

            return await this.fn.apply(global, [this.paramCache])
        } catch(e) {
            this.paramCache = await this._genParam(this.retryParams)

            return await this.fn.apply(global, [this.paramCache])
        }

        return undefined
    }
}

class RetryChainCatch extends RetryChain {
    constructor(fn, chain) {
        super((p) => p, chain)
        this.catchFn = fn
    }

    async resolve() {
        try {
            return await super.resolve()
        } catch(e) {
            this.paramCache = await this.catchFn(err)

            return await this.fn.apply(global, [this.paramCache])
        }

        return undefined

    }
}

module.exports = RetryChain
