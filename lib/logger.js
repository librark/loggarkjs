export class Logger {
  constructor ({ namespace = '', labels = null, global = globalThis } = {}) {
    const levels = ['error', 'warn', 'info', 'debug']
    const logvar = [namespace, 'LOGLEVEL'].filter(
      Boolean).join('_').toUpperCase().replaceAll(' ', '_')
    const loglevel = String(global[logvar]).toLowerCase()
    this.global = global
    this.logindex = levels.indexOf(loglevel)
    this.labels = labels
  }

  log (...args) {
    if (this.logindex >= 0) log(this.global, 'log', this.labels, args)
  }

  error (...args) {
    if (this.logindex >= 0) log(this.global, 'error', this.labels, args) 
  }

  warn (...args) {
    if (this.logindex >= 1) log(this.global, 'warn', this.labels, args)
  }

  info (...args) {
    if (this.logindex >= 2) log(this.global, 'info', this.labels, args)
  }

  debug (...args) {
    if (this.logindex >= 3) log(this.global, 'debug', this.labels, args)
  }
}

function log (global, level, labels, args) {
  return global.console[level](
  `[${level.toUpperCase()}]`,
  ...[labels ? JSON.stringify(labels) : false, ...args].filter(Boolean))
}