import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      assignee: { select: { id: true, name: true, email: true, role: true } },
      createdBy: { select: { id: true, name: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true } },
          attachments: true,
        },
        orderBy: { createdAt: "asc" },
      },
      activities: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
    },
  });

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  return NextResponse.json(ticket);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const role = session.user.role;
  const userId = session.user.id;
  const isAdmin = role === "ADMIN";
  const isAssignee = ticket.assigneeId === userId;

  if (!isAdmin && !isAssignee) {
    return NextResponse.json({ error: "Not authorized to edit this ticket" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, status, priority, dueDate, categoryId, assigneeId, driveLink } = body;

  const changes: string[] = [];

  if (status && status !== ticket.status) changes.push(`changed status from ${formatStatus(ticket.status)} to ${formatStatus(status)}`);
  if (assigneeId !== undefined && assigneeId !== ticket.assigneeId) {
    if (assigneeId) {
      const newAssignee = await prisma.user.findUnique({ where: { id: assigneeId } });
      if (newAssignee) changes.push(`assigned ticket to ${newAssignee.name}`);
    } else {
      changes.push("removed assignee");
    }
  }
  if (priority && priority !== ticket.priority) changes.push(`changed priority to ${priority}`);
  if (dueDate !== undefined) changes.push("updated due date");

  const updated = await prisma.ticket.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
      ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      ...(driveLink !== undefined && { driveLink: driveLink || null }),
    },
    include: {
      category: true,
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  // Log each change as an activity
  for (const change of changes) {
    await prisma.activity.create({
      data: { action: change, ticketId: params.id, userId },
    });
  }

  // Email if newly assigned
  if (assigneeId && assigneeId !== ticket.assigneeId && assigneeId !== userId) {
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (assignee) {
      const { sendEmail, assignedEmail } = await import("@/lib/email");
      const emailData = assignedEmail(updated.title, updated.id, assignee.name);
      await sendEmail({ to: assignee.email, ...emailData });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can delete tickets" }, { status: 403 });
  }

  await prisma.ticket.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

function formatStatus(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
