// ============================================================
//  POST /api/chat — "Ask Isuru" replies.
//
//  Order matters: cheap checks first, the AI last.
//    1. kill switch      2. same origin + JSON     3. size
//    4. rate limits      5. shape check            6. ask the AI
//    7. clean its words  8. check its actions against the allow-list
//  Errors never reveal internal details to the visitor.
// ============================================================

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { chatRequestSchema } from '../../lib/bot-schema';
import { validateActions } from '../../lib/bot-actions';
import { buildKnowledge, type ProjectFacts } from '../../lib/knowledge';
import { PROFILE } from '../../data/profile';
import { createRateLimiter, isChatEnabled, isJson, isSameOrigin, MAX_BODY_BYTES } from '../../server/guard';
import { demoProvider, type AiProvider } from '../../server/ai-provider';
import { createGeminiProvider } from '../../server/gemini-provider';
import { cleanReply } from '../../server/reply-filter';

export const prerender = false;

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

// Per visitor: a burst limit and a daily limit. Globally: a daily ceiling
// that protects the free Gemini quota. All per server instance; the Vercel
// firewall rule is the outer wall.
const perMinute = createRateLimiter({ limit: 8, windowMs: MINUTE });
const perDay = createRateLimiter({ limit: 60, windowMs: DAY });
const everyone = createRateLimiter({ limit: 1500, windowMs: DAY });

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function loadProjects() {
  const entries = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  const facts: ProjectFacts[] = entries.map(({ id, data }) => ({
    id,
    title: data.title,
    summary: data.summary,
    status: data.status,
    year: data.year,
    role: data.role,
    tech: data.tech,
    highlights: data.highlights,
    hasLiveSite: Boolean(data.links.live),
    hasCode: Boolean(data.links.github),
    isPlaceholder: data.placeholder,
  }));
  return { ids: entries.map((entry) => entry.id), facts };
}

/** Gemini when a key is set on the server; otherwise the demo answers. */
function chooseProvider(knowledge: string): AiProvider {
  const apiKey = import.meta.env.GEMINI_API_KEY;
  if (!apiKey) return demoProvider;
  return createGeminiProvider({ apiKey, model: import.meta.env.GEMINI_MODEL, knowledge });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isChatEnabled(import.meta.env.CHAT_ENABLED)) {
    return reply(503, { error: 'Ask Isuru is resting right now. Please use the contact form.' });
  }
  if (!isSameOrigin(request.headers.get('origin'), request.url) || !isJson(request.headers.get('content-type'))) {
    return reply(403, { error: 'Not allowed.' });
  }

  const declaredSize = Number(request.headers.get('content-length') ?? 0);
  if (declaredSize > MAX_BODY_BYTES) {
    return reply(413, { error: 'That message is too long.' });
  }
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) {
    return reply(413, { error: 'That message is too long.' });
  }

  const visitor = clientAddress || 'unknown';
  if (!perMinute(visitor) || !perDay(visitor)) {
    return reply(429, { error: 'You are fast! Please wait a little before the next message.' });
  }
  if (!everyone(`all`)) {
    return reply(503, { error: 'I have talked a lot today. Please use the contact form, or come back tomorrow.' });
  }

  let parsed;
  try {
    parsed = chatRequestSchema.safeParse(JSON.parse(body));
  } catch {
    return reply(400, { error: 'I could not read that message.' });
  }
  if (!parsed.success) {
    return reply(400, { error: 'I could not read that message.' });
  }

  try {
    const projects = await loadProjects();
    const provider = chooseProvider(buildKnowledge(PROFILE, projects.facts));
    const answer = await provider.generateReply({ ...parsed.data, projectIds: projects.ids });
    return reply(200, {
      reply: cleanReply(answer.text),
      actions: validateActions(answer.actions, projects.ids),
    });
  } catch (error) {
    // Server log only, and only the error type: never the request or any key
    const status = (error as { status?: number } | null)?.status;
    console.error('[api/chat] reply failed:', error instanceof Error ? error.name : 'unknown', status ?? '');
    const busy = status === 429 || status === 503;
    return reply(502, {
      error: busy
        ? 'Lots of people are talking to me right now. Please try again in a minute.'
        : 'My thoughts got tangled. Please try again.',
    });
  }
};
