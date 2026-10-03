// node tools/test.mjs — the song plays well with the engine (healthy audio, every mood reached, every stinger heard),
// and the art keeps its promises (every animal stands tall enough to hit a branch and ducks under it).
import { readFileSync } from 'node:fs';
import { Engine } from '../engine/src/engine/engine.js';
import { diskSamples } from '../engine/src/disk-samples.js';
import { animal, ANIMALS, FOOT, GROUND, DUCK_UNDER, CROW_BOTTOM, branch } from '../art.js';

let failed = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failed++; };

// the song
const SR = 44100, song = JSON.parse(readFileSync(new URL('../song.json', import.meta.url), 'utf8'));
const e = new Engine(SR, song, 3);
e.setSamples(await diskSamples());
function run(secs, onBlock) {
  const L = new Float32Array(128), R = new Float32Array(128);
  let peak = 0, bad = 0;
  for (let i = 0, n = Math.round(secs * SR); i < n; i += 128) {
    onBlock?.(e);
    e.process(L, R, 128);
    for (let j = 0; j < 128; j++) { if (!Number.isFinite(L[j])) bad++; peak = Math.max(peak, Math.abs(L[j])); }
  }
  return { peak, bad };
}
const h = run(90);
ok(h.bad === 0 && h.peak > 0.1 && h.peak < 1, `the song plays healthy audio (peak ${h.peak.toFixed(2)})`);
const far = [];
for (const mood of Object.keys(song.moods)) {
  e.setMood(mood);
  let got = false;
  run(40, (en) => { got ||= en.inMood(en.section); en.drainEvents(); });
  if (!got) far.push(`${mood}→${e.section.id}`);
}
ok(!far.length, `every mood reaches its section within 40 s${far.length ? ` — ${far.join(', ')}` : ''}`);
const silent = song.stingers.filter((x) => {
  e.drainEvents();
  e.sting(x.id);
  let notes = 0;
  run((x.beats * 60) / song.bpm + 1, (en) => { for (const ev of en.drainEvents()) if (ev.type === 'note') notes++; });
  return !notes;
}).map((x) => x.id);
ok(!silent.length, `every stinger plays (${song.stingers.map((x) => x.id)})${silent.length ? ` — silent: ${silent}` : ''}`);
// a super power lasts 8 s: its music has to come at once (within: 0, the next bar line) and leave as fast
{
  e.setMood('exploring');
  run(30, (en) => en.drainEvents());
  e.setMood('power', { within: 0 });
  let at = null, t = 0;
  run(4, (en) => { t += 128 / SR; if (at === null && en.section?.id === 'star') at = t; en.drainEvents(); });
  e.setMood('exploring', { within: 0 });
  let back = null; t = 0;
  run(4, (en) => { t += 128 / SR; if (back === null && en.section?.id !== 'star') back = t; en.drainEvents(); });
  ok(at !== null && at < 2 && back !== null && back < 2, `the power music comes within ${at?.toFixed(1)} s and leaves within ${back?.toFixed(1)} s`);
}
const used = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const calls = [...used.matchAll(/call\('sting', '(\w+)'\)/g)].map((m) => m[1]);
ok(calls.every((id) => song.stingers.some((x) => x.id === id)), `every stinger the game calls is in the song (${[...new Set(calls)]})`);

// the art: heights in rows above the ground, the ground row included
const rows = (s) => FOOT - Math.min(...[...s.mask.keys()].filter((i) => s.mask[i]).map((i) => Math.floor(i / s.w))) + 1;
const branchBottom = Math.max(...[...branch(Math.random).mask.entries()].filter(([, v]) => v).map(([i]) => Math.floor(i / 26)));
for (const k of Object.keys(ANIMALS)) {
  const stand = [0, 1, 2, 3].map((f) => rows(animal(k, 'run', f))), duck = [0, 1].map((f) => rows(animal(k, 'duck', f)));
  ok(Math.min(...stand) >= GROUND - DUCK_UNDER + 4 && Math.max(...duck) <= GROUND - DUCK_UNDER - 1,
    `the ${k} runs into what hangs low (${Math.min(...stand)} rows tall) and ducks under it (${Math.max(...duck)} rows)`);
}
// every animal jumps the tallest cactus (20 high), even the heavy ones (the game's JUMP 330 and GRAVITY 1500)
const heights = Object.entries(ANIMALS).map(([k, t]) => [k, Math.round((330 * t.jump) ** 2 / (2 * 1500 * t.gravity))]);
ok(heights.every(([, h]) => h >= 24), `every animal jumps high enough (${heights.map(([k, h]) => `${k} ${h}`).join(', ')})`);
const mults = Object.values(ANIMALS).map((t) => t.mult);
ok(mults.every((m, i) => !i || m > mults[i - 1]), `each animal counts more than the one before (${mults.join(', ')})`);
ok(branchBottom <= DUCK_UNDER && branchBottom >= DUCK_UNDER - 2, `branches end just above a ducking animal (row ${branchBottom})`);
ok(CROW_BOTTOM > 0, 'crows have a lowest row');

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
