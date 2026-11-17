// ============================================================
//  quality.js — fits the site to the visitor's hardware.
//
//  The site runs in one of three tiers:
//    high — everything
//    mid  — lighter effects (fewer particles, no glow or grain, no mouse parallax)
//    low  — still landing, no 3D scene, no inertia scrolling
//
//  How the tier is chosen:
//    1. A first guess from what the browser tells us (hints).
//    2. A real measurement: count frames for a moment. If the device
//       cannot keep up, step down. Hints are missing on iPhone and
//       Firefox, so the measurement is what makes this reliable.
//
//  The tier is written to <html data-tier="..."> so CSS can react,
//  and remembered for the browser session so we measure only once.
//
//  For testing, add ?tier=low, ?tier=mid or ?tier=high to the address.
// ============================================================

export const TIER_LOW = "low";
export const TIER_MID = "mid";
export const TIER_HIGH = "high";

const TIERS_LOW_TO_HIGH = [TIER_LOW, TIER_MID, TIER_HIGH];
const STORAGE_KEY = "qualityTier";
export const QUALITY_EVENT = "quality:change";

const LOW_MEMORY_GB = 2;
const MID_MEMORY_GB = 4;
const MID_CORE_COUNT = 4;

const SMOOTH_FPS = 45;       // below this the device is working hard: one tier down
const STRUGGLING_FPS = 24;   // below this it cannot cope: straight to low

const SETTLE_MS = 2000;      // let loading (and the 3D scene starting up) calm down first
const MEASURE_MS = 1500;
const OVERRIDE_PARAM = "tier";

/**
 * First guess from browser hints. Pure function: no browser access.
 * @param {{ reducedMotion: boolean, saveData: boolean, memory?: number, cores?: number }} signals
 * @returns {"low" | "mid" | "high"}
 */
export function pickInitialTier({ reducedMotion, saveData, memory, cores }) {
  // The visitor asked for less: respect it before anything else
  if (reducedMotion || saveData) return TIER_LOW;

  // Memory is only reported by Chrome and Edge. Without it we cannot judge
  // from hints (iPhones also under-report their cores), so we start high
  // and let the frame-rate measurement decide.
  if (memory === undefined) return TIER_HIGH;

  if (memory <= LOW_MEMORY_GB) return TIER_LOW;
  if (memory <= MID_MEMORY_GB) return TIER_MID;
  if (cores !== undefined && cores <= MID_CORE_COUNT) return TIER_MID;
  return TIER_HIGH;
}

/**
 * Lowers the tier when the measured frame rate is poor. Never raises it.
 * @param {"low" | "mid" | "high"} tier
 * @param {number} framesPerSecond
 * @returns {"low" | "mid" | "high"}
 */
export function adjustTierForFrameRate(tier, framesPerSecond) {
  if (framesPerSecond < STRUGGLING_FPS) return TIER_LOW;
  if (framesPerSecond < SMOOTH_FPS) {
    const oneLower = TIERS_LOW_TO_HIGH.indexOf(tier) - 1;
    return TIERS_LOW_TO_HIGH[Math.max(oneLower, 0)];
  }
  return tier;
}

function isKnownTier(value) {
  return TIERS_LOW_TO_HIGH.includes(value);
}

function readSignals() {
  return {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: navigator.connection?.saveData === true,
    memory: navigator.deviceMemory,
    cores: navigator.hardwareConcurrency,
  };
}

function readStoredTier() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return isKnownTier(stored) ? stored : null;
  } catch {
    return null;   // storage blocked: we simply measure again next page
  }
}

function storeTier(tier) {
  try {
    sessionStorage.setItem(STORAGE_KEY, tier);
  } catch {
    // storage blocked: nothing to do, the tier still applies to this page
  }
}

/** @returns {"low" | "mid" | "high"} the tier in use right now */
export function getTier() {
  const current = document.documentElement.dataset.tier;
  return isKnownTier(current) ? current : TIER_HIGH;
}

function applyTier(tier) {
  const previous = document.documentElement.dataset.tier;
  document.documentElement.dataset.tier = tier;
  if (previous !== tier) {
    window.dispatchEvent(new CustomEvent(QUALITY_EVENT, { detail: { tier } }));
  }
}

/**
 * The typical frame rate from a list of gaps between frames.
 * It uses the middle (median) gap, so one or two long pauses, such as a
 * file finishing loading, do not make a fast device look slow.
 * @param {number[]} frameGapsMs time between consecutive frames, in ms
 * @returns {number | null} frames per second, or null without enough frames
 */
export function typicalFrameRate(frameGapsMs) {
  if (frameGapsMs.length < 2) return null;
  const sorted = [...frameGapsMs].sort((a, b) => a - b);
  const middleGap = sorted[Math.floor(sorted.length / 2)];
  return 1000 / middleGap;
}

/**
 * Watches animation frames for a short time.
 * @returns {Promise<number | null>} frames per second, or null if the tab
 *   was hidden (browsers stop drawing hidden tabs, so the result would be wrong)
 */
function measureFrameRate() {
  return new Promise((resolve) => {
    const frameGaps = [];
    let startTime = 0;
    let previousTime = 0;

    function onFrame(time) {
      if (document.hidden) return resolve(null);
      if (!startTime) startTime = time;
      if (previousTime) frameGaps.push(time - previousTime);
      previousTime = time;
      if (time - startTime >= MEASURE_MS) return resolve(typicalFrameRate(frameGaps));
      requestAnimationFrame(onFrame);
    }

    setTimeout(() => requestAnimationFrame(onFrame), SETTLE_MS);
  });
}

function whenPageLoaded() {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
}

/**
 * Sets the tier straight away from hints (or from an earlier measurement
 * in this session), then refines it by measuring the real frame rate.
 */
export async function initQuality() {
  // Testing aid: ?tier=low in the address forces a tier for this session
  const forced = new URLSearchParams(window.location.search).get(OVERRIDE_PARAM);
  if (isKnownTier(forced)) {
    applyTier(forced);
    storeTier(forced);
    return;
  }

  const stored = readStoredTier();
  if (stored) {
    applyTier(stored);
    return;
  }

  const signals = readSignals();
  const initialTier = pickInitialTier(signals);
  applyTier(initialTier);

  // Nothing to measure when the visitor asked for no animation
  if (signals.reducedMotion) {
    storeTier(initialTier);
    return;
  }

  await whenPageLoaded();
  const framesPerSecond = await measureFrameRate();
  if (framesPerSecond === null) return;   // tab was hidden: try again on the next page

  const measuredTier = adjustTierForFrameRate(initialTier, framesPerSecond);
  applyTier(measuredTier);
  storeTier(measuredTier);
}
