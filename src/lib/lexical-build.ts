// Tiny helpers to author Lexical rich-text JSON for seed scripts. Shapes match
// @payloadcms/richtext-lexical and what src/components/blog/RichTextRenderer.tsx
// renders (paragraph/heading/list/link/text + format bitmask, bold = 1).

export type LexicalNode = {
  type: string
  tag?: string
  text?: string
  format?: number | string
  listType?: 'bullet' | 'number'
  fields?: { url?: string; newTab?: boolean }
  children?: LexicalNode[]
  version?: number
  [k: string]: unknown
}
export type LexicalLeaf = LexicalNode

const leaf = (extra: Partial<LexicalNode>): LexicalNode => ({ version: 1, ...extra })

export const text = (s: string, format = 0): LexicalLeaf =>
  leaf({ type: 'text', text: s, format, detail: 0, mode: 'normal', style: '' })

export const b = (s: string): LexicalLeaf => text(s, 1)

export const link = (label: string, url: string): LexicalNode =>
  leaf({
    type: 'link',
    fields: { url, newTab: false, linkType: 'custom' },
    children: [text(label)],
    direction: 'ltr',
    format: '',
    indent: 0,
  })

export const p = (...children: LexicalNode[]): LexicalNode =>
  leaf({ type: 'paragraph', children, direction: 'ltr', format: '', indent: 0, textFormat: 0 })

export const h2 = (s: string): LexicalNode =>
  leaf({ type: 'heading', tag: 'h2', children: [text(s)], direction: 'ltr', format: '', indent: 0 })

export const ul = (items: LexicalNode[][]): LexicalNode =>
  leaf({
    type: 'list',
    listType: 'bullet',
    tag: 'ul',
    start: 1,
    children: items.map((children, i) =>
      leaf({ type: 'listitem', value: i + 1, children, direction: 'ltr', format: '', indent: 0 }),
    ),
    direction: 'ltr',
    format: '',
    indent: 0,
  })

export const doc = (...blocks: LexicalNode[]): { root: LexicalNode } => ({
  root: leaf({ type: 'root', children: blocks, direction: 'ltr', format: '', indent: 0 }),
})
