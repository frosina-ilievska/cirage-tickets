import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { secret } = await req.json().catch(() => ({ secret: "" }));
  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Debug: show env var prefix
  const dbUrl = process.env.DATABASE_URL || "(not set)";
  const prefix = dbUrl.substring(0, 30);

  try {
    await prisma.$executeRawUnsafe(`SELECT 1`);
    return NextResponse.json({ ok: true, db_prefix: prefix });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg, db_prefix: prefix }, { status: 500 });
  }
}
