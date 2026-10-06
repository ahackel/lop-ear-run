// Pixel art for Lop Hop. Sprites are small grids of palette indices, filled from shapes (ellipses, capsules,
// triangles) and outlined. Each sprite comes with a collision mask. The animals are rigs (animals/*.js; see the rigs
// below): their tails and ears swing to any angle, and never count in a collision.
import rabbit from './animals/rabbit.js';
import cat from './animals/cat.js';
import dog from './animals/dog.js';
import fox from './animals/fox.js';
import hedgehog from './animals/hedgehog.js';
import squirrel from './animals/squirrel.js';
import otter from './animals/otter.js';
import skunk from './animals/skunk.js';
import wolf from './animals/wolf.js';
import boar from './animals/boar.js';
import bear from './animals/bear.js';
import cheetah from './animals/cheetah.js';
import rhino from './animals/rhino.js';
import elephant from './animals/elephant.js';
import dino from './animals/dino.js';
import guineapig from './animals/guineapig.js';
import pig from './animals/pig.js';
import yak from './animals/yak.js';
import ostrich from './animals/ostrich.js';
import dromedary from './animals/dromedary.js';
import gorilla from './animals/gorilla.js';

export const W = 300, H = 90, GROUND = 78; // the world in art pixels; GROUND: the y of the ground line

// a color's red, green, blue (0-255), from '#rrggbb'; how light it looks (0-255)
export const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
export const luma = (hex) => { const [r, g, b] = rgb(hex); return 0.3 * r + 0.59 * g + 0.11 * b; };

// palette indices
const OUT = 1, FUR = 2, EAR = 3, PINK = 4, INK = 5, BERRY = 6, ORANGE = 7, LEAF = 8, FAINT = 9, LIGHT = 10, FOX = 11, BELLY = 12,
  TAN = 14, BROWN = 15, GINGER = 16, STRIPE = 17, CACTUS = 18, CACTUS_DARK = 19, CACTUS_LIGHT = 20, YELLOW = 21, BARK = 22,
  WOOD = 23, FISH = 24, LEAF_DARK = 25, GRAPE = 27, WOLF = 28, BOAR = 29, SNOUT = 30, WOLF_DARK = 31, SKUNK = 32, CHEETAH = 33, RHINO = 34, RHINO_DARK = 35, DINO = 36, DINO_LIGHT = 37,
  ELEPHANT = 38, ELEPHANT_DARK = 39, PIG = 40, PIG_DARK = 41, YAK = 42, HORN = 43, OSTRICH = 44, OSTRICH_SKIN = 45, CAMEL = 46, CAMEL_DARK = 47,
  GORILLA = 48, SILVER = 49, GORILLA_FACE = 50;
export const COLOR = { INK, DIM: 13, BERRY, YELLOW, ENERGY: 26, LEAF, FAINT, WHITE: BELLY, ICE: FISH };

export const PALETTES = {
  day: { bg: '#f7f6f0', 1: '#3a3a3a', 2: '#fdfbf6', 3: '#e3d2c2', 4: '#f19bb2', 5: '#535353', 6: '#d6455f', 7: '#ec6f2b', 8: '#62b04f', 9: '#dedbd0',
    10: '#f7f6f0', 11: '#d9682b', 12: '#fdfbf6', 13: '#9a9a94', 14: '#dfa45e', 15: '#8a5a3b', 16: '#f2a65a', 17: '#c46f34', 18: '#6eae4c',
    19: '#3e7a39', 20: '#a6d46c', 21: '#ffcf3a', 22: '#7a5236', 23: '#e2bd86', 24: '#7aa5cf', 25: '#3f8a3a', 26: '#5dbb4c', 27: '#7d4f9e', 28: '#8e919c', 29: '#5e4c40', 30: '#c9a395', 31: '#5a5c66', 32: '#585866', 33: '#e2b25a', 34: '#9a968f', 35: '#77736d', 36: '#8f9090', 37: '#cfcfcc', 38: '#a4a9b4', 39: '#7f8590',
    40: '#f3b3b9', 41: '#de8f9b', 42: '#57463b', 43: '#ece4d0', 44: '#4f4b55', 45: '#e6aea2', 46: '#d8ad72', 47: '#b88a52', 48: '#55545e', 49: '#abacb5', 50: '#8d8893' },
  night: { bg: '#1d2033', 1: '#141625', 2: '#f4f1ea', 3: '#d3c3b3', 4: '#e88aa3', 5: '#c3c6d8', 6: '#e8607e', 7: '#ee8a2a', 8: '#4f9a48', 9: '#2e3350',
    10: '#1d2033', 11: '#d9682b', 12: '#f4f1ea', 13: '#6a7090', 14: '#cf975a', 15: '#7a5038', 16: '#e69a52', 17: '#b06232', 18: '#4f9446',
    19: '#2f6232', 20: '#86bd5e', 21: '#ffd24a', 22: '#6b4a33', 23: '#cfa974', 24: '#6f98c4', 25: '#2f6e35', 26: '#5dbb4c', 27: '#a274c4', 28: '#a3a6b3', 29: '#6e5a4c', 30: '#c39a8c', 31: '#6a6c78', 32: '#6c6c7a', 33: '#d4a650', 34: '#8e8a84', 35: '#6c6862', 36: '#9a9cac', 37: '#c9cad6', 38: '#979dad', 39: '#717787',
    40: '#e3a0aa', 41: '#c98290', 42: '#655246', 43: '#d8d0bf', 44: '#5e5a66', 45: '#d39a90', 46: '#c49c66', 47: '#a67c4a', 48: '#62616d', 49: '#9e9fad', 50: '#958f9c' },
};

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ellipse = (cx, cy, rx, ry) => (x, y) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
const capsule = (x1, y1, x2, y2, r) => (x, y) => {
  const px = x + 0.5, py = y + 0.5, dx = x2 - x1, dy = y2 - y1;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return (px - x1 - t * dx) ** 2 + (py - y1 - t * dy) ** 2 <= r * r;
};
const triangle = (ax, ay, bx, by, cx, cy) => (x, y) => {
  const px = x + 0.5, py = y + 0.5;
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by), d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy), d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};

class Grid {
  constructor(w, h) { this.w = w; this.h = h; this.px = new Uint8Array(w * h); }
  // fill the shapes with a color; outline: the pixels around them (4-neighbours) in that color. → the filled mask. (at:
  // [x0, y0, x1, y1], where the shapes can be: only there is looked at)
  layer(shapes, color, outline = 0, at = null) {
    const { w, h, px } = this, m = new Uint8Array(w * h), [x0, y0, x1, y1] = this.clip(at);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (shapes.some((s) => s(x, y))) { m[y * w + x] = 1; px[y * w + x] = color; }
    if (outline) {
      for (let y = Math.max(0, y0 - 1); y < Math.min(h, y1 + 1); y++) for (let x = Math.max(0, x0 - 1); x < Math.min(w, x1 + 1); x++) {
        const i = y * w + x;
        if (!m[i] && ((x > 0 && m[i - 1]) || (x < w - 1 && m[i + 1]) || (y > 0 && m[i - w]) || (y < h - 1 && m[i + w]))) px[i] = outline;
      }
    }
    return m;
  }
  // color the shapes, only where `within` (a mask) is set (at: as for layer)
  paint(shapes, color, within, at = null) {
    const [x0, y0, x1, y1] = this.clip(at);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (within[y * this.w + x] && shapes.some((s) => s(x, y))) this.px[y * this.w + x] = color;
  }
  clip(at) { return at ? [Math.max(0, at[0]), Math.max(0, at[1]), Math.min(this.w, at[2]), Math.min(this.h, at[3])] : [0, 0, this.w, this.h]; }
  dot(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c; }
  get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y * this.w + x] : 0; }
}
const union = (...masks) => { const out = new Uint8Array(masks[0].length); for (const m of masks) for (let i = 0; i < m.length; i++) out[i] |= m[i]; return out; };

// the screen pixels per art pixel: things move in screen pixels (smoothly), while the art keeps its big pixels
let S = 1;
export const setScale = (s) => { S = s; };
export const snap = (v) => Math.round(v * S) / S; // (to the nearest screen pixel)

// a palette as 32-bit pixels (RGBA in memory: the bytes of a little-endian word), by index
const words = new Map();
function wordsOf(pal) {
  let out = words.get(pal);
  if (!out) {
    out = new Uint32Array(256);
    for (const k in pal) if (/^\d+$/.test(k)) { const v = parseInt(pal[k].slice(1, 7), 16); out[k] = 0xff000000 | ((v & 0xff) << 16) | (v & 0xff00) | (v >> 16); }
    words.set(pal, out);
  }
  return out;
}
// canvases given back by sprites no longer kept (a rig's frames come and go: a new canvas for each would be slow, and
// without OffscreenCanvas, Safari before 16.4, a new element each time)
const spare = [];
// a sprite: { w, h, px (palette indices), mask, draw(ctx, x, y, palette), free() }; drawn into a canvas per palette, on
// first use (free: its canvases given back). ox, oy (in extra): where its grid starts from where it is placed (a rig's
// frame, bigger than the box: see the rigs)
function sprite(g, mask, extra) {
  let canvases = {};
  const ox = extra?.ox || 0, oy = extra?.oy || 0;
  return {
    w: g.w, h: g.h, px: g.px, mask, ...extra,
    free() { for (const k in canvases) if (spare.length < 64) spare.push(canvases[k]); canvases = {}; },
    draw(ctx, x, y, pal) {
      let c = canvases[pal.bg];
      if (!c) {
        c = canvases[pal.bg] = spare.pop() || (typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(g.w, g.h) : document.createElement('canvas')); // (Safari before 16.4: none)
        c.width = g.w; c.height = g.h;
        const cx = c.getContext('2d'), img = cx.createImageData(g.w, g.h), out = new Uint32Array(img.data.buffer), word = wordsOf(pal);
        for (let i = 0; i < g.px.length; i++) if (g.px[i]) out[i] = word[g.px[i]];
        cx.putImageData(img, 0, 0);
      }
      ctx.drawImage(c, snap(x + ox), snap(y + oy), g.w, g.h);
    },
  };
}

// a sprite from rows of characters: '.' is empty, the rest name palette entries in `keys`
function fromRows(rows, keys) {
  const g = new Grid(rows[0].length, rows.length), mask = new Uint8Array(g.w * g.h);
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') { g.px[y * g.w + x] = keys[ch]; mask[y * g.w + x] = 1; } }));
  return sprite(g, mask);
}

