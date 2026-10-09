// What the game writes, in the player's language: lang/<code>.txt, a line each, an id = its words, written as they are
// written (the game writes them in capitals: its font has no others; page.* are the page's words, written as they
// are). {name} and the like are what goes in. An id a language leaves out is written in English. The language:
// ?lang=de (or =en) if given, else the first of the device's languages there is a file for, else English.
export const LANGS = ['en', 'de'];

// a file's lines into { id: words } (# a comment; a line without ' = ' is left out), the game's in capitals
export function parseLang(src) {
  const table = {};
  for (const line of src.split('\n')) {
    const at = line.indexOf(' = ');
    if (line.trim().startsWith('#') || at < 0) continue;
    const id = line.slice(0, at).trim(), words = line.slice(at + 3).trim();
    table[id] = id.startsWith('page.') ? words : words.split(/(\{\w+\})/).map((w, i) => (i % 2 ? w : w.toUpperCase())).join(''); // (ß: SS; {name} as it is)
  }
  return table;
}

const page = typeof document !== 'undefined'; // (not in the tests: they read the files themselves)
const asked = page ? new URLSearchParams(location.search).get('lang') : null;
const device = page ? navigator.languages || [navigator.language] : [];
export const LANG = LANGS.includes(asked) ? asked : device.map((l) => String(l).slice(0, 2).toLowerCase()).find((l) => LANGS.includes(l)) || 'en';
const load = async (lang) => { try { return parseLang(await (await fetch(`lang/${lang}.txt`)).text()); } catch { return {}; } };
const [english, chosen] = page ? await Promise.all([load('en'), LANG === 'en' ? {} : load(LANG)]) : [{}, {}];
if (page) document.documentElement.lang = LANG;

// an id's words in the player's language, {name} and the like filled in from vars (an id no language has: as it is)
export const t = (id, vars = {}) => (chosen[id] ?? english[id] ?? id).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
