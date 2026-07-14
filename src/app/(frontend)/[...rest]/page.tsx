import { notFound } from 'next/navigation'

// Catch-all for URLs no route claims. Without it, unmatched paths render
// Next's unbranded default 404 (there is no root layout — the (frontend) and
// (payload) groups own their own <html>), never our not-found.tsx. Literal
// routes always win over a catch-all, so /admin, /api, /datasheets and every
// real page are untouched; anything else lands here and 404s with the
// branded page + full site chrome.
export default function CatchAll(): never {
  notFound()
}
