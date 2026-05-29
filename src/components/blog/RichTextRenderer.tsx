// Minimal Lexical-JSON → React renderer. Covers paragraphs, headings, lists,
// links, blockquotes, and inline marks (bold/italic/underline/code). Add more
// node types as they appear in real content.

import React from 'react'

type LexicalNode = {
  type?: string
  tag?: string
  text?: string
  format?: number
  url?: string
  newTab?: boolean
  fields?: { url?: string; newTab?: boolean; blockType?: string; html?: string }
  listType?: 'bullet' | 'number'
  children?: LexicalNode[]
}

type LexicalDoc = { root: LexicalNode }

const FMT = {
  BOLD: 1,
  ITALIC: 1 << 1,
  STRIKETHROUGH: 1 << 2,
  UNDERLINE: 1 << 3,
  CODE: 1 << 4,
}

function applyFormat(text: React.ReactNode, format = 0): React.ReactNode {
  let node = text
  if (format & FMT.CODE) node = <code>{node}</code>
  if (format & FMT.BOLD) node = <strong>{node}</strong>
  if (format & FMT.ITALIC) node = <em>{node}</em>
  if (format & FMT.UNDERLINE) node = <u>{node}</u>
  if (format & FMT.STRIKETHROUGH) node = <s>{node}</s>
  return node
}

function renderChildren(children: LexicalNode[] | undefined): React.ReactNode {
  if (!children) return null
  return children.map((child, i) => <Node key={i} node={child} />)
}

function Node({ node }: { node: LexicalNode }): React.ReactNode {
  if (!node) return null

  // Leaf text
  if (typeof node.text === 'string') {
    return applyFormat(node.text, node.format)
  }

  switch (node.type) {
    case 'paragraph':
      return <p>{renderChildren(node.children)}</p>
    case 'heading': {
      const Tag = (node.tag || 'h2') as keyof React.JSX.IntrinsicElements
      return <Tag>{renderChildren(node.children)}</Tag>
    }
    case 'quote':
      return <blockquote>{renderChildren(node.children)}</blockquote>
    case 'list': {
      const ListTag = node.listType === 'number' ? 'ol' : 'ul'
      return <ListTag>{renderChildren(node.children)}</ListTag>
    }
    case 'listitem':
      return <li>{renderChildren(node.children)}</li>
    case 'link': {
      const href = node.fields?.url ?? node.url ?? '#'
      const newTab = node.fields?.newTab ?? node.newTab
      return (
        <a href={href} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined}>
          {renderChildren(node.children)}
        </a>
      )
    }
    case 'linebreak':
      return <br />
    case 'block': {
      // Custom blocks from BlocksFeature. The "html" block renders its raw
      // HTML verbatim — authored by trusted editors, used for special layouts.
      if (node.fields?.blockType === 'html' && typeof node.fields.html === 'string') {
        return <div className="blog-html-block" dangerouslySetInnerHTML={{ __html: node.fields.html }} />
      }
      return <>{renderChildren(node.children)}</>
    }
    default:
      // Unknown node — render children if any, else nothing.
      return <>{renderChildren(node.children)}</>
  }
}

export function RichTextRenderer({ doc }: { doc: LexicalDoc | unknown }) {
  const root = (doc as LexicalDoc | undefined)?.root
  if (!root) return null
  return <>{renderChildren(root.children)}</>
}
