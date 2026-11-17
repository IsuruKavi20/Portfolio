// ============================================================
//  action-runner.js — runs the bot's actions one by one (Command pattern).
//
//  Every action is checked again here with the same allow-list the server
//  uses, so even a tampered reply cannot make the page do anything else.
// ============================================================

import { validateActions } from "../../lib/bot-actions.ts";
import { highlight, openProject, scrollToSection } from "./site-controller.js";

const PAUSE_BETWEEN_MS = 900;   // time to see each step, like being shown around

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {unknown} rawActions actions from the server reply
 * @param {{ projectIds: string[], onOfferCv: () => void, beforeNavigate: () => void }} hooks
 */
export async function runActions(rawActions, { projectIds, onOfferCv, beforeNavigate }) {
  const actions = validateActions(rawActions, projectIds);

  for (const action of actions) {
    switch (action.type) {
      case "scroll_to":
        scrollToSection(action.section);
        break;
      case "highlight":
        highlight(action.target);
        break;
      case "offer_cv":
        onOfferCv();
        break;
      case "open_project":
        beforeNavigate();
        openProject(action.id);
        return;   // the page is changing; nothing after this can run
    }
    await wait(PAUSE_BETWEEN_MS);
  }
}
