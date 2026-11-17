// ============================================================
//  main.js  —  All portfolio scripts in one place
// ============================================================

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { createParticleField } from "./particles.js";
import { initSmoothScroll } from "./scroll.js";
import { initQuality, getTier, getLandingTier, TIER_HIGH, TIER_LOW } from "./quality.js";

gsap.registerPlugin(ScrollTrigger);

const HAS_MOUSE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/**
 * Moves an element a little, opposite to the mouse, for a depth effect.
 * quickTo builds one reusable animation per axis, so a mouse move only
 * updates its target instead of creating a new animation every time.
 * @param {Element} element
 * @param {{ strength: number, duration: number }} options strength: larger = subtler
 * @returns {(event: MouseEvent) => void} handler for a mousemove listener
 */
function createMouseParallax(element, { strength, duration }) {
  const moveX = gsap.quickTo(element, "x", { duration, ease: "power2.out" });
  const moveY = gsap.quickTo(element, "y", { duration, ease: "power2.out" });
  return (event) => {
    if (getTier() !== TIER_HIGH) return;   // decorative: only on capable devices
    moveX((window.innerWidth  / 2 - event.clientX) / strength);
    moveY((window.innerHeight / 2 - event.clientY) / strength);
  };
}

// Sets the quality tier now (first guess) and refines it in the background
initQuality();
initSmoothScroll();

// ─────────────────────────────────────────────
// 1. CUSTOM CURSOR  (mouse devices only)
// ─────────────────────────────────────────────
(function initCursor() {
  const dot  = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  if (!dot || !ring || !HAS_MOUSE) return;

  const IDLE_HIDE_MS   = 1200;
  const RING_FOLLOW_S  = 0.45;   // how long the ring takes to catch up
  const HOVER_SCALE    = 1.5;
  const INTERACTIVE    = "a, button, input, textarea, [data-cursor]";

  document.documentElement.classList.add("has-cursor");

  // Positions use transform (x / y) instead of left / top: the graphics
  // card moves the element and the browser does not re-lay-out the page.
  gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
  const dotX  = gsap.quickSetter(dot, "x", "px");
  const dotY  = gsap.quickSetter(dot, "y", "px");
  const ringX = gsap.quickTo(ring, "x", { duration: RING_FOLLOW_S, ease: "power3" });
  const ringY = gsap.quickTo(ring, "y", { duration: RING_FOLLOW_S, ease: "power3" });

  let hasMoved = false;
  let isHovering = false;
  let idleTimer;

  document.addEventListener("mousemove", (e) => {
    dotX(e.clientX);
    dotY(e.clientY);

    if (!hasMoved) {
      // First move: place the ring under the mouse so it does not fly in from the corner
      gsap.set(ring, { x: e.clientX, y: e.clientY });
      hasMoved = true;
    }
    ringX(e.clientX);
    ringY(e.clientY);

    dot.style.opacity  = "1";
    ring.style.opacity = "1";

    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      dot.style.opacity  = "0";
      ring.style.opacity = "0";
    }, IDLE_HIDE_MS);
  });

  // One listener on the document also covers elements added later
  document.addEventListener("mouseover", (e) => {
    const hoveringNow = Boolean(e.target.closest?.(INTERACTIVE));
    if (hoveringNow === isHovering) return;
    isHovering = hoveringNow;
    ring.classList.toggle("cursor-hover", isHovering);
    gsap.to(ring, { scale: isHovering ? HOVER_SCALE : 1, duration: 0.25, ease: "power2.out", overwrite: "auto" });
  });
})();


