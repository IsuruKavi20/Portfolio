// ============================================================
//  reply-filter.ts — last check on the AI's words before they are sent.
//
//  The browser already shows replies as plain text (no HTML can run),
//  so this is about honesty and tidiness: no links the AI made up,
//  no markdown symbols, no runaway length.
// ============================================================

export const MAX_REPLY_CHARS = 900;
export const EMPTY_REPLY = "Sorry, I lost my words for a second. Could you ask that again?";

const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+/gi;
const MARKDOWN_PATTERN = /[*_`#>]+/g;

export function cleanReply(text: string): string {
  const cleaned = text
    .replace(URL_PATTERN, '(link on the site)')
    .replace(MARKDOWN_PATTERN, '')
    .replace(/\s+\n/g, '\n')
    .trim();

  if (!cleaned) return EMPTY_REPLY;
  if (cleaned.length <= MAX_REPLY_CHARS) return cleaned;

  // Cut at the last full sentence that fits
  const cut = cleaned.slice(0, MAX_REPLY_CHARS);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return lastStop > 0 ? cut.slice(0, lastStop + 1) : `${cut}…`;
}
