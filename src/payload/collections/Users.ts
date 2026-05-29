import type { CollectionConfig } from 'payload'

const isAdmin = ({ req: { user } }: { req: { user: any } }) =>
  user?.role === 'admin'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Settings',
    defaultColumns: ['email', 'name', 'role'],
  },
  access: {
    // Only admins can create, update, or delete user accounts
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
    // Only admins can access the Users list in the admin panel
    admin: isAdmin,
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
