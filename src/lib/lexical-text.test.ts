import { describe, it, expect } from 'vitest'
import { lexicalToText, readingTimeMinutes } from './lexical-text'

describe('lexicalToText', () => {
  it('returns empty string for null / undefined', () => {
    expect(lexicalToText(null)).toBe('')
    expect(lexicalToText(undefined)).toBe('')
  })

  it('extracts text from a flat text node', () => {
    expect(lexicalToText({ text: 'hello' })).toBe('hello')
  })

  it('walks children recursively', () => {
    const doc = {
      root: {
        children: [
          { children: [{ text: 'one' }, { text: 'two' }] },
          { children: [{ text: 'three' }] },
        ],
      },
    }
    expect(lexicalToText(doc)).toContain('one')
    expect(lexicalToText(doc)).toContain('two')
    expect(lexicalToText(doc)).toContain('three')
  })
})

describe('readingTimeMinutes', () => {
  it('rounds up to nearest minute, minimum 1', () => {
    expect(readingTimeMinutes('')).toBe(1)
    expect(readingTimeMinutes('one')).toBe(1)
  })

  it('uses 200 words per minute', () => {
    const text = Array(400).fill('word').join(' ') // 400 words
    expect(readingTimeMinutes(text)).toBe(2)
  })

  it('rounds 250 words up to 2 minutes', () => {
    const text = Array(250).fill('word').join(' ')
    expect(readingTimeMinutes(text)).toBe(2)
  })
})
