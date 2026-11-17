// ============================================================
//  particles.js — a particle sphere for the landing screen on phones,
//  tablets and low-tier desktops (a light stand-in for the Spline orb).
//
//  How it is drawn:
//    1. Points are spread evenly over a sphere (a "Fibonacci sphere").
//    2. Each frame the sphere is turned a little, and every point is
//       projected onto the flat screen with perspective: points in front
//       are drawn larger and brighter, points behind smaller and dimmer.
//    3. A finger (or mouse) pushes nearby points away, and they spring
//       back like water. A tap sends a ripple across the surface.
// ============================================================

const MAX_PIXEL_RATIO = 2;
const FRAME_MS = 1000 / 60;

// How many points: more looks richer, fewer is lighter for the device
const POINTS_BY_QUALITY = { high: 2200, mid: 1200, low: 1400 };

const SPHERE_SIZE = 0.38;          // radius as a share of the smaller screen side
const SURFACE_JITTER = 0.1;        // random depth so the surface looks like a soft shell, not a grid
const CAMERA_DISTANCE = 3;         // smaller = stronger perspective
const SPIN_SPEED = 0.0016;         // radians per frame
const BASE_TILT = 0.35;            // radians the sphere leans toward the viewer
const BREATH_AMOUNT = 0.025;       // how much the surface swells and settles
const ALPHA_LEVELS = 8;            // points are grouped by brightness to draw faster

const PUSH_RADIUS = 110;           // px around the finger that points move away from
const PUSH_STRENGTH = 5;
const SPRING_BACK = 0.06;          // how fast pushed points return (0–1 per frame)
const RIPPLE_SPEED = 0.5;          // px per ms
const RIPPLE_WIDTH = 46;           // px thickness of the ripple ring
const RIPPLE_STRENGTH = 3;
const RIPPLE_LIFE_MS = 1300;

const TILT_TURN = 0.45;            // radians the sphere turns at full phone tilt
const WARP_DURATION = 950;         // ms for the "fly through" exit
const WARP_REACH = 12;             // how far the nearest points fly out

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Evenly spaced points on a unit sphere, each with a tiny random offset. */
function createSpherePoints(count) {
  return Array.from({ length: count }, (_, index) => {
    const y = 1 - (2 * (index + 0.5)) / count;   // from top (1) to bottom (-1)
    const ringRadius = Math.sqrt(1 - y * y);
    const angle = index * GOLDEN_ANGLE;
    const jitter = 1 + (Math.random() - 0.5) * SURFACE_JITTER;
    return {
      x: Math.cos(angle) * ringRadius * jitter,
      y: y * jitter,
      z: Math.sin(angle) * ringRadius * jitter,
      phase: Math.random() * Math.PI * 2,   // so points breathe out of step
      pushX: 0,                             // offset from touch, springs back to 0
      pushY: 0,
    };
  });
}

/**
 * Starts a particle sphere on the given canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {{ animate?: boolean, quality?: "low" | "mid" | "high" }} [options]
 *   animate=false (or quality "low") draws one still frame
 * @returns {{ warp: () => Promise<void>, stop: () => void }}
 */
