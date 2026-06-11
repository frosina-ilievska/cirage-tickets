import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Designers can claim unassigned Design tickets
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "DESIGNER") {
    return NextResponse.json({ error: "Only designers can claim tickets" }, { status: 403 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { category: true },
  });

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (ticket.category?.name !== "Design") {
    return NextResponse.json({ error: "Can only claim Design tickets" }, { status: 400 });
  }
  if (ticket.assigneeId) {
    return NextResponse.json({ error: "This ticket is already assigned" }, { status: 400 });
  }

  const updated = await prisma.ticket.update({
    where: { id: params.id },
    data: {
      assigneeId: session.user.id,
      status: "IN_PROGRESS",
    },
    include: {
      category: true,
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await prisma.activity.create({
    data: {
      action: `claimed this ticket`,
      ticketId: params.id,
      userId: session.user.id,
    },
  });

  return NextResponse.json(updated);
}
