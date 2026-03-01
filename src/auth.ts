import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // Find user with their organization membership
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            memberships: {
              include: {
                organization: true,
              },
              take: 1, // Get primary organization
              orderBy: { joinedAt: 'asc' },
            },
          },
        })

        if (!user || !user.isActive) {
          return null
        }

        const isPasswordValid = await compare(password, user.password)
        if (!isPasswordValid) {
          return null
        }

        // Get primary organization membership
        const primaryMembership = user.memberships[0]

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          organizationId: primaryMembership?.organizationId ?? null,
          organizationName: primaryMembership?.organization.name ?? null,
          organizationSlug: primaryMembership?.organization.slug ?? null,
          role: primaryMembership?.role ?? null,
          isSuperAdmin: user.isSuperAdmin,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, persist org data to JWT token
      if (user) {
        token.id = user.id!
        token.organizationId = (user as Record<string, unknown>).organizationId as string | null
        token.organizationName = (user as Record<string, unknown>).organizationName as string | null
        token.organizationSlug = (user as Record<string, unknown>).organizationSlug as string | null
        token.role = (user as Record<string, unknown>).role as string | null
        token.isSuperAdmin = (user as Record<string, unknown>).isSuperAdmin as boolean
      }
      return token
    },
    async session({ session, token }) {
      // Pass org data from JWT to session
      if (session.user) {
        session.user.id = token.id as string
        session.user.organizationId = token.organizationId as string | null
        session.user.organizationName = token.organizationName as string | null
        session.user.organizationSlug = token.organizationSlug as string | null
        session.user.role = token.role as string | null
        session.user.isSuperAdmin = token.isSuperAdmin as boolean
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // If accessing root or login, check if super admin should go to /super-admin
      if (url === baseUrl || url === `${baseUrl}/` || url.includes('/login')) {
        return `${baseUrl}/dashboard`
      }
      return url.startsWith(baseUrl) ? url : baseUrl
    },
  },
})
