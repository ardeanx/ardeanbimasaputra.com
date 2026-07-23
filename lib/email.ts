import { getSettings } from "./settings";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const b = (await getSettings()).integrations.brevo;
  if (!b.enabled || !b.apiKey || !b.fromEmail) return;
  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": b.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: b.fromEmail, name: b.fromName || b.fromEmail },
        to: [{ email: opts.to }],
        subject: opts.subject,
        htmlContent: opts.html,
      }),
    });
  } catch {}
}
