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

export declare class Translator {
  static translate(key: string, options?: object): string

  constructor (options?: object)

  translate(key: string, options?: object): string

  t(key: string, options?: object): string
}

export declare function t(key: string, options?: object): string