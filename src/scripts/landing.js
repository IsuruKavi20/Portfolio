// ============================================================
//  landing.js — the "Enter" screen.
//
//  Desktop gets the Spline orb, phones and low-tier devices get our
//  particle sphere. The visitor enters with the button, a scroll, a swipe
//  up or a key. When done it announces "landing:done", which starts the
//  hero animation, smooth scrolling and the quality measurement.
// ============================================================

import { createParticleField } from "./particles.js";
import { getLandingTier, TIER_LOW } from "./quality.js";
import { HAS_MOUSE, MOTION_ALLOWED } from "./motion.js";

export const LANDING_DONE_EVENT = "landing:done";

const FADE_MS = 900;          // matches the CSS transition on .landing
const WARP_LEAD_MS = 350;     // particles rush first, then the fade starts
const WARP_TIMEOUT = 1400;    // never wait on the animation longer than this
const CONTENT_IN_MS = 300;
const SCENE_SETTLE_MS = 400;  // the 3D scene needs a moment to draw after loading
const MIN_WHEEL = 30;         // a deliberate scroll, not a tiny trackpad touch
const MIN_SWIPE_PX = 50;      // a deliberate swipe up
const ENTER_KEYS = ["Enter", " ", "ArrowDown", "PageDown"];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const announceDone = () => window.dispatchEvent(new Event(LANDING_DONE_EVENT));

function rememberEntered() {
  try {
    sessionStorage.setItem("entered", "1");
  } catch {
    // storage blocked: the landing screen simply shows again next time
  }
}

/** Shows the orb (desktop) or the particle sphere, and returns how to clean up. */
function startBackdrop({ canvas, scene }) {
  const isDesktop = window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)").matches;
  // The 3D scene is the heaviest thing on the site: low-tier devices skip it.
  // The landing judges by browser hints only, never by measured frame rate.
  const useSpline = Boolean(isDesktop && scene && getLandingTier() !== TIER_LOW);

  if (useSpline) {
    // The orb fades in once it has loaded, instead of popping in half-drawn
    scene.addEventListener("load", () => {
      setTimeout(() => scene.classList.add("is-ready"), SCENE_SETTLE_MS);
    }, { once: true });
    scene.src = scene.dataset.src;
    scene.classList.add("is-on");
    return {
      field: null,
      stop() {
        scene.classList.remove("is-on");
        scene.removeAttribute("src");   // stops the 3D scene and frees the graphics card
      },
    };
  }

  if (!canvas) return { field: null, stop() {} };
  canvas.classList.add("is-on");
  const field = createParticleField(canvas, { animate: MOTION_ALLOWED, quality: getLandingTier() });
  return { field, stop: () => field.stop() };
}

/** Listens for every way of entering; returns a function that removes them all. */
function listenForEnter(enterBtn, onEnter) {
  let touchStartY = null;

  const onWheel = (event) => {
    if (event.deltaY > MIN_WHEEL) onEnter();
  };
  const onTouchStart = (event) => {
    touchStartY = event.touches[0].clientY;
  };
  const onTouchEnd = (event) => {
    if (touchStartY === null) return;
    const swipedUp = touchStartY - event.changedTouches[0].clientY;
    touchStartY = null;
    if (swipedUp > MIN_SWIPE_PX) onEnter();
  };
  const onKey = (event) => {
    if (!ENTER_KEYS.includes(event.key)) return;
    event.preventDefault();   // stop Space and arrows from scrolling the page
    onEnter();
  };

  // (Over the desktop orb, scroll does not reach the page: the orb's frame
  //  keeps the wheel for itself. The button and keys always work.)
  enterBtn.addEventListener("click", onEnter);
  window.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("keydown", onKey);

  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("keydown", onKey);
  };
}

export function initLanding() {
  const landing = document.getElementById("landing");
  const enterBtn = document.getElementById("enterBtn");
  const content = document.getElementById("landingContent");
  if (!landing || !enterBtn || !content) return;

  // Already entered in this browser session: skip straight to the site.
  // The timeout lets every other part register its listener first.
  if (document.documentElement.classList.contains("entered")) {
    setTimeout(announceDone, 0);
    return;
  }

  document.body.classList.add("is-locked");
  const backdrop = startBackdrop({
    canvas: document.getElementById("landingCanvas"),
    scene: document.getElementById("landingScene"),
  });

  if (HAS_MOUSE) enterBtn.querySelector(".enter-label").textContent = "Click to Enter";
  setTimeout(() => content.classList.add("is-in"), CONTENT_IN_MS);

  let isEntering = false;
  let stopListening = () => {};

  async function enterSite() {
    if (isEntering) return;   // several ways to enter can fire at once
    isEntering = true;
    enterBtn.disabled = true;
    stopListening();

    if (backdrop.field && MOTION_ALLOWED) {
      const warpDone = Promise.race([backdrop.field.warp(), wait(WARP_TIMEOUT)]);
      await wait(WARP_LEAD_MS);
      landing.classList.add("is-leaving");
      await warpDone;
    } else {
      landing.classList.add("is-leaving");
    }
    await wait(MOTION_ALLOWED ? FADE_MS : 0);

    backdrop.stop();
    landing.style.display = "none";
    document.body.classList.remove("is-locked");
    rememberEntered();
    announceDone();
  }

  stopListening = listenForEnter(enterBtn, enterSite);
}
