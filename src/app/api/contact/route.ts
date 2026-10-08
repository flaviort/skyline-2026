import { mailConfigured, sendMail } from "@/lib/server/send-mail";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** The contact form. Validates, drops bots (honeypot), and sends one email; nothing is stored. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  // Bots fill the hidden field; tell them it worked and do nothing.
  if (clip(body.website, 200)) return Response.json({ ok: true });

  const name = clip(body.name, 120);
  const email = clip(body.email, 200);
  const company = clip(body.company, 160);
  const message = clip(body.message, 5000);
  const interests = Array.isArray(body.interests) ? body.interests.filter((item): item is string => typeof item === "string").slice(0, 10) : [];

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Tell us who you are.";
  if (!EMAIL.test(email)) errors.email = "That email doesn't look right.";
  if (message.length < 10) errors.message = "A few more words, please.";
  if (Object.keys(errors).length) return Response.json({ ok: false, errors }, { status: 422 });

  if (!mailConfigured()) {
    console.error("[contact] RESEND_API_KEY is not set; message not sent");
    return Response.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  try {
    await sendMail({
      subject: `Contact Form - The Skyline Agency - ${name}`,
      replyTo: email,
      text: [`Name: ${name}`, `Email: ${email}`, company ? `Company: ${company}` : null, interests.length ? `Interested in: ${interests.join(", ")}` : null, "", message]
        .filter((line) => line !== null)
        .join("\n"),
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[contact]", error);
    return Response.json({ ok: false, error: "failed" }, { status: 502 });
  }
}
