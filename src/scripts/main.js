// ============================================================
//  main.js  —  All portfolio scripts in one place
// ============================================================

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { createParticleField } from "./particles.js";
import { initSmoothScroll } from "./scroll.js";

gsap.registerPlugin(ScrollTrigger);

initSmoothScroll();

// ─────────────────────────────────────────────
// 1. CUSTOM CURSOR  (mouse devices only)
// ─────────────────────────────────────────────
(function initCursor() {
  const dot  = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  const hasMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (!dot || !ring || !hasMouse) return;

  const IDLE_HIDE_MS = 1200;
  const RING_FOLLOW  = 0.15;
  const INTERACTIVE  = "a, button, input, textarea, [data-cursor]";

  document.documentElement.classList.add("has-cursor");

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;
  let idleTimer;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    dot.style.left    = mouseX + "px";
    dot.style.top     = mouseY + "px";
    dot.style.opacity  = "1";
    ring.style.opacity = "1";

    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      dot.style.opacity  = "0";
      ring.style.opacity = "0";
    }, IDLE_HIDE_MS);
  });

  function animateRing() {
    ringX += (mouseX - ringX) * RING_FOLLOW;
    ringY += (mouseY - ringY) * RING_FOLLOW;
    ring.style.left = ringX + "px";
    ring.style.top  = ringY + "px";
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // One listener on the document also covers elements added later
  document.addEventListener("mouseover", (e) => {
    ring.classList.toggle("cursor-hover", Boolean(e.target.closest?.(INTERACTIVE)));
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

  if (isDesktop && scene) {
    scene.src = scene.dataset.src;
    scene.classList.add("is-on");
    enterBtn.querySelector(".enter-label").textContent = "Click to Enter";
  } else if (canvas) {
    canvas.classList.add("is-on");
    field = createParticleField(canvas, { animate: motionAllowed });
  }

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
  const sections = ["about", "skills", "projects", "education", "contact"];

  function updateActiveLink() {
    const scrollY = window.scrollY + window.innerHeight * 0.4;
    let current = "";
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= scrollY) current = id;
    });
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.toggle("nav-active", link.dataset.section === current);
    });
  }

  window.addEventListener("scroll", updateActiveLink, { passive: true });
  updateActiveLink();
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
    if (portrait) {
      window.addEventListener("mousemove", (e) => {
        const x = (window.innerWidth  / 2 - e.clientX) / 40;
        const y = (window.innerHeight / 2 - e.clientY) / 40;
        gsap.to(portrait, { x, y, duration: 0.6, ease: "power2.out" });
      });
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
    { opacity: 0, scale: 1.05, yPercent: -50 },
    {
      opacity: 1, scale: 1, yPercent: -50, duration: 1.4, ease: "power3.out",
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

  // Subtle parallax on photo as you scroll through section
  gsap.to("#about-photo", {
    y: -60, ease: "none",
    scrollTrigger: { trigger: "#about", start: "top bottom", end: "bottom top", scrub: 1.5 }
  });

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

  if (aboutPhoto && aboutSection) {
    document.addEventListener("mousemove", (e) => {
      const rect = aboutSection.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const x = (window.innerWidth  / 2 - e.clientX) / 30;
      const y = (window.innerHeight / 2 - e.clientY) / 30;
      gsap.to(aboutPhoto, { x, y, duration: 0.8, ease: "power2.out" });
    });
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
    width: 48, duration: 0.8, ease: "power3.out",
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
    width: 48, duration: 0.8, ease: "power3.out",
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
    width: 48, duration: 0.8, ease: "power3.out",
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
    width: 48, duration: 0.8, ease: "power3.out",
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
