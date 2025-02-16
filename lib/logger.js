export class Logger {
  static context () {
    return null
  }

  #context = {}

  constructor ({ namespace = '', context = null, global = globalThis } = {}) {
    this.levels = ['error', 'warn', 'info', 'debug']
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
  `${new global.Date().toISOString()} [${level.toUpperCase()}]`,
  ...[context ? JSON.stringify(context) : false, ...args].filter(Boolean))
}