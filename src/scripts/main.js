// ============================================================
//  main.js  —  All portfolio scripts in one place
// ============================================================

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────
// 1. CUSTOM CURSOR  (from Cursor.astro)
// ─────────────────────────────────────────────
(function initCursor() {
  const dot  = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");

  if (!dot || !ring) return;

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
    }, 1200);
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    ring.style.left = ringX + "px";
    ring.style.top  = ringY + "px";
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll("button, a").forEach((el) => {
    el.addEventListener("mouseenter", () => ring.classList.add("cursor-hover"));
    el.addEventListener("mouseleave", () => ring.classList.remove("cursor-hover"));
  });
})();


// ─────────────────────────────────────────────
// 2. LANDING SCREEN  (from Landing.astro)
// ─────────────────────────────────────────────
(function initLanding() {
  const canvas  = document.getElementById("landingCanvas");
  const landing = document.getElementById("landing");
  const enterBtn = document.getElementById("enterBtn");
  const landingContent = document.getElementById("landingContent");

  if (!canvas || !landing || !enterBtn || !landingContent) return;

  const ctx = canvas.getContext("2d");
  let w, h;

  function resize() {
    w = canvas.width  = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  class Line {
    constructor() { this.reset(); }
    reset() {
      this.x       = Math.random() * w;
      this.y       = Math.random() * h;
      this.len     = 80 + Math.random() * 120;
      this.angle   = Math.random() * Math.PI * 2;
      this.speed   = 0.003 + Math.random() * 0.006;
      this.life    = 0;
      this.maxLife = 200 + Math.random() * 200;
    }
    draw() {
      this.life++;
      this.angle += this.speed;
      const ex = this.x + Math.cos(this.angle) * this.len;
      const ey = this.y + Math.sin(this.angle) * this.len;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.09)";
      ctx.lineWidth = 1;
      ctx.moveTo(this.x, this.y);
      ctx.quadraticCurveTo(
        (this.x + ex) / 2 + Math.cos(this.angle) * 10,
        (this.y + ey) / 2 + Math.sin(this.angle) * 10,
        ex, ey
      );
      ctx.stroke();
      if (this.life > this.maxLife) this.reset();
    }
  }

  const lines = Array.from({ length: 40 }, () => new Line());

  function animate() {
    ctx.clearRect(0, 0, w, h);
    lines.forEach(l => l.draw());
    requestAnimationFrame(animate);
  }
  animate();

  enterBtn.addEventListener("click", () => {
    landing.style.transition = "opacity 0.8s ease, transform 0.8s ease";
    landing.style.opacity    = "0";
    landing.style.transform  = "scale(1.03)";
    setTimeout(() => {
      landing.style.display = "none";
      window.dispatchEvent(new Event("landing:done"));
    }, 800);
  });

  window.addEventListener("load", () => {
    setTimeout(() => {
      landingContent.style.transition = "all 1.2s ease";
      landingContent.style.opacity    = "1";
      landingContent.style.transform  = "translateY(0)";
    }, 300);
  });
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
// 6. SKILLS SECTION  (from Skills.astro)
// ─────────────────────────────────────────────
(function initSkills() {
  gsap.to("#skills-label", {
    opacity: 1, y: 0, duration: 0.6, ease: "power3.out",
    scrollTrigger: { trigger: "#skills", start: "top 80%", toggleActions: "play none none none" }
  });

  gsap.to("#skills-title", {
    opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: "#skills", start: "top 75%", toggleActions: "play none none none" }
  });

  gsap.fromTo(
    ["#skill-col-0", "#skill-col-1", "#skill-col-2", "#skill-col-3"],
    { opacity: 0, y: 50 },
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
})();
