// ============================================================
//  snap-rows.js — keeps phone carousels ([data-snap-row]) in sync:
//    - the card in view gets the class "is-active" (it lights up)
//    - the counter "01 / 04" and its little track follow along
//  The swiping and snapping itself is plain CSS (scroll-snap).
// ============================================================

const END_TOLERANCE_PX = 4;

/**
 * Which card is in view, from the row's scroll position.
 * At the very end of the row the last card counts as active, even though
 * it cannot scroll all the way to the left edge.
 * @param {{ scrollLeft: number, maxScroll: number, cardStarts: number[] }} row
 *   cardStarts: how far each card is from the first one, in px
 * @returns {number} index of the active card
 */
export function activeCardIndex({ scrollLeft, maxScroll, cardStarts }) {
  if (!cardStarts.length) return 0;
  if (scrollLeft >= maxScroll - END_TOLERANCE_PX) return cardStarts.length - 1;

  let closest = 0;
  cardStarts.forEach((start, index) => {
    if (Math.abs(start - scrollLeft) < Math.abs(cardStarts[closest] - scrollLeft)) closest = index;
  });
  return closest;
}

const twoDigits = (value) => String(value).padStart(2, "0");

function syncRow(row, counter) {
  const cards = [...row.children];
  const firstLeft = cards[0]?.offsetLeft ?? 0;
  const index = activeCardIndex({
    scrollLeft: row.scrollLeft,
    maxScroll: row.scrollWidth - row.clientWidth,
    cardStarts: cards.map((card) => card.offsetLeft - firstLeft),
  });

  cards.forEach((card, cardIndex) => card.classList.toggle("is-active", cardIndex === index));

  if (!counter) return;
  counter.querySelector("[data-snap-current]").textContent = twoDigits(index + 1);
  counter.querySelector("[data-snap-total]").textContent = twoDigits(cards.length);
  counter.style.setProperty("--snap-progress", String((index + 1) / cards.length));
}

export function initSnapRows() {
  document.querySelectorAll("[data-snap-row]").forEach((row) => {
    const counter = document.querySelector(`[data-snap-count="${row.id}"]`);
    let isQueued = false;

    const queueSync = () => {
      if (isQueued) return;
      isQueued = true;
      requestAnimationFrame(() => {
        isQueued = false;
        syncRow(row, counter);
      });
    };

    row.addEventListener("scroll", queueSync, { passive: true });
    window.addEventListener("resize", queueSync);
    syncRow(row, counter);
  });
}
