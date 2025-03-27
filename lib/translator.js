export class Translator {
  static translate (key, _options) {
    return key
  }

  #options = {}

  constructor (options = {}) {
    this.#options = options
  }

  translate (key, options) {
    return this.constructor.translate(
      key, { ...this.#options, ...options })
  }

  get t () {
    return this.translate.bind(this)
  }
}

export const t = (key, options) => Translator.translate(key, options)

export const lt = (key, options) => () => Translator.translate(key, options)