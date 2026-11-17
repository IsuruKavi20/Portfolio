// ============================================================
//  cursor.js — the custom dot-and-ring cursor (mouse devices only).
// ============================================================

import { gsap } from "gsap";
import { HAS_MOUSE } from "./motion.js";

const IDLE_HIDE_MS = 1200;
const RING_FOLLOW_S = 0.45;   // how long the ring takes to catch up
const HOVER_SCALE = 1.5;
const INTERACTIVE = "a, button, input, textarea, [data-cursor]";

export function initCursor() {
  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  if (!dot || !ring || !HAS_MOUSE) return;

  document.documentElement.classList.add("has-cursor");

  // Positions use transform (x / y) instead of left / top: the graphics
  // card moves the element and the browser does not re-lay-out the page.
  gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
  const dotX = gsap.quickSetter(dot, "x", "px");
  const dotY = gsap.quickSetter(dot, "y", "px");
  const ringX = gsap.quickTo(ring, "x", { duration: RING_FOLLOW_S, ease: "power3" });
  const ringY = gsap.quickTo(ring, "y", { duration: RING_FOLLOW_S, ease: "power3" });

  let hasMoved = false;
  let isHovering = false;
  let idleTimer;

  document.addEventListener("mousemove", (event) => {
    dotX(event.clientX);
    dotY(event.clientY);

    if (!hasMoved) {
      // First move: place the ring under the mouse so it does not fly in from the corner
      gsap.set(ring, { x: event.clientX, y: event.clientY });
      hasMoved = true;
    }
    ringX(event.clientX);
    ringY(event.clientY);

    dot.style.opacity = "1";
    ring.style.opacity = "1";

    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    }, IDLE_HIDE_MS);
  });

  // One listener on the document also covers elements added later
  document.addEventListener("mouseover", (event) => {
    const hoveringNow = Boolean(event.target.closest?.(INTERACTIVE));
    if (hoveringNow === isHovering) return;
    isHovering = hoveringNow;
    ring.classList.toggle("cursor-hover", isHovering);
    gsap.to(ring, { scale: isHovering ? HOVER_SCALE : 1, duration: 0.25, ease: "power2.out", overwrite: "auto" });
  });
}
