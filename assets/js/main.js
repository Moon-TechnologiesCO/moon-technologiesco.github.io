// Entry point: wires the page behaviours together.
import { createI18n } from "./i18n.js";
import { startMotion } from "./motion.js";
import { startStarfield } from "./starfield.js";

document.documentElement.classList.add("js");

function setupLanguageToggle(i18n) {
  const toggle = document.querySelector(".lang-toggle");
  const sync = (lang) => {
    toggle.dataset.lang = lang;
    toggle.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  };
  toggle.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-lang]");
    if (button) i18n.set(button.dataset.lang);
  });
  i18n.onChange(sync);
  sync(i18n.lang);
}

function setupMenu() {
  const nav = document.querySelector(".nav");
  const button = nav.querySelector(".nav__menu");
  const close = () => { nav.dataset.open = "false"; button.setAttribute("aria-expanded", "false"); };
  button.addEventListener("click", () => {
    const open = nav.dataset.open !== "true";
    nav.dataset.open = String(open);
    button.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll(".nav__links a").forEach((a) => a.addEventListener("click", close));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach((el) => observer.observe(el));
}

const i18n = createI18n(document);
setupLanguageToggle(i18n);
setupMenu();
setupReveal();
startStarfield(document.querySelector(".starfield"));
startMotion();
document.querySelector("[data-year]").textContent = String(new Date().getFullYear());
i18n.init().catch((error) => console.warn("Translation unavailable, showing English.", error));
