import assert from 'node:assert/strict'
import { it } from 'node:test'
import { Translator, t, lt } from './translator.js'

it('can be instantiated', () => {
  const translator = new Translator()
  assert.ok(translator)
})

it('defines a translate function with options', () => {
  const translator = new Translator()

  const result = translator.translate('any.key') 

  assert.strictEqual(result, 'any.key')
})

it('defines a t shortcut for function translate', () => {
  const t = new Translator().t

  const result = t('any.key') 

  assert.strictEqual(result, 'any.key')
})

it('defines a global t shortcut translate', () => {
  const originalTranslate = Translator.translate
  try {
    Translator.translate = (key, _options) => {
      return `translated:${key}`
    }

    const result = t('any.key') 

    assert.strictEqual(result, 'translated:any.key')
  } finally {
    Translator.translate = originalTranslate
  }
})

it('defines a global lt lazy-translation function', () => {
  const originalTranslate = Translator.translate
  try {
    Translator.translate = (key, _options) => {
      return `translated:${key}`
    }

    const result = lt('any.key') 

    assert.ok(result instanceof Function)
    assert.strictEqual(result(), 'translated:any.key')
  } finally {
    Translator.translate = originalTranslate
  }
})
