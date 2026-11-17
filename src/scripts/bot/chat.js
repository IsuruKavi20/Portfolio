// ============================================================
//  chat.js — "Ask Isuru" chat controller (a small state machine).
//
//  States: closed → open → thinking → acting → open
//                              └──→ error ─┘
//  The orb's mood and the input follow the state, so they always agree.
//  The conversation is kept for the browser session, so it continues
//  when the bot opens a project page.
// ============================================================

import { createOrb } from "./orb.js";
import { runActions } from "./action-runner.js";
import { readPageContext } from "./site-controller.js";
import { MOTION_ALLOWED } from "../motion.js";
import { getTier, TIER_LOW } from "../quality.js";
import { SECTION_EVENT } from "../nav-popup.js";

const STORAGE_KEY = "askIsuru";
const MAX_HISTORY_SENT = 12;
const MAX_INPUT_CHARS = 600;
const GREETING_DELAY_MS = 4000;
const GREETING = "Hi! I'm Ask Isuru, an AI version of Isuru. Want me to show you around?";
const OFFLINE_REPLY = "I couldn't reach my brain just now. Please try again in a moment.";

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveSession(session) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage blocked: the chat still works, it just won't survive a page change
  }
}

export function initAskIsuru() {
  const root = document.getElementById("askIsuru");
  if (!root) return;

  const launcher = root.querySelector("[data-bot-launcher]");
  const panel = root.querySelector("[data-bot-panel]");
  const log = root.querySelector("[data-bot-log]");
  const form = root.querySelector("[data-bot-form]");
  const input = root.querySelector("[data-bot-input]");
  const sendButton = root.querySelector("[data-bot-send]");
  const closeButton = root.querySelector("[data-bot-close]");
  const bubble = root.querySelector("[data-bot-bubble]");
  const projectIds = JSON.parse(root.dataset.projects || "[]");

  const animate = MOTION_ALLOWED && getTier() !== TIER_LOW;
  const orbs = [...root.querySelectorAll("[data-bot-orb]")].map((canvas) => createOrb(canvas, { animate }));
  const setMood = (mood) => orbs.forEach((orb) => orb.setMood(mood));

  const session = { messages: [], isOpen: false, greeted: false, ...loadSession() };
  let currentSection = "";
  let state = "closed";

  function setState(next) {
    state = next;
    root.dataset.state = next;
    const busy = next === "thinking" || next === "acting";
    input.disabled = busy;
    sendButton.disabled = busy;
    setMood(next === "thinking" ? "thinking" : next === "acting" ? "acting" : next === "error" ? "error" : "idle");
  }

  // ── Messages (always plain text: textContent, never HTML) ──
  function addBubble(role, text) {
    const item = document.createElement("li");
    item.className = `bot-msg bot-msg-${role}`;
    item.textContent = text;
    log.append(item);
    log.scrollTop = log.scrollHeight;
  }

  function addCvButton() {
    const item = document.createElement("li");
    item.className = "bot-msg bot-msg-bot bot-msg-card";
    const link = document.createElement("a");
    link.href = "/cv.pdf";
    link.download = "Isuru_K_Premasiri_CV.pdf";
    link.className = "bot-card-link";
    link.textContent = "Download CV ↓";
    item.append(link);
    log.append(item);
    log.scrollTop = log.scrollHeight;
  }

  function remember(role, text) {
    session.messages = [...session.messages, { role, text }].slice(-MAX_HISTORY_SENT * 2);
    saveSession(session);
  }

  // ── Open / close ──
  function open() {
    session.isOpen = true;
    session.greeted = true;
    saveSession(session);
    bubble.hidden = true;
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    root.classList.add("is-open");
    if (!log.children.length) addBubble("bot", GREETING);
    setState("open");
    input.focus({ preventScroll: true });
  }

  /** @param {{ returnFocus?: boolean }} [options] */
  function close({ returnFocus = true } = {}) {
    session.isOpen = false;
    saveSession(session);
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    root.classList.remove("is-open");
    setState("closed");
    if (returnFocus) launcher.focus({ preventScroll: true });
  }

  // ── Talking to the server ──
  async function send(text) {
    addBubble("visitor", text);
    remember("visitor", text);
    setState("thinking");

    let data;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: session.messages.slice(-MAX_HISTORY_SENT),
          context: readPageContext(currentSection),
        }),
      });
      data = await response.json();
      if (!response.ok) throw new Error(data?.error || "request failed");
    } catch (error) {
      const message = typeof data?.error === "string" ? data.error : OFFLINE_REPLY;
      addBubble("bot", message);
      setState("error");
      setTimeout(() => state === "error" && setState("open"), 2500);
      return;
    }

    addBubble("bot", data.reply);
    remember("bot", data.reply);
    setState("acting");
    await runActions(data.actions, {
      projectIds,
      onOfferCv: addCvButton,
      beforeNavigate: () => saveSession({ ...session, isOpen: true }),
    });
    setState("open");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim().slice(0, MAX_INPUT_CHARS);
    if (!text || state === "thinking" || state === "acting") return;
    input.value = "";
    send(text);
  });

  launcher.addEventListener("click", () => (session.isOpen ? close() : open()));
  closeButton.addEventListener("click", () => close());

  // Tapping or clicking anywhere outside the chat minimizes it.
  // Not while the bot is busy showing something, so its own scrolling
  // and highlighting never close the chat by accident.
  document.addEventListener("pointerdown", (event) => {
    if (!session.isOpen || state === "thinking" || state === "acting") return;
    if (root.contains(event.target)) return;
    close({ returnFocus: false });
  });
  bubble.querySelector("[data-bot-bubble-open]").addEventListener("click", open);
  bubble.querySelector("[data-bot-bubble-dismiss]").addEventListener("click", () => {
    bubble.hidden = true;
    session.greeted = true;
    saveSession(session);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && session.isOpen) close();
  });

  window.addEventListener(SECTION_EVENT, (event) => {
    currentSection = event.detail.id;
  });

  // ── Appear: after the landing on the home page, straight away elsewhere ──
  function appear() {
    root.classList.add("is-visible");
    session.messages.forEach(({ role, text }) => addBubble(role, text));
    if (session.isOpen) open();
    else if (!session.greeted) {
      setTimeout(() => {
        if (!session.isOpen && !session.greeted) bubble.hidden = false;
      }, GREETING_DELAY_MS);
    }
  }

  const landingIsOver =
    !document.getElementById("landing") || document.documentElement.dataset.landingDone === "true";
  if (landingIsOver) appear();
  else window.addEventListener("landing:done", appear, { once: true });
}
