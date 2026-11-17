// ============================================================
//  firewall.ts — asks Vercel's firewall whether this visitor has gone
//  over a limit (a rule set up in the Vercel dashboard).
//
//  Vercel counts across all servers, so this limit holds even when many
//  copies of /api/chat are running. Our own in-code limits (guard.ts)
//  stay in place as a second wall.
//
//  The free plan allows ONE rate-limit rule per project, so the bot and
//  the contact form share the rule "ask-isuru", but each keeps its own
//  count (the key is "visitor:route").
//
//  It "fails open": if the firewall is slow, unreachable, or the rule is
//  not set up, the request continues and our own limits still apply.
//  The site never breaks because of this check.
// ============================================================

import { checkRateLimit } from '@vercel/firewall';

/** Must match the "@vercel/firewall" rate limit ID in the Vercel dashboard. */
export const FIREWALL_RULE_ID = 'ask-isuru';

/** Separate counts inside the one rule. */
export const FIREWALL_BUCKETS = {
  chat: 'chat',
  contact: 'contact',
} as const;

const CHECK_TIMEOUT_MS = 800;

/** The count key: one per visitor per route, e.g. "203.0.113.5:contact". */
export function firewallKey(visitor: string, bucket: string): string {
  return `${visitor}:${bucket}`;
}

/** true only when Vercel's firewall says this visitor is over the limit. */
export async function isOverFirewallLimit(bucket: string, request: Request, visitor: string): Promise<boolean> {
  // The firewall only exists on Vercel; locally there is nothing to ask
  if (!import.meta.env.PROD) return false;
  try {
    const { rateLimited, error } = await checkRateLimit(FIREWALL_RULE_ID, {
      request,
      rateLimitKey: firewallKey(visitor, bucket),
      timeout: CHECK_TIMEOUT_MS,
    });
    // Diagnostic: shows in Vercel → Logs if the firewall cannot find the rule.
    // Only the rule name and Vercel's short answer are logged, never request data.
    if (error) console.warn('[firewall] check for', FIREWALL_RULE_ID, 'answered:', error);
    return rateLimited;
  } catch (failure) {
    console.warn('[firewall] check for', FIREWALL_RULE_ID, 'failed:', failure instanceof Error ? failure.name : 'unknown');
    return false;
  }
}
