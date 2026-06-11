import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const ticketId = formData.get("ticketId") as string;
  const commentId = formData.get("commentId") as string | null;

  if (!file || !ticketId) {
    return NextResponse.json({ error: "File and ticketId are required" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 5MB). Paste a Drive or Dropbox link instead." },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const uploadDir = join(process.cwd(), "public", "uploads");

  // Make sure uploads dir exists
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, safeName), buffer);

  const attachment = await prisma.attachment.create({
    data: {
      name: file.name,
      url: `/uploads/${safeName}`,
      fileType: file.type.startsWith("image/") ? "image" : "file",
      ticketId,
      ...(commentId ? { commentId } : {}),
    },
  });

  return NextResponse.json(attachment, { status: 201 });
}
