// ============================================================
//  project-page.js — scripts for /projects/<name>.
//  Same cursor, smooth scrolling, quality tier and swipe rows as the
//  home page; no landing screen. Elements with data-reveal fade up as
//  they scroll into view.
// ============================================================

import { initQuality } from "./quality.js";
import { initSmoothScroll } from "./scroll.js";
import { initCursor } from "./cursor.js";
import { initSnapRows } from "./snap-rows.js";
import { reveal } from "./motion.js";

initQuality();
initCursor();
initSmoothScroll({ waitForLanding: false });
initSnapRows();

document.querySelectorAll("[data-reveal]").forEach((element) => {
  reveal(element, {
    from: { opacity: 0, y: 24 },
    to: { opacity: 1, y: 0 },
    trigger: element,
    start: "top 90%",
    duration: 0.9,
  });
});