// ----------------------------------------------------------------------------------------------------------- animals
// Every animal faces right in a 26×20 box, its feet on row FOOT, and is a rig (see the rigs below). Moves: run (see
// stride), jump (see jumpFrame), duck, idle (see idleFrame), hurt, ko; the hedgehog's ball (0-3), drawn on its own.
export const FOOT = 19;
// In the order they are unlocked: each is chased by the next, and reaching night with one unlocks
// the next (the dino, last, is chased by the rabbit). The rabbit is the easy start; each after it is clearly harder than the
// one before, the dino the hardest, and
// its score counts more (mult). The dials, as factors: speed (start and top speed), jump (its speed off the ground),
// gravity, drain (energy), meals (how often food comes), bump (what a bump costs), early (crows and branches come that
// many points sooner), packs (obstacles in groups), tight (the gaps between obstacles).
const tune = (mult, speed, jump, gravity, drain, meals, bump, early, packs, tight) => ({ mult, speed, jump, gravity, drain, meals, bump, early, packs, tight });
// a jump: how fast it leaves the ground, how fast it falls back (art pixels per second, per second), for every animal
// (times its dials); → how high it gets (its feet)
export const JUMP = 330, GRAVITY = 1500;
export const jumpHeight = (kind) => (JUMP * ANIMALS[kind].jump) ** 2 / (2 * GRAVITY * ANIMALS[kind].gravity);
export const ANIMALS = {
  rabbit: { name: 'RABBIT', food: 'carrot', ...tune(1.0, 1.0, 1.08, 1, 1, 1, 1, 0, 1, 1) },
  guineapig: { name: 'GUINEA PIG', food: 'cucumber', ...tune(1.1, 1.03, 1.04, 1, 1.048, 0.982, 1.02, 0, 1.05, 0.99) },
  cat: { name: 'CAT', food: 'fish', ...tune(1.21, 1.04, 1, 1, 1.05, 0.98, 1.04, 0, 1.1, 0.98) },
  dog: { name: 'DOG', food: 'bone', ...tune(1.43, 1.07, 1, 1.05, 1.09, 0.96, 1.09, 50, 1.3, 0.97) },
  pig: { name: 'PIG', food: 'truffle', ...tune(1.53, 1.09, 0.98, 1.05, 1.115, 0.95, 1.11, 75, 1.35, 0.96) },
  fox: { name: 'FOX', food: 'grapes', ...tune(1.64, 1.11, 1, 1.05, 1.14, 0.94, 1.13, 100, 1.4, 0.95) },
  hedgehog: { name: 'HEDGEHOG', food: 'apple', ...tune(1.86, 1.13, 0.98, 1, 1.18, 0.935, 1.17, 100, 1.4, 0.94) },
  squirrel: { name: 'SQUIRREL', food: 'acorn', ...tune(2.07, 1.18, 1, 0.85, 1.23, 0.91, 1.21, 100, 1.6, 0.91) }, // floaty, hungry
  otter: { name: 'OTTER', food: 'shell', ...tune(2.29, 1.21, 0.97, 1.1, 1.28, 0.89, 1.26, 150, 1.8, 0.9) }, // crows from the start
  skunk: { name: 'SKUNK', food: 'beetle', ...tune(2.5, 1.25, 1.05, 1.1, 1.32, 0.87, 1.3, 200, 1.9, 0.88) },
  wolf: { name: 'WOLF', food: 'sausage', ...tune(2.71, 1.29, 1, 1.15, 1.37, 0.85, 1.34, 200, 2.0, 0.86) },
  boar: { name: 'BOAR', food: 'mushroom', ...tune(2.93, 1.32, 0.95, 1.2, 1.42, 0.83, 1.39, 250, 2.2, 0.85) }, // heavy, low jumps
  bear: { name: 'BEAR', food: 'berries', ...tune(3.14, 1.36, 0.95, 1.2, 1.46, 0.81, 1.43, 250, 2.3, 0.83) },
  yak: { name: 'YAK', food: 'hay', ...tune(3.21, 1.37, 0.95, 1.2, 1.47, 0.807, 1.44, 250, 2.33, 0.827) }, // heavy
  ostrich: { name: 'OSTRICH', food: 'melon', ...tune(3.29, 1.38, 1.06, 1.1, 1.49, 0.803, 1.455, 275, 2.37, 0.82) }, // long legs: high jumps
  cheetah: { name: 'CHEETAH', food: 'drumstick', ...tune(3.36, 1.39, 1.08, 1.1, 1.51, 0.8, 1.47, 300, 2.4, 0.81) },
  dromedary: { name: 'DROMEDARY', food: 'date', ...tune(3.46, 1.41, 1, 1.15, 1.535, 0.79, 1.49, 300, 2.45, 0.8) },
  rhino: { name: 'RHINO', food: 'leaf', ...tune(3.57, 1.43, 0.95, 1.15, 1.56, 0.78, 1.51, 300, 2.5, 0.79) },
  gorilla: { name: 'GORILLA', food: 'fig', ...tune(3.68, 1.445, 1, 1.2, 1.58, 0.77, 1.535, 300, 2.6, 0.785) },
  elephant: { name: 'ELEPHANT', food: 'peanut', ...tune(3.79, 1.46, 1, 1.2, 1.6, 0.76, 1.56, 300, 2.7, 0.78) },
  dino: { name: 'DINO', food: 'roast', ...tune(4.0, 1.5, 1, 1.25, 1.65, 0.74, 1.6, 300, 2.8, 0.76) }, // the hardest
};

// where a run is in its stride (phase 0…1) → { frame, lift }: a gait's frame, and how high a leap has the body (a
// gallop bobs itself); a move of keyframes, four to a stride
export function stride(kind, phase, move = 'run') {
  const g = RIGS[kind].poses[move]?.gait;
  return g ? { frame: Math.floor(phase * g.frames) % g.frames, lift: g.leap ? leapLift(g, phase) : 0 } : { frame: Math.floor(phase * 4) % 4, lift: 0 };
}

// how fast a run's strides go, for an animal (1: the usual; less: longer strides, as a rig's gait says)
export const strideRate = (kind) => RIGS[kind].poses.run?.gait?.rate || 1;
// how many strides a second, running at a speed (art pixels a second); rate: its own (see strideRate)
export const strides = (kind, speed, rate = strideRate(kind)) => (1.6 + speed / 90) * rate;
// does it run in leaps (the rabbit, the squirrel: landing with a puff of dust)?
export const leaps = (kind) => !!RIGS[kind].poses.run?.gait?.leap;

// sitting (on the title), t seconds in → its frame: a rig's own loop (breathing, looking about), or two frames
export function idleFrame(kind, t) {
  const m = RIGS[kind].poses.idle;
  return m?.at ? Math.floor(t * m.fps) % m.frames : Math.floor(t * 5) % 2;
}

// jumping, rise: how fast it goes up (1: as it takes off, 0: at the top, -1: falling as fast) → its frame: a rig's jump
// keyframes, spread over the arc (two: rising, falling)
export function jumpFrame(kind, rise) {
  const m = RIGS[kind].poses.jump, n = Array.isArray(m) ? m.length : 2;
  return clamp(Math.floor(((1 - rise) / 2) * n), 0, n - 1);
}

// an animal in a move's frame: blinking or not; body: its moving parts (its chains), as moveBody left them (none: at
// rest); scale: drawn bigger (the giant dino, see drawRig)
export function animal(kind, pose, frame = 0, { blink = false, body = null, scale = 1 } = {}) {
  return pose === 'ball' ? balls[frame % 4] : rigFrame(kind, pose, frame, blink, body, scale);
}


function eyes(g, pose, [x, y], blink) {
  if (pose === 'ko') for (const [dx, dy] of [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]) g.dot(x + dx, y + dy, OUT);
  else if (pose === 'hurt') { g.dot(x - 1, y - 1, OUT); g.dot(x, y, OUT); g.dot(x - 1, y + 1, OUT); } // >
  else { g.dot(x, y + 1, OUT); if (!blink) g.dot(x, y, OUT); }
}

// ------------------------------------------------------------------------------------------------- the hedgehog's ball

// spikes (a hedgehog) or bristles (a boar): ticks out of the outline where `where` holds, every so often (phase turns
// them); a texture of lighter specks inside
function spikes(g, mask, where, phase = 0, speck = 0) {
  const ticks = [];
  for (let y = 1; y < g.h - 1; y++) for (let x = 1; x < g.w - 1; x++) {
    const i = y * g.w + x;
    if (mask[i] || g.px[i] !== OUT || !where(x, y) || (x + y * 2 + phase) % 3) continue;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (mask[(y + dy) * g.w + x + dx]) ticks.push([x - dx, y - dy]);
  }
  for (const [x, y] of ticks) if (!g.get(x, y)) g.dot(x, y, OUT);
  if (speck) for (let i = 0; i < mask.length; i++) if (mask[i] && where(i % g.w, Math.floor(i / g.w)) && ((i * 37 + phase * 11) % 17) % 5 === 0) g.px[i] = speck;
}

// its super power rolls it up: a spiky ball, its face turning with it (frames 0-3)
const balls = [0, 1, 2, 3].map((f) => {
  const g = new Grid(26, 20), m = g.layer([ellipse(12, 12.5, 6.5, 6.5)], BROWN, OUT);
  spikes(g, m, () => true, f, TAN);
  g.paint([ellipse(13 + [0, 1, 0, -1][f], 13.5 + [0, 0, 1, 0][f], 2.6, 2.2)], EAR, m);
  return sprite(g, m, { head: [12, 4] });
});

// ------------------------------------------------------------------------------------------------------------ rigs
// An animal can be a rig (animals/<kind>.js, see the cat): joints, shapes on them, legs that bend to reach their paws,
// chains (a tail, ears) that the body's motion swings, and a pose for each move and frame. Its shapes are distances (how
// far a point lies outside them), so they join smoothly. Each frame is drawn into a grid just big enough for it, with its
// offset (ox, oy) from the 26×20 box the game places every animal by: a tail can reach out of the box.
// (moves: the build's own, over the moves its make worked out: a list of keyframes set by hand in the workshop's timeline,
// in place of the move; or a gait's settings over the worked-out ones, a leg's over its own)
function withMoves(rig) {
  if (!rig.moves) return rig;
  const poses = { ...rig.poses };
  for (const name in rig.moves) {
    const o = rig.moves[name], m = poses[name];
    if (Array.isArray(o)) poses[name] = o;
    else if (o.gait && m?.gait) {
      const legs = { ...m.gait.legs };
      for (const l in o.gait.legs || {}) legs[l] = Array.isArray(legs[l]) ? o.gait.legs[l] : { ...legs[l], ...o.gait.legs[l] };
      poses[name] = { ...m, gait: { ...m.gait, ...o.gait, legs } };
    }
  }
  return { ...rig, poses };
}
const RIGS = Object.fromEntries(Object.entries({ rabbit, guineapig, cat, dog, pig, fox, hedgehog, squirrel, otter, skunk, wolf, boar, bear, yak, ostrich, cheetah, dromedary, rhino, gorilla, elephant, dino })
  .map(([k, rig]) => [k, withMoves(rig)]));
const NAMED = { OUT, FUR, EAR, PINK, INK, BERRY, ORANGE, LEAF, FAINT, LIGHT, FOX, BELLY, TAN, BROWN, GINGER, STRIPE, YELLOW, BARK, WOOD,
  FISH, LEAF_DARK, GRAPE, WOLF, BOAR, SNOUT, WOLF_DARK, SKUNK, CHEETAH, RHINO, RHINO_DARK, DINO, DINO_LIGHT, ELEPHANT, ELEPHANT_DARK, PIG, PIG_DARK, YAK, HORN, OSTRICH, OSTRICH_SKIN, CAMEL, CAMEL_DARK, GORILLA, SILVER, GORILLA_FACE };

