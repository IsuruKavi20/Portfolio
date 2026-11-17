// ============================================================
//  orb.js — the little particle character of "Ask Isuru".
//  A tiny version of the landing sphere. Its motion shows its mood:
//    idle     slow turn, gentle breathing
//    thinking fast swirl, particles pulled inward
//    acting   bright pulse, as if pointing
//    error    dim and still
// ============================================================

const POINTS = 110;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const MOODS = {
  idle:     { spin: 0.012, breath: 0.05, squeeze: 0,    brightness: 0.85 },
  thinking: { spin: 0.06,  breath: 0.02, squeeze: 0.18, brightness: 1 },
  acting:   { spin: 0.025, breath: 0.12, squeeze: 0,    brightness: 1 },
  error:    { spin: 0.004, breath: 0.01, squeeze: 0,    brightness: 0.4 },
};

function spherePoints() {
  return Array.from({ length: POINTS }, (_, index) => {
    const y = 1 - (2 * (index + 0.5)) / POINTS;
    const ring = Math.sqrt(1 - y * y);
    const angle = index * GOLDEN_ANGLE;
    return { x: Math.cos(angle) * ring, y, z: Math.sin(angle) * ring, phase: Math.random() * Math.PI * 2 };
  });
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ animate: boolean }} options animate=false draws one still frame
 * @returns {{ setMood: (mood: keyof MOODS) => void }}
 */
export function createOrb(canvas, { animate }) {
  const ctx = canvas.getContext("2d");
  const points = spherePoints();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  // Size comes from data-size, not from the layout: the panel orb is
  // created while the panel is still hidden (0px wide)
  const size = Number(canvas.dataset.size) || canvas.clientWidth;
  canvas.width = canvas.height = Math.round(size * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  // Current values ease toward the mood's values, so changes feel smooth
  let target = MOODS.idle;
  let current = { ...MOODS.idle };
  let spin = 0;
  let time = 0;
  let frameId = 0;

  function draw() {
    for (const key of Object.keys(current)) current[key] += (target[key] - current[key]) * 0.08;
    spin += current.spin;
    time += 16;

    ctx.clearRect(0, 0, size, size);
    const center = size / 2;
    const radius = size * 0.34;
    const cos = Math.cos(spin);
    const sin = Math.sin(spin);
    const pulse = 1 + Math.sin(time * 0.004) * current.breath;

    for (const point of points) {
      const x = point.x * cos + point.z * sin;
      const z = point.z * cos - point.x * sin;
      const wobble = 1 - current.squeeze * (0.5 + 0.5 * Math.sin(time * 0.01 + point.phase));
      const nearness = (z + 1) / 2;
      const scale = radius * pulse * wobble;
      ctx.fillStyle = `rgba(255,255,255,${(0.15 + nearness * 0.75) * current.brightness})`;
      const dot = 0.8 + nearness * 1.1;
      ctx.fillRect(center + x * scale - dot / 2, center + point.y * scale - dot / 2, dot, dot);
    }
  }

  function loop() {
    draw();
    frameId = requestAnimationFrame(loop);
  }

  function onVisibility() {
    cancelAnimationFrame(frameId);
    if (!document.hidden) loop();
  }

  if (animate) {
    document.addEventListener("visibilitychange", onVisibility);
    loop();
  } else {
    draw();
  }

  return {
    setMood(mood) {
      target = MOODS[mood] ?? MOODS.idle;
      if (!animate) {
        current = { ...target };
        draw();
      }
    },
  };
}
