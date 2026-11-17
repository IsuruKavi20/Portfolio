// ============================================================
//  contact-schema.ts — the exact shape a contact message must have.
//  Shared by the form (browser) and /api/contact (server).
// ============================================================

import { z } from 'astro/zod';

export const LIMITS = {
  name: 80,
  email: 120,
  subject: 120,
  message: 2000,
  minMessage: 10,
} as const;

/** A real person needs at least this long to fill in the form; bots are faster. */
export const MIN_FILL_MS = 3000;

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(LIMITS.name),
  email: z.email().trim().max(LIMITS.email),
  subject: z.string().trim().max(LIMITS.subject).default(''),
  message: z.string().trim().min(LIMITS.minMessage).max(LIMITS.message),
  /** Hidden "website" field: people never see it, so it must stay empty. Bots fill it. */
  website: z.string().max(200).default(''),
  /** How long the form was open before sending, in ms. */
  elapsedMs: z.number().int().nonnegative(),
});

export type ContactMessage = z.infer<typeof contactSchema>;

/** true when the message looks automated (honeypot filled or sent too fast). */
export function looksLikeBot(message: Pick<ContactMessage, 'website' | 'elapsedMs'>): boolean {
  return message.website.trim() !== '' || message.elapsedMs < MIN_FILL_MS;
}