const plus = (a, b) => [a[0] + b[0], a[1] + b[1]], minus = (a, b) => [a[0] - b[0], a[1] - b[1]], times = (a, k) => [a[0] * k, a[1] * k];
const turn = ([x, y], t) => [x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t)]; // (+: clockwise on screen)
const unit = (a) => times(a, 1 / (Math.hypot(a[0], a[1]) || 1)), mix = (a, b, t) => plus(a, times(minus(b, a), t));
// distances: negative inside
const sdEllipse = (x, y, [cx, cy, rx, ry]) => (Math.hypot((x - cx) / rx, (y - cy) / ry) - 1) * Math.min(rx, ry);
function sdCapsule(x, y, [ax, ay, bx, by, r]) {
  const dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(x - ax - t * dx, y - ay - t * dy) - r;
}
function sdTriangle(x, y, [[ax, ay], [bx, by], [cx, cy]]) { // (Inigo Quilez's)
  const e = [[bx - ax, by - ay], [cx - bx, cy - by], [ax - cx, ay - cy]], v = [[x - ax, y - ay], [x - bx, y - by], [x - cx, y - cy]];
  const s = Math.sign(e[0][0] * e[2][1] - e[0][1] * e[2][0]);
  let d = Infinity, w = Infinity;
  for (let i = 0; i < 3; i++) {
    const [ex, ey] = e[i], [vx, vy] = v[i], t = clamp((vx * ex + vy * ey) / (ex * ex + ey * ey), 0, 1);
    d = Math.min(d, (vx - ex * t) ** 2 + (vy - ey * t) ** 2); w = Math.min(w, s * (vx * ey - vy * ex));
  }
  return -Math.sqrt(d) * Math.sign(w);
}
function sdBox(x, y, [x0, y0, x1, y1, r = 0]) { // (r: its corners rounded)
  const qx = Math.max(x0 + r - x, x - x1 + r), qy = Math.max(y0 + r - y, y - y1 + r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}
const sdShape = (s, x, y) => (s.ellipse ? sdEllipse(x, y, s.ellipse) : s.capsule ? sdCapsule(x, y, s.capsule) : s.box ? sdBox(x, y, s.box) : sdTriangle(x, y, s.triangle));
const smin = (a, b, k) => { if (k <= 0) return Math.min(a, b); const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
// a shape's box, in its own coordinates
const extent = (s) => (s.ellipse ? [s.ellipse[0] - s.ellipse[2], s.ellipse[1] - s.ellipse[3], s.ellipse[0] + s.ellipse[2], s.ellipse[1] + s.ellipse[3]]
  : s.box ? s.box.slice(0, 4)
  : s.capsule ? [Math.min(s.capsule[0], s.capsule[2]) - s.capsule[4], Math.min(s.capsule[1], s.capsule[3]) - s.capsule[4], Math.max(s.capsule[0], s.capsule[2]) + s.capsule[4], Math.max(s.capsule[1], s.capsule[3]) + s.capsule[4]]
  : [Math.min(...s.triangle.map((p) => p[0])), Math.min(...s.triangle.map((p) => p[1])), Math.max(...s.triangle.map((p) => p[0])), Math.max(...s.triangle.map((p) => p[1]))]);

// a joint's frame: its place, its angle, flipped (on its back); points from it (local) and back (world)
const jointFrame = (o, a, flip) => ({ o, a, flip: flip ? -1 : 1 });
const toLocal = (f, x, y) => { const dx = x - f.o[0], dy = y - f.o[1], c = Math.cos(f.a), s = Math.sin(f.a); return [dx * c + dy * s, (-dx * s + dy * c) * f.flip]; };
const toWorld = (f, [x, y]) => (f ? plus(f.o, turn([x, y * f.flip], f.a)) : [x, y]);

// two bones from a root toward a target (lengths a, b) → [knee, end]; bend 1 puts the knee behind, -1 in front
function reach(root, target, a, b, bend) {
  const d = minus(target, root), dist = clamp(Math.hypot(d[0], d[1]), Math.abs(a - b) + 0.01, a + b - 0.01), dir = unit(d);
  const knee = plus(root, times(turn(dir, bend * Math.acos(clamp((a * a + dist * dist - b * b) / (2 * a * dist), -1, 1))), a));
  return [knee, plus(knee, times(unit(minus(target, knee)), b))];
}

// a frame of a gait (a move worked out from the stride: the run, the crawl): where the stride is (frame / frames) → the
// joints bobbing (beat times a stride; the head following the chest), each paw on the ground pushing back (the stance)
// or swinging forward in an arc. m: the move, its settings over the rig's
function gaitPose(rig, m, f) {
  const g = m.gait, p = f / g.frames, J = { ...rig.joints, ...m.joints }, bob = (o) => [0, g.bob * Math.sin(Math.PI * 2 * ((g.beat || 1) * p + o))];
  const chest = bob(-0.15), paws = {};
  for (const name in g.legs) {
    const [o, ahead] = g.legs[name], L = rig.legs[name], x = toWorld(jointFrame(J[L.on], 0), L.at)[0] + ahead, q = (((p - o) % 1) + 1) % 1;
    if (q < g.stance) paws[name] = [x + g.reach * (0.5 - q / g.stance), g.ground];
    else { const u = (q - g.stance) / (1 - g.stance); paws[name] = [x - g.reach / 2 + g.reach * u * u * (3 - 2 * u), g.ground - g.lift * Math.sin(Math.PI * u)]; }
  }
  return { ...m, joints: { hip: plus(J.hip, bob(0.1)), chest: plus(J.chest, chest), head: plus(J.head, times(chest, g.head ?? 0.7)) }, paws };
}

// a frame of a leap (a gait of bounds: the rabbit, the squirrel): on the ground for `land` of the stride, gathering
// (gather: the hip forward) and crouching, then off into the air (how high: height, see stride), stretched out (the hip
// back), the nose up as it rises and down as it falls (pitch). Each leg: when its paw is down (down: [touches, leaves],
// in the stride), where (at: from its root, as it touches and as it leaves; it slides back between), and the point it
// swings toward in the air (air: from its root, and from the ground)
function leapPose(rig, m, f) {
  const g = m.gait, p = f / g.frames, J = { ...rig.joints, ...m.joints }, down = p < g.land, paws = {};
  const crouch = down ? Math.sin((Math.PI * p) / g.land) : 0, air = down ? 0 : Math.sin((Math.PI * (p - g.land)) / (1 - g.land)), tilt = down ? 0 : Math.cos((Math.PI * (p - g.land)) / (1 - g.land));
  const hip = plus(J.hip, [g.gather * crouch - g.stretch * air, g.crouch * crouch + g.pitch * tilt]), chest = plus(J.chest, [0, 0.4 * g.crouch * crouch - g.pitch * tilt]);
  const wrap = (x) => ((x % 1) + 1) % 1;
  for (const name in g.legs) {
    const { down: [td, lo], at: [xt, xl], air: [cx, cy] } = g.legs[name], L = rig.legs[name], x0 = toWorld(jointFrame(J[L.on], 0), L.at)[0];
    const into = wrap(p - td), span = wrap(lo - td) || 1;
    if (into < span) { paws[name] = [x0 + xt + ((xl - xt) * into) / span, g.ground]; continue; }
    const u = (into - span) / (1 - span), a = [x0 + xl, g.ground], c = [x0 + cx, g.ground + cy], b = [x0 + xt, g.ground]; // (a curve from a to b, pulled toward c)
    paws[name] = plus(plus(times(a, (1 - u) ** 2), times(c, 2 * u * (1 - u))), times(b, u * u));
  }
  return { ...m, joints: { hip, chest, head: plus(J.head, times(minus(chest, J.chest), g.head ?? 0.8)) }, paws };
}
// how high a leap has the body, where the stride is
const leapLift = (g, phase) => (phase < g.land ? 0 : g.height * Math.sin((Math.PI * (phase - g.land)) / (1 - g.land)));

// a rig's pose for a move and a frame. A move is keyframes (a list), a gait, or a loop worked out by its own function
// (at: 0…1 → a pose, in frames at fps); one it has none for: the run. (Worked-out poses are kept.)
const worked = new Map();
function poseOf(rig, name, frame) {
  const m = rig.poses[name] || rig.poses.run;
  if (Array.isArray(m)) return m[frame % m.length];
  let list = worked.get(m);
  if (!list) worked.set(m, (list = []));
  const n = m.gait ? m.gait.frames : m.frames, i = frame % n;
  return list[i] || (list[i] = m.gait ? (m.gait.leap ? leapPose : gaitPose)(rig, m, i) : m.at(i / n));
}
// a rig in a pose: the pose's settings over the rig's, the joints' frames
const posed = (rig, name, frame) => posedAs(rig, poseOf(rig, name, frame));
function posedAs(rig, p) {
  const J = { ...rig.joints, ...p.joints }, a = Math.atan2(J.chest[1] - J.hip[1], J.chest[0] - J.hip[0]);
  const F = { spine: jointFrame(J.hip, a, p.flip), hip: jointFrame(J.hip, a, p.flip), chest: jointFrame(J.chest, a, p.flip), head: jointFrame(J.head, p.headAngle || 0) };
  return { p, J, F, a, torso: { ...rig.torso, ...p.torso } };
}
// a pose between two (u: 0 the first, 1 the second): the joints, the paws, the head's turn, the torso and the chains' rest
// part way; what cannot be part way (the shapes of a pose of its own, flipped, pads), the nearer one's
function mixPose(rig, a, b, u) {
  const m = u < 0.5 ? a : b, lerp = (x, y) => x + (y - x) * u, part = (x, y) => (x && y ? mix(x, y, u) : u < 0.5 ? x : y);
  const ja = { ...rig.joints, ...a.joints }, jb = { ...rig.joints, ...b.joints }, ta = { ...rig.torso, ...a.torso }, tb = { ...rig.torso, ...b.torso };
  const out = { ...m, joints: {}, paws: {}, chains: {}, headAngle: lerp(a.headAngle || 0, b.headAngle || 0), torso: { ...ta, ...tb, r: lerp(ta.r || 0, tb.r || 0), ends: lerp(ta.ends ?? tb.ends ?? 0, tb.ends ?? ta.ends ?? 0) } };
  for (const k in ja) out.joints[k] = mix(ja[k], jb[k], u);
  for (const k in rig.legs) out.paws[k] = part(a.paws?.[k], b.paws?.[k]);
  for (const k in rig.chains) {
    const ca = { curl: 0, ...rig.chains[k], ...a.chains?.[k] }, cb = { curl: 0, ...rig.chains[k], ...b.chains?.[k] };
    out.chains[k] = ca.ear ? { tip: mix(ca.tip, cb.tip, u) } : { ...(u < 0.5 ? a : b).chains?.[k], angle: lerp(ca.angle, cb.angle), curl: lerp(ca.curl, cb.curl), at: mix(ca.at, cb.at, u), root: part(ca.root, cb.root) };
  }
  return out;
}
// landing (s: how hard, 1…0): the body lower (the legs bend to keep their paws down), the torso flatter and longer
function squashPose(rig, p, s) {
  const J = { ...rig.joints, ...p.joints }, t = { ...rig.torso, ...p.torso }, down = (q, k) => [q[0], q[1] + k * 1.5 * s];
  return { ...p, joints: { hip: down(J.hip, 1), chest: down(J.chest, 0.8), head: down(J.head, 0.5) }, torso: t.r > 0 ? { ...t, r: t.r - 0.35 * s, ends: t.ends + 0.4 * s } : t };
}

// a chain at rest in a pose: its root, its direction, its links (an ear: one, from the middle of its base to its tip)
function chainRest(rig, P, name) {
  const c = { links: 1, curl: 0, r: 1, ...rig.chains[name], ...P.p.chains?.[name] }, f = P.F[c.on];
  if (c.ear) {
    const base = c.ear.map((q) => toWorld(f, q)), root = mix(base[0], base[1], 0.5), to = minus(toWorld(f, c.tip), root);
    return { ...c, base, root, dir: unit(to), length: Math.hypot(to[0], to[1]) };
  }
  return { ...c, root: c.root || toWorld(f, c.at), dir: turn([0, -1], f.a - c.angle) };
}
function restPoints(c) {
  const pts = [c.root];
  for (let i = 0, d = c.dir; i < c.links; i++, d = turn(d, c.curl)) pts.push(plus(pts[i], times(d, c.length / c.links)));
  return pts;
}

// the moving parts of an animal on screen (body: kept by the game, one per animal it draws): its chains, stepped by how
// the animal moves. x, y: where its box is now; wind: how fast the world goes by (the air streams past the runner)
export function moveBody(body, kind, pose, frame, x, y, wind, dt) {
  const rig = RIGS[kind], was = body.at || [x, y];
  if (body.kind !== kind || dt > 0.2 || Math.hypot(x - was[0], y - was[1]) > 40) { body.kind = kind; body.chains = {}; body.move = null; body.landed = Infinity; } // (a new start)
  ease(body, rig, pose, frame, dt);
  const P = bodyPosed(rig, kind, pose, frame, body)[0];
  for (const name in rig.chains) {
    const c = chainRest(rig, P, name);
    let pts = body.chains[name];
    if (!pts || pts.length !== c.links + 1) pts = body.chains[name] = restPoints(c).map((q) => ({ p: plus(q, [x, y]), v: [0, 0] }));
    const from = pts[0].p, to = plus(c.root, [x, y]), n = Math.ceil(dt * 120);
    for (let i = 1; i <= n; i++) stepChain(pts, c, mix(from, to, i / n), dt / n, wind);
  }
  body.at = [x, y];
}
// a move eased into from the one before (from: that move and its frame; since: how long ago), and from one keyframe to
// the next; a landing (landed: how long ago, after a jump). Not into or out of sitting or being knocked out: they snap.
// Both in steps (a few a move, as the frames go), so the frames drawn are few.
const BLEND = 0.12, SQUASH = 0.2, STEPS = 3, SNAPS = ['idle', 'ko', 'ball'];
function ease(body, rig, pose, frame, dt) {
  const was = body.move, keys = Array.isArray(rig.poses[pose]);
  body.since = (body.since ?? Infinity) + dt; body.landed = (body.landed ?? Infinity) + dt;
  if (was && (was.pose !== pose || (keys && was.frame !== frame))) {
    body.from = SNAPS.includes(was.pose) || SNAPS.includes(pose) ? null : was; body.since = 0;
    if (was.pose === 'jump' && pose !== 'jump' && !SNAPS.includes(pose)) body.landed = 0;
  }
  body.move = { pose, frame };
}
// a rig as an animal on screen has it (body: see moveBody; it eases and lands only in the move it is in) → [its pose
// placed, a key for the frame drawn from it]
function bodyPosed(rig, kind, pose, frame, body) {
  const on = body?.kind === kind && body.move?.pose === pose && body.move.frame === frame;
  const u = on && body.from && body.since < BLEND ? (Math.floor((body.since / BLEND) * STEPS) + 1) / (STEPS + 1) : 1;
  const s = on && body.landed < SQUASH ? 1 - Math.floor((body.landed / SQUASH) * STEPS) / STEPS : 0;
  if (u === 1 && !s) return [posed(rig, pose, frame), ''];
  let p = poseOf(rig, pose, frame);
  if (u < 1) p = mixPose(rig, poseOf(rig, body.from.pose, body.from.frame), p, u);
  if (s) p = squashPose(rig, p, s);
  return [posedAs(rig, p), u < 1 ? `${body.from.pose}${body.from.frame} ${u} ${s}` : `${s}`];
}

// one step of a chain: each link springs toward its rest angle as the body holds it (a quarter of it following the link
// before, so the chain bends as one), stiffest at the root; damping (against bending) keeps it from ringing; the air drags
// on every point (still as the animal rises or falls, so a tail droops as it takes off and floats as it falls); its weight
const DRAG = 9, WIND = 0.15;
function stepChain(pts, c, root, h, wind) {
  pts[0].v = times(minus(root, pts[0].p), 1 / h); pts[0].p = root;
  const seg = c.length / c.links, air = [-wind * WIND, 0];
  let rest = c.dir, prev = null;
  for (let i = 1; i < pts.length; i++) {
    const q = pts[i], up = pts[i - 1], d = prev ? unit(mix(rest, turn(prev, c.curl), 0.25)) : rest;
    const k = c.stiffness * (1 - (0.45 * (i - 1)) / Math.max(1, c.links - 1)), want = plus(up.p, times(d, seg));
    const acc = plus(plus(plus(times(minus(want, q.p), k), times(minus(up.v, q.v), c.damping)), times(minus(air, q.v), DRAG)), [0, c.weight]);
    const was = q.p;
    q.v = plus(q.v, times(acc, h));
    const p = plus(up.p, times(unit(minus(plus(q.p, times(q.v, h)), up.p)), seg)); // moved, then kept at the link's length
    q.v = times(minus(p, was), 1 / h); q.p = p;
    prev = unit(minus(p, up.p)); rest = turn(rest, c.curl);
  }
}

// a frame of a rigged animal: its chains where the body has them (in the box: to a quarter pixel), or at rest. Kept for
// a while (the most recent few hundred).
const rigFrames = new Map();
// how much bigger each animal is drawn than its rig: n more rows in its 20-row box (it is drawn (20 + n) / 20 as big), so
// the bigger ones by nature stand taller, up to about 3 pixels. It grows from its feet, in the middle of its box; ducking,
// no more than still goes under a branch (see ducked). (The dino's even: drawn half as big again as a giant, still whole)
const SIZE = { rabbit: 0, guineapig: 0, cat: 1, dog: 2, pig: 2, fox: 1, hedgehog: 0, squirrel: 0, otter: 1, skunk: 0, wolf: 2, boar: 3, bear: 4, yak: 4, ostrich: 3,
  cheetah: 2, dromedary: 4, rhino: 4, gorilla: 4, elephant: 3, dino: 2 };
const ducks = {};
// how many frames a move has (a gait's, keyframes'; a loop's), for an animal
const framesOf = (kind, pose) => { const m = RIGS[kind].poses[pose]; return m?.gait ? m.gait.frames : Array.isArray(m) ? m.length : m?.frames || 1; };
// the most it grows by, ducking: tried, every frame of the crawl, a frame at a time (see readying; ducked: all at once)
function* fitDuck(kind) {
  const top = (s) => { let t = Infinity; for (let i = 0; i < s.mask.length; i++) if (s.mask[i]) { t = Math.floor(i / s.w); break; } return t + s.oy; };
  let n = SIZE[kind] || 0;
  for (; n > 0; n--) {
    let low = true;
    for (let f = 0; low && f < framesOf(kind, 'duck'); f++) { low = FOOT - top(rigFrame(kind, 'duck', f, false, null, 1, n)) + 1 <= GROUND - DUCK_UNDER - 1; yield; }
    if (low) break;
  }
  ducks[kind] = n;
}
function ducked(kind) {
  if (ducks[kind] === undefined) for (const it = fitDuck(kind); !it.next().done;);
  return ducks[kind];
}
const grown = (kind, pose) => (pose === 'duck' ? ducked(kind) : SIZE[kind] || 0);

// what an animal runs into in a move's frame: the frame at rest (its mask, blinking or not), kept for good (the frames
// drawn come and go), so a jump or a duck never waits for one to be drawn
const hitboxes = new Map();
export function hitbox(kind, pose, frame) {
  if (pose === 'ball') return animal(kind, pose, frame);
  const key = `${kind} ${pose} ${frame}`;
  if (!hitboxes.has(key)) hitboxes.set(key, rigFrame(kind, pose, frame, false, null));
  return hitboxes.get(key);
}
// an animal made ready to run, a piece at a time (the game does one a frame, from the title on): how low it ducks, and
// every frame it can run into
export function* readying(kind) {
  if (ducks[kind] === undefined) yield* fitDuck(kind);
  for (const pose of ['run', 'jump', 'duck', 'hurt']) {
    for (let f = 0; f < framesOf(kind, pose); f++) if (!hitboxes.has(`${kind} ${pose} ${f}`)) { hitbox(kind, pose, f); yield; }
  }
}

// grown by n rows: how much bigger (k), and moved by how much (from its feet, the row above the ground's, in the middle:
// moved back, so they stay where they were)
function growth(n, scale = 1) {
  const k = (20 + n) / 20;
  return [k, [Math.round(13 * scale * (1 - k)), Math.round((FOOT - 0.5) * scale * (1 - k))]];
}
function rigFrame(kind, pose, frame, blink, body, scale = 1, n = grown(kind, pose)) {
  const rig = RIGS[kind], [P, eased] = bodyPosed(rig, kind, pose, frame, body), chains = {};
  const live = body?.kind === kind && body.chains && body.at;
  for (const name in rig.chains) {
    const pts = live && body.chains[name] ? body.chains[name].map((q) => minus(q.p, body.at)) : restPoints(chainRest(rig, P, name));
    chains[name] = pts.map(([x, y]) => [Math.round(x * 4) / 4, Math.round(y * 4) / 4]);
  }
  const key = `${kind} ${pose} ${frame} ${eased} ${blink} ${scale} ${n} ${JSON.stringify(chains)}`;
  let s = rigFrames.get(key);
  if (s) { rigFrames.delete(key); rigFrames.set(key, s); return s; } // (the most recent last)
  const [k, d] = growth(n, scale);
  s = drawRig(rig, P, pose, blink, chains, scale * k, d, Math.round((FOOT + 1) * scale), n > 0 && pose !== 'jump');
  rigFrames.set(key, s);
  if (rigFrames.size > 400) { const old = rigFrames.keys().next().value; rigFrames.get(old).free(); rigFrames.delete(old); }
  return s;
}

// draw a rig in a pose, back to front: soft chains (a tail), the far legs, the body (torso, shapes, ears,
// near legs, joined smoothly), the markings on it (paint; spikes; socks; dark ear tips), the near paws outlined over the
// belly (over: lying low), things on top (top: horns, fangs, a head over a round body, outlined), chains in front (front:
// lop ears), single pixels (dots), the face. The collision mask: the far legs and the body. (recolor: one palette name
// for another, everywhere: the wolf is a grey fox)
function drawRig(rig, P, pose, blink, chains, S = 1, [dx, dy] = [0, 0], floor = Math.round((FOOT + 1) * S), settle = false) {
  const { p, F, torso } = P, k = rig.smooth ?? 1, fur = NAMED[rig.fur];
  // a shape with its frame (its turn worked out once), its box in the box's coordinates, and how much nearer than its
  // distance that box may be (an ellipse's distance is short of the true one off its long axis): see near
  const placed = (s) => {
    const f = s.on ? F[s.on] : null, [a, b, c, d] = extent(s), q = [[a, b], [c, b], [a, d], [c, d]].map((v) => toWorld(f, v));
    const e = s.ellipse && Math.min(s.ellipse[2], s.ellipse[3]) / Math.max(s.ellipse[2], s.ellipse[3]);
    return { s, f, cos: f ? Math.cos(f.a) : 1, sin: f ? Math.sin(f.a) : 0, k: e || 1,
      box: [Math.min(...q.map((v) => v[0])), Math.min(...q.map((v) => v[1])), Math.max(...q.map((v) => v[0])), Math.max(...q.map((v) => v[1]))] };
  };
  const sd = (b, x, y) => { // (as toLocal does it)
    if (!b.f) return sdShape(b.s, x, y);
    const dx = x - b.f.o[0], dy = y - b.f.o[1];
    return sdShape(b.s, dx * b.cos + dy * b.sin, (-dx * b.sin + dy * b.cos) * b.f.flip);
  };
  const boxOf = (caps) => [Math.min(...caps.map((c) => Math.min(c[0], c[2]) - c[4])), Math.min(...caps.map((c) => Math.min(c[1], c[3]) - c[4])),
    Math.max(...caps.map((c) => Math.max(c[0], c[2]) + c[4])), Math.max(...caps.map((c) => Math.max(c[1], c[3]) + c[4]))];
  const join = (...boxes) => (boxes.length ? [Math.min(...boxes.map((b) => b[0])), Math.min(...boxes.map((b) => b[1])), Math.max(...boxes.map((b) => b[2])), Math.max(...boxes.map((b) => b[3]))] : [0, 0, 0, 0]);
  const ovalBox = (ellipse) => extent({ ellipse }), triBox = (triangle) => extent({ triangle });
  const body = [...(p.ownShapes ? [] : rig.shapes || []), ...(p.shapes || [])].map(placed); // (ownShapes: the pose's alone)
  if (torso.r > 0) { // the torso: along the spine from the hip to the chest, reaching past both (an ellipse, or a capsule)
    const len = Math.hypot(P.J.chest[0] - P.J.hip[0], P.J.chest[1] - P.J.hip[1]), half = len / 2;
    body.unshift(placed(torso.capsule ? { on: 'spine', capsule: [-torso.ends, 0, len + torso.ends, 0, torso.r] } : { on: 'spine', ellipse: [half, 0, half + torso.ends, torso.r] }));
  }
  const legs = Object.entries(rig.legs || {}).map(([name, L]) => {
    const root = p.roots?.[name] || toWorld(F[L.on], L.at), [knee, paw] = reach(root, p.paws[name], L.thigh, L.shin, L.bend);
    const pad = p.pad && !L.far ? [paw[0], paw[1] + 0.3, ...p.pad] : L.foot ? [paw[0] + L.foot[0] - 0.8, paw[1] + 0.3, ...L.foot] : null; // a paw flat on the ground (a foot: always)
    const parts = [[...root, ...knee, L.r], [...knee, ...paw, L.r]];
    return { far: L.far, r: L.r, parts, pad, sock: [...mix(knee, paw, 0.35), ...paw, L.r], box: pad ? join(boxOf(parts), ovalBox(pad)) : boxOf(parts),
      k: pad ? Math.min(pad[2], pad[3]) / Math.max(pad[2], pad[3]) : 1 };
  });
  const legSd = (L, x, y) => Math.min(sdCapsule(x, y, L.parts[0]), sdCapsule(x, y, L.parts[1]), L.pad ? sdEllipse(x, y, L.pad) : Infinity);
  const over = legs.filter((L) => L.pad && p.over); // (near paws drawn over the body, outlined: where they would hide in it)
  const soft = [], front = [], ears = [];
  for (const name in rig.chains) {
    const c = { ...rig.chains[name], ...p.chains?.[name] }, pts = chains[name];
    if (c.ear) { const [a, b] = chainRest(rig, P, name).base; ears.push({ tri: [a, pts[1], b], tip: pts[1], c }); continue; }
    const r = (i) => (Array.isArray(c.r) ? c.r[0] + ((c.r[1] - c.r[0]) * i) / Math.max(1, pts.length - 2) : c.r ?? 1);
    const parts = pts.slice(1).map((q, i) => [...pts[i], ...q, r(i)]), last = pts[pts.length - 1];
    if (c.end) parts.push([...last, ...last, c.end]); // a round end (a lop ear's spoon, a cotton tail)
    const along = (t) => { // a point t along the chain (past its end: on along its last link)
      const n = pts.length - 1, u = clamp(t * n, 0, n), i = Math.min(n - 1, Math.floor(u));
      return mix(pts[i], pts[i + 1], u - i);
    };
    (c.front ? front : soft).push({ joined: c.joined, line: c.line, overEye: c.overEye, color: NAMED[c.color] || fur, parts, marks: (c.marks || []).map(([t, color, mr]) => [along(t), NAMED[color], mr]) });
  }
  const tops = [...(rig.top || []), ...(p.top || [])].map((t) => ({ color: NAMED[t.color] || fur, shapes: t.shapes.map(placed), paint: t.paint || [] }));
  const dots = (p.dots || rig.dots || []).map((d) => [toWorld(d.on ? F[d.on] : null, d.at), NAMED[d.color] || OUT]);

  // the frame's bounds: every shape's box (turned with its frame), one more pixel for the outline
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const fit = ([x, y], r = 0) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
  const fitShape = ({ box: [a, b, c, d] }) => { fit([a, b]); fit([c, d]); }; // (its box, turned: see placed)
  body.forEach(fitShape);
  for (const t of tops) t.shapes.forEach(fitShape);
  for (const L of [...legs, ...soft, ...front]) for (const [ax, ay, bx, by, r] of L.parts) { fit([ax, ay], r); fit([bx, by], r); }
  for (const L of legs) if (L.pad) { fit([L.pad[0] - L.pad[2], L.pad[1] - L.pad[3]]); fit([L.pad[0] + L.pad[2], L.pad[1] + L.pad[3]]); }
  for (const e of ears) for (const q of e.tri) fit(q);
  for (const [q] of dots) fit(q);
  // drawn S times bigger (the giant dino: its shapes finer, its outline still one pixel); nothing below the feet's row
  // (the ground). (ox, oy: in the bigger pixels)
  const ox = Math.floor(x0 * S) - 1, oy = Math.floor(y0 * S) - 1;
  let g = new Grid(Math.ceil(x1 * S) + 1 - ox, Math.min(Math.ceil(y1 * S) + 1, floor - dy) - oy); // (floor: the row under its feet, once moved)
  const inside = (d) => [(x, y) => d((x + ox + 0.5) / S, (y + oy + 0.5) / S) <= 0]; // (tested at the pixel's middle)
  const at = (b) => [Math.floor(b[0] * S) - ox - 1, Math.floor(b[1] * S) - oy - 1, Math.ceil(b[2] * S) - ox + 2, Math.ceil(b[3] * S) - oy + 2]; // (a box: its pixels)
  const any = (list, d) => (x, y) => { for (const q of list) if (d(q, x, y) <= 0) return 0; return 1; }; // (inside any of them)
  const n = Math.round(S), pixel = { dot: (x, y, c) => { for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) g.dot(Math.round(x) * S - ox + a, Math.round(y) * S - oy + b, c); } }; // (a dot: S by S)
  const chain = (t) => {
    const m = g.layer(inside(any(t.parts, (c, x, y) => sdCapsule(x, y, c))), t.color, t.line ? 0 : OUT, at(boxOf(t.parts))); // (line: a thin one, not outlined)
    for (const [[mx, my], color, r] of t.marks) {
      if (r) g.paint(inside((x, y) => Math.hypot(x - mx, y - my) - r), color, m, at([mx - r, my - r, mx + r, my + r]));
      else pixel.dot(mx, my, color);
    }
  };

  soft.forEach(chain);
  const farLegs = legs.filter((L) => L.far);
  const farMask = g.layer(inside(any(farLegs, (L, x, y) => legSd(L, x, y))), fur, OUT, at(join(...farLegs.map((L) => L.box))));
  // the body: its shapes, ears and near legs joined smoothly, one after another. A part too far off to change it is
  // passed over (smin leaves it as it is when the part is at least its smoothing further), and once a point is inside,
  // it stays so (smin only ever takes away)
  const joined = [...body.map((b) => ({ d: (x, y) => sd(b, x, y), box: b.box, near: b.k, k: k * (b.s.smooth ?? 1) })),
    ...ears.map((e) => ({ d: (x, y) => sdTriangle(x, y, e.tri), box: triBox(e.tri), near: 1, k: k * 0.4 })),
    ...legs.filter((L) => !L.far).map((L) => ({ d: (x, y) => legSd(L, x, y), box: L.box, near: L.k, k: k * 0.5 }))];
  const bodyMask = g.layer(inside((x, y) => {
    let d = Infinity;
    for (const j of joined) {
      const b = j.box, dx = b[0] > x ? b[0] - x : x > b[2] ? x - b[2] : 0, dy = b[1] > y ? b[1] - y : y > b[3] ? y - b[3] : 0, far = d + j.k;
      if ((dx * dx + dy * dy) * j.near * j.near >= far * far) continue; // (at most this near: its box's distance, see placed)
      d = smin(d, j.d(x, y), j.k);
      if (d <= 0) return d;
    }
    return d;
  }), fur, OUT);
  for (const m of p.paint || rig.paint || []) { const q = placed(m); g.paint(inside((x, y) => sd(q, x, y)), NAMED[m.color], bodyMask, at(q.box)); }
  const spk = p.spikes || rig.spikes; // spikes or bristles where the region holds, specks inside
  if (spk) { // (as spikes() does, but placed by the box, not the frame's grid: they stay put as frames change size)
    const region = placed(spk), where = (x, y) => sd(region, (x + ox + 0.5) / S, (y + oy + 0.5) / S) <= 0, ticks = [], { w } = g;
    for (let y = 1; y < g.h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (bodyMask[i] || g.px[i] !== OUT || !where(x, y) || (((x + ox + (y + oy) * 2) % 3) + 3) % 3) continue;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (bodyMask[(y + dy) * w + x + dx]) ticks.push([x - dx, y - dy]);
    }
    for (const [x, y] of ticks) if (!g.get(x, y)) g.dot(x, y, OUT);
    if (spk.speck) for (let i = 0; i < bodyMask.length; i++) {
      const x = i % w, y = Math.floor(i / w), X = x + ox, Y = y + oy;
      if (bodyMask[i] && where(x, y) && (((((Y * 26 + X) * 37) % 17) + 17) % 17) % 5 === 0) g.px[i] = NAMED[spk.speck]; // (as in the 26 wide box)
    }
  }
  if (rig.socks) { const socks = legs.map((L) => L.sock); g.paint(inside(any(socks, (c, x, y) => sdCapsule(x, y, c))), NAMED[rig.socks], union(farMask, bodyMask), at(boxOf(socks))); }
  for (const e of ears) if (e.c.tipColor) g.paint(inside((x, y) => Math.max(sdTriangle(x, y, e.tri), Math.hypot(x - e.tip[0], y - e.tip[1]) - (e.c.tipSize || 2))), NAMED[e.c.tipColor], bodyMask, at(triBox(e.tri)));
  const overMask = over.length ? g.layer(inside(any(over, (L, x, y) => sdEllipse(x, y, L.pad))), fur, OUT, at(join(...over.map((L) => ovalBox(L.pad))))) : farMask.map(() => 0);
  for (const t of tops) {
    const m = g.layer(inside(any(t.shapes, (b, x, y) => sd(b, x, y))), t.color, OUT, at(join(...t.shapes.map((b) => b.box))));
    for (const q of t.paint.map(placed)) g.paint(inside((x, y) => sd(q, x, y)), NAMED[q.s.color], m, at(q.box));
  }
  const under = front.length ? g.px.slice() : null;
  front.filter((t) => !t.overEye).forEach(chain);
  // a chain in front that grows out of the body (joined: the elephant's trunk): no outline over the body where it starts
  for (const t of front.filter((t) => t.joined)) {
    const [ax, ay, , , r] = t.parts[0], cx = ax * S - ox, cy = ay * S - oy, R = (r + 2) * S;
    for (let y = Math.max(0, Math.floor(cy - R)); y < Math.min(g.h, cy + R); y++) for (let x = Math.max(0, Math.floor(cx - R)); x < Math.min(g.w, cx + R); x++) {
      const i = y * g.w + x;
      if (bodyMask[i] && g.px[i] === OUT && under[i] !== OUT && Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < R) g.px[i] = under[i];
    }
  }
  for (const [[x, y], c] of dots) pixel.dot(x, y, c);
  if (rig.recolor) { const to = {}; for (const a in rig.recolor) to[NAMED[a]] = NAMED[rig.recolor[a]]; for (let i = 0; i < g.px.length; i++) g.px[i] = to[g.px[i]] ?? g.px[i]; }
  const face = rig.face, eye = toWorld(F.head, face.eye);
  eyes(pixel, pose, eye, blink);
  if (face.nose) { const nose = toWorld(F.head, face.nose); pixel.dot(nose[0], nose[1], NAMED[face.noseColor] || OUT); }
  front.filter((t) => t.overEye).forEach(chain); // (over the eye too: the pig's lop ear)
  // (dx, dy: moved, grown from where its feet touch the ground: see rigFrame. settle: grown, a row short of the ground
  // only by rounding, it is set down on it)
  let mask = union(farMask, bodyMask, overMask), down = 0;
  if (settle && g.h > 1 && oy + dy + g.h === floor && !g.px.subarray((g.h - 1) * g.w).some(Boolean) && g.px.subarray((g.h - 2) * g.w, (g.h - 1) * g.w).some(Boolean)) {
    down = 1;
    const cut = new Grid(g.w, g.h - 1); cut.px.set(g.px.subarray(0, cut.px.length));
    mask = mask.slice(0, cut.px.length); g = cut;
  }
  return sprite(g, mask, { ox: ox + dx, oy: oy + dy + down, head: [(eye[0] - 1) * S + dx, (eye[1] - 6) * S + dy + down] });
}

// for the workshop (tools/workshop.html): an edited rig swapped in (its frames drawn again), and what places its parts
export function setRig(kind, rig) { RIGS[kind] = withMoves(rig); rigFrames.clear(); worked.clear(); hitboxes.clear(); delete ducks[kind]; }
export const rigParts = { posed: (kind, move, frame) => posed(RIGS[kind], move, frame), pose: (kind, move, frame) => poseOf(RIGS[kind], move, frame), move: (kind, name) => RIGS[kind].poses[name], chainRest: (kind, P, name) => chainRest(RIGS[kind], P, name), growth: (kind, pose) => growth(grown(kind, pose)), toWorld, toLocal, sdShape, NAMED };

// the birds that circle a knocked-out head: two frames
const birds = [0, 1].map((f) => {
  const g = new Grid(9, 7);
  g.layer([ellipse(3.5, 4, 2.6, 1.8), ellipse(5.5, 2.8, 1.6, 1.6), f ? capsule(3, 4, 1.5, 5.5, 0.8) : capsule(3, 3.5, 1.5, 1.2, 0.8)], YELLOW, OUT);
  g.dot(8, 3, ORANGE); g.dot(5, 2, OUT);
  return sprite(g, new Uint8Array(g.w * g.h));
});
export const bird = (f) => birds[f];

// ------------------------------------------------------------------------------------------------------- obstacles
// low obstacles (jump them): cacti, rocks, logs; high ones (duck under them): branches, crows at head height.
// A high obstacle's mask ends on row DUCK_UNDER (above the ground): every animal stands taller, ducks lower.
export const DUCK_UNDER = GROUND - 11;

// a cactus, different each time (rnd: () => 0…1): a tall saguaro with arms, or a small barrel, prickly pear or sprout
export function cactus(rnd, big) {
  const type = big ? 'saguaro' : ['barrel', 'pear', 'sprout'][Math.floor(rnd() * 3)];
  const h = type === 'saguaro' ? 16 + Math.floor(rnd() * 5) : 9 + Math.floor(rnd() * 3), w = type === 'saguaro' ? 19 : type === 'sprout' ? 12 : 14;
  const g = new Grid(w, h + 3), base = h + 3, cx = w / 2, parts = []; // each part: [shape, axis x or null, half width, rib]
  let flower = null;
  if (type === 'saguaro') {
    const sides = rnd() < 0.3 ? [rnd() < 0.5 ? -1 : 1] : [-1, 1];
    for (const s of sides) {
      const ay = base - h * (0.4 + rnd() * 0.2), ax = cx + s * 5.4, top = ay - 3.5 - rnd() * 3;
      parts.push([capsule(cx, ay, ax, ay, 1.6), null, 1.6], [capsule(ax, ay, ax, top, 1.7), ax, 1.7]);
    }
    parts.push([capsule(cx, base - h + 2.6, cx, base + 3, 2.6), cx, 2.6, true]);
    if (rnd() < 0.5) flower = [Math.floor(cx), base - h - 1];
  } else if (type === 'barrel') {
    const rx = 4.5 + rnd(), ry = h / 2 + 0.5;
    parts.push([ellipse(cx, base - ry + 1, rx, ry), cx, rx, true]);
    flower = [Math.floor(cx), base - h - 1];
  } else if (type === 'pear') {
    parts.push([ellipse(cx - 2.8, base - h + 3.5, 2.5, 3.2), cx - 2.8, 2.5], [ellipse(cx + 3, base - h + 4.5, 2.4, 3), cx + 3, 2.4],
      [ellipse(cx, base - 4.5, 3.4, 5), cx, 3.4]);
  } else {
    parts.push([capsule(cx + 2.6, base - h + 4, cx + 2.6, base + 2, 1.8), cx + 2.6, 1.8], [capsule(cx - 1.8, base - h + 1.8, cx - 1.8, base + 2, 2.1), cx - 1.8, 2.1, true]);
  }
  const mask = g.layer(parts.map((p) => p[0]), CACTUS, OUT);
  // shading: the left side lit, the right in shadow, a rib down the middle; arms lit on top
  for (const [shape, axis, r, rib] of parts) {
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      if (!shape(x, y)) continue;
      const i = y * g.w + x;
      if (axis === null) { g.px[i] = !shape(x, y - 1) ? CACTUS_LIGHT : !shape(x, y + 1) ? CACTUS_DARK : CACTUS; continue; }
      const d = x + 0.5 - axis;
      g.px[i] = d < -r + 1.1 ? CACTUS_LIGHT : d > r - 1.1 ? CACTUS_DARK : rib && Math.abs(d) < 0.6 ? CACTUS_DARK : CACTUS;
    }
  }
  if (type === 'pear') for (let i = 0; i < mask.length; i++) if (mask[i] && g.px[i] === CACTUS && rnd() < 0.12) g.px[i] = CACTUS_DARK;
  // spines: little ticks out of the outline, now and then
  const outline = g.px.map((c, i) => c === OUT && !mask[i]);
  for (let y = 0; y < g.h - 2; y++) for (let x = 0; x < g.w; x++) {
    if (!outline[y * g.w + x] || rnd() > 0.22) continue;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1]]) {
      if (g.get(x - dx, y - dy) === 0 || !mask[(y - dy) * g.w + x - dx]) continue;
      if (g.get(x + dx, y + dy) === 0) g.dot(x + dx, y + dy, OUT);
    }
  }
  if (type === 'pear') for (const [x, y] of [[cx - 2.8, base - h + 0.3], [cx + 3, base - h + 1.5]]) if (rnd() < 0.7) g.layer([ellipse(x, y, 1.2, 1.2)], BERRY, OUT);
  if (flower) {
    const [fx, fy] = flower;
    for (const [dx, dy, c] of [[0, 0, YELLOW], [-1, 0, PINK], [1, 0, PINK], [0, -1, PINK], [-1, 1, PINK], [1, 1, PINK]]) g.dot(fx + dx, fy + dy, c);
  }
  return sprite(g, mask);
}

