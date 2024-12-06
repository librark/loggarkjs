export class Logger {
  static context () {
    return null
  }

  #context = {}

  constructor ({ namespace = '', context = null, global = globalThis } = {}) {
    const levels = ['error', 'warn', 'info', 'debug']
    const logvar = [namespace, 'LOGLEVEL'].filter(
      Boolean).join('_').toUpperCase().replaceAll(' ', '_')
    const loglevel = String(global[logvar]).toLowerCase()
    this.global = global
    this.logindex = levels.indexOf(loglevel)
    this.#context = context
  }

  get context () {
    const context = this.constructor.context()
    return !(context || this.#context) ? null : { ...context, ...this.#context }
  }

  log (...args) {
    if (this.logindex >= 0) log(this.global, 'log', this.context, args)
  }

  error (...args) {
    if (this.logindex >= 0) log(this.global, 'error', this.context, args) 
  }

  warn (...args) {
    if (this.logindex >= 1) log(this.global, 'warn', this.context, args)
  }

  info (...args) {
    if (this.logindex >= 2) log(this.global, 'info', this.context, args)
  }

  debug (...args) {
    if (this.logindex >= 3) log(this.global, 'debug', this.context, args)
  }
}

function log (global, level, context, args) {
  return global.console[level](
  `[${level.toUpperCase()}]`,
  ...[context ? JSON.stringify(context) : false, ...args].filter(Boolean))
}