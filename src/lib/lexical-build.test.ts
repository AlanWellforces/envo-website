import { describe, it, expect } from 'vitest'
import { doc, h2, p, ul, text, b, link } from './lexical-build'

describe('lexical-build', () => {
  it('builds a heading node', () => {
    const n = h2('Hello')
    expect(n.type).toBe('heading')
    expect(n.tag).toBe('h2')
    expect(n.children?.[0]).toMatchObject({ type: 'text', text: 'Hello' })
  })

  it('builds a paragraph with an inline link and bold run', () => {
    const n = p(text('See '), link('here', '/x'), text(' and '), b('this'))
    expect(n.type).toBe('paragraph')
    expect(n.children?.[1]).toMatchObject({ type: 'link', fields: { url: '/x' } })
    expect(n.children?.[3]).toMatchObject({ type: 'text', text: 'this', format: 1 })
  })

  it('builds a bullet list with two items', () => {
    const n = ul([[text('one')], [text('two')]])
    expect(n.type).toBe('list')
    expect(n.listType).toBe('bullet')
    expect(n.children).toHaveLength(2)
    expect(n.children?.[0].type).toBe('listitem')
  })

  it('wraps blocks in a root', () => {
    const d = doc(h2('A'), p(text('b')))
    expect(d.root.type).toBe('root')
    expect(d.root.children).toHaveLength(2)
  })
})