// a rock, in a land's colours (see ROCKS): grey, the desert's sandstone, the canyon's red, snowed on
const ROCKS = { grey: [FAINT, LIGHT, INK], sand: [WOOD, BELLY, OUT], red: [STRIPE, GINGER, OUT], snowy: [FAINT, LIGHT, INK] };
export function rock(rnd, look = 'grey') {
  const [fill, light, out] = ROCKS[look], w = 9 + Math.floor(rnd() * 4), g = new Grid(w + 2, 8);
  const mask = g.layer([ellipse(w / 2 + 1, 7, w / 2, 5)], fill, out);
  g.dot(w / 2 - 1, 4, light); g.dot(w / 2, 3, light); g.dot(w / 2 + 1, 3, light);
  if (look === 'snowy') snowOn(g, mask, 2);
  return sprite(g, mask);
}

// a fallen log, its cut end toward the runner (snowy: snowed on)
export function log(rnd, snowy = false) {
  const w = 14 + Math.floor(rnd() * 6), g = new Grid(w + 2, 9);
  const mask = g.layer([capsule(3.5, 5, w - 3, 5, 3.4)], BARK, OUT);
  for (let x = 4; x < w - 5; x += 3 + Math.floor(rnd() * 2)) g.dot(x, 3 + Math.floor(rnd() * 4), BROWN);
  g.layer([ellipse(3.5, 5, 2.4, 3.4)], WOOD, OUT);
  g.dot(3, 4, BARK); g.dot(3, 5, BARK);
  if (snowy) snowOn(g, mask, 2);
  return sprite(g, mask);
}

