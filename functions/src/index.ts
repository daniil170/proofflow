import { setGlobalOptions } from 'firebase-functions/v2'

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 50,
})

export * from './domain/index.js'
export * from './infrastructure/ports/index.js'
export * from './infrastructure/adapters/index.js'
export * from './application/use-cases/index.js'
export * from './interfaces/index.js'
