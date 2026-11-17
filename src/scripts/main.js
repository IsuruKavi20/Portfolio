// ============================================================
//  main.js — the one entry point. Each feature lives in its own file;
//  this file only starts them, in order.
// ============================================================

import { initQuality } from "./quality.js";
import { initSmoothScroll } from "./scroll.js";
import { initCursor } from "./cursor.js";
import { initLanding } from "./landing.js";
import { initScrollSpy, initOffscreenPause } from "./nav.js";
import { initNavPopup } from "./nav-popup.js";
import { initSnapRows } from "./snap-rows.js";
import { initSections } from "./sections.js";

// Quality first: other parts read the tier when they start
initQuality();

initCursor();
initSmoothScroll();
initNavPopup();
initSnapRows();
initScrollSpy();
initOffscreenPause();
initSections();

// Last: when the visitor has already entered this session, the landing
// announces "landing:done" straight away, so everything above must be listening
initLanding();
