// ============================================================
//  nav-popup.js — the floating section button on phones.
//
//  - The ring around the button fills as the page is scrolled.
//  - The number shows the current section (from main.js "section:change").
//  - Tap: the sections pop up above the button. Tapping a section, the
//    dimmed page, Escape, or scrolling closes it again.
// ============================================================

export const SECTION_EVENT = "section:change";

export function initNavPopup() {
  const root = document.getElementById("navPop");
  const toggle = document.getElementById("navPopToggle");
  const progress = document.getElementById("navPopProgress");
  const indexLabel = document.getElementById("navPopIndex");
  if (!root || !toggle || !progress || !indexLabel) return;

  const links = [...root.querySelectorAll(".pop-link")];
  let isOpen = false;
  let isProgressQueued = false;

  function setOpen(nextOpen) {
    isOpen = nextOpen;
    root.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close sections" : "Open sections");
  }

  // Scroll progress: read the position at most once per frame
  function drawProgress() {
    isProgressQueued = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const share = scrollable > 0 ? window.scrollY / scrollable : 0;
    progress.style.strokeDashoffset = String(1 - Math.min(1, Math.max(0, share)));
  }

  function onScroll() {
    if (isOpen) setOpen(false);
    if (isProgressQueued) return;
    isProgressQueued = true;
    requestAnimationFrame(drawProgress);
  }

  toggle.addEventListener("click", () => setOpen(!isOpen));

  root.addEventListener("click", (event) => {
    if (event.target.closest(".pop-link, [data-nav-pop-close]")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) {
      setOpen(false);
      toggle.focus();
    }
  });

  window.addEventListener(SECTION_EVENT, (event) => {
    const position = links.findIndex((link) => link.dataset.section === event.detail.id);
    indexLabel.textContent = position < 0 ? "00" : String(position + 1).padStart(2, "0");
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("landing:done", () => root.classList.add("is-visible"), { once: true });
  drawProgress();
}
