// describe / test / expect are provided by Vitest (globals: true in vitest.config.js)
import { activeCardIndex } from "./snap-rows.js";

const CARD_STEP = 300;
const fourCards = [0, CARD_STEP, CARD_STEP * 2, CARD_STEP * 3];

describe("activeCardIndex", () => {
  test("returns the first card at the start of the row", () => {
    expect(activeCardIndex({ scrollLeft: 0, maxScroll: 700, cardStarts: fourCards })).toBe(0);
  });

  test("returns the card whose start is closest to the scroll position", () => {
    expect(activeCardIndex({ scrollLeft: 320, maxScroll: 700, cardStarts: fourCards })).toBe(1);
    expect(activeCardIndex({ scrollLeft: 590, maxScroll: 700, cardStarts: fourCards })).toBe(2);
  });

  test("returns the last card at the end, even when it cannot reach the left edge", () => {
    expect(activeCardIndex({ scrollLeft: 700, maxScroll: 700, cardStarts: fourCards })).toBe(3);
  });

  test("returns 0 for an empty row", () => {
    expect(activeCardIndex({ scrollLeft: 0, maxScroll: 0, cardStarts: [] })).toBe(0);
  });
});
