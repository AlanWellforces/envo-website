// Shared read-access rules for the public Payload REST/GraphQL API.
//
// The FRONTEND never hits these endpoints — every SSR read goes through the
// Local API (getPayload().find), which runs with overrideAccess:true and so
// ignores these rules. They exist solely to gate the anonymous public API at
// /api/* and /api/graphql, which until 2026-07-23 returned disabled/hidden
// products, unpublished drafts, and internal fields (price, stock, lead time).
//
// Authenticated admin requests (req.user set) always get the full, unfiltered
// result — the admin panel depends on it.

import type { Access, FieldAccess, Where } from 'payload'

/** Published content only for anonymous callers; everything for logged-in users. */
export const publishedOrAuthed: Access = ({ req }) =>
  req.user ? true : ({ _status: { equals: 'published' } } as Where)

/** Live catalogue only for anonymous callers: enabled and not hidden. */
export const visibleProductOrAuthed: Access = ({ req }) =>
  req.user
    ? true
    : ({ and: [{ enabled: { equals: true } }, { hidden: { not_equals: true } }] } as Where)

/** Field is readable only by authenticated users (internal-only data). */
export const authedFieldRead: FieldAccess = ({ req }) => Boolean(req.user)
