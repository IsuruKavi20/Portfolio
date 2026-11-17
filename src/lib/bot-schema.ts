// ============================================================
//  bot-schema.ts — the exact shape of what the browser may send to
//  /api/chat. Anything else is rejected before it reaches the AI.
// ============================================================

import { z } from 'astro/zod';
import { SECTIONS } from './bot-actions';

export const MAX_MESSAGE_CHARS = 600;
export const MAX_HISTORY = 12;

const message = z.object({
  role: z.enum(['visitor', 'bot']),
  text: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
});

/** Where the visitor is right now, so the bot can talk about it. */
const context = z.object({
  page: z.enum(['home', 'project']),
  section: z.enum(SECTIONS).optional(),
  projectId: z.string().regex(/^[a-z0-9-]{1,60}$/).optional(),
});

export const chatRequestSchema = z.object({
  messages: z
    .array(message)
    .min(1)
    .max(MAX_HISTORY)
    // the newest message must come from the visitor
    .refine((list) => list[list.length - 1]?.role === 'visitor', 'last message must be from the visitor'),
  context,
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatMessage = ChatRequest['messages'][number];
export type ChatContext = ChatRequest['context'];