// ─────────────────────────────────────────────
// 2. LANDING SCREEN  (from Landing.astro)
// ─────────────────────────────────────────────
(function initLanding() {
  const root     = document.documentElement;
  const landing  = document.getElementById("landing");
  const enterBtn = document.getElementById("enterBtn");
  const content  = document.getElementById("landingContent");
  const canvas   = document.getElementById("landingCanvas");
  const scene    = document.getElementById("landingScene");

  if (!landing || !enterBtn || !content) return;

  const FADE_MS        = 900;   // matches the CSS transition on .landing
  const WARP_LEAD_MS   = 350;   // particles rush first, then the fade starts
  const WARP_TIMEOUT   = 1400;  // never wait on the animation longer than this
  const CONTENT_IN_MS  = 300;

  const announceDone = () => window.dispatchEvent(new Event("landing:done"));

  // Already entered in this browser session: skip straight to the site.
  // The timeout lets the sections below register their listeners first.
  if (root.classList.contains("entered")) {
    setTimeout(announceDone, 0);
    return;
  }

  const motionAllowed = root.classList.contains("motion");
  const isDesktop = window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)").matches;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let field = null;

  document.body.classList.add("is-locked");

  function showCanvas() {
    if (!canvas) return;
    canvas.classList.add("is-on");
    field = createParticleField(canvas, { animate: motionAllowed, quality: getLandingTier() });
  }

  function showSpline() {
    scene.src = scene.dataset.src;
    scene.classList.add("is-on");
  }

  function hideSpline() {
    scene.classList.remove("is-on");
    scene.removeAttribute("src");   // stops the 3D scene and frees the graphics card
  }

  // The 3D scene is the heaviest thing on the site: low-tier devices skip it.
  // The landing judges by browser hints only, never by measured frame rate.
  const isUsingSpline = Boolean(isDesktop && scene && getLandingTier() !== TIER_LOW);
  if (isUsingSpline) showSpline();
  else showCanvas();

  if (HAS_MOUSE) enterBtn.querySelector(".enter-label").textContent = "Click to Enter";

  setTimeout(() => content.classList.add("is-in"), CONTENT_IN_MS);

  enterBtn.addEventListener("click", async () => {
    enterBtn.disabled = true;

    if (field && motionAllowed) {
      const warpDone = Promise.race([field.warp(), wait(WARP_TIMEOUT)]);
      await wait(WARP_LEAD_MS);
      landing.classList.add("is-leaving");
      await warpDone;
    } else {
      landing.classList.add("is-leaving");
    }
    await wait(motionAllowed ? FADE_MS : 0);

    field?.stop();
    if (isUsingSpline) hideSpline();
    landing.style.display = "none";
    document.body.classList.remove("is-locked");
    try {
      sessionStorage.setItem("entered", "1");
    } catch {
      // storage blocked: the landing screen simply shows again next time
    }
    announceDone();
  }, { once: true });
})();


// ─────────────────────────────────────────────
// 3. NAVBAR SCROLLSPY  (from Navbar.astro)
// ─────────────────────────────────────────────
(function initNavbar() {
  const links = [...document.querySelectorAll(".nav-link")];
  const sections = links
    .map((link) => document.getElementById(link.dataset.section))
    .filter(Boolean);

  if (!sections.length) return;

  // An invisible line 40% down the screen. Whichever section is crossing
  // that line is the one the visitor is reading.
  const READING_LINE = "-40% 0px -60% 0px";
  const crossingLine = new Set();

  function setActive(sectionId) {
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
})();


// ─────────────────────────────────────────────
// 3b. PAUSE OFF-SCREEN ANIMATIONS
// ─────────────────────────────────────────────
// Looping CSS animations (the scroll drip, the availability dot) keep the
// device busy even when nobody can see them. Sections marked with
// data-pause-offscreen get the class "is-offscreen" while out of view,
// and global.css pauses every animation inside them.
(function initOffscreenPause() {
  const areas = document.querySelectorAll("[data-pause-offscreen]");
  if (!areas.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-offscreen", !entry.isIntersecting);
    });
  });

  areas.forEach((area) => observer.observe(area));
})();


