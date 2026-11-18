// ============================================================
//  bot-actions.ts — the ONLY things "Ask Isuru" may do on the page.
//
//  The AI never runs code. It can only name an action from this list.
//  The server checks every requested action here before sending it to the
//  browser, and the browser checks again before running it. Anything not
//  on the list, or with a value not on the list, is dropped.
//
//  Shared by the server (/api/chat) and the browser (scripts/bot).
//  No secrets in this file: it is public.
// ============================================================

export const SECTIONS = ['about', 'skills', 'projects', 'education', 'contact'] as const;

/** Things the bot can point at. Each maps to a CSS selector on the page. */
export const HIGHLIGHT_TARGETS = {
  'cv-button': '.cv-btn',
  'social-links': '#hero-socials',
  'skills-grid': '#skills-row',
  'project-cards': '#projects-row',
  'education-cards': '#edu-card',
  'project-links': '.pp-links',
  'project-tech': '.pp-tech-groups',
  'contact-form': '#contact-form',
} as const;

export type Section = (typeof SECTIONS)[number];
export type HighlightTarget = keyof typeof HIGHLIGHT_TARGETS;

export type BotAction =
  | { type: 'scroll_to'; section: Section }
  | { type: 'highlight'; target: HighlightTarget }
  | { type: 'open_project'; id: string }
  | { type: 'offer_cv' };

/** Never run more than this many actions from one reply. */
export const MAX_ACTIONS_PER_REPLY = 3;

const PROJECT_ID = /^[a-z0-9-]{1,60}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Checks one requested action. Returns a clean copy, or null when it is
 * not allowed. Extra fields are never copied over.
 * @param knownProjectIds real project ids; open_project must use one of them
 */
export function validateAction(raw: unknown, knownProjectIds: readonly string[]): BotAction | null {
  if (!isRecord(raw)) return null;

  switch (raw.type) {
    case 'scroll_to':
      return SECTIONS.includes(raw.section as Section)
        ? { type: 'scroll_to', section: raw.section as Section }
        : null;
    case 'highlight':
      return typeof raw.target === 'string' && Object.hasOwn(HIGHLIGHT_TARGETS, raw.target)
        ? { type: 'highlight', target: raw.target as HighlightTarget }
        : null;
    case 'open_project':
      return typeof raw.id === 'string' && PROJECT_ID.test(raw.id) && knownProjectIds.includes(raw.id)
        ? { type: 'open_project', id: raw.id }
        : null;
    case 'offer_cv':
      return { type: 'offer_cv' };
    default:
      return null;
  }
}

/** Checks a list of requested actions: drops bad ones, keeps at most MAX_ACTIONS_PER_REPLY. */
export function validateActions(raw: unknown, knownProjectIds: readonly string[]): BotAction[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((action) => validateAction(action, knownProjectIds))
    .filter((action): action is BotAction => action !== null)
    .slice(0, MAX_ACTIONS_PER_REPLY);
}
