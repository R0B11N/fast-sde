"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // Clean up existing users to prevent unique constraint errors during iterative testing
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    // The password for all seed users will be "test"
    const passwordHash = await bcrypt_1.default.hash('test', 10);
    const users = [
        { name: 'Alex Chen', email: 'alex@maximmechanical.com', role: client_1.Role.owner },
        { name: 'Morgan Reed', email: 'morgan@maximmechanical.com', role: client_1.Role.admin },
        { name: 'Jordan Smith', email: 'jordan@maximmechanical.com', role: client_1.Role.editor },
        { name: 'Sam Williams', email: 'sam@maximmechanical.com', role: client_1.Role.viewer },
        { name: 'Taylor Brown', email: 'taylor@maximmechanical.com', role: client_1.Role.viewer },
        { name: 'Pat Davis', email: 'pat@maximmechanical.com', role: client_1.Role.editor },
    ];
    for (const u of users) {
        const user = await prisma.user.create({
            data: {
                name: u.name,
                email: u.email,
                passwordHash,
                role: u.role,
                active: true,
            },
        });
        console.log(`✅ Created user: ${user.email} (${user.role})`);
    }
    console.log('🎉 Seed completed successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map