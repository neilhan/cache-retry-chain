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

    thenTry(fn) {
        let longerChain = new RetryChain(fn, this)
        return longerChain
    }

    async _maybeEvalParam(useArgs) {
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
        let useArgs
        try {
            // resolve this fn with paramCache
            // if no paramCache, get it from resolving retryParams, it maybe a previous chain
            if(! this.paramCache) {
                this.paramCache = await this._maybeEvalParam(this.retryParams)
            }

            return await this.fn.apply(global, [this.paramCache])
        } catch(e) {
            this.paramCache = await this._maybeEvalParam(this.retryParams)

            return await this.fn.apply(global, [useArgs])
        }

        return undefined
    }
}

module.exports = RetryChain
