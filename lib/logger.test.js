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
      toISOString () {
        return new Date('2025-02-15').toISOString()
      }
    }
  }

  return { mockGlobal }
}

function parseRecord (args) {
  assert.ok(args)
  assert.strictEqual(args.length, 1)
  return JSON.parse(args[0])
}

it('can be instantiated', () => {
  const logger = new Logger()
  assert.ok(logger)
})

it('returns null context when no static or instance context is available', () => {
  const logger = new Logger()
  assert.strictEqual(logger.context, null)
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

it('emits JSON logs by default according to loglevel', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'debug'
  const logger = new Logger({ global: mockGlobal })

  logger.log('Logging something...')
  assert.deepStrictEqual(parseRecord(mockGlobal.logArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'log',
    message: 'Logging something...'
  })

  logger.error('Logging something...')
  assert.deepStrictEqual(parseRecord(mockGlobal.errorArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'error',
    message: 'Logging something...'
  })

  logger.warn('Logging something...')
  assert.deepStrictEqual(parseRecord(mockGlobal.warnArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'warn',
    message: 'Logging something...'
  })

  logger.info('Logging something...')
  assert.deepStrictEqual(parseRecord(mockGlobal.infoArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'info',
    message: 'Logging something...'
  })

  logger.debug('Logging something...')
  assert.deepStrictEqual(parseRecord(mockGlobal.debugArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'debug',
    message: 'Logging something...'
  })
})

it('merges object parameters into the base JSON log object', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'info'
  const logger = new Logger({ global: mockGlobal })

  logger.info('Logging something...', { action: 'create', entity: 'product' })
  assert.deepStrictEqual(parseRecord(mockGlobal.infoArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'info',
    message: 'Logging something...',
    action: 'create',
    entity: 'product'
  })
})

it('can emit JSON logs without message arguments', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'info'
  const logger = new Logger({ global: mockGlobal })

  logger.info()
  assert.deepStrictEqual(parseRecord(mockGlobal.infoArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'info'
  })
})

it('can emit JSON logs without context when flat is disabled', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'info'
  const logger = new Logger({ global: mockGlobal, flat: false })

  logger.info('Logging something...')
  assert.deepStrictEqual(parseRecord(mockGlobal.infoArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'info',
    message: 'Logging something...'
  })
})

it('flattens provided logging context labels by default', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'debug'
  const context = { correlationId: 'ABCD1234', interactor: 'Informer' }
  const logger = new Logger({ global: mockGlobal, context })

  logger.info('Logging something...')
  assert.deepStrictEqual(parseRecord(mockGlobal.infoArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'info',
    correlationId: 'ABCD1234',
    interactor: 'Informer',
    message: 'Logging something...'
  })
})

it('can flatten context labels into top-level JSON fields with flat option', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'info'
  const context = { correlationId: 'ABCD1234', interactor: 'Informer' }
  const logger = new Logger({ global: mockGlobal, context, flat: true })

  logger.info('Logging something...')
  assert.deepStrictEqual(parseRecord(mockGlobal.infoArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'info',
    correlationId: 'ABCD1234',
    interactor: 'Informer',
    message: 'Logging something...'
  })
})

it('can keep nested context when flat option is disabled', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'info'
  const context = { correlationId: 'ABCD1234', interactor: 'Informer' }
  const logger = new Logger({ global: mockGlobal, context, flat: false })

  logger.info('Logging something...')
  assert.deepStrictEqual(parseRecord(mockGlobal.infoArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'info',
    context,
    message: 'Logging something...'
  })
})

it('keeps log metadata and payload fields over flat context collisions', () => {
  const { mockGlobal } = setup()
  mockGlobal.CORE_LOGLEVEL = 'info'
  const context = {
    timestamp: 'old',
    level: 'fatal',
    namespace: 'context-namespace',
    message: 'context message',
    args: ['context args'],
    correlationId: 'ABCD1234'
  }
  const logger = new Logger({
    global: mockGlobal,
    namespace: 'core',
    context,
    flat: true
  })

  logger.info('real message', 'value')
  assert.deepStrictEqual(parseRecord(mockGlobal.infoArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'info',
    namespace: 'core',
    message: 'real message',
    args: ['context args'],
    correlationId: 'ABCD1234',
    arg1: 'value'
  })
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
    assert.deepStrictEqual(parseRecord(mockGlobal.infoArgs), {
      timestamp: '2025-02-15T00:00:00.000Z',
      level: 'info',
      correlationId: 'ABCD1234',
      model: 'Product',
      message: 'Logging something...'
    })
  } finally {
    Logger.context = originalContext
  }
})

