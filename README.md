# cache-retry-chain

This library was created with one use case in mind.

The task is this:
- to generate a token there are 4 steps
- each steps generate a temporary token
- tokens expire with different lifespan

This library provides a tool: RetryChain.

You can chain together a sequence of steps. The first step generate a result
that will be forward to step 2. Step 2 will generate what step 3 needs.

The steps are defined as a function. The step one function can take multiple parameters.
The rest of the steps can only take one parameter. To pass multiple fields you may consider
using an javascript object, or an array as the return value for that step.

The result of each step is cached. When RetryChain.resolve() is called, you will receive
the result of the last step function as if you run all the steps. The intermident results
of each steps are cached. It only retry the previous step when the chain has failed to produce
a result at the later steps.

## Sample
```javascript
async function twoStepsLogin() => {
        const chain =
              new RetryChain(async (uid, pwd) => {  // don't have to async function
                  return await getLoginStep1Token(uid, pwd)  // don't have to async function
              }, [userId, password])
              .then((t) => {
                  return exchangeToken1ToToken2(t)
              })
              return await chain.resolve()
```
The sample code behaves as following:
- call getLoginStep1Token() with userId and password
- the result of the getLoginStep1Token() is cached
- the result is send to step-2 as t
- step-2 call exchangeToken1ToToken2()
- the result of step is returned by chain.resolve() function call
- In case of the step-2 failure, cached value of 't' will be erased, the step-1 will be called again to generate t
- new-t will be used for step-2. exchangeToken1ToToken2(new-t) will be the result for chain.resolve()


## Exception handling
The .catch((e)=>{..}) is provided for the following use case:
When getLoginStep1Token() fails and throws an exception, step-2 can operate with a 't' that another function can provide.
```javascript
async function twoStepsLogin() => {
        const chain =
              new RetryChain(async (uid, pwd) => {  // don't have to async function
                  return await getLoginStep1Token(uid, pwd)  // don't have to async function
              }, [userId, password])
              .catch( e => {
                  return t_whenError
              })
              .then( t => {
                  return exchangeToken1ToToken2(t)
              })
              return await chain.resolve()
```
The code above shows when getLoginStep1Token() failed to provide 't' for exxchangeToken1ToToken2(), catch the exception and return t_whenError.
