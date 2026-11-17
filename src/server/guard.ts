// ============================================================
//  guard.ts — checks every request before any real work happens.
//  Server only. Each check is a small pure function, so it can be tested.
// ============================================================

export const MAX_BODY_BYTES = 10_000;

/** The kill switch: set CHAT_ENABLED=false in Vercel to turn the bot off instantly. */
export function isChatEnabled(flag: string | undefined): boolean {
  return flag !== 'false';
}

/**
 * Only our own pages may call the API. Browsers always send the Origin
 * header on a POST, so a missing or different origin is refused.
 */
export function isSameOrigin(originHeader: string | null, requestUrl: string): boolean {
  if (!originHeader) return false;
  try {
    return new URL(originHeader).host === new URL(requestUrl).host;
  } catch {
    return false;
  }
}

export function isJson(contentType: string | null): boolean {
  return contentType?.split(';')[0].trim().toLowerCase() === 'application/json';
}

/**
 * A simple per-visitor limit kept in memory. It is a first line only:
 * each server instance keeps its own count. The Vercel firewall rule
 * (added before going live) is the real limit.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return function isAllowed(key: string, now: number = Date.now()): boolean {
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    hits.set(key, [...recent, now]);
    return true;
  };
}