// snow on top of something: the top `rows` rows of each column of the mask, white (a little less now and then)
function snowOn(g, mask, rows) {
  for (let x = 0; x < g.w; x++) {
    let y = 0;
    while (y < g.h && !mask[y * g.w + x]) y++;
    for (let k = 0, n = rows - (x % 3 === 2 ? 1 : 0); k < n && y + k < g.h; k++) if (mask[(y + k) * g.w + x]) g.px[(y + k) * g.w + x] = BELLY;
  }
}

// the meadow's: a round bush, berries on it now and then; a sunflower, tall on its stem, its face to the runner
export function bush(rnd) {
  const w = 12 + Math.floor(rnd() * 3), h = 8 + Math.floor(rnd() * 3), g = new Grid(w + 2, h + 3), b = g.h - 1, cx = g.w / 2;
  const mask = g.layer([ellipse(cx - w * 0.22, b - h * 0.42, w * 0.3, h * 0.42), ellipse(cx + w * 0.22, b - h * 0.4, w * 0.3, h * 0.42),
    ellipse(cx, b - h * 0.58, w * 0.3, h * 0.45), capsule(cx - w * 0.3, b - 1.5, cx + w * 0.3, b - 1.5, 2)], LEAF, OUT);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const i = y * g.w + x;
    if (!mask[i]) continue;
    if (!mask[i - g.w]) g.px[i] = x < cx ? CACTUS_LIGHT : LEAF; // (lit from the top left)
    else if (y === b || (x + 0.5 > cx + 1 && (x * 5 + y * 3) % 7 === 0)) g.px[i] = LEAF_DARK;
  }
  if (rnd() < 0.5) for (let k = 0; k < 3; k++) g.dot(cx - 4 + k * 3 + Math.floor(rnd() * 2), b - h * 0.5 + rnd() * 3, BERRY);
  return sprite(g, mask);
}
export function sunflower(rnd) {
  const h = 16 + Math.floor(rnd() * 4), g = new Grid(13, h + 2), b = g.h - 1, cx = 6.5, top = b - h + 4.8;
  const stem = g.layer([capsule(cx, top, cx, b + 1, 0.9), ellipse(cx - 2.6, b - h * 0.45, 2.4, 1.1), ellipse(cx + 2.6, b - h * 0.28, 2.4, 1.1)], LEAF, OUT);
  const head = g.layer([ellipse(cx, top, 4.3, 4.3)], YELLOW, OUT);
  for (let a = 0; a < 8; a++) g.dot(cx - 0.5 + Math.cos(a * 0.785 + 0.4) * 3.6, top - 0.5 + Math.sin(a * 0.785 + 0.4) * 3.6, ORANGE); // (petals' tips)
  g.layer([ellipse(cx - 0.5, top, 2.1, 2.1)], BROWN);
  g.dot(cx - 2, top - 2, BARK);
  return sprite(g, union(stem, head));
}

