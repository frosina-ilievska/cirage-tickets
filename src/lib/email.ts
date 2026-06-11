// Email utility — logs locally, ready to wire up Resend for production

type EmailPayload = {
  to: string;
  subject: string;
  body: string;
};

export async function sendEmail({ to, subject, body }: EmailPayload) {
  // In local dev, just log the email
  if (process.env.NODE_ENV !== "production" || !process.env.RESEND_API_KEY) {
    console.log("\n📧 [EMAIL — local dev, not actually sent]");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log("──────────────────────────────\n");
    return;
  }

  // Production: use Resend
  // npm install resend  — then uncomment below
  // const { Resend } = await import("resend");
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: "Cirage Paris Tickets <tickets@cirageparis.com>",
  //   to,
  //   subject,
  //   html: body,
  // });
}

export function assignedEmail(ticketTitle: string, ticketId: string, assigneeName: string) {
  return {
    subject: `You've been assigned: ${ticketTitle}`,
    body: `
      <p>Hi ${assigneeName},</p>
      <p>You've been assigned to a ticket: <strong>${ticketTitle}</strong></p>
      <p><a href="${process.env.NEXTAUTH_URL}/tickets/${ticketId}">View ticket →</a></p>
    `,
  };
}

export function overdueEmail(ticketTitle: string, ticketId: string, assigneeName: string) {
  return {
    subject: `Overdue: ${ticketTitle}`,
    body: `
      <p>Hi ${assigneeName},</p>
      <p>This ticket is now overdue: <strong>${ticketTitle}</strong></p>
      <p><a href="${process.env.NEXTAUTH_URL}/tickets/${ticketId}">View ticket →</a></p>
    `,
  };
}
