import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const USERS = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Alice", role: "EMPLOYEE" as const },
  { id: "22222222-2222-4222-8222-222222222222", name: "Bob", role: "EMPLOYEE" as const },
  { id: "33333333-3333-4333-8333-333333333333", name: "Carol", role: "ADMIN" as const },
];

async function main() {
  for (const user of USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
