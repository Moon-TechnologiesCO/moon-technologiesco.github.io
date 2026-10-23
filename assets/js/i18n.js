// Internationalisation.
// English lives in the HTML (it is the default and what search engines index).
// Other languages are JSON dictionaries keyed by the elements' data-i18n attributes.

export const SUPPORTED = ["en", "es"];
export const DEFAULT_LANG = "en";
const STORAGE_KEY = "mt.lang";

/** Picks the language: an explicit choice wins, then the browser's languages, then English. */
export function detectLanguage(stored, browserLanguages = []) {
  if (SUPPORTED.includes(stored)) return stored;
  for (const tag of browserLanguages) {
    const base = String(tag).toLowerCase().split("-")[0];
    if (SUPPORTED.includes(base)) return base;
  }
  return DEFAULT_LANG;
}

function readStored() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function writeStored(lang) {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* private mode: the choice lasts for this visit */ }
}

/** Snapshot of the English text so we can switch back without reloading. */
function captureDefaults(root) {
  const text = new Map();
  const attrs = new Map();
  root.querySelectorAll("[data-i18n]").forEach((el) => text.set(el, el.textContent));
  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    attrs.set(el, parseAttrSpec(el.dataset.i18nAttr).map(([attr]) => [attr, el.getAttribute(attr)]));
  });
  return { text, attrs };
}

/** "content:meta.description; alt:img.lino" -> [["content","meta.description"], ["alt","img.lino"]] */
export function parseAttrSpec(spec) {
  return spec.split(";").map((part) => part.trim()).filter(Boolean).map((part) => part.split(":").map((s) => s.trim()));
}

async function loadDictionary(lang) {
  const response = await fetch(`assets/i18n/${lang}.json`, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Missing dictionary: ${lang}`);
  return response.json();
}

export function createI18n(root = document) {
  const defaults = captureDefaults(root);
  const cache = new Map();
  const listeners = new Set();
  let current = DEFAULT_LANG;

  async function apply(lang) {
    const dict = lang === DEFAULT_LANG ? null : cache.get(lang) ?? cache.set(lang, await loadDictionary(lang)).get(lang);
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = dict?.[el.dataset.i18n] ?? defaults.text.get(el);
    });
    root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const original = new Map(defaults.attrs.get(el));
      for (const [attr, key] of parseAttrSpec(el.dataset.i18nAttr)) {
        el.setAttribute(attr, dict?.[key] ?? original.get(attr));
      }
    });
    root.documentElement.lang = lang;
    current = lang;
    listeners.forEach((fn) => fn(lang));
  }

  return {
    get lang() { return current; },
    onChange(fn) { listeners.add(fn); },
    async init() {
      await apply(detectLanguage(readStored(), navigator.languages ?? [navigator.language]));
    },
    async set(lang) {
      if (!SUPPORTED.includes(lang) || lang === current) return;
      writeStored(lang);
      await apply(lang);
    },
  };
}
