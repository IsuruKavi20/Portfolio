// ============================================================
//  site-controller.js — the bot's "hands" on the page (Facade).
//  The bot code calls scrollToSection / highlight / openProject and
//  never needs to know how the page is built inside.
// ============================================================

import { HIGHLIGHT_TARGETS } from "../../lib/bot-actions.ts";
import { getLenis } from "../scroll.js";
import { MOTION_ALLOWED } from "../motion.js";

const HIGHLIGHT_MS = 3200;
const SCROLL_OFFSET_PX = -80;   // leave room above the target

export function scrollToElement(element) {
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(element, { offset: SCROLL_OFFSET_PX, duration: 1.4 });
    return;
  }
  element.scrollIntoView({ behavior: MOTION_ALLOWED ? "smooth" : "auto", block: "start" });
}

/** @returns {boolean} false when the section is not on this page */
export function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return false;
  scrollToElement(section);
  return true;
}

/** Puts a soft glowing ring around one listed element for a few seconds. */
export function highlight(target) {
  const selector = HIGHLIGHT_TARGETS[target];
  const element = selector && document.querySelector(selector);
  if (!element) return false;

  const box = element.getBoundingClientRect();
  const isOnScreen = box.top >= 0 && box.bottom <= window.innerHeight;
  if (!isOnScreen) scrollToElement(element);

  element.classList.remove("bot-highlight");
  void element.offsetWidth;   // restart the CSS animation if it is already running
  element.classList.add("bot-highlight");
  setTimeout(() => element.classList.remove("bot-highlight"), HIGHLIGHT_MS);
  return true;
}

export function openProject(id) {
  window.location.assign(`/projects/${encodeURIComponent(id)}`);
}

/** Where the visitor is now: sent with each message so the bot can talk about it. */
export function readPageContext(currentSection) {
  const match = window.location.pathname.match(/^\/projects\/([a-z0-9-]+)\/?$/);
  if (match) return { page: "project", projectId: match[1] };
  return currentSection ? { page: "home", section: currentSection } : { page: "home" };
}
