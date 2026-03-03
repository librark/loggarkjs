import { journaldSocket } from './utilities/journald-socket.js'

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
    this.journald = getJournaldTransport(this.global)
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
    if (this.logindex >= 0) log(this.global, 'log', this.context, args, this.namespace, this.format, this.flat, this.journald)
  }

  error (...args) {
    if (this.logindex >= 0) log(this.global, 'error', this.context, args, this.namespace, this.format, this.flat, this.journald)
  }

  warn (...args) {
    if (this.logindex >= 1) log(this.global, 'warn', this.context, args, this.namespace, this.format, this.flat, this.journald)
  }

  info (...args) {
    if (this.logindex >= 2) log(this.global, 'info', this.context, args, this.namespace, this.format, this.flat, this.journald)
  }

  debug (...args) {
    if (this.logindex >= 3) log(this.global, 'debug', this.context, args, this.namespace, this.format, this.flat, this.journald)
  }
}

function parseArgs (args) {
  const payload = {}

  args.forEach((value, index) => {
    if (index === 0 && typeof value === 'string') {
      payload.message = value
      return
    }

    Object.assign(payload, toLogFields(value, index))
  })

  return payload
}

function toLogFields (value, index) {
  if (value instanceof Error) return toSerializableError(value)
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  return { [`arg${index}`]: value }
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

export const JOURNAL_PRIORITY = {
  log: 6,
  error: 3,
  warn: 4,
  info: 6,
  debug: 7
}

function toJournaldFields (record) {
  const entry = {
    PRIORITY: JOURNAL_PRIORITY[record.level] ?? 6,
    MESSAGE: serializeJournaldValue(record.message) ?? '',
    TIMESTAMP: record.timestamp,
    LEVEL: record.level
  }

  if (record.namespace) {
    entry.SYSLOG_IDENTIFIER = record.namespace
  }

  for (const [key, value] of Object.entries(record)) {
    if (['timestamp', 'level', 'namespace', 'message'].includes(key)) continue
    const normalized = serializeJournaldValue(value)
    if (normalized !== undefined) {
      entry[key.toUpperCase()] = normalized
    }
  }

  return entry
}

function serializeJournaldValue (value) {
  if (value === undefined) return undefined
  if (value === null) return 'null'
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`
  if (typeof value === 'symbol') return value.toString()
  if (typeof value === 'object') return stringifyJson(value)
  return String(value)
}

let defaultJournaldTransport = null

function getJournaldTransport (global) {
  if (!global?.JOURNALD) return null
  if (defaultJournaldTransport) return defaultJournaldTransport
  defaultJournaldTransport = journaldSocket.createTransport()
  return defaultJournaldTransport
}

function sendToJournald (journald, fields) {
  if (typeof journald === 'function') {
    journald(fields)
    return
  }

  if (journald && typeof journald.send === 'function') {
    journald.send(fields)
    return
  }

  if (journald && typeof journald.log === 'function') {
    journald.log(fields)
  }
}

function log (global, level, context, args, namespace, format, flat, journald) {
  const timestamp = new global.Date().toISOString()
  const record = {
    ...(flat && context ? context : {}),
    timestamp,
    level,
    ...(namespace ? { namespace } : {}),
    ...(!flat && context ? { context } : {}),
    ...parseArgs(args)
  }

  let consoleResult

  if (format === 'plain') {
    const message = [`${timestamp} [${level.toUpperCase()}]`]
    if (context) message.push(stringifyJson(context))
    message.push(...args)
    consoleResult = global.console[level](...message)
  } else {
    consoleResult = global.console[level](stringifyJson(record))
  }

  if (journald) {
    sendToJournald(journald, toJournaldFields(record))
  }

  return consoleResult
}
