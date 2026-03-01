export class Logger {
  static context () {
    return null
  }

  #context = {}

  constructor ({ namespace = '', context = null, global = globalThis, format = 'json', flat = true } = {}) {
    this.levels = ['error', 'warn', 'info', 'debug']
    this.namespace = namespace
    this.format = format
    this.flat = flat
    this.logvar = [namespace, 'LOGLEVEL'].filter(
      Boolean).join('_').toUpperCase().replaceAll(' ', '_')
    this.global = global
    this.#context = context
  }

  get context () {
    const context = this.constructor.context()
    return !(context || this.#context) ? null : { ...context, ...this.#context }
  }

  get logindex () {
    const loglevel = String(this.global[this.logvar]).toLowerCase()
    return this.levels.indexOf(loglevel)
  }

  log (...args) {
    if (this.logindex >= 0) log(this.global, 'log', this.context, args, this.namespace, this.format, this.flat)
  }

  error (...args) {
    if (this.logindex >= 0) log(this.global, 'error', this.context, args, this.namespace, this.format, this.flat)
  }

  warn (...args) {
    if (this.logindex >= 1) log(this.global, 'warn', this.context, args, this.namespace, this.format, this.flat)
  }

  info (...args) {
    if (this.logindex >= 2) log(this.global, 'info', this.context, args, this.namespace, this.format, this.flat)
  }

  debug (...args) {
    if (this.logindex >= 3) log(this.global, 'debug', this.context, args, this.namespace, this.format, this.flat)
  }
}

function parseArgs (args) {
  if (!args.length) return {}

  const [first, ...rest] = args
  if (typeof first === 'string') {
    return {
      message: first,
      ...(rest.length ? { args: rest } : {})
    }
  }

  return { args }
}

function toSerializableError (error) {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...error
  }
}

function stringifyJson (payload) {
  const seen = new WeakSet()
  return JSON.stringify(payload, (_key, value) => {
    if (typeof value === 'bigint') return value.toString()
    if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`
    if (typeof value === 'symbol') return value.toString()
    if (value instanceof Error) return toSerializableError(value)

    if (value && typeof value === 'object') {
      if (seen.has(value)) return '[Circular]'
      seen.add(value)
    }

    return value
  })
}

function log (global, level, context, args, namespace, format, flat) {
  const timestamp = new global.Date().toISOString()

  if (format === 'plain') {
    const message = [`${timestamp} [${level.toUpperCase()}]`]
    if (context) message.push(stringifyJson(context))
    message.push(...args)
    return global.console[level](...message)
  }

  const record = {
    ...(flat && context ? context : {}),
    timestamp,
    level,
    ...(namespace ? { namespace } : {}),
    ...(!flat && context ? { context } : {}),
    ...parseArgs(args)
  }

  return global.console[level](stringifyJson(record))
}
