// ============================================================
//  sections.js — the entrance and scroll animations of each section.
//  How much actually animates is decided by the helpers in motion.js.
// ============================================================

import { gsap } from "gsap";
import { LANDING_DONE_EVENT } from "./landing.js";
import {
  HAS_MOUSE,
  MOTION_ALLOWED,
  createMouseParallax,
  darkenOnExit,
  reveal,
  revealSectionHeader,
  scrubbed,
} from "./motion.js";

const HERO_PARTS = ["#hero", "#hero-portrait", "#hero-subtitle", "#hero-desc", "#hero-socials"];

function initHero() {
  window.addEventListener(LANDING_DONE_EVENT, () => {
    if (!MOTION_ALLOWED) {
      gsap.set(HERO_PARTS, { opacity: 1 });
      gsap.set("#hero-line", { scaleX: 1 });
      gsap.set("#navbar", { opacity: 1, y: 0 });
      return;
    }

    gsap.timeline()
      .to("#hero", { opacity: 1, duration: 0.4, ease: "power2.out" })
      .to("#hero-portrait", { opacity: 1, duration: 1.2, ease: "power3.out" }, "-=0.2")
      .from(".word", { opacity: 0, y: 40, duration: 0.7, stagger: 0.15, ease: "power3.out" }, "-=0.4")
      .to("#hero-line", { scaleX: 1, duration: 0.6, ease: "power3.out" }, "-=0.3")
      .to("#hero-subtitle", { opacity: 1, duration: 0.5, ease: "power3.out" }, "-=0.2")
      .to("#hero-desc", { opacity: 1, duration: 0.5, ease: "power3.out" }, "-=0.2")
      .to("#hero-socials", { opacity: 1, duration: 0.5, ease: "power3.out" }, "-=0.1")
      .to("#navbar", { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.3");

    const portrait = document.getElementById("hero-portrait");
    if (portrait && HAS_MOUSE) {
      window.addEventListener("mousemove", createMouseParallax(portrait, { strength: 40, duration: 0.6 }), { passive: true });
    }
  }, { once: true });

  // Hero text fades and lifts away as you scroll down
  scrubbed("#hero > div", {
    from: { opacity: 1, y: 0 },
    to: { opacity: 0, y: -40 },
    trigger: "#hero",
    start: "top top",
    end: "40% top",
  });
}

function initAbout() {
  const trigger = "#about";
  reveal("#about-clip", { from: { opacity: 0, x: -40 }, to: { opacity: 1, x: 0 }, trigger, duration: 1 });
  reveal("#about-photo", { from: { opacity: 0, scale: 1.05 }, to: { opacity: 1, scale: 1 }, trigger, duration: 1.4 });

  // Desktop and phones place the photo and the info panel differently, so
  // their position animations differ. gsap.matchMedia runs the matching
  // block and undoes it automatically if the screen size changes.
  const layout = gsap.matchMedia();

  layout.add("(min-width: 768px)", () => {
    // Info panel is centred with top: 50%, so it rises to y = -50%
    reveal("#about-info", { to: { opacity: 1, y: "-50%" }, trigger, start: "top 60%", duration: 1 });

    // The photo is centred with top: 50% plus yPercent -50. The parallax
    // drifts around that centre; without it, it simply stays centred.
    const hasParallax = scrubbed("#about-photo", {
      from: { yPercent: -47 },
      to: { yPercent: -53 },
      trigger,
      scrub: 1.5,
    });
    if (!hasParallax) gsap.set("#about-photo", { yPercent: -50 });
  });

  layout.add("(max-width: 767px)", () => {
    reveal("#about-info", { to: { opacity: 1, y: 0 }, trigger: "#about-info", start: "top 85%", duration: 1 });
    scrubbed("#about-photo", { from: { yPercent: 4 }, to: { yPercent: -4 }, trigger, scrub: 1 });
  });

  reveal(".tag", { from: { opacity: 0, y: 12 }, to: { opacity: 1, y: 0 }, trigger: ".tag", start: "top 88%", duration: 0.4, stagger: 0.08 });
  reveal("#about-divider", { from: { scaleX: 0 }, to: { scaleX: 1 }, trigger: "#about-info", start: "top 80%" });

  const aboutPhoto = document.getElementById("about-photo");
  const aboutSection = document.getElementById("about");
  if (aboutPhoto && aboutSection && HAS_MOUSE) {
    const moveAboutPhoto = createMouseParallax(aboutPhoto, { strength: 30, duration: 0.8 });
    let isAboutVisible = false;

    // The browser tells us when the section enters or leaves the screen,
    // so we do not measure its position on every mouse move.
    new IntersectionObserver(([entry]) => {
      isAboutVisible = entry.isIntersecting;
    }).observe(aboutSection);

    document.addEventListener("mousemove", (event) => {
      if (isAboutVisible) moveAboutPhoto(event);
    }, { passive: true });
  }

  darkenOnExit("#about-overlay", trigger);
}

function initSkills() {
  revealSectionHeader("skills");
  reveal(".skill-card", { from: { opacity: 0, y: 40 }, to: { opacity: 1, y: 0 }, trigger: "#skills", start: "top 65%", stagger: 0.12 });
  reveal(".skill-list li", { from: { opacity: 0, x: -14 }, to: { opacity: 1, x: 0 }, trigger: "#skills", start: "top 60%", duration: 0.45, stagger: 0.04 });
  darkenOnExit("#skills-overlay", "#skills");
}

function initProjects() {
  revealSectionHeader("projects", "proj");
  reveal(".proj-card-wrap", { from: { opacity: 0, y: 40 }, to: { opacity: 1, y: 0 }, trigger: "#projects", start: "top 65%", duration: 0.7, stagger: 0.1 });
  darkenOnExit("#projects-overlay", "#projects");
}

function initEducation() {
  revealSectionHeader("education", "edu");
  reveal("#edu-card", { to: { opacity: 1, y: 0 }, trigger: "#education", start: "top 65%", duration: 0.9 });
  darkenOnExit("#education-overlay", "#education");
}

function initContact() {
  revealSectionHeader("contact");
  reveal("#contact-body", { to: { opacity: 1, y: 0 }, trigger: "#contact", start: "top 65%", duration: 0.9 });
}

export function initSections() {
  initHero();
  initAbout();
  initSkills();
  initProjects();
  initEducation();
  initContact();
}