it('includes namespace in JSON output and uses the namespace loglevel variable', () => {
  const { mockGlobal } = setup()
  mockGlobal.CORE_LOGLEVEL = 'info'
  const logger = new Logger({ global: mockGlobal, namespace: 'core' })

  logger.info('Logging something...')
  assert.deepStrictEqual(parseRecord(mockGlobal.infoArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'info',
    namespace: 'core',
    message: 'Logging something...'
  })
})

it('merges non-string object payloads into the JSON record', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'info'
  const logger = new Logger({ global: mockGlobal })

  logger.info({ code: 'E_UNEXPECTED' })
  assert.deepStrictEqual(parseRecord(mockGlobal.infoArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'info',
    code: 'E_UNEXPECTED'
  })
})

it('stores null payloads as positional fields in JSON format', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'info'
  const logger = new Logger({ global: mockGlobal })

  logger.info(null)
  assert.deepStrictEqual(parseRecord(mockGlobal.infoArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'info',
    arg0: null
  })
})

it('serializes Error payloads in JSON format', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'error'
  const logger = new Logger({ global: mockGlobal })
  const error = new Error('Unexpected failure')
  error.code = 'E_UNEXPECTED'

  logger.error(error)
  const record = parseRecord(mockGlobal.errorArgs)

  assert.strictEqual(record.level, 'error')
  assert.strictEqual(record.name, 'Error')
  assert.strictEqual(record.message, 'Unexpected failure')
  assert.strictEqual(record.code, 'E_UNEXPECTED')
  assert.match(record.stack, /Unexpected failure/)
})

it('serializes nested Error values inside object payloads', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'info'
  const logger = new Logger({ global: mockGlobal })
  const nested = new Error('Nested failure')
  nested.code = 'E_NESTED'

  logger.info({ nested })
  const record = parseRecord(mockGlobal.infoArgs)

  assert.strictEqual(record.nested.name, 'Error')
  assert.strictEqual(record.nested.message, 'Nested failure')
  assert.strictEqual(record.nested.code, 'E_NESTED')
  assert.match(record.nested.stack, /Nested failure/)
})

it('lets additional payload fields overwrite previously defined keys', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'info'
  const logger = new Logger({ global: mockGlobal })
  const error = new TypeError('Bad input')
  error.field = 'name'

  logger.info('Validation failed', error)
  const record = parseRecord(mockGlobal.infoArgs)

  assert.strictEqual(record.message, 'Bad input')
  assert.strictEqual(record.name, 'TypeError')
  assert.strictEqual(record.field, 'name')
  assert.match(record.stack, /Bad input/)
})

it('serializes special values and circular references in merged JSON fields', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'info'
  const logger = new Logger({ global: mockGlobal })
  const payload = {
    count: 10n,
    token: Symbol('auth')
  }
  payload.self = payload

  logger.info('Special payload', (function () {}), function namedFn () {}, payload)
  const record = parseRecord(mockGlobal.infoArgs)

  assert.strictEqual(record.message, 'Special payload')
  assert.strictEqual(record.arg1, '[Function anonymous]')
  assert.strictEqual(record.arg2, '[Function namedFn]')
  assert.strictEqual(record.count, '10')
  assert.strictEqual(record.token, 'Symbol(auth)')
  assert.strictEqual(record.self.count, '10')
  assert.strictEqual(record.self.token, 'Symbol(auth)')
  assert.strictEqual(record.self.self, '[Circular]')
})

it('stores array payloads as positional fields in JSON format', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'info'
  const logger = new Logger({ global: mockGlobal })

  logger.info('Array payload', [1, 2, 3])
  assert.deepStrictEqual(parseRecord(mockGlobal.infoArgs), {
    timestamp: '2025-02-15T00:00:00.000Z',
    level: 'info',
    message: 'Array payload',
    arg1: [1, 2, 3]
  })
})

it('supports plain formatting for backward compatibility', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'info'
  const context = { correlationId: 'ABCD1234' }
  const logger = new Logger({ global: mockGlobal, context, format: 'plain' })

  logger.info('Logging something...', 0, false)
  assert.deepStrictEqual(mockGlobal.infoArgs, [
    '2025-02-15T00:00:00.000Z [INFO]',
    JSON.stringify(context),
    'Logging something...',
    0,
    false
  ])
})

it('supports plain formatting without context labels', () => {
  const { mockGlobal } = setup()
  mockGlobal.LOGLEVEL = 'info'
  const logger = new Logger({ global: mockGlobal, format: 'plain' })

  logger.info()
  assert.deepStrictEqual(mockGlobal.infoArgs, [
    '2025-02-15T00:00:00.000Z [INFO]'
  ])
})
