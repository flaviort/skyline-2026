// The one place email leaves the site (docs/ARCHITECTURE.md). Resend over its
// REST API while testing; swapping to SendGrid later only changes this file.
// RESEND_API_KEY must be set in the Vercel project; CONTACT_TO and
// CONTACT_FROM are optional (CONTACT_FROM must be on a domain verified in Resend).

type Mail = { subject: string; text: string; replyTo?: string };

export const mailConfigured = () => Boolean(process.env.RESEND_API_KEY);

export async function sendMail({ subject, text, replyTo }: Mail) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM ?? "Skyline website <onboarding@resend.dev>",
      to: [process.env.CONTACT_TO ?? "accounts@theskylineagency.com"],
      subject,
      text,
      reply_to: replyTo,
    }),
  });
  if (!response.ok) throw new Error(`Resend responded ${response.status}`);
}
