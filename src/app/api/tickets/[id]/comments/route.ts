import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      ticketId: params.id,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, name: true } },
      attachments: true,
    },
  });

  await prisma.activity.create({
    data: {
      action: "added a comment",
      ticketId: params.id,
      userId: session.user.id,
    },
  });

  // Email notifications for comment — notify assignee