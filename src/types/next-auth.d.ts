import 'next-auth'
import { type DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      organizationId: string | null
      organizationName: string | null
      organizationSlug: string | null
      role: string | null
      isSuperAdmin: boolean
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    organizationId: string | null
    organizationName: string | null
    organizationSlug: string | null
    role: string | null
    isSuperAdmin: boolean
  }
}
