const RetryChain = require('../retry')


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
