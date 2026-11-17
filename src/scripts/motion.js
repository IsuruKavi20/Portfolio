// ============================================================
//  motion.js — shared animation helpers used by every section.
//
//  They decide HOW MUCH to animate, so no section has to:
//    - reduced motion (or no animation allowed): jump to the end state
//    - low quality tier: fade only, no movement, shorter
//    - otherwise: the full animation
// ============================================================

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getTier, TIER_HIGH, TIER_LOW } from "./quality.js";

gsap.registerPlugin(ScrollTrigger);

export const HAS_MOUSE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Set on <html> before first paint (Base.astro) unless the visitor prefers reduced motion. */
export const MOTION_ALLOWED = document.documentElement.classList.contains("motion");

const LOW_TIER_SPEEDUP = 0.6;

const isLowTier = () => getTier() === TIER_LOW;

/**
 * Reveals elements when their section scrolls into view.
 * @param {gsap.TweenTarget} targets
 * @param {{
 *   to: gsap.TweenVars,          end state, e.g. { opacity: 1, y: 0 }
 *   from?: gsap.TweenVars,       start state; leave out when CSS already sets it
 *   trigger: string | Element,   what has to scroll into view
 *   start?: string,              when, e.g. "top 75%" = its top reaches 75% down the screen
 *   duration?: number,
 *   stagger?: number,            delay between several targets
 * }} options
 */
export function reveal(targets, { to, from, trigger, start = "top 75%", duration = 0.8, stagger = 0 }) {
  if (!MOTION_ALLOWED) {
    gsap.set(targets, to);
    return;
  }

  const scrollTrigger = { trigger, start, toggleActions: "play none none none" };

  if (isLowTier()) {
    // Put everything in its final place at once, then only fade it in
    const { opacity = 1, ...finalPlace } = to;
    gsap.set(targets, finalPlace);
    gsap.fromTo(targets,
      { opacity: from?.opacity ?? 0 },
      { opacity, duration: duration * LOW_TIER_SPEEDUP, stagger: stagger * LOW_TIER_SPEEDUP, ease: "power1.out", scrollTrigger }
    );
    return;
  }

  const vars = { ...to, duration, stagger, ease: "power3.out", scrollTrigger };
  if (from) gsap.fromTo(targets, from, vars);
  else gsap.to(targets, vars);
}

/**
 * Ties an animation to the scroll position (parallax, darkening).
 * Decorative only, so it is skipped for reduced motion and on the low tier.
 * @returns {boolean} true when the effect was created
 */
export function scrubbed(targets, { from, to, trigger, start = "top bottom", end = "bottom top", scrub = true }) {
  if (!MOTION_ALLOWED || isLowTier()) return false;
  gsap.fromTo(targets, from, { ...to, ease: "none", scrollTrigger: { trigger, start, end, scrub } });
  return true;
}

/** Darkens a section as it scrolls away (its overlay element fades to black). */
export function darkenOnExit(overlay, section) {
  scrubbed(overlay, {
    from: { opacity: 0 },
    to: { opacity: 1 },
    trigger: section,
    start: "center center",
    end: "bottom top",
  });
}

/**
 * The standard section header: the short line draws in, then the label,
 * title and description rise one after another.
 * @param {string} sectionId e.g. "skills"
 * @param {string} prefix    id prefix of the header parts, e.g. "proj" for #proj-title
 */
export function revealSectionHeader(sectionId, prefix = sectionId) {
  const trigger = `#${sectionId}`;
  reveal(`#${prefix}-line`, { to: { scaleX: 1 }, trigger, start: "top 80%" });
  reveal([`#${prefix}-label`, `#${prefix}-title`, `#${prefix}-desc`], {
    to: { opacity: 1, y: 0 },
    trigger,
    stagger: 0.15,
  });
}

/**
 * Moves an element a little, opposite to the mouse, for a depth effect.
 * quickTo builds one reusable animation per axis, so a mouse move only
 * updates its target instead of creating a new animation every time.
 * @param {Element} element
 * @param {{ strength: number, duration: number }} options strength: larger = subtler
 * @returns {(event: MouseEvent) => void} handler for a mousemove listener
 */
export function createMouseParallax(element, { strength, duration }) {
  const moveX = gsap.quickTo(element, "x", { duration, ease: "power2.out" });
  const moveY = gsap.quickTo(element, "y", { duration, ease: "power2.out" });
  return (event) => {
    if (!MOTION_ALLOWED || getTier() !== TIER_HIGH) return;   // decorative: capable devices only
    moveX((window.innerWidth / 2 - event.clientX) / strength);
    moveY((window.innerHeight / 2 - event.clientY) / strength);
  };
}
