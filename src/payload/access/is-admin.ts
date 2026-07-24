// Role gate shared by collections/globals whose sensitive operations must be
// admin-only. The 'editor' role is deliberately non-functional (2026-07-24
// P0 decision): the admin panel itself is gated to admins in Users.ts, and
// these rules close the REST/GraphQL side, where a non-admin login token
// would otherwise still work. If a real editor tier is ever wanted, loosen
// per-collection from here — the checklist lives in the audit memory.
import type { Access } from 'payload'

type RoleUser = { role?: string | null } | null | undefined

export const isAdmin: Access = ({ req }) => (req.user as RoleUser)?.role === 'admin'
