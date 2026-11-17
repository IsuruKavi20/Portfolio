// ============================================================
//  gemini-provider.ts — "Ask Isuru" powered by Google Gemini (Adapter).
//
//  Security notes:
//   - The key comes from the server environment (GEMINI_API_KEY). It is
//     never sent to the browser and never logged.
//   - Gemini only sees public facts (profile + projects).
//   - Its tool requests are returned as raw data; /api/chat checks every
//     one against the allow-list before the browser sees it.
//   - Short answers and a time limit keep cost and waiting low.
// ============================================================

import { FunctionCallingConfigMode, GoogleGenAI, type Content, type FunctionCall, type FunctionDeclaration } from '@google/genai';
import { HIGHLIGHT_TARGETS, SECTIONS } from '../lib/bot-actions';
import type { ChatMessage } from '../lib/bot-schema';
import type { AiProvider, AiReply } from './ai-provider';
import { buildSystemInstruction, describeContext } from './prompt';

export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const MAX_OUTPUT_TOKENS = 350;
const TIMEOUT_MS = 12_000;
const FALLBACK_TEXT = 'Here you go.';

/** The tools Gemini may request, built from the same allow-list the code enforces. */
export function buildToolDeclarations(projectIds: string[]): FunctionDeclaration[] {
  const tools: FunctionDeclaration[] = [
    {
      name: 'scroll_to',
      description: 'Scroll the home page to one section.',
      parametersJsonSchema: {
        type: 'object',
        properties: { section: { type: 'string', enum: [...SECTIONS] } },
        required: ['section'],
      },
    },
    {
      name: 'highlight',
      description: 'Draw a glowing ring around one element on the current page.',
      parametersJsonSchema: {
        type: 'object',
        properties: { target: { type: 'string', enum: Object.keys(HIGHLIGHT_TARGETS) } },
        required: ['target'],
      },
    },
    {
      name: 'offer_cv',
      description: 'Show a button to download the CV.',
      parametersJsonSchema: { type: 'object', properties: {} },
    },
  ];

  if (projectIds.length) {
    tools.push({
      name: 'open_project',
      description: "Open one project's page.",
      parametersJsonSchema: {
        type: 'object',
        properties: { id: { type: 'string', enum: projectIds } },
        required: ['id'],
      },
    });
  }
  return tools;
}

/** Our conversation format → Gemini's. The page context rides on the newest message. */
export function toGeminiContents(messages: ChatMessage[], contextNote: string): Content[] {
  return messages.map((message, index) => {
    const isNewest = index === messages.length - 1;
    const text = isNewest ? `${contextNote}\n${message.text}` : message.text;
    return { role: message.role === 'visitor' ? 'user' : 'model', parts: [{ text }] };
  });
}

/** Gemini's tool requests → our raw action objects (validated later by /api/chat). */
export function toRawActions(calls: FunctionCall[] | undefined): unknown[] {
  return (calls ?? []).map((call) => ({ ...(call.args ?? {}), type: call.name }));
}

export function createGeminiProvider({ apiKey, model, knowledge }: { apiKey: string; model?: string; knowledge: string }): AiProvider {
  const client = new GoogleGenAI({ apiKey });
  const systemInstruction = buildSystemInstruction(knowledge);

  return {
    async generateReply({ messages, context, projectIds }): Promise<AiReply> {
      const response = await client.models.generateContent({
        model: model || DEFAULT_MODEL,
        contents: toGeminiContents(messages, describeContext(context)),
        config: {
          systemInstruction,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          temperature: 0.6,
          tools: [{ functionDeclarations: buildToolDeclarations(projectIds) }],
          toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } },
          abortSignal: AbortSignal.timeout(TIMEOUT_MS),
        },
      });

      const actions = toRawActions(response.functionCalls);
      const text = response.text?.trim() || (actions.length ? FALLBACK_TEXT : '');
      return { text, actions };
    },
  };
}
