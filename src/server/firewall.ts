// ============================================================
//  firewall.ts — asks Vercel's firewall whether this visitor has gone
//  over a limit (a rule set up in the Vercel dashboard).
//
//  Vercel counts across all servers, so this limit holds even when many
//  copies of /api/chat are running. Our own in-code limits (guard.ts)
//  stay in place as a second wall.
//
//  It "fails open": if the firewall is slow, unreachable, or the rule is
//  not set up, the request continues and our own limits still apply.
//  The site never breaks because of this check.
// ============================================================

import { checkRateLimit } from '@vercel/firewall';

/** Rate-limit IDs; each must match a "@vercel/firewall" rule in the Vercel dashboard. */
export const FIREWALL_LIMITS = {
  chat: 'ask-isuru',
  contact: 'contact-form',
} as const;

const CHECK_TIMEOUT_MS = 800;

/** true only when Vercel's firewall says this visitor is over the limit. */
export async function isOverFirewallLimit(rateLimitId: string, request: Request): Promise<boolean> {
  // The firewall only exists on Vercel; locally there is nothing to ask
  if (!import.meta.env.PROD) return false;
  try {
    const { rateLimited } = await checkRateLimit(rateLimitId, { request, timeout: CHECK_TIMEOUT_MS });
    return rateLimited;
  } catch {
    return false;
  }
}
