// ============================================================
//  particles.js — lightweight particle field for the landing
//  screen on phones and tablets (replaces the heavy 3D scene).
//
//  The premium feel comes from three things:
//    1. depth   — far particles are small, dim and slow
//    2. flow    — particles drift along a smooth field, never randomly
//    3. response — they bend away from a finger and follow phone tilt
// ============================================================

const MAX_PIXEL_RATIO = 2;
const AREA_PER_PARTICLE = 5200;   // one particle per this many px²
const REDUCED_DENSITY = 0.6;      // share of particles kept below the high tier
const MIN_PARTICLES = 60;
const MAX_PARTICLES = 130;
const GLOW_SHARE = 0.1;           // share of particles that get a soft halo
const TOUCH_RADIUS = 130;         // px around the finger that particles avoid
const TOUCH_PUSH = 0.9;
const SPRING_BACK = 0.04;
const TILT_SHIFT = 18;            // px the nearest layer moves at full tilt
const WARP_DURATION = 950;        // ms for the "fly through" exit
const FRAME_MS = 1000 / 60;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function createGlowSprite() {
  const size = 64;
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = size;
  const ctx = sprite.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,0.55)');
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.14)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return sprite;
}

function createParticle(width, height) {
  const depth = 0.25 + Math.random() * 0.75;   // 0.25 = far, 1 = near
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    depth,
    radius: 0.4 + depth * 1.3,
    alpha: 0.12 + depth * 0.6,
    speed: 0.05 + depth * 0.22,
    hasGlow: Math.random() < GLOW_SHARE,
    pushX: 0,   // temporary offset from a touch, springs back to 0
    pushY: 0,
  };
}

/**
 * Starts a particle field on the given canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {{ animate?: boolean, quality?: "low" | "mid" | "high" }} [options]
 *   animate=false draws one still frame; quality sets how rich the field is
 * @returns {{ warp: () => Promise<void>, stop: () => void }}
 */
export function createParticleField(canvas, { animate = true, quality = "high" } = {}) {
  const ctx = canvas.getContext('2d');
  const glowSprite = createGlowSprite();
  const pointer = { x: 0, y: 0, active: false };
  const tilt = { x: 0, y: 0, targetX: 0, targetY: 0 };

  // "low" always means a still frame, whatever was asked for
  const isAnimating = animate && quality !== "low";
  const isRich = quality === "high";   // rich = full particle count + glow
  let width = 0;
  let height = 0;
  let particles = [];
  let frameId = 0;
  let lastTime = 0;
  let elapsed = 0;
  let warpStart = 0;
  let resolveWarp = null;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const fullCount = clamp(Math.round((width * height) / AREA_PER_PARTICLE), MIN_PARTICLES, MAX_PARTICLES);
    const count = Math.round(fullCount * (isRich ? 1 : REDUCED_DENSITY));
    particles = Array.from({ length: count }, () => createParticle(width, height));
    if (!isAnimating) draw(0);
  }

  // A smooth direction for every point in space that changes slowly over time.
  function flowAngle(x, y) {
    return Math.sin(x * 0.0018 + elapsed * 0.00011) * Math.cos(y * 0.0022 - elapsed * 0.00009) * Math.PI * 2;
  }

  function update(step) {
    tilt.x += (tilt.targetX - tilt.x) * 0.05;
    tilt.y += (tilt.targetY - tilt.y) * 0.05;

    for (const p of particles) {
      const angle = flowAngle(p.x, p.y);
      p.x += Math.cos(angle) * p.speed * step;
      p.y += Math.sin(angle) * p.speed * step;

      // Wrap around the edges so the field never empties
      if (p.x < -20) p.x = width + 20;
      else if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      else if (p.y > height + 20) p.y = -20;

      if (pointer.active) {
        const dx = p.x + p.pushX - pointer.x;
        const dy = p.y + p.pushY - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance < TOUCH_RADIUS) {
          const force = (1 - distance / TOUCH_RADIUS) * TOUCH_PUSH * p.depth * step;
          p.pushX += (dx / distance) * force * 6;
          p.pushY += (dy / distance) * force * 6;
        }
      }
      p.pushX -= p.pushX * SPRING_BACK * step;
      p.pushY -= p.pushY * SPRING_BACK * step;
    }
  }

  function draw(warpProgress) {
    ctx.clearRect(0, 0, width, height);
    const centerX = width / 2;
    const centerY = height / 2;
    // Ease-in so the fly-through starts gently and accelerates
    const warp = warpProgress * warpProgress * warpProgress;

    for (const p of particles) {
      const baseX = p.x + p.pushX + tilt.x * p.depth * TILT_SHIFT;
      const baseY = p.y + p.pushY + tilt.y * p.depth * TILT_SHIFT;

      if (warp > 0) {
        // Push every particle outward from the centre; near ones move furthest
        const reach = 1 + warp * p.depth * 14;
        const x = centerX + (baseX - centerX) * reach;
        const y = centerY + (baseY - centerY) * reach;
        const tailReach = 1 + warp * p.depth * 10;
        ctx.strokeStyle = `rgba(255,255,255,${p.alpha * (1 - warpProgress * 0.6)})`;
        ctx.lineWidth = p.radius;
        ctx.beginPath();
        ctx.moveTo(centerX + (baseX - centerX) * tailReach, centerY + (baseY - centerY) * tailReach);
        ctx.lineTo(x, y);
        ctx.stroke();
        continue;
      }

      if (isRich && p.hasGlow) {
        const glowSize = p.radius * 14;
        ctx.globalAlpha = p.alpha;
        ctx.drawImage(glowSprite, baseX - glowSize / 2, baseY - glowSize / 2, glowSize, glowSize);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(baseX, baseY, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(time) {
    // `step` is 1 at 60fps, so speed is the same on fast and slow screens
    const step = clamp((time - lastTime) / FRAME_MS, 0, 3);
    lastTime = time;
    elapsed += step * FRAME_MS;

    let warpProgress = 0;
    if (warpStart) {
      warpProgress = clamp((time - warpStart) / WARP_DURATION, 0, 1);
    } else {
      update(step);
    }
    draw(warpProgress);

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

  function onPointerMove(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  }

  function onPointerEnd() {
    pointer.active = false;
  }

  function onTilt(event) {
    if (event.gamma == null || event.beta == null) return;
    tilt.targetX = clamp(event.gamma / 30, -1, 1);          // left / right
    tilt.targetY = clamp((event.beta - 45) / 30, -1, 1);    // 45° = natural holding angle
  }

  function onVisibility() {
    if (document.hidden) cancelAnimationFrame(frameId);
    else if (isAnimating) start();
  }

  // iOS needs a permission popup for tilt; we skip it there instead of asking.
  const tiltNeedsPermission = typeof window.DeviceOrientationEvent?.requestPermission === 'function';

  window.addEventListener('resize', resize);
  resize();

  if (isAnimating) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerEnd, { passive: true });
    window.addEventListener('pointercancel', onPointerEnd, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    if (!tiltNeedsPermission) window.addEventListener('deviceorientation', onTilt, { passive: true });
    start();
  }

  function stop() {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerdown', onPointerMove);
    window.removeEventListener('pointerup', onPointerEnd);
    window.removeEventListener('pointercancel', onPointerEnd);
    window.removeEventListener('deviceorientation', onTilt);
    document.removeEventListener('visibilitychange', onVisibility);
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