// ─────────────────────────────────────────────
// 4. HERO ANIMATIONS  (from Hero.astro)
// ─────────────────────────────────────────────
(function initHero() {
  window.addEventListener("landing:done", () => {
    const tl = gsap.timeline();

    tl.to("#hero", { opacity: 1, duration: 0.4, ease: "power2.out" })
      .to("#hero-portrait", { opacity: 1, duration: 1.2, ease: "power3.out" }, "-=0.2")
      .from(".word", { opacity: 0, y: 40, duration: 0.7, stagger: 0.15, ease: "power3.out" }, "-=0.4")
      .to("#hero-line", { scaleX: 1, duration: 0.6, ease: "power3.out" }, "-=0.3")
      .to("#hero-subtitle", { opacity: 1, duration: 0.5, ease: "power3.out" }, "-=0.2")
      .to("#hero-desc", { opacity: 1, duration: 0.5, ease: "power3.out" }, "-=0.2")
      .to("#hero-socials", { opacity: 1, duration: 0.5, ease: "power3.out" }, "-=0.1")
      .to("#navbar", { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.3");

    // Portrait parallax on mouse move
    const portrait = document.getElementById("hero-portrait");
    if (portrait && HAS_MOUSE) {
      window.addEventListener("mousemove", createMouseParallax(portrait, { strength: 40, duration: 0.6 }), { passive: true });
    }
  });

  // Fade hero content out on scroll
  gsap.to("#hero > div", {
    opacity: 0,
    y: -40,
    scrollTrigger: {
      trigger: "#hero",
      start: "top top",
      end: "40% top",
      scrub: true
    }
  });
})();


// ─────────────────────────────────────────────
// 5. ABOUT SECTION  (from projects.js / About.astro)
// ─────────────────────────────────────────────
(function initAbout() {
  gsap.fromTo("#about-clip",
    { opacity: 0, x: -40 },
    {
      opacity: 1, x: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: "#about", start: "top 75%", toggleActions: "play none none none" }
    }
  );

  gsap.fromTo("#about-photo",
    { opacity: 0, scale: 1.05 },
    {
      opacity: 1, scale: 1, duration: 1.4, ease: "power3.out",
      scrollTrigger: { trigger: "#about", start: "top 75%", toggleActions: "play none none none" }
    }
  );

  gsap.to("#about-info", {
    opacity: 1, y: "-50%", duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: "#about", start: "top 60%", toggleActions: "play none none none" }
  });

  gsap.fromTo(".tag",
    { opacity: 0, y: 12 },
    {
      opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out",
      scrollTrigger: { trigger: ".tag", start: "top 88%", toggleActions: "play none none none" }
    }
  );

  // Subtle parallax on photo as you scroll through section.
  // It uses yPercent (around the -50 that centres the photo) so it does not
  // fight the mouse parallax below, which uses y.
  gsap.fromTo("#about-photo",
    { yPercent: -47 },
    {
      yPercent: -53, ease: "none",
      scrollTrigger: { trigger: "#about", start: "top bottom", end: "bottom top", scrub: 1.5 }
    }
  );

  // Animate the WHO I AM divider line
  gsap.fromTo("#about-divider",
    { scaleX: 0 },
    {
      scaleX: 1, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: "#about-info", start: "top 80%", toggleActions: "play none none none" }
    }
  );

  // Cursor parallax on about photo
  const aboutPhoto   = document.getElementById("about-photo");
  const aboutSection = document.getElementById("about");

  if (aboutPhoto && aboutSection && HAS_MOUSE) {
    const moveAboutPhoto = createMouseParallax(aboutPhoto, { strength: 30, duration: 0.8 });
    let isAboutVisible = false;

    // The browser tells us when the section enters or leaves the screen,
    // so we do not measure its position on every mouse move.
    new IntersectionObserver(([entry]) => {
      isAboutVisible = entry.isIntersecting;
    }).observe(aboutSection);

    document.addEventListener("mousemove", (e) => {
      if (isAboutVisible) moveAboutPhoto(e);
    }, { passive: true });
  }

  // Scroll-out overlay darkening
  gsap.to("#about-overlay", {
    opacity: 1, ease: "power2.out",
    scrollTrigger: { trigger: "#about", start: "center center", end: "bottom top", scrub: true }
  });
})();


