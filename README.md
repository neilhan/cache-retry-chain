This package helps you with a retry-chain.
You can create a chain of steps. The chain behaves as follow:
First step provide parameter for second step, and continue till the end of the chain.
Each step cache the parameter it receives, and will call previous step
if the cached parameter has failed/expired.
