// ============================================================
//  ai-provider.ts — the one place that talks to an AI.
//
//  Everything else only knows `generateReply(...)`. Today it is a demo
//  provider with fixed answers (no AI, no key needed), so the whole bot
//  can be built and tested first. In the next step Gemini plugs in here,
//  and nothing else in the site has to change.
// ============================================================

import type { ChatContext, ChatMessage } from '../lib/bot-schema';

export interface AiReply {
  text: string;
  /** Raw action requests; the API route validates them before use. */
  actions: unknown[];
}

export interface AiProvider {
  generateReply(input: { messages: ChatMessage[]; context: ChatContext; projectIds: string[] }): Promise<AiReply>;
}

const DEMO_NOTE = '(Demo mode: my real brain arrives soon.)';

/** Fixed answers that show off what the bot can do on the page. */
export const demoProvider: AiProvider = {
  async generateReply({ messages, context, projectIds }) {
    const question = messages[messages.length - 1].text.toLowerCase();
    const has = (...words: string[]) => words.some((word) => question.includes(word));

    if (has('open') && projectIds.length) {
      return { text: `Opening ${projectIds[0]} for you. ${DEMO_NOTE}`, actions: [{ type: 'open_project', id: projectIds[0] }] };
    }
    if (has('project', 'work', 'built', 'portfolio')) {
      return {
        text: `Let me show you my projects. Say "open one" and I will take you inside. ${DEMO_NOTE}`,
        actions: [
          { type: 'scroll_to', section: 'projects' },
          { type: 'highlight', target: 'project-cards' },
        ],
      };
    }
    if (has('skill', 'tech', 'stack', 'know')) {
      return {
        text: `Here is my toolkit. ${DEMO_NOTE}`,
        actions: [{ type: 'scroll_to', section: 'skills' }, { type: 'highlight', target: 'skills-grid' }],
      };
    }
    if (has('cv', 'resume', 'résumé')) {
      return {
        text: `My CV is coming soon. Meanwhile, you can message me through the contact form. ${DEMO_NOTE}`,
        actions: [{ type: 'scroll_to', section: 'contact' }],
      };
    }
    if (has('hire', 'contact', 'email', 'reach', 'intern')) {
      return {
        text: `I'd love to hear from you. The form is right here. ${DEMO_NOTE}`,
        actions: [{ type: 'scroll_to', section: 'contact' }, { type: 'highlight', target: 'contact-form' }],
      };
    }
    if (context.page === 'project' && context.projectId) {
      return {
        text: `You're looking at ${context.projectId}. Ask me how it works, or what I built in it. ${DEMO_NOTE}`,
        actions: [{ type: 'highlight', target: 'project-tech' }],
      };
    }
    return {
      text: `Hi! I'm Ask Isuru, an AI version of Isuru. Try "show me your projects", "what are your skills?" or "how can I hire you?". ${DEMO_NOTE}`,
      actions: [],
    };
  },
};
