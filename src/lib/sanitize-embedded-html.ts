// Allowlist sanitizer for the richText "html" block (Posts / Pages / Projects).
// The block exists for special layouts, so structural tags, classes and benign
// inline styles pass through — but nothing executable survives: no script/
// iframe/form, no event handlers, no javascript: URLs, no fixed-position
// overlay styles. Applied at render (RichTextRenderer), so it also covers
// anything already stored in the DB.
import sanitizeHtml from 'sanitize-html'

const ALLOWED_TAGS = [
  'a', 'address', 'article', 'aside', 'b', 'blockquote', 'br', 'caption', 'code',
  'dd', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4',
  'h5', 'h6', 'hr', 'i', 'img', 'li', 'ol', 'p', 'pre', 's', 'section', 'small',
  'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead',
  'tr', 'u', 'ul',
]

// Layout-only CSS properties. Anything that can take content out of flow and
// cover the page (position, z-index, inset) is deliberately absent, as is
// background-image (url() beacons). Values are free-form minus ; and {}.
const ALLOWED_STYLE_PROPS = [
  'color', 'background-color', 'font-size', 'font-weight', 'font-style', 'line-height',
  'letter-spacing', 'text-align', 'text-transform', 'text-decoration', 'vertical-align',
  'white-space', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'width', 'max-width', 'min-width', 'height', 'max-height', 'min-height',
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-width', 'border-style', 'border-color', 'border-radius', 'border-collapse',
  'display', 'gap', 'flex', 'flex-direction', 'flex-wrap', 'justify-content',
  'align-items', 'align-self', 'grid-template-columns', 'grid-template-rows',
  'grid-column', 'grid-row', 'object-fit', 'overflow', 'overflow-x', 'overflow-y',
]

const ANY_VALUE = [/^[^;{}]*$/]
const ALLOWED_STYLES = Object.fromEntries(ALLOWED_STYLE_PROPS.map((p) => [p, ANY_VALUE]))

export function sanitizeEmbeddedHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      '*': ['class', 'id', 'style', 'title', 'aria-*', 'role'],
      a: ['class', 'id', 'style', 'title', 'href', 'target', 'rel', 'aria-*', 'role'],
      img: ['class', 'id', 'style', 'src', 'alt', 'width', 'height', 'loading', 'decoding'],
      td: ['class', 'id', 'style', 'colspan', 'rowspan'],
      th: ['class', 'id', 'style', 'colspan', 'rowspan', 'scope'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    // Style declarations not in the property allowlist are silently dropped;
    // a style attribute that ends up empty disappears entirely.
    allowedStyles: { '*': ALLOWED_STYLES },
    // target="_blank" without noopener leaks window.opener — force the pair.
    transformTags: {
      a: (tagName, attribs) =>
        attribs.target === '_blank'
          ? { tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } }
          : { tagName, attribs },
    },
  })
}
