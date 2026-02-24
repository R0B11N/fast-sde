import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed...')

    // Clean up existing users to prevent unique constraint errors during iterative testing
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()

    // The password for all seed users will be "test"
    const passwordHash = await bcrypt.hash('test', 10)

    const users = [
        { name: 'Alex Chen', email: 'alex@maximmechanical.com', role: Role.owner },
        { name: 'Morgan Reed', email: 'morgan@maximmechanical.com', role: Role.admin },
        { name: 'Jordan Smith', email: 'jordan@maximmechanical.com', role: Role.editor },
        { name: 'Sam Williams', email: 'sam@maximmechanical.com', role: Role.viewer },
        { name: 'Taylor Brown', email: 'taylor@maximmechanical.com', role: Role.viewer },
        { name: 'Pat Davis', email: 'pat@maximmechanical.com', role: Role.editor },
    ]

    for (const u of users) {
        const user = await prisma.user.create({
            data: {
                name: u.name,
                email: u.email,
                passwordHash,
                role: u.role,
                active: true,
            },
        })
        console.log(`✅ Created user: ${user.email} (${user.role})`)
    }

    console.log('🎉 Seed completed successfully!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