export function createParticleField(canvas, { animate = true, quality = "high" } = {}) {
  const ctx = canvas.getContext('2d');
  const isAnimating = animate && quality !== "low";
  const points = createSpherePoints(POINTS_BY_QUALITY[quality] ?? POINTS_BY_QUALITY.high);
  const buckets = Array.from({ length: ALPHA_LEVELS }, () => []);

  const pointer = { x: 0, y: 0, active: false };
  const tilt = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const ripples = [];

  let width = 0;
  let height = 0;
  let spin = 0;
  let elapsed = 0;
  let frameId = 0;
  let lastTime = 0;
  let warpStart = 0;
  let resolveWarp = null;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!isAnimating) draw(0, performance.now());
  }

  // Moves points away from the finger and from passing ripples
  function applyForces(point, screenX, screenY, step, now) {
    if (pointer.active) {
      const dx = screenX - pointer.x;
      const dy = screenY - pointer.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance < PUSH_RADIUS) {
        const force = (1 - distance / PUSH_RADIUS) * PUSH_STRENGTH * step;
        point.pushX += (dx / distance) * force;
        point.pushY += (dy / distance) * force;
      }
    }

    for (const ripple of ripples) {
      const age = now - ripple.start;
      const dx = screenX - ripple.x;
      const dy = screenY - ripple.y;
      const distance = Math.hypot(dx, dy) || 1;
      const offRing = Math.abs(distance - age * RIPPLE_SPEED);
      if (offRing < RIPPLE_WIDTH) {
        const fade = 1 - age / RIPPLE_LIFE_MS;
        const force = (1 - offRing / RIPPLE_WIDTH) * RIPPLE_STRENGTH * fade * step;
        point.pushX += (dx / distance) * force;
        point.pushY += (dy / distance) * force;
      }
    }

    point.pushX -= point.pushX * SPRING_BACK * step;
    point.pushY -= point.pushY * SPRING_BACK * step;
  }

  /**
   * Draws one frame.
   * @param {number} step 1 at 60fps; 0 means "draw without moving anything"
   * @param {number} now current time in ms
   * @param {number} warpProgress 0 normally, 0→1 during the exit
   */
  function draw(step, now, warpProgress = 0) {
    ctx.clearRect(0, 0, width, height);
    buckets.forEach((bucket) => (bucket.length = 0));

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * SPHERE_SIZE;
    const turnY = spin + tilt.x * TILT_TURN;
    const turnX = BASE_TILT + tilt.y * TILT_TURN;
    const cosY = Math.cos(turnY), sinY = Math.sin(turnY);
    const cosX = Math.cos(turnX), sinX = Math.sin(turnX);
    const warp = warpProgress * warpProgress * warpProgress;   // starts gently, then rushes

    for (const point of points) {
      // Turn around the vertical axis, then lean toward the viewer
      const x1 = point.x * cosY + point.z * sinY;
      const z1 = point.z * cosY - point.x * sinY;
      const y2 = point.y * cosX - z1 * sinX;
      const z2 = point.y * sinX + z1 * cosX;

      const breath = 1 + Math.sin(elapsed * 0.0012 + point.phase) * BREATH_AMOUNT;
      const perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE - z2);
      const nearness = (z2 + 1) / 2;   // 0 = back of the sphere, 1 = front

      let screenX = centerX + x1 * radius * breath * perspective;
      let screenY = centerY + y2 * radius * breath * perspective;

      if (step > 0) applyForces(point, screenX, screenY, step, now);
      screenX += point.pushX;
      screenY += point.pushY;

      if (warp > 0) {
        const reach = 1 + warp * (0.3 + nearness) * WARP_REACH;
        screenX = centerX + (screenX - centerX) * reach;
        screenY = centerY + (screenY - centerY) * reach;
      }

      // Points on the outline (seen edge-on) glow brighter, like the Spline orb
      const rim = (1 - Math.min(1, Math.abs(z2))) ** 2;
      const alpha = Math.min(1, 0.15 + nearness * 0.45 + rim * 0.6) * (1 - warpProgress * 0.7);
      const level = Math.min(ALPHA_LEVELS - 1, Math.floor(alpha * ALPHA_LEVELS));
      const size = (0.9 + nearness * 1.3) * (1 + warp * 2);
      buckets[level].push(screenX - size / 2, screenY - size / 2, size);
    }

    // One colour change per brightness level instead of one per point
    buckets.forEach((bucket, level) => {
      if (!bucket.length) return;
      ctx.fillStyle = `rgba(255,255,255,${(level + 0.5) / ALPHA_LEVELS})`;
      for (let i = 0; i < bucket.length; i += 3) {
        ctx.fillRect(bucket[i], bucket[i + 1], bucket[i + 2], bucket[i + 2]);
      }
    });
  }

  function frame(time) {
    // step is 1 at 60fps, so motion speed is the same on fast and slow screens
    const step = clamp((time - lastTime) / FRAME_MS, 0, 3);
    lastTime = time;
    elapsed += step * FRAME_MS;

    tilt.x += (tilt.targetX - tilt.x) * 0.05 * step;
    tilt.y += (tilt.targetY - tilt.y) * 0.05 * step;
    while (ripples.length && time - ripples[0].start > RIPPLE_LIFE_MS) ripples.shift();

    let warpProgress = 0;
    if (warpStart) {
      warpProgress = clamp((time - warpStart) / WARP_DURATION, 0, 1);
    } else {
      spin += SPIN_SPEED * step;
    }
    draw(warpStart ? 0 : step, time, warpProgress);

    if (warpProgress >= 1) {
      resolveWarp?.();
      return;
    }
    frameId = requestAnimationFrame(frame);
  }

  function start() {
    cancelAnimationFrame(frameId);
    lastTime = performance.now();
    frameId = requestAnimationFrame(frame);
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  }

  function onPointerMove(event) {
    updatePointer(event);
    pointer.active = true;
  }

  function onPointerDown(event) {
    updatePointer(event);
    pointer.active = true;
    ripples.push({ x: pointer.x, y: pointer.y, start: performance.now() });
  }

  function onPointerEnd(event) {
    // A mouse is still "there" after a click; a finger is not
    if (event.pointerType !== 'mouse') pointer.active = false;
  }

  function onMouseLeaveWindow(event) {
    if (!event.relatedTarget) pointer.active = false;
  }

  function onTilt(event) {
    if (event.gamma == null || event.beta == null) return;
    tilt.targetX = clamp(event.gamma / 30, -1, 1);          // left / right
    tilt.targetY = clamp((event.beta - 45) / 30, -1, 1);    // 45° = natural holding angle
  }

  function onVisibility() {
    if (document.hidden) cancelAnimationFrame(frameId);
    else if (isAnimating && !warpStart) start();
  }

  // iOS needs a permission popup for tilt; we skip it there instead of asking.
  const tiltNeedsPermission = typeof window.DeviceOrientationEvent?.requestPermission === 'function';

  window.addEventListener('resize', resize);
  resize();

  if (isAnimating) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerEnd, { passive: true });
    window.addEventListener('pointercancel', onPointerEnd, { passive: true });
    document.addEventListener('mouseout', onMouseLeaveWindow);
    document.addEventListener('visibilitychange', onVisibility);
    if (!tiltNeedsPermission) window.addEventListener('deviceorientation', onTilt, { passive: true });
    start();
  }

  function stop() {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', onPointerEnd);
    window.removeEventListener('pointercancel', onPointerEnd);
    document.removeEventListener('mouseout', onMouseLeaveWindow);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('deviceorientation', onTilt);
  }

  /** Plays the fly-through exit and resolves when it finishes. */
  function warp() {
    if (!isAnimating) return Promise.resolve();
    return new Promise((resolve) => {
      resolveWarp = resolve;
      warpStart = performance.now();
    });
  }

  return { warp, stop };
}
