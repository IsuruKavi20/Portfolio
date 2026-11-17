// Without JavaScript the landing screen cannot be closed, so hide it.
// Shared with astro.config.mjs, which fingerprints it for the security policy.
export const NOSCRIPT_CSS = '#landing{display:none}';
