import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Add Email / NL category ────────────────────────────────────────────────
  await prisma.category.upsert({
    where: { name: "Email / NL" },
    update: {},
    create: { name: "Email / NL", color: "#ec4899" },
  });
  console.log("✓ Category: Email / NL");

  // ── Add team users ─────────────────────────────────────────────────────────
  const users = [
    { name: "Natacha", email: "natacha.seroussi@gmail.com", password: "Natacha@Cirage1", role: "ADMIN" },
    { name: "Yuri",    email: "yuri@cirageparis.com",       password: "Yuri@Cirage1",    role: "ADMIN" },
    { name: "Alba",    email: "alba.igz@gmail.com",          password: "Alba@Cirage1",    role: "DESIGNER" },
    { name: "Maryna",  email: "mlisova24@gmail.com",         password: "Maryna@Cirage1",  role: "DESIGNER" },
    { name: "Frosina", email: "frosinailievska8@gmail.com",  password: "Frosina@Cirage1", role: "MEMBER" },
  ];

  for (const u of users) {
    const hashed = await hash(u.password, 12);
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password: hashed },
      create: { email: u.email, name: u.name, password: hashed, role: u.role },
    });
    console.log(`✓ ${created.name.padEnd(10)} ${created.email.padEnd(38)} [${created.role}]`);
  }

  console.log("\n── Passwords ─────────────────────────────────────────────────");
  for (const u of users) {
    console.log(`  ${u.name.padEnd(10)} ${u.password}`);
  }
  console.log("\nDone! Restart the app if it was running.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
