import { describe, it, expect } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('lowercases and joins words with dashes', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('strips punctuation', () => {
    expect(slugify("Don't worry, be happy!")).toBe('dont-worry-be-happy')
  })

  it('collapses repeated spaces and dashes', () => {
    expect(slugify('a   b -- c')).toBe('a-b-c')
  })

  it('trims leading and trailing dashes', () => {
    expect(slugify('  --hello--  ')).toBe('hello')
  })

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })

  it('handles unicode by stripping it', () => {
    // We intentionally do not transliterate. Editor can override slug manually.
    expect(slugify('LED 灯')).toBe('led')
  })
})
