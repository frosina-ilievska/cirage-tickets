import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { secret } = await req.json().catch(() => ({ secret: "" }));
  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Create tables
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'MEMBER',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Category" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "color" TEXT NOT NULL DEFAULT '#6366f1',
        CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Ticket" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'OPEN',
        "priority" TEXT NOT NULL DEFAULT 'NORMAL',
        "dueDate" TIMESTAMP(3),
        "driveLink" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "categoryId" TEXT,
        "assigneeId" TEXT,
        "createdById" TEXT NOT NULL,
        CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Comment" (
        "id" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ticketId" TEXT NOT NULL,
        "authorId" TEXT NOT NULL,
        CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Activity" (
        "id" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ticketId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Attachment" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "fileType" TEXT NOT NULL DEFAULT 'file',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ticketId" TEXT NOT NULL,
        "commentId" TEXT,
        CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
      );
    `);

    // Add foreign keys (ignore errors if already exist)
    const fkStatements = [
      `ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
      `ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
      `ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "Comment" ADD CONSTRAINT "Comment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "Activity" ADD CONSTRAINT "Activity_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
      `ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    ];

    for (const stmt of fkStatements) {
      try {
        await prisma.$executeRawUnsafe(stmt);
      } catch {
        // FK already exists — ignore
      }
    }

    // Seed categories
    const categories = [
      { name: "Design", color: "#8b5cf6" },
      { name: "Development", color: "#3b82f6" },
      { name: "Marketing", color: "#10b981" },
      { name: "Operations", color: "#f59e0b" },
      { name: "Finance", color: "#ef4444" },
      { name: "HR", color: "#ec4899" },
      { name: "General", color: "#6366f1" },
    ];

    for (const cat of categories) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Category" ("id", "name", "color") VALUES (gen_random_uuid()::text, $1, $2) ON CONFLICT ("name") DO NOTHING`,
        cat.name,
        cat.color
      );
    }

    const categoryCount = await prisma.$queryRawUnsafe<{count: bigint}[]>(`SELECT COUNT(*) as count FROM "Category"`);

    return NextResponse.json({ ok: true, categories: Number(categoryCount[0].count) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
