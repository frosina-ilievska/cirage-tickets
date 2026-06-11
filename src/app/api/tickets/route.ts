import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const categoryId = searchParams.get("categoryId");
  const assigneeId = searchParams.get("assigneeId");
  const createdById = searchParams.get("createdById");

  const role = session.user.role;
  const userId = session.user.id;

  // Build where clause based on role
  let whereClause: Record<string, unknown> = {};

  if (role === "DESIGNER") {
    whereClause = {
      OR: [
        // Unassigned Design tickets (can claim)
        { assigneeId: null, category: { name: "Design" } },
        // Their own assigned tickets
        { assigneeId: userId },
      ],
    };
  } else if (role === "MEMBER") {
    whereClause = {
      OR: [{ assigneeId: userId }, { createdById: userId }],
    };
  }
  // ADMIN sees all — no extra filter

  if (status) whereClause.status = status;
  if (priority) whereClause.priority = priority;
  if (categoryId) whereClause.categoryId = categoryId;
  if (assigneeId) whereClause.assigneeId = assigneeId;
  if (createdById) whereClause.createdById = createdById;

  const tickets = await prisma.ticket.findMany({
    where: whereClause,
    include: {
      category: true,
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [
      { status: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, status, priority, dueDate, categoryId, assigneeId, driveLink } = body;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const ticket = await prisma.ticket.create({
    data: {
      title,
      description,
      status: status || "OPEN",
      priority: priority || "NORMAL",
      dueDate: dueDate ? new Date(dueDate) : null,
      categoryId: categoryId || null,
      assigneeId: assigneeId || null,
      driveLink: driveLink || null,
      createdById: session.user.id,
    },
    include: {
      category: true,
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      action: "created this ticket",
      ticketId: ticket.id,
      userId: session.user.id,
    },
  });

  // Email notification if assigned
  if (assigneeId && assigneeId !== session.user.id) {
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (assignee) {
      const { sendEmail, assignedEmail } = await import("@/lib/email");
      const emailData = assignedEmail(title, ticket.id, assignee.name);
      await sendEmail({ to: assignee.email, ...emailData });
    }
  }

  return NextResponse.json(ticket, { status: 201 });
}
