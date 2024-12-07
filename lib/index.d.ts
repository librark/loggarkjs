export declare class Logger {
  static context(): object | null

  constructor (dependencies?: {
    namespace?: string,
    context?: object,
    global?: object
  })

  context?: object | null

  logindex: number

  log(...data: any[]): void

  error(...data: any[]): void

  warn(...data: any[]): void

  info(...data: any[]): void

  debug(...data: any[]): void
}
