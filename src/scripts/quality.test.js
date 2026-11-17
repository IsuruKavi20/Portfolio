// describe / test / expect are provided by Vitest (globals: true in vitest.config.js)
import {
  TIER_HIGH,
  TIER_LOW,
  TIER_MID,
  adjustTierForFrameRate,
  pickInitialTier,
  typicalFrameRate,
} from "./quality.js";

const capableDevice = { reducedMotion: false, saveData: false, memory: 8, cores: 8 };

describe("pickInitialTier", () => {
  test("returns high for a device with plenty of memory and cores", () => {
    expect(pickInitialTier(capableDevice)).toBe(TIER_HIGH);
  });

  test("returns low when the visitor prefers reduced motion, even on strong hardware", () => {
    expect(pickInitialTier({ ...capableDevice, reducedMotion: true })).toBe(TIER_LOW);
  });

  test("returns low when the visitor turned on data saver", () => {
    expect(pickInitialTier({ ...capableDevice, saveData: true })).toBe(TIER_LOW);
  });

  test("returns low when memory is 2 GB or less", () => {
    expect(pickInitialTier({ ...capableDevice, memory: 2 })).toBe(TIER_LOW);
  });

  test("returns mid when memory is 4 GB", () => {
    expect(pickInitialTier({ ...capableDevice, memory: 4 })).toBe(TIER_MID);
  });

  test("returns mid when memory is fine but there are only 4 cores", () => {
    expect(pickInitialTier({ ...capableDevice, cores: 4 })).toBe(TIER_MID);
  });

  test("starts high when the browser hides memory, so the measurement decides", () => {
    expect(pickInitialTier({ reducedMotion: false, saveData: false, memory: undefined, cores: 2 })).toBe(TIER_HIGH);
  });
});

describe("typicalFrameRate", () => {
  const SIXTY_FPS_GAP = 1000 / 60;

  test("returns 60 for evenly spaced 60fps frames", () => {
    const gaps = Array(30).fill(SIXTY_FPS_GAP);
    expect(typicalFrameRate(gaps)).toBeCloseTo(60);
  });

  test("ignores a few long pauses on an otherwise fast device", () => {
    const gaps = [...Array(30).fill(SIXTY_FPS_GAP), 400, 250, 300];
    expect(typicalFrameRate(gaps)).toBeCloseTo(60);
  });

  test("reports a slow device when most frames are slow", () => {
    const gaps = Array(20).fill(50);
    expect(typicalFrameRate(gaps)).toBeCloseTo(20);
  });

  test("returns null when there are too few frames to judge", () => {
    expect(typicalFrameRate([])).toBeNull();
    expect(typicalFrameRate([16])).toBeNull();
  });
});

describe("adjustTierForFrameRate", () => {
  test("keeps the tier when the frame rate is smooth", () => {
    expect(adjustTierForFrameRate(TIER_HIGH, 60)).toBe(TIER_HIGH);
  });

  test("steps down one tier when the frame rate is below smooth", () => {
    expect(adjustTierForFrameRate(TIER_HIGH, 40)).toBe(TIER_MID);
    expect(adjustTierForFrameRate(TIER_MID, 40)).toBe(TIER_LOW);
  });

  test("drops straight to low when the device is struggling", () => {
    expect(adjustTierForFrameRate(TIER_HIGH, 20)).toBe(TIER_LOW);
  });

  test("never goes below low", () => {
    expect(adjustTierForFrameRate(TIER_LOW, 40)).toBe(TIER_LOW);
  });

  test("never raises the tier, however fast the device is", () => {
    expect(adjustTierForFrameRate(TIER_MID, 120)).toBe(TIER_MID);
  });
});