// the forest's: a toadstool (red, spotted); a young pine (snowy: snowed on); a tree stump, its rings on top
export function toadstool(rnd) {
  const w = 11 + Math.floor(rnd() * 3), h = 9 + Math.floor(rnd() * 3), g = new Grid(w + 2, h + 2), b = g.h - 1, cx = g.w / 2, capY = b - h + 4.6;
  const stem = g.layer([capsule(cx, capY, cx, b + 1, 2.2)], BELLY, OUT);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (stem[y * g.w + x] && x + 0.5 > cx + 1) g.px[y * g.w + x] = FAINT;
  const cap = g.layer([ellipse(cx, capY, w / 2, 3.8)], BERRY, OUT, [0, 0, g.w, Math.ceil(capY + 0.6)]);
  for (const [dx, dy] of [[-2.5, -1.5], [1, -2.6], [3, -0.6], [-0.5, 0]]) if (rnd() < 0.8) g.dot(cx + dx, capY + dy, BELLY);
  return sprite(g, union(stem, cap));
}
export function pine(rnd, snowy = false) {
  const h = 16 + Math.floor(rnd() * 4), g = new Grid(15, h + 2), b = g.h - 1, cx = g.w / 2, top = b - h + 0.8, step = (h - 4) / 3.2;
  const trunk = g.layer([capsule(cx, b - 4, cx, b + 1, 1.3)], BARK, OUT);
  const crown = g.layer([0, 1, 2].map((k) => { const y0 = top + k * step, y1 = y0 + (h - 4) / 2.2, half = 3 + k * 1.7; return triangle(cx, y0, cx - half, y1, cx + half, y1); }), LEAF_DARK, OUT);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const i = y * g.w + x;
    if (crown[i] && !crown[i - 1] && x + 0.5 < cx) g.px[i] = LEAF; // (its left edges lit)
  }
  if (snowy) { // snow on each tier's shoulders
    for (let y = 1; y < g.h; y++) for (let x = 0; x < g.w; x++) { const i = y * g.w + x; if (crown[i] && !crown[i - g.w] && rnd() < 0.85) g.px[i] = BELLY; }
  }
  return sprite(g, union(trunk, crown));
}
export function stump(rnd) {
  const w = 11 + Math.floor(rnd() * 3), h = 8 + Math.floor(rnd() * 3), g = new Grid(w + 4, h + 2), b = g.h - 1, cx = g.w / 2, topY = b - h + 2.6;
  const body = g.layer([(x, y) => Math.abs(x + 0.5 - cx) <= w / 2 - 0.5 && y + 0.5 >= topY, ellipse(cx, b + 0.5, w / 2 + 1.2, 1.6)], BARK, OUT);
  for (let x = Math.round(cx - w / 2 + 2); x < cx + w / 2 - 1; x += 3) for (let y = Math.ceil(topY + 2); y < b; y++) if ((x + y) % 4) g.dot(x, y, BROWN);
  const top = g.layer([ellipse(cx, topY, w / 2 - 0.5, 1.7)], WOOD, OUT);
  g.dot(cx - 0.5, topY - 0.5, BROWN); g.dot(cx + 1.5, topY - 0.5, TAN); g.dot(cx - 2.5, topY - 0.5, TAN);
  return sprite(g, union(body, top));
}

// the mountains': a big rock with a smaller one on top (and a pebble)
export function boulders(rnd) {
  const g = new Grid(20, 19), b = g.h - 1, cx = 10, off = (rnd() - 0.5) * 4;
  const shapes = [ellipse(cx, b - 3.6, 8.6, 5.6), ellipse(cx + off, b - 10.6, 5.2, 4.6)];
  if (rnd() < 0.6) shapes.push(ellipse(cx + (off > 0 ? -6 : 6), b - 1.5, 2.6, 2));
  const mask = g.layer(shapes, FAINT, INK);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const i = y * g.w + x; if (mask[i] && !mask[i + 1] && !mask[i + g.w + 1] && y < b) g.px[i] = COLOR.DIM; } // (shadowed on the right)
  for (const [x, y] of [[cx - 4, b - 7], [cx - 3, b - 8], [cx + off - 2, b - 13], [cx + off - 1, b - 14]]) g.dot(x, y, LIGHT);
  g.dot(cx + 3, b - 4, INK); g.dot(cx + 4, b - 3, INK); // (a crack)
  return sprite(g, mask);
}

