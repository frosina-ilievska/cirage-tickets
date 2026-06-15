import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, overdueEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  // Vercel Cron authenticates with CRON_SECRET
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overdueTickets = await prisma.ticket.findMany({
    where: {
      status: { notIn: ["DONE", "ARCHIVED"] },
      dueDate: { lt: new Date() },
      assigneeId: { not: null },
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  let sent = 0;
  for (const ticket of overdueTickets) {
    if (ticket.assignee) {
      const emailData = overdueEmail(ticket.title, ticket.id, ticket.assignee.name);
      await sendEmail({ to: ticket.assignee.email, ...emailData });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, ticketsFound: overdueTickets.length, emailsSent: sent });
}
