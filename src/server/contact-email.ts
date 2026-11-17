// ============================================================
//  contact-email.ts — turns a checked contact message into an email
//  and sends it through Resend. Server only.
//
//  Security notes:
//   - The email is plain text: nothing a visitor types can become HTML
//     or a link that runs code in your inbox.
//   - Line breaks are removed from one-line fields (name, subject), so a
//     visitor cannot sneak in extra email headers ("header injection").
//   - The visitor's address goes in Reply-To, so you just press Reply.
//   - The key is passed in from the server environment; never logged.
// ============================================================

import type { ContactMessage } from '../lib/contact-schema';

const RESEND_URL = 'https://api.resend.com/emails';
const FROM = 'Portfolio contact <onboarding@resend.dev>';
const TIMEOUT_MS = 10_000;

/** One line, no control characters: safe to use in an email header. */
export function toHeaderSafe(value: string, maxLength: number): string {
  return value.replace(/[\r\n\t\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export interface OutgoingEmail {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
}

export function buildContactEmail(message: ContactMessage, to: string): OutgoingEmail {
  const name = toHeaderSafe(message.name, 80);
  const subject = toHeaderSafe(message.subject, 120) || 'New message from your portfolio';

  return {
    from: FROM,
    to: [to],
    reply_to: toHeaderSafe(message.email, 120),
    subject: `[Portfolio] ${subject}`,
    text: [
      `From: ${name} <${toHeaderSafe(message.email, 120)}>`,
      '',
      message.message,
      '',
      '—',
      'Sent from the contact form on your portfolio. Press Reply to answer.',
    ].join('\n'),
  };
}

/** Sends the email. Throws on failure (the caller shows a friendly message). */
export async function sendWithResend(email: OutgoingEmail, apiKey: string): Promise<void> {
  const response = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(email),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    const error = new Error('email service refused the message');
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
}