// the canyon's: a spire of red rock, banded; a tumbleweed (rolling in from the desert too)
export function spire(rnd) {
  const h = 16 + Math.floor(rnd() * 4), g = new Grid(14, h + 2), b = g.h - 1, cx = 7, o = rnd() * 6;
  const mask = g.layer([(x, y) => { const t = (b + 1 - (y + 0.5)) / h; return t <= 1 && Math.abs(x + 0.5 - cx) <= 5 - 2.4 * t + Math.sin(y * 1.3 + o) * 0.5; }], STRIPE, OUT);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const i = y * g.w + x;
    if (!mask[i]) continue;
    if (!mask[i + 1]) g.px[i] = BROWN; // (its right side in shadow)
    else if ((y + Math.floor(o)) % 4 === 0 || !mask[i - g.w]) g.px[i] = GINGER; // (bands, and the top)
  }
  return sprite(g, mask);
}
export function tumbleweed(rnd) {
  const r = 4.5 + rnd(), n = Math.ceil(2 * r) + 2, g = new Grid(n, n), b = g.h - 1, cx = n / 2, cy = b + 1 - r;
  const mask = g.layer([ellipse(cx, cy, r, r)], TAN);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const i = y * g.w + x, d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (!mask[i]) continue;
    g.px[i] = d > r - 1 ? (rnd() < 0.75 ? BROWN : TAN) : rnd() < 0.4 ? TAN : rnd() < 0.35 ? BROWN : 0; // (twigs, the light through them)
  }
  return sprite(g, mask);
}

// the snow's: a snowman (a hat now and then, a carrot nose turned to the runner, stick arms); a block of ice, snowed on
export function snowman(rnd) {
  const hat = rnd() < 0.5, g = new Grid(15, hat ? 20 : 19), b = g.h - 1, cx = 7.5, balls = [[b - 3.6, 4.6], [b - 10.2, 3.4], [b - 15, 2.6]];
  g.layer([capsule(cx - 3, balls[1][0], cx - 6.5, balls[1][0] - 3, 0.5), capsule(cx + 3, balls[1][0], cx + 6.5, balls[1][0] - 2.5, 0.5)], BARK);
  const mask = g.layer(balls.map(([y, r]) => ellipse(cx, y, r, r)), BELLY, OUT);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const i = y * g.w + x, [by, r] = balls.find(([cy, cr]) => Math.abs(y + 0.5 - cy) <= cr) || balls[0];
    if (mask[i] && x + 0.5 - cx + (y + 0.5 - by) > r * 0.95) g.px[i] = FISH; // (shaded blue, lower right)
  }
  const [hy] = balls[2];
  g.dot(cx - 2, hy - 1, INK); g.dot(cx, hy - 1, INK); g.dot(cx - 3, hy, ORANGE); g.dot(cx - 4, hy, ORANGE);
  g.dot(cx - 0.5, balls[1][0] - 1, INK); g.dot(cx - 0.5, balls[1][0] + 1, INK);
  if (hat) { const m = g.layer([(x, y) => (y + 0.5 >= hy - 5 && y + 0.5 <= hy - 2.2 && Math.abs(x + 0.5 - cx) <= 2) || (Math.abs(y + 0.5 - (hy - 2.2)) < 0.6 && Math.abs(x + 0.5 - cx) <= 3.4)], INK); for (let i = 0; i < m.length; i++) mask[i] |= m[i]; }
  return sprite(g, mask);
}
export function ice(rnd) {
  const w = 10 + Math.floor(rnd() * 3), h = 8 + Math.floor(rnd() * 3), g = new Grid(w + 2, h + 2), b = g.h - 1;
  const mask = g.layer([(x, y) => x >= 1 && x <= w && y >= b - h + 1], FISH, OUT);
  for (let k = 0; k < 3; k++) g.dot(3 + k, b - 3 - k, BELLY); // (a glint)
  g.dot(w - 1, b - 1, BELLY);
  snowOn(g, mask, 2);
  return sprite(g, mask);
}

// a leafy branch hanging from the trees above, down to DUCK_UNDER: its leaves in a land's colours (LEAVES: leaf, shade,
// berries?, the stem's colour, spines?): the desert's a cactus hanging down, green and spiny
const LEAVES = { green: [LEAF, LEAF_DARK, true], cactus: [CACTUS, CACTUS_DARK, false, CACTUS_DARK, true], needles: [LEAF_DARK, CACTUS_DARK, false], autumn: [GINGER, STRIPE, true], snowy: [BELLY, FAINT, false] };
export const TRUNK = 160; // (a branch's trunk goes on this far above the world's top: up into the sky a tall screen adds)
export function branch(rnd, [leaf, dark, berries, wood = BARK, spiny = false] = LEAVES.green) {
  const T = TRUNK, g = new Grid(26, T + DUCK_UNDER + 1), b = g.h - 1, x0 = 6 + rnd() * 6;
  const stem = [capsule(x0, 0, x0, T - 2, 1.5), capsule(x0, T - 2, x0 + 3, b - 12, 1.5), capsule(x0 + 3, b - 12, 13, b - 5, 1.2)];
  const leaves = [ellipse(13, b - 3.2, 6.5, 3.6), ellipse(7.5, b - 5, 4.2, 3.2), ellipse(19, b - 5.5, 4.2, 3.2), ellipse(12.5, b - 7.5, 4.5, 3),
    ...Array.from({ length: 4 }, (_, i) => ellipse(x0 + 0.8 * i + (i % 2 ? 4 : -3), T + 6 + i * ((b - T - 20) / 4), 2.6, 1.6))];
  const mask = union(g.layer(stem, wood, OUT), g.layer(leaves, leaf, OUT));
  for (let y = 1; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const i = y * g.w + x;
    if (g.px[i] === leaf && (!mask[i + g.w] || y === g.h - 1 || (x * 7 + y * 3) % 11 === 0)) g.px[i] = dark;
  }
  for (let k = 0; k < 3; k++) if (rnd() < 0.5 && berries) g.layer([ellipse(7 + k * 5 + rnd() * 2, b - 2 + rnd() * 1.5, 1.2, 1.2)], BERRY, OUT);
  if (spiny) { // spines: little ticks out of the outline, now and then, sideways and up (none below: it ends on DUCK_UNDER)
    for (let i = g.w; i < g.px.length; i++) if (g.px[i] === leaf && !mask[i - g.w]) g.px[i] = CACTUS_LIGHT; // (lit from above)
    const outline = g.px.map((c, i) => c === OUT && !mask[i]);
    for (let y = T - 10; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      if (!outline[y * g.w + x] || rnd() > 0.3) continue;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1]]) if (mask[(y - dy) * g.w + x - dx] && g.get(x + dx, y + dy) === 0) g.dot(x + dx, y + dy, OUT);
    }
    g.dot(13, b - 9, PINK); g.dot(12, b - 9, YELLOW); g.dot(14, b - 9, PINK); g.dot(13, b - 10, PINK); // (a flower on top)
  }
  return sprite(g, mask, { oy: -T });
}

// a crow flying left; frame 0 wings up, 1 down
const crows = [0, 1].map((f) => {
  const g = new Grid(17, 11);
  const mask = g.layer([ellipse(9, 6.5, 5, 2.4), ellipse(3.8, 5.3, 2.2, 2), capsule(13, 6.5, 16, 5.5, 1.1), capsule(1.5, 5.6, 0.2, 6, 0.6),
    f ? capsule(9, 7, 11, 9.3, 1.4) : capsule(9, 6, 11, 1, 1.4)], INK);
  g.dot(3, 4, LIGHT);
  return sprite(g, mask);
});
export const crow = (f) => crows[f];
// the lowest row of a crow's mask, in either frame
export const CROW_BOTTOM = Math.max(...crows.map((c) => Math.max(...[...c.mask.keys()].filter((i) => c.mask[i]).map((i) => Math.floor(i / c.w)))));

// The lands a run goes through, a day each (then round again), each with obstacles of its own: what is jumped (big:
// tall; small: low, in packs at speed; other: the rest, now and then) and the leaves on the branches ducked under
const pick = (rnd, ...makes) => makes[Math.floor(rnd() * makes.length)](rnd);
export const LANDS = [
  { name: 'THE MEADOW', big: sunflower, small: bush, other: (r) => pick(r, rock, log), leaves: LEAVES.green },
  { name: 'THE DESERT', big: (r) => cactus(r, true), small: (r) => cactus(r, false), other: (r) => pick(r, (q) => rock(q, 'sand'), tumbleweed), leaves: LEAVES.cactus },
  { name: 'THE FOREST', big: pine, small: toadstool, other: (r) => pick(r, stump, log), leaves: LEAVES.needles },
  { name: 'THE MOUNTAINS', big: boulders, small: rock, other: (r) => pick(r, (q) => rock(q, 'snowy'), log), leaves: LEAVES.green },
  { name: 'THE CANYON', big: spire, small: (r) => pick(r, tumbleweed, (q) => rock(q, 'red')), other: (r) => rock(r, 'sand'), leaves: LEAVES.autumn },
  { name: 'THE SNOW', big: (r) => pick(r, snowman, (q) => pine(q, true)), small: ice, other: (r) => pick(r, (q) => rock(q, 'snowy'), (q) => log(q, true)), leaves: LEAVES.snowy },
];

// each animal's face, for the high scores: its whole head as it runs (the ears too), cut out of the animal drawn smaller
// (FACE_S: from its shapes, outlined as ever); FACE_W × FACE_H, its eye at EYE_AT (FACE_AT moves one's cut by [dx, dy]),
// cut round (no body behind it) and outlined where it is cut
export const FACE_W = 10;
const FACE_H = 9;
const FACE_S = 0.6, EYE_AT = [5, 5], FACE_AT = {}, faces = {};
export function face(kind) {
  if (faces[kind] || !ANIMALS[kind]) return faces[kind];
  const s = rigFrame(kind, 'run', 0, false, null, FACE_S, 0), [dx, dy] = FACE_AT[kind] || [0, 0]; // (s.head: the eye, less [1, 6], drawn bigger by FACE_S)
  const x0 = Math.round(s.head[0] + FACE_S - (s.ox || 0)) - EYE_AT[0] + dx, y0 = Math.round(s.head[1] + 6 * FACE_S - (s.oy || 0)) - EYE_AT[1] + dy;
  const g = new Grid(FACE_W, FACE_H), round = ellipse(FACE_W / 2, FACE_H / 2, FACE_W / 2 + 0.3, FACE_H / 2 + 0.3);
  const src = (x, y) => (x0 + x >= 0 && y0 + y >= 0 && x0 + x < s.w && y0 + y < s.h ? s.px[(y0 + y) * s.w + x0 + x] : 0); // (the animal, in the face's place)
  for (let y = 0; y < FACE_H; y++) for (let x = 0; x < FACE_W; x++) {
    const v = round(x, y) ? src(x, y) : 0, cut = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([u, w]) => !round(x + u, y + w) && src(x + u, y + w));
    g.px[y * FACE_W + x] = v && cut ? OUT : v; // (outlined where the round cut goes through it)
  }
  return (faces[kind] = sprite(g, new Uint8Array(FACE_W * FACE_H)));
}

