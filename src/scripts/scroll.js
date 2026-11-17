// ============================================================
//  scroll.js — inertia ("gliding") scrolling for mouse devices.
//  Phones keep their native scrolling, which already has momentum.
// ============================================================

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getTier, TIER_LOW } from "./quality.js";

const MS_PER_SECOND = 1000;

function startLenis() {
  // A struggling device scrolls best with the browser's own scrolling
  if (getTier() === TIER_LOW) return;

  // anchors: nav links such as #about glide to their section
  const lenis = new Lenis({ anchors: true });

  // Tell GSAP's scroll animations every time Lenis moves the page
  lenis.on("scroll", ScrollTrigger.update);

  // Drive Lenis from GSAP's clock so both animate on the same frame.
  // GSAP gives seconds, Lenis expects milliseconds.
  gsap.ticker.add((time) => lenis.raf(time * MS_PER_SECOND));
  gsap.ticker.lagSmoothing(0);
}

/**
 * Turns on smooth scrolling when the device has a real mouse.
 * Lenis is only created after the landing screen closes, because while it
 * is active its stylesheet stops iframes from receiving the mouse, and that
 * would freeze the Spline orb's hover effect.
 */
export function initSmoothScroll() {
  const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!hasMouse) return;

  window.addEventListener("landing:done", startLenis, { once: true });
}
