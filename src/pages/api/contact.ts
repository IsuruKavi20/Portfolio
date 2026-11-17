// ============================================================
//  POST /api/contact — delivers a contact message to your Gmail.
//
//    1. same origin + JSON   2. size   3. rate limits
//    4. shape check          5. bot traps (hidden field, too fast)
//    6. build a plain-text email   7. send through Resend
//  Bots that fall into a trap get a normal "sent" answer, so they learn
//  nothing; the message is simply dropped.
// ============================================================

import type { APIRoute } from 'astro';
import { CONTACT_TO, RESEND_API_KEY } from 'astro:env/server';
import { contactSchema, looksLikeBot } from '../../lib/contact-schema';
import { createRateLimiter, isJson, isSameOrigin } from '../../server/guard';
import { buildContactEmail, sendWithResend } from '../../server/contact-email';
import { FIREWALL_BUCKETS, isOverFirewallLimit } from '../../server/firewall';
import { PROFILE } from '../../data/profile';

export const prerender = false;

const MAX_BODY_BYTES = 6_000;
const HOUR = 60 * 60_000;

const perHour = createRateLimiter({ limit: 3, windowMs: HOUR });
const perDay = createRateLimiter({ limit: 6, windowMs: 24 * HOUR });
const everyone = createRateLimiter({ limit: 80, windowMs: 24 * HOUR });

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

const SENT = { ok: true, message: "Thanks! Your message is on its way. I'll reply by email soon." };

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isSameOrigin(request.headers.get('origin'), request.url) || !isJson(request.headers.get('content-type'))) {
    return reply(403, { error: 'Not allowed.' });
  }

  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) {
    return reply(413, { error: 'That message is too long.' });
  }

  const visitor = clientAddress || 'unknown';
  if (await isOverFirewallLimit(FIREWALL_BUCKETS.contact, request, visitor)) {
    return reply(429, { error: "You've sent a few messages already. Please wait a while, or email me directly." });
  }
  if (!perHour(visitor) || !perDay(visitor)) {
    return reply(429, { error: "You've sent a few messages already. Please wait a while, or email me directly." });
  }
  if (!everyone('all')) {
    return reply(503, { error: 'The form is resting for today. Please email me directly.' });
  }

  let parsed;
  try {
    parsed = contactSchema.safeParse(JSON.parse(body));
  } catch {
    return reply(400, { error: 'Please check the form and try again.' });
  }
  if (!parsed.success) {
    return reply(400, { error: 'Please check the form: a name, a valid email and a message of at least 10 characters.' });
  }

  if (looksLikeBot(parsed.data)) return reply(200, SENT);

  if (!RESEND_API_KEY) {
    return reply(503, { error: 'The form is not set up yet. Please email me directly.' });
  }

  try {
    await sendWithResend(buildContactEmail(parsed.data, CONTACT_TO || PROFILE.contact.email), RESEND_API_KEY);
    return reply(200, SENT);
  } catch (error) {
    const status = (error as { status?: number } | null)?.status;
    console.error('[api/contact] send failed:', error instanceof Error ? error.name : 'unknown', status ?? '');
    return reply(502, { error: "Sorry, the message didn't go through. Please email me directly." });
  }
};
