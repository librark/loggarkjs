export declare class Logger {
  static Logger(): void

  constructor (dependencies?: {
    namespace?: string,
    context?: object,
    global?: object
  })

  context?: object

  log(...args: string[]): void

  error(...args: string[]): void

  warn(...args: string[]): void

  info(...args: string[]): void

  debug(...args: string[]): void
}
