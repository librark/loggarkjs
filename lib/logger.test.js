import assert from 'node:assert/strict'
import { it } from 'node:test'
import { Logger } from './logger.js'

function setup () {
  const mockGlobal = {
    console: {
      log (...args) { mockGlobal.logArgs = args },
      error (...args) { mockGlobal.errorArgs = args },
      warn (...args) { mockGlobal.warnArgs = args },
      info (...args) { mockGlobal.infoArgs = args },
      debug (...args) { mockGlobal.debugArgs = args }
    },
    Date: class {
      toISOString() {
        return new Date('2025-02-15').toISOString()
      }
    }
  }
  return {mockGlobal}
}

it('can be instantiated', () => {
  const logger = new Logger()
  assert.ok(logger)
})

it('can be instantiated', () => {
  const logger = new Logger()
  assert.ok(logger)
})

it('is disabled by default', () => {
  const { mockGlobal } = setup()
  const logger = new Logger({ global: mockGlobal })

  logger.log('Logging something...')
  assert.ok(!mockGlobal.logArgs)

  logger.error('Logging something...')
  assert.ok(!mockGlobal.errorArgs)

  logger.warn('Logging something...')
  assert.ok(!mockGlobal.warnArgs)

  logger.info('Logging something...')
  assert.ok(!mockGlobal.infoArgs)

  logger.debug('Logging something...')
  assert.ok(!mockGlobal.debugArgs)
})

it('adds a prefix to the logging methods according to loglevel', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'debug'
  const logger = new Logger({ global: mockGlobal })

  logger.log('Logging something...')
  assert.deepStrictEqual(mockGlobal.logArgs,
    ['2025-02-15T00:00:00.000Z [LOG]', 'Logging something...'])

  logger.error('Logging something...')
  assert.deepStrictEqual(mockGlobal.errorArgs,
    ['2025-02-15T00:00:00.000Z [ERROR]', 'Logging something...'])

  logger.warn('Logging something...')
  assert.deepStrictEqual(mockGlobal.warnArgs,
    ['2025-02-15T00:00:00.000Z [WARN]', 'Logging something...'])

  logger.info('Logging something...')
  assert.deepStrictEqual(mockGlobal.infoArgs,
    ['2025-02-15T00:00:00.000Z [INFO]', 'Logging something...'])

  logger.debug('Logging something...')
  assert.deepStrictEqual(mockGlobal.debugArgs,
    ['2025-02-15T00:00:00.000Z [DEBUG]', 'Logging something...'])
})

it('adds the provided logging context labels to its final output', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'debug'
  const context = { correlationId: 'ABCD1234', interactor: 'Informer' }
  const logger = new Logger({ global: mockGlobal, context })

  logger.log('Logging something...')
  assert.deepStrictEqual(mockGlobal.logArgs, [
    '2025-02-15T00:00:00.000Z [LOG]',
    JSON.stringify({ correlationId: 'ABCD1234', interactor: 'Informer' }),
    'Logging something...'])

  logger.error('Logging something...')
  assert.deepStrictEqual(mockGlobal.errorArgs, [
    '2025-02-15T00:00:00.000Z [ERROR]', 
    JSON.stringify({ correlationId: 'ABCD1234', interactor: 'Informer' }),
    'Logging something...'])

  logger.warn('Logging something...')
  assert.deepStrictEqual(mockGlobal.warnArgs, [
    '2025-02-15T00:00:00.000Z [WARN]', 
    JSON.stringify({ correlationId: 'ABCD1234', interactor: 'Informer' }),
    'Logging something...'])

  logger.info('Logging something...')
  assert.deepStrictEqual(mockGlobal.infoArgs, [
    '2025-02-15T00:00:00.000Z [INFO]', 
    JSON.stringify({ correlationId: 'ABCD1234', interactor: 'Informer' }),
    'Logging something...'])

  logger.debug('Logging something...')
  assert.deepStrictEqual(mockGlobal.debugArgs, [
    '2025-02-15T00:00:00.000Z [DEBUG]',
    JSON.stringify({ correlationId: 'ABCD1234', interactor: 'Informer' }),
    'Logging something...'])
})

it('supports including static context labels', () => {
  const originalContext = Logger.context
  Logger.context = () => {
    return { correlationId: 'ABCD1234' }
  }

  try {
    const { mockGlobal } = setup()
    mockGlobal.LOGLEVEL = 'debug'
    const context = { model: 'Product' }
    const logger = new Logger({ global: mockGlobal, context })

    logger.info('Logging something...')
    assert.deepStrictEqual(mockGlobal.infoArgs, [
      '2025-02-15T00:00:00.000Z [INFO]',
      JSON.stringify({ correlationId: 'ABCD1234', model: 'Product' }),
      'Logging something...'])
  } finally {
    Logger.context = originalContext
  }
})
