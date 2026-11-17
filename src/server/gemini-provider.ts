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

/** Tells Gemini its actions were carried out, so it can now write its sentence. */
export function toToolResults(calls: FunctionCall[]): Content {
  return {
    role: 'user',
    parts: calls.map((call) => ({
      functionResponse: { id: call.id, name: call.name, response: { result: 'done on the page' } },
    })),
  };
}

const RETRY_STATUSES = new Set([429, 500, 503]);
const RETRY_DELAY_MS = 900;

function isRetryable(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  return typeof status === 'number' && RETRY_STATUSES.has(status);
}

export function createGeminiProvider({ apiKey, model, knowledge, voice }: { apiKey: string; model?: string; knowledge: string; voice?: string }): AiProvider {
  const client = new GoogleGenAI({ apiKey });
  const systemInstruction = buildSystemInstruction(knowledge, voice);

  /** One request to Gemini; tried once more if Google is briefly busy. */
  async function ask(contents: Content[], tools: FunctionDeclaration[], mode: FunctionCallingConfigMode) {
    const request = () =>
      client.models.generateContent({
        model: model || DEFAULT_MODEL,
        contents,
        config: {
          systemInstruction,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          temperature: 0.6,
          tools: [{ functionDeclarations: tools }],
          toolConfig: { functionCallingConfig: { mode } },
          abortSignal: AbortSignal.timeout(TIMEOUT_MS),
        },
      });
    try {
      return await request();
    } catch (error) {
      if (!isRetryable(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return request();
    }
  }

  return {
    async generateReply({ messages, context, projectIds }): Promise<AiReply> {
      const tools = buildToolDeclarations(projectIds);
      const contents = toGeminiContents(messages, describeContext(context));

      // Round 1: Gemini answers, and may ask for actions
      const first = await ask(contents, tools, FunctionCallingConfigMode.AUTO);
      const calls = first.functionCalls ?? [];
      const actions = toRawActions(calls);
      let text = first.text?.trim() ?? '';

      // Round 2 (only when it acted without words): report the actions as
      // done and let it write its sentence. Tools are switched off here.
      const modelTurn = first.candidates?.[0]?.content;
      if (!text && calls.length && modelTurn) {
        const second = await ask([...contents, modelTurn, toToolResults(calls)], tools, FunctionCallingConfigMode.NONE);
        text = second.text?.trim() ?? '';
      }

      return { text: text || (actions.length ? FALLBACK_TEXT : ''), actions };
    },
  };
}
