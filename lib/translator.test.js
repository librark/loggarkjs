import { it, expect } from '@jest/globals'
import { Translator, t, lt } from './translator.js'

it('can be instantiated', () => {
  const translator = new Translator()
  expect(translator).toBeTruthy()
})

it('defines a translate function with options', () => {
  const translator = new Translator()

  const result = translator.translate('any.key') 

  expect(result).toBe('any.key')
})

it('defines a t shortcut for function translate', () => {
  const t = new Translator().t

  const result = t('any.key') 

  expect(result).toBe('any.key')
})

it('defines a global t shortcut translate', () => {
  const originalTranslate = Translator.translate
  Translator.translate = (key, _options) => {
    return `translated:${key}`
  }

  const result = t('any.key') 

  expect(result).toBe('translated:any.key')
  Translator.translate = originalTranslate
})

it('defines a global lt lazy-translation function', () => {
  const originalTranslate = Translator.translate
  Translator.translate = (key, _options) => {
    return `translated:${key}`
  }

  const result = lt('any.key') 

  expect(result).toBeInstanceOf(Function)
  expect(result()).toBe('translated:any.key')
  Translator.translate = originalTranslate
})
