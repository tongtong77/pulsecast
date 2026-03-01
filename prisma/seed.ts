import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding PulseCast database...')

  // 1. Default Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Organization',
      slug: 'default',
      plan: 'FREE',
      maxDevices: 5,
      maxStorage: BigInt(536870912), // 500 MB
    },
  })
  console.log(`✅ Organization: ${org.name}`)

  // 2. Super Admin
  const hashedPassword = await hash('admin123', 12)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@domain.com' },
    update: {},
    create: {
      email: 'super@domain.com',
      name: 'Super Admin',
      password: hashedPassword,
      isSuperAdmin: true,
    },
  })
  console.log(`✅ Super Admin: ${superAdmin.email}`)

  // 3. Assign Super Admin as OWNER of Default Organization
  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: superAdmin.id,
        organizationId: org.id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      organizationId: org.id,
      role: 'OWNER',
    },
  })
  console.log(`✅ Membership: Super Admin → Default Organization (OWNER)`)

  console.log('\n🎉 Seeding complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📧 Login: super@domain.com`)
  console.log(`🔑 Password: admin123`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
