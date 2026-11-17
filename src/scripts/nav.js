// ============================================================
//  nav.js — knowing where the visitor is.
//    - initScrollSpy: highlights the current section in the desktop links
//      and the phone popup, and announces it ("section:change")
//    - initOffscreenPause: pauses looping CSS animations out of view
// ============================================================

import { SECTION_EVENT } from "./nav-popup.js";

// An invisible line 40% down the screen. Whichever section is crossing
// that line is the one the visitor is reading.
const READING_LINE = "-40% 0px -60% 0px";

export function initScrollSpy() {
  const links = [...document.querySelectorAll(".nav-link, .pop-link")];
  const sectionIds = [...new Set(links.map((link) => link.dataset.section))];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;

  const crossingLine = new Set();

  function setActive(sectionId) {
    window.dispatchEvent(new CustomEvent(SECTION_EVENT, { detail: { id: sectionId } }));
    links.forEach((link) => {
      const isActive = link.dataset.section === sectionId;
      link.classList.toggle("nav-active", isActive);
      if (isActive) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  // The browser calls this only when a section starts or stops crossing
  // the line, instead of us checking positions on every scroll event.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) crossingLine.add(entry.target.id);
      else crossingLine.delete(entry.target.id);
    });
    const current = sections.filter((section) => crossingLine.has(section.id)).pop();
    setActive(current ? current.id : "");
  }, { rootMargin: READING_LINE });

  sections.forEach((section) => observer.observe(section));
}

// Looping CSS animations (the scroll drip, the availability dot) keep the
// device busy even when nobody can see them. Sections marked with
// data-pause-offscreen get the class "is-offscreen" while out of view,
// and global.css pauses every animation inside them.
export function initOffscreenPause() {
  const areas = document.querySelectorAll("[data-pause-offscreen]");
  if (!areas.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-offscreen", !entry.isIntersecting);
    });
  });

  areas.forEach((area) => observer.observe(area));
}
