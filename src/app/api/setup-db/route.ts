import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { secret } = await req.json().catch(() => ({ secret: "" }));
  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'MEMBER',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Category" (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        color TEXT NOT NULL DEFAULT '#6366f1'
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Ticket" (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'OPEN',
        priority TEXT NOT NULL DEFAULT 'NORMAL',
        "dueDate" TIMESTAMP(3),
        "driveLink" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "categoryId" TEXT REFERENCES "Category"(id),
        "assigneeId" TEXT REFERENCES "User"(id),
        "createdById" TEXT NOT NULL REFERENCES "User"(id)
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Comment" (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ticketId" TEXT NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
        "authorId" TEXT NOT NULL REFERENCES "User"(id)
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Activity" (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ticketId" TEXT NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "User"(id)
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Attachment" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        "fileType" TEXT NOT NULL DEFAULT 'file',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ticketId" TEXT NOT NULL REFERENCES "Ticket"(id) ON DELETE CASCADE,
        "commentId" TEXT REFERENCES "Comment"(id) ON DELETE CASCADE
      )
    `);

    const categories = [
      { id: "cat_design", name: "Design", color: "#8b5cf6" },
      { id: "cat_dev", name: "Development", color: "#3b82f6" },
      { id: "cat_marketing", name: "Marketing", color: "#10b981" },
      { id: "cat_ops", name: "Operations", color: "#f59e0b" },
      { id: "cat_content", name: "Content", color: "#ef4444" },
    ];
    for (const cat of categories) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Category" (id, name, color) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING`,
        cat.id, cat.name, cat.color
      );
    }

    return NextResponse.json({ ok: true, message: "Schema + seed applied!" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
