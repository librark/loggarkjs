export declare class Logger {
  constructor (dependencies?: {
    namespace?: string,
    global?: object
  })

  log(...args: string[]): void

  error(...args: string[]): void

  warn(...args: string[]): void

  info(...args: string[]): void

  debug(...args: string[]): void
}
