// Pointer- and scroll-driven effects. The visuals live in motion.css; this file only feeds them
// CSS custom properties, batched to one update per animation frame.

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/** Runs `fn` at most once per frame, with the latest arguments. */
function perFrame(fn) {
  let pending = false;
  let lastArgs;
  return (...args) => {
    lastArgs = args;
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; fn(...lastArgs); });
  };
}

/** A soft light that follows the pointer inside each card. */
function setupSpotlight() {
  document.addEventListener("pointermove", perFrame((event) => {
    const card = event.target.closest?.(".card");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    card.style.setProperty("--my", `${event.clientY - rect.top}px`);
  }), { passive: true });
}

/** The hero moon leans gently towards the pointer. */
function setupParallax() {
  const target = document.querySelector("[data-parallax]");
  if (!target) return;
  window.addEventListener("pointermove", perFrame((event) => {
    if (reducedMotion.matches) return;
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = (event.clientY / window.innerHeight) * 2 - 1;
    target.style.setProperty("--px", x.toFixed(3));
    target.style.setProperty("--py", y.toFixed(3));
  }), { passive: true });
}

/** A thin line under the navigation shows how far the reader has scrolled. */
function setupProgress() {
  const nav = document.querySelector(".nav");
  const update = perFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav.style.setProperty("--progress", max > 0 ? (window.scrollY / max).toFixed(4) : "0");
  });
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
}

export function startMotion() {
  setupSpotlight();
  setupParallax();
  setupProgress();
}
