import _ from 'lodash/fp'
import {isFunction, isArray, cloneDeep, } from 'lodash/fp'

global.counter = 0
class RetryChain {
    constructor(fn, retryParams=undefined, maxRetry=1) {
        this.fn = fn
        this.paramCache = undefined
        if (! (retryParams instanceof RetryChain)
            && !( isArray(retryParams) && retryParams[0] instanceof RetryChain)) {
            this.paramCache = retryParams
        }
        this.retryParams = retryParams
        this.maxRetry = maxRetry

        // debugging ...
        this.counter = global.counter
        global.counter = global.counter + 1
    }

    thenTry(fn, maxRetry=1) {
        let longerChain = new RetryChain(fn, this, maxRetry)
        return longerChain
    }

    async resolve() {
        console.log('**** ========== resolve', this.counter)
        let useArgs
        try {
            // resolve this fn with paramCache
            // if no paramCache, get it from resolving retryParams, it maybe a previous chain
            if(this.paramCache) {
                console.log(this.counter, 'using cached parameter:', this.paramCache)
                useArgs = this.paramCache
            }  else {
                console.log(this.counter, 'using []')
                useArgs = []
            }

            console.log(this.counter,  'before resolve',  'useArgs:', useArgs)
            return await this.fn.apply(global, [useArgs])
        } catch(e) {
            this.paramCache = undefined
            if (this.retryParams){
                console.log(this.counter, 'using retryParams:', this.retryParams)
                useArgs =  this.retryParams
            }

            // if it's RetryChain, resolve it
            if (isArray(useArgs) && useArgs.length === 1 && useArgs[0] instanceof RetryChain) {
                useArgs = useArgs[0]
            }
            if (useArgs instanceof RetryChain) {
                console.log(this.counter, '**** before parent chain', 'useArgs:', useArgs)
                useArgs = await useArgs.resolve(useArgs.retryParams)
                console.log(this.counter, '**** after parent chain', 'useArgs:', useArgs)

                this.paramCache = useArgs
            }

            console.log(this.counter, 'this.fn:', this.fn, 'args:', useArgs)
            return await this.fn.apply(global, [useArgs])
        }

        return undefined
    }
}

const retryChain =
      new RetryChain(
          (p1, p2) => {
              console.log('step 1, p1:', p1)

              if (p1 < 1) {
                  console.log('step 1, throw error')
                  throw new Error('will retry')
              }
              console.log('step 1, Yeah! fn done. return: 1')
              return 1
          },
          [1, 'retry p2'])
      .thenTry(
          (p1) => {
              console.log('step 2, p1:', p1)

              if (p1 < 1) {
                  console.log('step 2, throw error')
                  throw new Error('will retry')
              }
              console.log('step 2, Yeah! fn done.')
              return p1
          })
      .thenTry(
          (p1) => {
              console.log('step 3, p1:', p1)

              if (p1 < 1) {
                  console.log('step 3, throw error')
                  throw new Error('will retry')
              }
              console.log('step 3, Yeah! fn done.')
              return p1
          })

retryChain.resolve()
