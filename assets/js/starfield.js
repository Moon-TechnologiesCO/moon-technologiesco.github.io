// A quiet night sky: twinkling stars and, now and then, a shooting star.
// Respects prefers-reduced-motion (draws one still frame) and pauses with the tab.

const STAR_DENSITY = 1 / 7000;     // stars per CSS pixel of area
const SHOOTING_STAR_EVERY = [5000, 10000]; // ms, random in range
const PARALLAX = 0.12;     // how much the farthest stars move per scrolled pixel

function random(min, max) { return min + Math.random() * (max - min); }

function makeStars(width, height) {
  const count = Math.round(width * height * STAR_DENSITY);
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() < 0.08 ? random(1.1, 1.7) : random(0.35, 0.95),
    base: random(0.25, 0.85),
    speed: random(0.4, 1.4),
    phase: random(0, Math.PI * 2),
    warm: Math.random() < 0.12,
    depth: random(0.15, 1),  // 1 = nearest: moves most when scrolling
  }));
}

export function startStarfield(canvas) {
  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let stars = [];
  let shooting = null;
  let nextShootingAt = performance.now() + random(...SHOOTING_STAR_EVERY);
  let width = 0;
  let height = 0;
  let frame = 0;
  let scrollY = window.scrollY;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = makeStars(width, height);
    draw(performance.now());
  }

  function drawShootingStar(now) {
    if (!shooting && now >= nextShootingAt) {
      shooting = { x: random(width * 0.2, width), y: random(0, height * 0.35), start: now, length: random(120, 220) };
    }
    if (!shooting) return;
    const t = (now - shooting.start) / 900;
    if (t >= 1) {
      shooting = null;
      nextShootingAt = now + random(...SHOOTING_STAR_EVERY);
      return;
    }
    const x = shooting.x - t * 420;
    const y = shooting.y + t * 180;
    const gradient = ctx.createLinearGradient(x, y, x + shooting.length, y - shooting.length * 0.43);
    gradient.addColorStop(0, `rgba(255, 248, 231, ${0.9 * (1 - t)})`);
    gradient.addColorStop(1, "rgba(255, 248, 231, 0)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + shooting.length, y - shooting.length * 0.43);
    ctx.stroke();
  }

  function draw(now) {
    ctx.clearRect(0, 0, width, height);
    const animate = !reducedMotion.matches;
    for (const s of stars) {
      const twinkle = animate ? 0.5 + 0.5 * Math.sin(now / 1000 * s.speed + s.phase) : 0.7;
      ctx.globalAlpha = s.base * (0.55 + 0.45 * twinkle);
      ctx.fillStyle = s.warm ? "#FFE9A8" : "#FFFFFF";
      const y = ((s.y - scrollY * PARALLAX * s.depth) % height + height) % height;
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (animate) drawShootingStar(now);
  }

  function loop(now) {
    draw(now);
    frame = requestAnimationFrame(loop);
  }

  function updateMotion() {
    cancelAnimationFrame(frame);
    if (reducedMotion.matches) draw(performance.now());
    else frame = requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", () => {
    scrollY = window.scrollY;
    if (reducedMotion.matches) draw(performance.now());
  }, { passive: true });
  reducedMotion.addEventListener("change", updateMotion);
  resize();
  updateMotion();
}
