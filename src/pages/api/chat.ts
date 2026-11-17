// ============================================================
//  POST /api/chat — "Ask Isuru" replies.
//
//  Order matters: cheap checks first, the AI last.
//    1. kill switch   2. same origin + JSON   3. size   4. rate limit
//    5. shape check   6. ask the AI           7. check its actions
//  Errors never reveal internal details to the visitor.
// ============================================================

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { chatRequestSchema } from '../../lib/bot-schema';
import { validateActions } from '../../lib/bot-actions';
import { createRateLimiter, isChatEnabled, isJson, isSameOrigin, MAX_BODY_BYTES } from '../../server/guard';
import { demoProvider } from '../../server/ai-provider';

export const prerender = false;

const MESSAGES_PER_MINUTE = 10;
const isAllowed = createRateLimiter({ limit: MESSAGES_PER_MINUTE, windowMs: 60_000 });

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isChatEnabled(import.meta.env.CHAT_ENABLED)) {
    return reply(503, { error: 'Ask Isuru is resting right now. Please use the contact form.' });
  }
  if (!isSameOrigin(request.headers.get('origin'), request.url) || !isJson(request.headers.get('content-type'))) {
    return reply(403, { error: 'Not allowed.' });
  }

  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) {
    return reply(413, { error: 'That message is too long.' });
  }
  if (!isAllowed(clientAddress ?? 'unknown')) {
    return reply(429, { error: 'You are fast! Please wait a moment before the next message.' });
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
    const projectIds = (await getCollection('projects'))
      .sort((a, b) => a.data.order - b.data.order)
      .map((project) => project.id);
    const answer = await demoProvider.generateReply({ ...parsed.data, projectIds });
    return reply(200, {
      reply: answer.text.trim().slice(0, 1200),
      actions: validateActions(answer.actions, projectIds),
    });
  } catch (error) {
    console.error('[api/chat] reply failed', error);   // server log only
    return reply(502, { error: 'My thoughts got tangled. Please try again.' });
  }
};
