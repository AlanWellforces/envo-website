// Minimal Lexical-JSON text extractor. Handles the shapes Payload's
// lexicalEditor() produces today: { root: { children: [...] } }, plus
// arbitrary nesting through `children` arrays and leaf `text` strings.

type LexicalNode =
  | { text?: string; children?: LexicalNode[]; root?: LexicalNode }
  | null
  | undefined

export function lexicalToText(node: LexicalNode): string {
  if (!node) return ''
  if (typeof (node as { text?: unknown }).text === 'string') {
    return (node as { text: string }).text
  }
  const root = (node as { root?: LexicalNode }).root
  if (root) return lexicalToText(root)
  const children = (node as { children?: LexicalNode[] }).children
  if (Array.isArray(children)) return children.map(lexicalToText).join(' ')
  return ''
}

const WPM = 200

export function readingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / WPM))
}