// ------------------------------------------------------------------------------------------------------------- food
function bone() {
  const g = new Grid(12, 7);
  g.layer([capsule(3, 3.5, 9, 3.5, 1.2), ellipse(2.2, 2.4, 1.6, 1.6), ellipse(2.2, 4.6, 1.6, 1.6), ellipse(9.8, 2.4, 1.6, 1.6), ellipse(9.8, 4.6, 1.6, 1.6)], BELLY, OUT);
  return sprite(g, new Uint8Array(g.w * g.h));
}
function fish() {
  const g = new Grid(12, 8);
  g.layer([ellipse(6.5, 4, 3.8, 2.4), triangle(0.5, 1.2, 0.5, 6.8, 3.4, 4)], FISH, OUT);
  g.dot(8, 3, OUT); g.dot(6, 4, LIGHT); g.dot(4, 3, LIGHT);
  return sprite(g, new Uint8Array(g.w * g.h));
}
function carrot() {
  const g = new Grid(9, 12);
  g.layer([capsule(4.5, 3.5, 2.6, 0.8, 0.6), capsule(4.5, 3.5, 4.5, 0.4, 0.6), capsule(4.5, 3.5, 6.4, 0.9, 0.6)], LEAF);
  const m = g.layer([ellipse(4.5, 4.8, 2.4, 1.5), triangle(2.1, 4.8, 6.9, 4.8, 4.6, 11.2)], ORANGE, OUT);
  g.paint([capsule(3.5, 6.5, 4.4, 6.5, 0.4), capsule(4.6, 8.5, 5.2, 8.5, 0.4)], STRIPE, m); // its rings
  g.dot(3, 5, LIGHT);
  return sprite(g, new Uint8Array(g.w * g.h));
}
// grapes, for the fox (the sour ones of the fable, within reach now)
function grapes() {
  const g = new Grid(10, 11);
  g.layer([capsule(5, 0.5, 5.5, 2.5, 0.6)], LEAF);
  for (const [x, y] of [[2.5, 4], [5, 3.8], [7.5, 4], [3.8, 6.3], [6.2, 6.3], [5, 8.6]]) { g.layer([ellipse(x, y, 1.5, 1.5)], GRAPE, OUT); g.dot(x - 1, y - 1, LIGHT); }
  return sprite(g, new Uint8Array(g.w * g.h));
}
// the later animals' food: an apple, an acorn, a shell, a beetle, a sausage, a mushroom
const food = (w, h, draw) => { const g = new Grid(w, h); draw(g); return sprite(g, new Uint8Array(w * h)); };
const apple = food(8, 9, (g) => {
  g.layer([capsule(4, 0.6, 4.2, 2.2, 0.5)], BARK); g.layer([ellipse(5.8, 1.3, 1.3, 0.7)], LEAF);
  g.layer([ellipse(4, 5.4, 3, 3)], BERRY, OUT); g.dot(3, 4, LIGHT);
});
// (no food is yellow or golden: that is the golden food's, for a super power)
const acorn = food(8, 9, (g) => {
  g.layer([ellipse(4, 5.8, 2.4, 2.6)], STRIPE, OUT); g.layer([ellipse(4, 3.3, 3.2, 1.7)], BARK, OUT); g.dot(4, 0, BARK); g.dot(3, 5, LIGHT);
});
const shell = food(10, 8, (g) => {
  const m = g.layer([ellipse(5, 4.4, 4.2, 3.4), ellipse(5, 7, 1.6, 0.9)], BELLY, OUT);
  g.paint([capsule(5, 7, 2, 2, 0.4), capsule(5, 7, 5, 1.5, 0.4), capsule(5, 7, 8, 2, 0.4)], PINK, m);
});
const beetle = food(9, 7, (g) => {
  for (const [x1, y1, x2, y2] of [[2, 4, 0.5, 6], [4.5, 4.5, 4.5, 6.5], [7, 4, 8.5, 6], [3, 2, 1.5, 0.5], [6, 2, 7.5, 0.5]]) g.layer([capsule(x1, y1, x2, y2, 0.4)], OUT);
  g.layer([ellipse(4.5, 3.5, 3, 2.3)], LEAF_DARK, OUT); g.dot(4, 2, LIGHT); g.dot(4, 3, OUT); g.dot(4, 4, OUT);
});
const sausage = food(12, 7, (g) => {
  g.layer([capsule(2.5, 4, 9.5, 3, 1.8)], FOX, OUT); g.dot(4, 2, LIGHT); g.dot(5, 2, LIGHT); g.dot(0, 5, OUT); g.dot(11, 2, OUT);
});
const mushroom = food(9, 9, (g) => {
  g.layer([capsule(4.5, 5, 4.5, 7.6, 1.2)], BELLY, OUT);
  const m = g.layer([(x, y) => y < 4.5 && ellipse(4.5, 4.4, 4, 3.6)(x, y)], BERRY, OUT);
  g.paint([ellipse(3, 2.5, 0.7, 0.7), ellipse(6, 2, 0.7, 0.7), ellipse(5, 3.6, 0.5, 0.5)], BELLY, m);
});
const berries = food(10, 8, (g) => {
  g.layer([ellipse(6.8, 1.3, 1.5, 0.8)], LEAF);
  for (const [x, y] of [[3, 3.5], [6, 3.6], [4.5, 5.8], [7.6, 6]]) { g.layer([ellipse(x, y, 1.6, 1.6)], FISH, OUT); g.dot(x - 1, y - 1, LIGHT); }
});
const leaf = food(10, 7, (g) => {
  const m = g.layer([ellipse(5.5, 3.5, 4.2, 2.4)], LEAF, OUT); g.paint([capsule(1.5, 3.5, 9, 3.5, 0.45)], LEAF_DARK, m); g.layer([capsule(0, 4.5, 1.5, 3.5, 0.4)], LEAF_DARK);
});
const drumstick = food(11, 8, (g) => {
  g.layer([capsule(1.5, 6, 4, 4, 0.7), ellipse(1.2, 6.8, 1, 1)], BELLY, OUT);
  g.layer([ellipse(6.8, 3.5, 3.6, 2.8)], FOX, OUT); g.dot(6, 2, LIGHT);
});
// the dino's: a big roasted leg, its bone sticking out with a knobbed end (the biggest food, for the biggest animal)
const roast = food(16, 12, (g) => {
  g.layer([capsule(3.2, 9.2, 8, 5.5, 0.8), ellipse(2.4, 8.2, 1.2, 1.2), ellipse(4, 10.3, 1.2, 1.2)], BELLY, OUT);
  g.layer([ellipse(10.5, 4.6, 4.6, 3.6)], BROWN, OUT); g.layer([ellipse(10.2, 3.5, 2.6, 1.5)], TAN); g.dot(9, 2, LIGHT);
});
// the elephant's: a peanut in its shell, pinched in the middle, its pits in a darker brown
const peanut = food(11, 7, (g) => {
  const m = g.layer([ellipse(3.2, 3.6, 2.6, 2.4), ellipse(7.6, 3.4, 2.7, 2.5), capsule(3.5, 3.6, 7.3, 3.4, 1.7)], TAN, OUT);
  g.paint([ellipse(2.6, 3, 0.5, 0.5), ellipse(4, 4.6, 0.5, 0.5), ellipse(7, 2.6, 0.5, 0.5), ellipse(8.4, 4.2, 0.5, 0.5), ellipse(6.2, 4.4, 0.5, 0.5)], BROWN, m);
  g.dot(7, 1, LIGHT);
});
// the newer animals': a cucumber (the guinea pig's), a truffle (the pig's), a bundle of hay (the yak's), a slice of melon
// (the ostrich's), a date (the dromedary's), a fig (the gorilla's)
const cucumber = food(12, 6, (g) => {
  const m = g.layer([capsule(2.4, 3.2, 9.6, 2.6, 2)], LEAF_DARK, OUT);
  g.paint([capsule(3, 2.2, 8, 1.8, 0.4)], LEAF, m); g.dot(4, 4, CACTUS_LIGHT); g.dot(7, 3, CACTUS_LIGHT); g.dot(10, 2, LEAF);
});
// (a truffle: a dark knobbly lump, dug up)
const truffle = food(9, 8, (g) => {
  const m = g.layer([ellipse(4.5, 4.4, 3.4, 2.9), ellipse(3, 2.8, 1.6, 1.4), ellipse(6.4, 3.2, 1.5, 1.3)], BARK, OUT);
  g.paint([ellipse(3.4, 4.6, 0.6, 0.6), ellipse(5.8, 5.4, 0.6, 0.6), ellipse(5, 3.2, 0.5, 0.5)], BROWN, m); g.dot(3, 2, TAN);
});
const hay = food(11, 9, (g) => {
  const m = g.layer([capsule(2.5, 1.6, 2.5, 7.2, 1.4), capsule(5.5, 1.2, 5.5, 7.6, 1.4), capsule(8.5, 1.6, 8.5, 7.2, 1.4)], WOOD, OUT);
  g.paint([capsule(1, 4.4, 10, 4.4, 0.6)], STRIPE, m); g.dot(4, 2, LIGHT);
});
const melon = food(12, 8, (g) => { // (flat side up, the rind below)
  const m = g.layer([(x, y) => y >= 1 && ellipse(6, 1, 5.4, 6)(x, y)], LEAF_DARK, OUT);
  g.paint([ellipse(6, 1, 4.6, 5)], LEAF, m); g.paint([ellipse(6, 1, 4.2, 4.4)], BERRY, m);
  g.dot(4, 2, OUT); g.dot(8, 2, OUT); g.dot(6, 3, OUT);
});
const date = food(9, 7, (g) => {
  g.layer([ellipse(4.5, 3.6, 3.6, 2.3)], BROWN, OUT); g.dot(3, 2, STRIPE); g.dot(4, 2, STRIPE); g.dot(8, 2, BARK);
});
const fig = food(9, 9, (g) => {
  g.layer([capsule(4.5, 0.6, 4.5, 2, 0.5)], LEAF_DARK);
  g.layer([ellipse(4.5, 5.6, 3.2, 3), capsule(4.5, 5, 4.5, 2.4, 1.2)], GRAPE, OUT); g.dot(3, 4, LIGHT); g.dot(4, 7, PINK);
});
export const FOOD = { carrot: carrot(), bone: bone(), fish: fish(), grapes: grapes(), apple, acorn, shell, beetle, sausage, mushroom, berries, drumstick, leaf, peanut, roast,
  cucumber, truffle, hay, melon, date, fig };

// ---------------------------------------------------------------------------------------------------------- the sky
// the far hills: how high they are at u (art pixels along them)
export const hill = (u) => 7 + 4 * Math.sin(u * 0.021) + 3 * Math.sin(u * 0.057 + 1.3);

export const cloud = fromRows([
  '......ffff......',
  '...fff....ff....',
  '.ff.........fff.',
  'f..............f',
  'ffffffffffffffff',
], { f: FAINT });

export const moon = fromRows([
  '..mmm.',
  '.mm...',
  'mm....',
  'mm....',
  'mm....',
  '.mm...',
  '..mmm.',
], { m: INK });

// the golden look of a super power (golden food, the animal flashing): every color but the outlines turned to gold
const golds = {};
export function golden(pal) {
  return (golds[pal.bg] ||= { ...Object.fromEntries(Object.entries(pal).map(([k, hex]) => {
    if (k === 'bg' || +k === OUT || +k === INK) return [k, hex];
    const l = luma(hex) / 255;
    return [k, l > 0.8 ? '#fff4b8' : l > 0.5 ? '#ffd23f' : '#e3a21a'];
  })), bg: `${pal.bg} gold` });
}

export const star = fromRows([
  '..y..',
  '.yyy.',
  'yyyyy',
  '.yyy.',
  '.y.y.',
], { y: YELLOW });

export const heart = fromRows([
  'rr.rr',
  'rrrrr',
  'rrrrr',
  '.rrr.',
  '..r..',
], { r: BERRY });

// ------------------------------------------------------------------------------------------------- a 3×5 pixel font
const GLYPHS = {
  A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57755',
  N: '65555', O: '25552', P: '65644', Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557', V: '55552', W: '55775', X: '55255', Y: '55222', Z: '71247',
  0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71222', 8: '75757', 9: '75716',
  ' ': '00000', '.': '00002', ':': '02020', '!': '22202', '-': '00700', '/': '11244', '+': '02720', '<': '12421', '>': '42124', '?': '61202',
};
export const textWidth = (s) => s.length * 4 - 1;
// text at (x, y), its top left; align 'center' or 'right' moves x
export function text(ctx, s, x, y, color, align = 'left', size = 1, glyphs = GLYPHS) { // (size: each pixel of the font that many; glyphs: some of its letters drawn otherwise)
  s = String(s).toUpperCase();
  if (align === 'center') x -= (textWidth(s) * size) / 2;
  if (align === 'right') x -= textWidth(s) * size;
  x = Math.round(x);
  ctx.fillStyle = color;
  ctx.beginPath(); // (every pixel of it in one path: one fill)
  for (let i = 0; i < s.length; i++) {
    const gl = glyphs[s[i]] || GLYPHS[s[i]] || GLYPHS[' '];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (+gl[r] & (4 >> c)) ctx.rect(x + (i * 4 + c) * size, y + r * size, size, size);
  }
  ctx.fill();
}

// do two sprites overlap, pixel for pixel (by their masks)?
export function hits(a, ax, ay, b, bx, by) {
  ax = Math.round(ax + (a.ox || 0)); ay = Math.round(ay + (a.oy || 0)); bx = Math.round(bx + (b.ox || 0)); by = Math.round(by + (b.oy || 0));
  const x0 = Math.max(ax, bx), x1 = Math.min(ax + a.w, bx + b.w), y0 = Math.max(ay, by), y1 = Math.min(ay + a.h, by + b.h);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (a.mask[(y - ay) * a.w + x - ax] && b.mask[(y - by) * b.w + x - bx]) return true;
  return false;
}
