const RetryChain = require('../retry')


describe('RetryChain', () => {

    test('retry happens', async () => {
        global.log1 = []
        try {
            global.counter1 = 0
            const chain =
                  new RetryChain(async () => {
                      if (global.counter1 < 1) {
                          global.counter1 = global.counter1 + 1
                          global.log1.push('<1')
                          throw new Error('<1')
                      }
                      global.log1.push('good now')
                      return global.counter1
                  })

            const result = await chain.resolve()
            console.log('result:', result)
            console.log('log1:', global.log1)
        }catch(e) {
            console.log('catch() log1:', global.log1)
            console.log('error:', e)
        }

        expect(global.log1).toEqual(['<1', 'good now'])
    })

    test('cache parameter', async () => {
        global.log2 = []
        try {
            global.counter2 = 0
            const chain =
                  new RetryChain(async () => {
                      if (global.counter2 < 1) {
                          global.counter2 = global.counter2 + 1
                          global.log2.push('<1')
                          throw new Error('<1')
                      }
                      global.log2.push('good now')
                      return global.counter2
                  }).then((v1) => {
                      global.log2.push(`received v: ${v1}`)
                      return v1
                  })

            let result = await chain.resolve()
            result = await chain.resolve()
        }catch(e) {
            console.log('catch() log2:', global.log2)
            console.log('error:', e)
        }

        expect(global.log2).toEqual(['<1',
                                     'good now',
                                     "received v: 1",
                                     "received v: 1",])
    })

    // TODO need better coverage

    // catch related
    test('catch works', async () => {
        const chain =
              new RetryChain((p) => {
                  return p+1
              }, 1)
              .then((p) => {
                  // fail
                  throw new Error('fail to test catch')
              })
              .catch(e => 'value when exception')
        const result = await chain.resolve()

        expect(result).toEqual('value when exception')
    })

    test('catch has no effects when all fn worked', async () => {
        const chain =
              new RetryChain((p) => {
                  return p+1
              }, 1)
              .then((p) => {
                  return p+1
              })
              .catch(e => 'value when exception')
        const result = await chain.resolve()

        expect(result).toEqual(3)
    })

    test('catch fixing in the middle of the chain', async () => {
        const chain =
              new RetryChain((p) => {
                  return p+1
              }, 1)
              .then((p) => {
                  throw new Error('always fail')
              })
              .catch((e)=>{return 0})
              .then((p) => {
                  return p+1
              })
        const result = await chain.resolve()

        expect(result).toEqual(1)
    })

})