// ─────────────────────────────────────────────
// 6. SKILLS SECTION
// ─────────────────────────────────────────────
(function initSkills() {
  // Animate the horizontal line — same as Projects
  gsap.to("#skills-line", {
    scaleX: 1, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: "#skills", start: "top 80%", toggleActions: "play none none none" }
  });

  // Label + title + desc stagger — same as Projects
  gsap.to(["#skills-label", "#skills-title", "#skills-desc"], {
    opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out",
    scrollTrigger: { trigger: "#skills", start: "top 75%", toggleActions: "play none none none" }
  });

  // Cards cascade in
  gsap.fromTo(
    ["#skill-col-0", "#skill-col-1", "#skill-col-2", "#skill-col-3"],
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out",
      scrollTrigger: { trigger: "#skills", start: "top 65%", toggleActions: "play none none none" }
    }
  );

  gsap.fromTo(".skill-list li",
    { opacity: 0, x: -14 },
    {
      opacity: 1, x: 0, duration: 0.45, stagger: 0.04, ease: "power2.out",
      scrollTrigger: { trigger: "#skills", start: "top 60%", toggleActions: "play none none none" }
    }
  );

  // Scroll-out overlay darkening
  gsap.to("#skills-overlay", {
    opacity: 1, ease: "power2.out",
    scrollTrigger: { trigger: "#skills", start: "center center", end: "bottom top", scrub: true }
  });
})();


// ─────────────────────────────────────────────
// 7. PROJECTS SECTION
// ─────────────────────────────────────────────
(function initProjects() {
  // Animate the horizontal line
  gsap.to("#proj-line", {
    scaleX: 1, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: "#projects", start: "top 80%", toggleActions: "play none none none" }
  });

  // Label + title + desc stagger
  gsap.to(["#proj-label", "#proj-title", "#proj-desc"], {
    opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out",
    scrollTrigger: { trigger: "#projects", start: "top 75%", toggleActions: "play none none none" }
  });

  // Cards cascade in
  gsap.fromTo(".proj-card-wrap",
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out",
      scrollTrigger: { trigger: "#projects", start: "top 65%", toggleActions: "play none none none" }
    }
  );

  // Scroll-out overlay darkening
  gsap.to("#projects-overlay", {
    opacity: 1, ease: "power2.out",
    scrollTrigger: { trigger: "#projects", start: "center center", end: "bottom top", scrub: true }
  });
})();


// ─────────────────────────────────────────────
// 8. EDUCATION SECTION
// ─────────────────────────────────────────────
(function initEducation() {
  // Animate the horizontal line
  gsap.to("#edu-line", {
    scaleX: 1, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: "#education", start: "top 80%", toggleActions: "play none none none" }
  });

  // Label + title + desc stagger
  gsap.to(["#edu-label", "#edu-title", "#edu-desc"], {
    opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out",
    scrollTrigger: { trigger: "#education", start: "top 75%", toggleActions: "play none none none" }
  });

  // Card fade + rise
  gsap.to("#edu-card", {
    opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: "#education", start: "top 65%", toggleActions: "play none none none" }
  });

  // Scroll-out overlay darkening
  gsap.to("#education-overlay", {
    opacity: 1, ease: "power2.out",
    scrollTrigger: { trigger: "#education", start: "center center", end: "bottom top", scrub: true }
  });
})();


// ─────────────────────────────────────────────
// 9. CONTACT SECTION
// ─────────────────────────────────────────────
(function initContact() {
  gsap.to("#contact-line", {
    scaleX: 1, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: "#contact", start: "top 80%", toggleActions: "play none none none" }
  });

  gsap.to(["#contact-label", "#contact-title", "#contact-desc"], {
    opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out",
    scrollTrigger: { trigger: "#contact", start: "top 75%", toggleActions: "play none none none" }
  });

  gsap.to("#contact-body", {
    opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: "#contact", start: "top 65%", toggleActions: "play none none none" }
  });
})();
