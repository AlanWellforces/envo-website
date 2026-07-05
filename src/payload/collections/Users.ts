import type { CollectionConfig } from 'payload'

type MaybeUser = { role?: string | null } | null | undefined

const isAdmin = ({ req: { user } }: { req: { user: MaybeUser } }) =>
  user?.role === 'admin'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Settings',
    defaultColumns: ['email', 'name', 'role'],
    // Hide this collection from the sidebar for non-admins.
    // NOTE: do NOT use access.admin for this — Payload uses that to gate
    // the entire admin panel, which would lock out all editors.
    // Payload's ClientUser type doesn't carry our custom `role` field — narrow it here.
    hidden: ({ user }) => (user as MaybeUser)?.role !== 'admin',
  },
  access: {
    // Only admins can create or delete user accounts
    create: isAdmin,
    delete: isAdmin,
    // Admins see all users; editors can only read their own profile
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { id: { equals: user.id } }
    },
    // Admins can update anyone; editors can only update their own profile
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { id: { equals: user.id } }
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Full Name',
    },
    {
      name: 'role',
      type: 'select',
      label: 'Role',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin',  value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: {
        // Only admins can change someone's role
        update: isAdmin,
      },
      admin: {
        description: 'Admins can manage users and settings. Editors can create and edit content.',
      },
    },
  ],
}
