import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create categories
  const categories = [
    { name: "Design", color: "#8b5cf6" },
    { name: "Development", color: "#3b82f6" },
    { name: "Content", color: "#10b981" },
    { name: "Admin", color: "#f59e0b" },
    { name: "Email / NL", color: "#ec4899" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // Create users
  const adminPassword = await hash("Admin123!", 12);
  const designerPassword = await hash("Designer123!", 12);
  const memberPassword = await hash("Member123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@cirageparis.com" },
    update: {},
    create: {
      email: "admin@cirageparis.com",
      name: "Admin",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const designer1 = await prisma.user.upsert({
    where: { email: "marie@cirageparis.com" },
    update: {},
    create: {
      email: "marie@cirageparis.com",
      name: "Marie",
      password: designerPassword,
      role: "DESIGNER",
    },
  });

  const designer2 = await prisma.user.upsert({
    where: { email: "sophie@cirageparis.com" },
    update: {},
    create: {
      email: "sophie@cirageparis.com",
      name: "Sophie",
      password: designerPassword,
      role: "DESIGNER",
    },
  });

  await prisma.user.upsert({
    where: { email: "team@cirageparis.com" },
    update: {},
    create: {
      email: "team@cirageparis.com",
      name: "Team Member",
      password: memberPassword,
      role: "MEMBER",
    },
  });

  // ── Cirage Paris team ──────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "natacha.seroussi@gmail.com" },
    update: {},
    create: {
      email: "natacha.seroussi@gmail.com",
      name: "Natacha",
      password: await hash("Natacha@Cirage1", 12),
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "yuri@cirageparis.com" },
    update: {},
    create: {
      email: "yuri@cirageparis.com",
      name: "Yuri",
      password: await hash("Yuri@Cirage1", 12),
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "alba.igz@gmail.com" },
    update: {},
    create: {
      email: "alba.igz@gmail.com",
      name: "Alba",
      password: await hash("Alba@Cirage1", 12),
      role: "DESIGNER",
    },
  });

  await prisma.user.upsert({
    where: { email: "mlisova24@gmail.com" },
    update: {},
    create: {
      email: "mlisova24@gmail.com",
      name: "Maryna",
      password: await hash("Maryna@Cirage1", 12),
      role: "DESIGNER",
    },
  });

  await prisma.user.upsert({
    where: { email: "frosinailievska8@gmail.com" },
    update: {},
    create: {
      email: "frosinailievska8@gmail.com",
      name: "Frosina",
      password: await hash("Frosina@Cirage1", 12),
      role: "MEMBER",
    },
  });

  // Create sample tickets
  const designCat = await prisma.category.findUnique({ where: { name: "Design" } });
  const devCat = await prisma.category.findUnique({ where: { name: "Development" } });

  if (designCat && devCat) {
    const t1 = await prisma.ticket.create({
      data: {
        title: "Redesign homepage hero section",
        description: "The hero section needs a refresh for the summer collection. New visuals, updated copy.",
        status: "OPEN",
        priority: "HIGH",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        categoryId: designCat.id,
        createdById: admin.id,
      },
    });

    await prisma.activity.create({
      data: {
        action: "created this ticket",
        ticketId: t1.id,
        userId: admin.id,
      },
    });

    const t2 = await prisma.ticket.create({
      data: {
        title: "Fix mobile navigation menu",
        description: "The hamburger menu on mobile doesn't close after selecting an item.",
        status: "IN_PROGRESS",
        priority: "P0",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        categoryId: devCat.id,
        createdById: admin.id,
        assigneeId: designer1.id,
      },
    });

    await prisma.activity.create({
      data: {
        action: "created this ticket",
        ticketId: t2.id,
        userId: admin.id,
      },
    });

    await prisma.activity.create({
      data: {
        action: "assigned ticket to Marie",
        ticketId: t2.id,
        userId: admin.id,
      },
    });

    await prisma.comment.create({
      data: {
        content: "I can reproduce this on both iOS Safari and Chrome. Will fix today.",
        ticketId: t2.id,
        authorId: designer1.id,
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log("");
  console.log("Accounts:");
  console.log("  admin@cirageparis.com          Admin123!       (Admin)");
  console.log("  natacha.seroussi@gmail.com     Natacha@Cirage1 (Admin)");
  console.log("  yuri@cirageparis.com           Yuri@Cirage1    (Admin)");
  console.log("  marie@cirageparis.com          Designer123!    (Designer)");
  console.log("  sophie@cirageparis.com         Designer123!    (Designer)");
  console.log("  alba.igz@gmail.com             Alba@Cirage1    (Designer)");
  console.log("  mlisova24@gmail.com            Maryna@Cirage1  (Designer)");
  console.log("  team@cirageparis.com           Member123!      (Member)");
  console.log("  frosinailievska8@gmail.com     Frosina@Cirage1 (Member/Developer)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
