// Pixel art for Lop Hop. Sprites are small grids of palette indices, filled from shapes (ellipses, capsules,
// triangles) and outlined, so ears and tails can swing to any angle. Each sprite comes with a collision mask (ears and
// tails are soft: they never count). Some animals are rigs instead (animals/*.js; see the rigs below).
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
import sabre from './animals/sabre.js';
import dino from './animals/dino.js';

export const W = 300, H = 90, GROUND = 78; // the world in art pixels; GROUND: the y of the ground line

// palette indices
const OUT = 1, FUR = 2, EAR = 3, PINK = 4, INK = 5, BERRY = 6, ORANGE = 7, LEAF = 8, FAINT = 9, LIGHT = 10, FOX = 11, BELLY = 12,
  TAN = 14, BROWN = 15, GINGER = 16, STRIPE = 17, CACTUS = 18, CACTUS_DARK = 19, CACTUS_LIGHT = 20, YELLOW = 21, BARK = 22,
  WOOD = 23, FISH = 24, LEAF_DARK = 25, GRAPE = 27, WOLF = 28, BOAR = 29, SNOUT = 30, WOLF_DARK = 31, SKUNK = 32, CHEETAH = 33, RHINO = 34, RHINO_DARK = 35, DINO = 36, DINO_LIGHT = 37;
export const COLOR = { INK, DIM: 13, BERRY, YELLOW, ENERGY: 26, LEAF, FAINT, WHITE: BELLY, ICE: FISH };

export const PALETTES = {
  day: { bg: '#f7f6f0', 1: '#3a3a3a', 2: '#fdfbf6', 3: '#e3d2c2', 4: '#f19bb2', 5: '#535353', 6: '#d6455f', 7: '#ec6f2b', 8: '#62b04f', 9: '#dedbd0',
    10: '#f7f6f0', 11: '#d9682b', 12: '#fdfbf6', 13: '#9a9a94', 14: '#dfa45e', 15: '#8a5a3b', 16: '#f2a65a', 17: '#c46f34', 18: '#6eae4c',
    19: '#3e7a39', 20: '#a6d46c', 21: '#ffcf3a', 22: '#7a5236', 23: '#e2bd86', 24: '#7aa5cf', 25: '#3f8a3a', 26: '#5dbb4c', 27: '#7d4f9e', 28: '#8e919c', 29: '#5e4c40', 30: '#c9a395', 31: '#5a5c66', 32: '#585866', 33: '#e2b25a', 34: '#9a968f', 35: '#77736d', 36: '#8f9090', 37: '#cfcfcc' },
  night: { bg: '#1d2033', 1: '#141625', 2: '#f4f1ea', 3: '#d3c3b3', 4: '#e88aa3', 5: '#c3c6d8', 6: '#e8607e', 7: '#ee8a2a', 8: '#4f9a48', 9: '#2e3350',
    10: '#1d2033', 11: '#d9682b', 12: '#f4f1ea', 13: '#6a7090', 14: '#cf975a', 15: '#7a5038', 16: '#e69a52', 17: '#b06232', 18: '#4f9446',
    19: '#2f6232', 20: '#86bd5e', 21: '#ffd24a', 22: '#6b4a33', 23: '#cfa974', 24: '#6f98c4', 25: '#2f6e35', 26: '#5dbb4c', 27: '#a274c4', 28: '#a3a6b3', 29: '#6e5a4c', 30: '#c39a8c', 31: '#6a6c78', 32: '#6c6c7a', 33: '#d4a650', 34: '#8e8a84', 35: '#6c6862', 36: '#9a9cac', 37: '#c9cad6' },
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
  // fill the shapes with a color; outline: the pixels around them (4-neighbours) in that color. → the filled mask
  layer(shapes, color, outline = 0) {
    const { w, h, px } = this, m = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (shapes.some((s) => s(x, y))) { m[y * w + x] = 1; px[y * w + x] = color; }
    if (outline) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!m[i] && ((x > 0 && m[i - 1]) || (x < w - 1 && m[i + 1]) || (y > 0 && m[i - w]) || (y < h - 1 && m[i + w]))) px[i] = outline;
      }
    }
    return m;
  }
  // color the shapes, only where `within` (a mask) is set
  paint(shapes, color, within) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (within[y * this.w + x] && shapes.some((s) => s(x, y))) this.px[y * this.w + x] = color;
  }
  dot(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c; }
  get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y * this.w + x] : 0; }
}
const union = (...masks) => masks.reduce((a, m) => a.map((v, i) => v | m[i]));

// the screen pixels per art pixel: things move in screen pixels (smoothly), while the art keeps its big pixels
let S = 1;
export const setScale = (s) => { S = s; };
export const snap = (v) => Math.round(v * S) / S; // (to the nearest screen pixel)

// a sprite: { w, h, px (palette indices), mask, draw(ctx, x, y, palette) }; drawn into a canvas per palette, on first use.
// ox, oy (in extra): where its grid starts from where it is placed (a rig's frame, bigger than the box: see the rigs)
function sprite(g, mask, extra) {
  const canvases = {}, ox = extra?.ox || 0, oy = extra?.oy || 0;
  return {
    w: g.w, h: g.h, px: g.px, mask, ...extra,
    draw(ctx, x, y, pal, scale = 1) { // (scale: whole pixels made bigger, for the giant dino)
      let c = canvases[pal.bg];
      if (!c) {
        c = canvases[pal.bg] = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(g.w, g.h) : Object.assign(document.createElement('canvas'), { width: g.w, height: g.h }); // (Safari before 16.4: none)
        const cx = c.getContext('2d'), img = cx.createImageData(g.w, g.h);
        for (let i = 0; i < g.px.length; i++) {
          const k = g.px[i];
          if (!k) continue;
          const hex = pal[k];
          img.data.set([parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255], i * 4);
        }
        cx.putImageData(img, 0, 0);
      }
      x += ox * scale; y += oy * scale;
      if (scale === 1) ctx.drawImage(c, snap(x), snap(y), g.w, g.h);
      else ctx.drawImage(c, snap(x), snap(y), Math.round(g.w * scale), Math.round(g.h * scale));
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
// Every animal faces right in a 26×20 grid, its feet on row FOOT. Poses: run (frames 0-3, see stride), jump (0 rising,
// 1 falling), duck (0/1), idle (0/1: the tail wags), hurt, ko (and the hedgehog's ball, 0-3). soft: the angle of the
// ear or the tail in radians, swung by a spring in the game: 0 hangs down, more swings it back and up.
export const FOOT = 19;
// In the order they are unlocked: each is chased by the next, and reaching night with one unlocks
// the next (the dino, last, is chased by the rabbit). The rabbit is the easy start; each after it is clearly harder than the
// one before, the dino the hardest, and
// its score counts more (mult). The dials, as factors: speed (start and top speed), jump (its speed off the ground),
// gravity, drain (energy), meals (how often food comes), bump (what a bump costs), early (crows and branches come that
// many points sooner), packs (obstacles in groups), tight (the gaps between obstacles).
const tune = (mult, speed, jump, gravity, drain, meals, bump, early, packs, tight) => ({ mult, speed, jump, gravity, drain, meals, bump, early, packs, tight });
export const ANIMALS = {
  rabbit: { name: 'RABBIT', food: 'carrot', ...tune(1.0, 1.0, 1.08, 1, 1, 1, 1, 0, 1, 1) },
  cat: { name: 'CAT', food: 'fish', ...tune(1.21, 1.04, 1, 1, 1.07, 0.97, 1.04, 0, 1.1, 0.98) },
  dog: { name: 'DOG', food: 'bone', ...tune(1.43, 1.07, 1, 1.05, 1.14, 0.94, 1.09, 50, 1.3, 0.97) },
  fox: { name: 'FOX', food: 'grapes', ...tune(1.64, 1.11, 1, 1.05, 1.21, 0.91, 1.13, 100, 1.4, 0.95) },
  hedgehog: { name: 'HEDGEHOG', food: 'apple', ...tune(1.86, 1.14, 0.92, 1.05, 1.29, 0.89, 1.17, 100, 1.5, 0.93) }, // short jumps
  squirrel: { name: 'SQUIRREL', food: 'acorn', ...tune(2.07, 1.18, 1, 0.85, 1.36, 0.86, 1.21, 100, 1.6, 0.91) }, // floaty, hungry
  otter: { name: 'OTTER', food: 'shell', ...tune(2.29, 1.21, 0.97, 1.1, 1.43, 0.83, 1.26, 150, 1.8, 0.9) }, // crows from the start
  skunk: { name: 'SKUNK', food: 'beetle', ...tune(2.5, 1.25, 1.05, 1.1, 1.5, 0.8, 1.3, 200, 1.9, 0.88) },
  wolf: { name: 'WOLF', food: 'sausage', ...tune(2.71, 1.29, 1, 1.15, 1.57, 0.77, 1.34, 200, 2.0, 0.86) },
  boar: { name: 'BOAR', food: 'mushroom', ...tune(2.93, 1.32, 0.95, 1.2, 1.64, 0.74, 1.39, 250, 2.2, 0.85) }, // heavy, low jumps
  bear: { name: 'BEAR', food: 'berries', ...tune(3.14, 1.36, 0.95, 1.2, 1.71, 0.71, 1.43, 250, 2.3, 0.83) },
  cheetah: { name: 'CHEETAH', food: 'drumstick', ...tune(3.36, 1.39, 1.08, 1.1, 1.79, 0.69, 1.47, 300, 2.4, 0.81) },
  rhino: { name: 'RHINO', food: 'leaf', ...tune(3.57, 1.43, 0.95, 1.15, 1.86, 0.66, 1.51, 300, 2.5, 0.79) },
  sabre: { name: 'SABRE-TOOTH', food: 'ham', ...tune(3.79, 1.46, 1, 1.2, 1.93, 0.63, 1.56, 300, 2.7, 0.78) },
  dino: { name: 'DINO', food: 'roast', ...tune(4.0, 1.5, 1, 1.25, 2.0, 0.6, 1.6, 300, 2.8, 0.76) }, // the hardest
};

// where a run is in its stride (phase 0…1) → { frame, lift }: the rabbit hops (crouched on the ground, stretched out
// as it rises, gathered as it falls), the others gallop
export function stride(kind, phase, move = 'run') {
  const g = rigged(kind) && RIGS[kind].poses[move]?.gait;
  if (g) return { frame: Math.floor(phase * g.frames) % g.frames, lift: g.leap ? leapLift(g, phase) : 0 }; // (a gallop: its body bobs itself; a leap: up it goes)
  if (move === 'duck') return { frame: Math.floor(phase * 4) % 2, lift: 0 }; // shuffling
  if (kind === 'rabbit') {
    if (phase < 0.3) return { frame: 0, lift: 0 };
    const q = (phase - 0.3) / 0.7;
    return { frame: q < 0.5 ? 1 : 2, lift: Math.round(Math.sin(Math.PI * q) * 4) };
  }
  const frame = Math.floor(phase * 4) % 4;
  return { frame, lift: frame === 0 ? 1 : 0 };
}

// how fast a run's strides go, for an animal (1: the usual; less: longer strides, as a rig's gait says)
export const strideRate = (kind) => (rigged(kind) && RIGS[kind].poses.run?.gait?.rate) || 1;

// sitting (on the title), t seconds in → its frame: a rig's own loop (breathing, looking about), or two frames
export function idleFrame(kind, t) {
  const m = rigged(kind) && RIGS[kind].poses.idle;
  return m?.at ? Math.floor(t * m.fps) % m.frames : Math.floor(t * 5) % 2;
}

const animals = new Map();
// body: a rig's moving parts (its chains), as moveBody left them; none: at rest
export function animal(kind, pose, frame = 0, soft = 0.4, blink = false, wiggle = 0, body = null, scale = 1) {
  if (rigged(kind) && pose !== 'ball') return rigFrame(kind, pose, frame, blink, body, scale); // (scale: drawn bigger, see drawRig) // (the hedgehog's ball: still drawn)
  const a = Math.round(clamp(soft, -0.4, 2.6) * 8) / 8, key = `${kind}${pose}${frame}${a}${blink}${wiggle}`;
  if (!animals.has(key)) {
    const g = new Grid(26, 20), { mask, head } = DRAW[kind](g, pose, frame, a, blink, wiggle);
    animals.set(key, sprite(g, mask, { head }));
  }
  return animals.get(key);
}

function eyes(g, pose, [x, y], blink) {
  if (pose === 'ko') for (const [dx, dy] of [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]) g.dot(x + dx, y + dy, OUT);
  else if (pose === 'hurt') { g.dot(x - 1, y - 1, OUT); g.dot(x, y, OUT); g.dot(x - 1, y + 1, OUT); } // >
  else { g.dot(x, y + 1, OUT); if (!blink) g.dot(x, y, OUT); }
}
// a tail on the spring: soft is about 0.45 while running; less (taking off) and the tail lags, drooping; more (falling)
// and it floats up. → how far to swing it, for a tail's angle (more: back and down)
const lag = (soft) => clamp(0.45 - soft, -0.9, 0.6);
// a lop ear hanging from (x, y) at angle a: length L, spoon-shaped (wider at the tip)
const lopEar = (x, y, a, L, r, tip) => {
  const dx = -Math.sin(a), dy = Math.cos(a);
  return [capsule(x, y, x + dx * L * 0.75, y + dy * L * 0.75, r), ellipse(x + dx * L * 0.8, y + dy * L * 0.8, tip, tip)];
};
// legs from hip/shoulder to feet: [[x1, y1, x2, y2], …]
const legs = (list, r) => list.map(([x1, y1, x2, y2]) => capsule(x1, y1, x2, y2, r));

const DRAW = {
  // the rabbit: round and compact, one lop ear, a cotton tail that wiggles (wiggle: 1 flicks it up a pixel)
  rabbit(g, pose, f, ear, blink, wiggle) {
    const crouch = pose === 'idle' || pose === 'hurt' || (pose === 'run' && f === 0);
    const stretch = (pose === 'run' && f === 1) || (pose === 'jump' && f === 0);
    let body, tail, earAt, eye, nose;
    if (crouch) {
      tail = [2.5, 12.5, 2];
      body = [ellipse(9.5, 13.5, 7, 5), ellipse(7.5, 15, 5, 4), ellipse(15.5, 9, 4.5, 4.5), ellipse(19, 10.8, 2.5, 2.2),
        ellipse(8.5, 18.4, 4.5, 1.4), capsule(14.5, 14, 15, 18.3, 1.2)];
      earAt = [13.5, 6]; eye = [17, 8]; nose = [20, 10];
    } else if (stretch) {
      tail = [2, 10.5, 2];
      body = [capsule(6.5, 12.5, 12, 10.5, 4.3), ellipse(16.5, 7.5, 4.5, 4.3), ellipse(20, 9.3, 2.5, 2.2),
        capsule(5, 14.5, 1.5, 17.5, 1.5), capsule(15, 12, 19, 15, 1.1)];
      earAt = [14.5, 4.5]; eye = [18, 6.5]; nose = [21, 8.5];
    } else if (pose === 'run' || pose === 'jump') { // gathered
      tail = [2.5, 11, 2];
      body = [ellipse(10, 12.5, 7, 5), ellipse(16, 8, 4.5, 4.3), ellipse(19.5, 9.8, 2.5, 2.2),
        capsule(8, 16, 12.5, 17.5, 1.5), capsule(15, 12.5, 16.5, 17.3, 1.1)];
      earAt = [14, 5]; eye = [17.5, 7]; nose = [21, 9];
    } else if (pose === 'duck') {
      tail = [1.8, 15, 1.8];
      body = [ellipse(10, 16, 8.5, 3.3), ellipse(18, 15.5, 4, 3.4), ellipse(21.3, 16.6, 2, 1.7),
        ellipse(f ? 6 : 8.5, 18.8, 3.5, 1.1), capsule(17, 18, f ? 20.5 : 19.5, 18.8, 1)];
      earAt = [16, 13]; eye = [19, 14.5]; nose = [22, 16];
    } else { // ko: on its back, feet up
      tail = [2.5, 16, 1.8];
      body = [ellipse(11, 16.5, 8, 3.2), ellipse(19, 15.8, 4.2, 3.4), ellipse(22.3, 17, 2, 1.6),
        capsule(8, 14, 6, 10.5, 1.3), capsule(13.5, 14, 14.5, 11, 1.1)];
      earAt = [17, 13.5]; eye = [20, 15.5]; nose = [23, 17];
    }
    g.layer([ellipse(tail[0] - 0.3, tail[1] - wiggle, tail[2] + 0.3, tail[2] + 0.3)], FUR, OUT); // soft, like the ear
    const mask = g.layer(body, FUR, OUT);
    g.layer(lopEar(earAt[0], earAt[1], ear, 7, 1.4, 2.1), EAR, OUT);
    eyes(g, pose, eye, blink);
    g.dot(nose[0], nose[1], PINK);
    if (pose !== 'ko') g.dot(eye[0] + 1, eye[1] + 3, PINK); // a blush
    return { mask, head: [earAt[0] + 1, earAt[1] - 3] };
  },

  // the dog: a beagle puppy, a floppy ear, a wagging tail
  dog(g, pose, f, ear, blink) {
    let body, far = [], near, tail, earAt, eye, nose, tongue = false, head, muzzle, saddle;
    if (pose === 'duck' || pose === 'ko') {
      const ko = pose === 'ko';
      head = ellipse(19.5, ko ? 15.5 : 14.8, 4.2, ko ? 3.6 : 3.8); muzzle = ellipse(23, ko ? 16.8 : 16.3, 2.5, 1.8);
      body = [ellipse(10.5, 16, 8, 3.2), head, muzzle];
      saddle = ellipse(10, 13.5, 6.5, 2.5);
      near = ko ? legs([[7, 14, 6, 10.5], [13.5, 14, 13, 10.5]], 1.2) : [ellipse(f ? 21 : 20, 18.9, 2.6, 1), ellipse(f ? 5 : 7, 18.9, 3, 1)];
      far = ko ? legs([[9.5, 14, 10, 10.5], [15.5, 14, 16.5, 10.5]], 1.2) : [];
      tail = [3, 15, 1.45];
      earAt = [18, ko ? 12.5 : 11.5]; eye = [21, ko ? 14.5 : 13.5]; nose = [25, ko ? 16 : 15.5]; tongue = ko;
    } else if (pose === 'idle') { // sitting
      head = ellipse(17, 6.5, 4.4, 4.2); muzzle = ellipse(20.5, 8.3, 2.6, 2);
      body = [ellipse(9, 14.5, 5.5, 4.5), ellipse(13.5, 12, 3.8, 5), head, muzzle, ellipse(9.5, 18.6, 3.5, 1.2)];
      saddle = ellipse(8, 12, 5, 3);
      near = legs([[13.5, 14, 13.5, 18.4]], 1.2); far = legs([[15.5, 14, 15.8, 18.4]], 1.2);
      tail = [4, 16.5, f ? 1.0 : 1.6];
      earAt = [15.5, 3]; eye = [18.5, 5]; nose = [22.5, 7.5];
    } else { // run, jump, hurt
      const k = pose === 'jump' ? (f ? 2 : 0) : pose === 'hurt' ? 1 : f;
      head = ellipse(19.5, 7, 4.4, 4.2); muzzle = ellipse(23, 8.8, 2.6, 2);
      body = [ellipse(10.5, 11.5, 7, 4.2), ellipse(15, 11.5, 3.8, 4.4), head, muzzle];
      saddle = ellipse(9.5, 8.5, 6.5, 3.2);
      const feet = [ // hind near, hind far, front near, front far
        [[3, 17.5], [4.5, 18.2], [19.5, 16.8], [18, 17.8]],
        [[7.5, 18.4], [9, 18.4], [14.5, 18.4], [16.5, 18.4]],
        [[10.5, 17.8], [9, 18.2], [12.5, 17.5], [14, 18]],
        [[6, 18.4], [7.5, 18.4], [16.5, 18.4], [15, 18.4]],
      ][k];
      near = legs([[7, 13.5, ...feet[0]], [15.5, 13.5, ...feet[2]]], 1.2);
      far = legs([[8, 13.5, ...feet[1]], [16, 13.5, ...feet[3]]], 1.1);
      tail = [4, 9.5, 0.75 + (pose === 'run' ? [0.18, 0, -0.18, 0][k] : 0) + 0.6 * lag(ear)]; // swinging with the stride, on the spring
      earAt = [18, 3.5]; eye = [21, 5.5]; nose = [25, 8]; tongue = pose === 'run';
    }
    const [tx, ty, ta] = tail, tdx = -Math.sin(ta), tdy = -Math.cos(ta);
    g.layer([capsule(tx, ty, tx + tdx * 5, ty + tdy * 5, 1.1)], TAN, OUT);
    g.dot(tx + tdx * 5.5, ty + tdy * 5.5, FUR);
    const farMask = g.layer(far, FUR, OUT);
    const bodyMask = g.layer([...body, ...near], FUR, OUT);
    g.paint([saddle, head], TAN, bodyMask);
    g.paint([muzzle], FUR, bodyMask);
    if (tongue) g.layer([ellipse(nose[0] - 2.5, nose[1] + 3.3, 1, 1.2)], PINK, OUT);
    g.layer(lopEar(earAt[0], earAt[1], ear, 5.5, 1.6, 2.2), BROWN, OUT);
    eyes(g, pose, eye, blink);
    g.dot(nose[0], nose[1], OUT);
    return { mask: union(farMask, bodyMask), head: [earAt[0] + 1, earAt[1] - 3] };
  },

  // the cat: a ginger kitten, pointed ears, the tail up
  cat(g, pose, f, tailA, blink) {
    let body, far = [], near, tailAt, eye, nose, ears, muzzle, chest, stripes;
    if (pose === 'duck' || pose === 'ko') {
      const ko = pose === 'ko', hy = ko ? 15.6 : 15.3;
      muzzle = ellipse(22.2, hy + 1.3, 1.9, 1.4);
      body = [ellipse(10.5, 16.3, 8, 2.9), ellipse(19.5, hy, 3.8, 3.3), muzzle];
      ears = [triangle(16.5, hy - 2.3, 15.3, hy - 5, 18.5, hy - 3), triangle(19.8, hy - 3, 21, hy - 5.2, 22, hy - 2.6)];
      near = ko ? legs([[7, 14.5, 6, 11], [13.5, 14.5, 13, 11]], 1) : [ellipse(f ? 21.5 : 20.5, 18.9, 2.3, 1), ellipse(f ? 5 : 7, 18.9, 2.6, 1)];
      far = ko ? legs([[9.5, 14.5, 10, 11], [15.5, 14.5, 16.5, 11]], 1) : [];
      chest = ellipse(16, 18, 2, 1.5);
      stripes = [7, 10, 13].map((x) => capsule(x, 13, x - 0.5, 15, 0.6));
      tailAt = [3.5, 16, 1.55];
      eye = [20.5, hy - 1]; nose = [23, hy + 0.5];
    } else if (pose === 'idle') { // sitting
      muzzle = ellipse(17.3, 9, 2, 1.6);
      body = [ellipse(9.5, 14, 5.5, 5), ellipse(13, 13, 3, 4.5), ellipse(14.5, 7.5, 4, 3.7), muzzle, ellipse(10, 18.6, 3.5, 1.2)];
      ears = [triangle(11.3, 5.5, 11.8, 0.8, 14.5, 4.2), triangle(15, 4, 17, 0.6, 18, 5.6)];
      near = legs([[13, 15, 13, 18.5]], 1); far = legs([[15, 15, 15.2, 18.5]], 1);
      chest = ellipse(14, 12, 2, 2.5);
      stripes = [5.5, 8.5].map((x) => capsule(x, 10, x - 0.5, 12.5, 0.6));
      tailAt = [4.5, 17, 1.25 + (f ? 0.2 : 0)];
      eye = [15.5, 7]; nose = [18.5, 8.5];
    } else { // run, jump, hurt
      const k = pose === 'jump' ? (f ? 2 : 0) : pose === 'hurt' ? 1 : f;
      muzzle = ellipse(22.3, 10, 2, 1.6);
      body = [ellipse(10.5, 12, 7, 3.8), ellipse(19.5, 8.5, 4, 3.7), muzzle];
      ears = [triangle(16.4, 6.2, 17, 1.6, 19.5, 5), triangle(20, 4.8, 22, 1.4, 23, 6.6)];
      const feet = [
        [[3, 17.3], [4.5, 18], [19.5, 16.5], [18, 17.6]],
        [[7, 18.4], [8.5, 18.4], [14.5, 18.4], [16.5, 18.4]],
        [[10.5, 17.6], [9, 18], [12.5, 17.3], [14, 17.8]],
        [[5.5, 18.4], [7, 18.4], [16.5, 18.4], [15, 18.4]],
      ][k];
      near = legs([[6.5, 13.5, ...feet[0]], [15, 13.5, ...feet[2]]], 1);
      far = legs([[7.5, 13.5, ...feet[1]], [15.5, 13.5, ...feet[3]]], 0.9);
      chest = ellipse(16, 13, 2.5, 2.2);
      stripes = [6.5, 9.5, 12.5].map((x) => capsule(x, 8, x - 0.5, 10.3, 0.6));
      tailAt = [4, 10.5, 0.6 + 0.8 * lag(tailA)];
      eye = [20.5, 7.5]; nose = [23, 9.5];
    }
    // the tail: up and back from the rump, its tip curling forward
    const [tx, ty, ta] = tailAt, d1 = [-Math.sin(ta), -Math.cos(ta)], d2 = [-Math.sin(ta - 0.9), -Math.cos(ta - 0.9)];
    const mx = tx + d1[0] * 4.5, my = ty + d1[1] * 4.5;
    g.layer([capsule(tx, ty, mx, my, 1.1), capsule(mx, my, mx + d2[0] * 3.5, my + d2[1] * 3.5, 1.1)], GINGER, OUT);
    const farMask = g.layer(far, GINGER, OUT);
    const bodyMask = g.layer([...body, ...ears, ...near], GINGER, OUT);
    g.paint(stripes, STRIPE, bodyMask);
    g.paint([muzzle, chest], BELLY, bodyMask);
    eyes(g, pose, eye, blink);
    g.dot(nose[0], nose[1], PINK);
    return { mask: union(farMask, bodyMask), head: [eye[0] - 1, eye[1] - 6] };
  },

  // the fox: slim, a long snout, ears with dark tips, dark socks, a bushy tail with a white tip (on the spring)
  fox(g, pose, f, tailA, blink) {
    let body, far = [], near, tail, eye, nose, ears, tipsAbove = -1, white, socks;
    if (pose === 'duck' || pose === 'ko') {
      const ko = pose === 'ko', hy = ko ? 15.6 : 15.3;
      body = [ellipse(11.5, 16.3, 7.5, 2.9), ellipse(19.5, hy, 3.4, 3.1), capsule(21, hy + 1, 24.6, hy + 1.6, 1.2)];
      ears = [triangle(16.8, hy - 1.9, 15.3, hy - 4.4, 18.6, hy - 2.7), triangle(19.5, hy - 2.9, 20.3, hy - 4.8, 21.6, hy - 2.7)];
      near = ko ? legs([[8, 14.5, 7, 11], [14.5, 14.5, 14, 11]], 0.9) : [ellipse(f ? 22 : 21, 18.9, 2.3, 1), ellipse(f ? 6 : 8, 18.9, 2.6, 1)];
      far = ko ? legs([[10.5, 14.5, 11, 11], [16.5, 14.5, 17.5, 11]], 0.9) : [];
      white = [ellipse(13, 18.3, 5, 1), ellipse(22.5, hy + 2, 2, 0.9)];
      socks = ko ? (x, y) => y < 12.5 : (x, y) => y >= 18;
      tail = [5.5, 15.5, 1.5];
      eye = [20.5, hy - 1]; nose = [25, hy + 1];
    } else if (pose === 'idle') { // sitting, the tail around its feet
      body = [ellipse(10.5, 14, 5, 4.6), ellipse(14, 12.5, 2.8, 4.2), ellipse(16, 7.5, 3.5, 3.2), capsule(17, 9, 20.8, 9.6, 1.3), ellipse(11, 18.6, 3.2, 1.1)];
      ears = [triangle(13.6, 5.3, 14.1, 0.8, 16.2, 4.3), triangle(16.4, 4.3, 18, 0.6, 18.8, 5.4)];
      near = legs([[14, 15, 14, 18.5]], 0.9); far = legs([[16, 15, 16.2, 18.5]], 0.9);
      white = [ellipse(14.5, 12.5, 1.8, 3), ellipse(18.5, 10.2, 2.2, 0.9)];
      socks = (x, y) => y >= 17;
      tipsAbove = 2.6;
      tail = [6, 17, 1.5 + (f ? 0.12 : 0)];
      eye = [16.5, 7]; nose = [21, 9];
    } else { // run, jump, hurt
      const k = pose === 'jump' ? (f ? 2 : 0) : pose === 'hurt' ? 1 : f;
      body = [ellipse(12, 11.8, 6.5, 3.5), ellipse(16.5, 12, 2.6, 3), ellipse(19.8, 8.6, 3.5, 3.2), capsule(21, 10, 24.6, 10.6, 1.3)];
      ears = [triangle(17.4, 6.3, 17.9, 1.6, 20, 5.2), triangle(20.2, 5.3, 21.8, 1.5, 22.6, 6.4)];
      const feet = [
        [[4.5, 17.3], [6, 18], [21, 16.5], [19.5, 17.6]],
        [[8.5, 18.4], [10, 18.4], [16, 18.4], [18, 18.4]],
        [[12, 17.6], [10.5, 18], [14, 17.3], [15.5, 17.8]],
        [[7, 18.4], [8.5, 18.4], [18, 18.4], [16.5, 18.4]],
      ][k];
      near = legs([[8.5, 13.5, ...feet[0]], [16, 13.5, ...feet[2]]], 0.9);
      far = legs([[9.5, 13.5, ...feet[1]], [16.5, 13.5, ...feet[3]]], 0.8);
      white = [ellipse(13, 14.6, 5, 1.1), ellipse(17.6, 13, 1.8, 2), ellipse(22.6, 11.1, 2.2, 0.9)];
      socks = (x, y) => y >= 16.5;
      tipsAbove = 3.4;
      tail = [6, 10.5, 0.75 + 0.7 * lag(tailA)];
      eye = [20.5, 7.5]; nose = [25, 10];
    }
    // the tail: bushy, from the rump back and up, its tip white
    const [tx, ty, ta] = tail, dx = -Math.sin(ta), dy = -Math.cos(ta), L = 5.5;
    g.layer([capsule(tx, ty, tx + dx * L * 0.5, ty + dy * L * 0.5, 1.6), capsule(tx + dx * L * 0.5, ty + dy * L * 0.5, tx + dx * L, ty + dy * L, 2.1)], FOX, OUT);
    g.paint([ellipse(tx + dx * (L + 0.8), ty + dy * (L + 0.8), 1.8, 1.8)], BELLY, g.px.map((c) => +(c === FOX)));
    const farMask = g.layer(far, FOX, OUT);
    const bodyMask = g.layer([...body, ...ears, ...near], FOX, OUT);
    g.paint(white, BELLY, bodyMask);
    g.paint([...near, ...far].map((l) => (x, y) => socks(x, y) && l(x, y)), BROWN, union(farMask, bodyMask));
    if (tipsAbove > 0) g.paint(ears.map((e) => (x, y) => y < tipsAbove && e(x, y)), BROWN, bodyMask);
    eyes(g, pose, eye, blink);
    g.dot(nose[0], nose[1], OUT);
    return { mask: union(farMask, bodyMask), head: [eye[0] - 1, eye[1] - 6] };
  },
};

// ------------------------------------------------------------------------------------------------- more four-legged
// The helpers the later animals share: legs for a gallop frame, spikes and bristles, and drawing the parts in order.

// legs for gallop frame k (0-3), from hip and shoulder: [near, far]
function gallop(k, [hx, hy], [sx, sy], r) {
  const F = [
    [[-3.5, -1.1], [-2, -0.4], [4.5, -1.9], [3, -0.8]],
    [[0.5, 0], [2, 0], [-0.5, 0], [1.5, 0]],
    [[4, -0.8], [2.5, -0.4], [-2.5, -1.1], [-1, -0.6]],
    [[-1, 0], [0.5, 0], [1.5, 0], [0, 0]],
  ][k], at = ([dx, dy], x) => [x + dx, 18.4 + dy];
  return [legs([[hx, hy, ...at(F[0], hx)], [sx, sy, ...at(F[2], sx)]], r), legs([[hx + 1, hy, ...at(F[1], hx)], [sx + 0.5, sy, ...at(F[3], sx)]], r * 0.9)];
}
// legs up (knocked out on its back) from the body's x positions
const legsUp = (xs, r, top = 11) => legs(xs.map((x, i) => [x, 14.5, x + (i % 2 ? 0.5 : -1), top]), r);
// paws in front and behind, for lying low (ducking), shuffling with f
const paws = (f, front, back) => [ellipse(front + (f ? 1 : 0), 18.9, 2.3, 1), ellipse(back + (f ? 0 : 1.5), 18.9, 2.6, 1)];

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

// an animal from its parts, back to front: the tail (soft: no collisions), far legs, the body with near legs and ears,
// paint on the body, things on top (outlined), the eye and the nose
function render(g, pose, blink, p) {
  if (p.tail) g.layer(p.tail, p.tailColor ?? p.fur, OUT);
  const farMask = g.layer(p.far || [], p.fur, OUT);
  const bodyMask = g.layer([...p.body, ...(p.near || [])], p.fur, OUT);
  for (const [shapes, color] of p.paint || []) g.paint(shapes, color, bodyMask);
  p.after?.(bodyMask);
  for (const [shapes, color] of p.over || []) g.layer(shapes, color, OUT);
  p.last?.();
  for (const [x, y, c] of p.dots || []) g.dot(x, y, c);
  eyes(g, pose, p.eye, blink);
  if (p.nose) g.dot(p.nose[0], p.nose[1], OUT);
  return { mask: union(farMask, bodyMask), head: [p.eye[0] - 1, p.eye[1] - 6] };
}
const frameOf = (pose, f) => (pose === 'jump' ? (f ? 2 : 0) : pose === 'run' ? f : 1);
const swing = (x, y, a, L) => [x - Math.sin(a) * L, y - Math.cos(a) * L]; // from (x, y), L long, at angle a from straight up

Object.assign(DRAW, {
  // the hedgehog: a round spiky back, a cream face, a pointed snout; short legs. Its power rolls it into a ball.
  hedgehog(g, pose, f, soft, blink) {
    if (pose === 'ball') {
      const m = g.layer([ellipse(12, 12.5, 6.5, 6.5)], BROWN, OUT);
      spikes(g, m, () => true, f, TAN);
      g.paint([ellipse(13 + [0, 1, 0, -1][f], 13.5 + [0, 0, 1, 0][f], 2.6, 2.2)], EAR, m); // the face, turning with it
      return { mask: m, head: [12, 4] };
    }
    if (pose === 'duck' || pose === 'ko') {
      const ko = pose === 'ko', back = ellipse(11.5, ko ? 16.2 : 15.5, 9, ko ? 3.2 : 4), face = ellipse(19.5, 16, 3, 2.6), snout = capsule(21, 16.8, 24, 17.1, 1);
      return render(g, pose, blink, { fur: BROWN, body: [back, face, snout], near: ko ? legsUp([8, 14], 0.9) : paws(f, 20, 6),
        paint: [[[face, snout, ...(ko ? [ellipse(12, 14, 6, 1.5)] : [])], EAR]], eye: [20.5, 15.5], nose: [24.5, 16.6],
        after: (m) => spikes(g, m, (x, y) => x < 18 && (ko ? y > 15 : y < 16), 0, TAN) });
    }
    const [near, far] = gallop(frameOf(pose, f), [8, 16.5], [15, 16.5], 0.9);
    const back = ellipse(11, 11.3, 8.5, 7.2), face = ellipse(18.5, 13, 3.4, 3), snout = capsule(20, 14.4, 23.6, 14.8, 1.1);
    return render(g, pose, blink, { fur: BROWN, body: [back, face, snout, ellipse(12, 15.5, 6, 2.5)], near, far,
      paint: [[[face, snout, ellipse(12.5, 16.4, 5, 1.3)], EAR]], over: [[[ellipse(17.6, 9.6, 1.1, 1.1)], EAR]], eye: [19.5, 12.4], nose: [24, 14.4],
      after: (m) => spikes(g, m, (x, y) => x < 17 && y < 15, 0, TAN) });
  },

  // the squirrel: red, tufted ears, a big bushy tail curled up over its back (on the spring)
  squirrel(g, pose, f, soft, blink) {
    const bushy = (x, y, a, r1, r2) => { const [mx, my] = swing(x, y, a, 5), [tx, ty] = swing(mx, my, a - 1.3, 4.2); return [capsule(x, y, mx, my, r1), capsule(mx, my, tx, ty, r2)]; };
    if (pose === 'duck' || pose === 'ko') {
      const ko = pose === 'ko', hy = ko ? 15.8 : 15.6, head = ellipse(19, hy, 3, 2.8);
      return render(g, pose, blink, { fur: STRIPE, body: [ellipse(12, 16.4, 7, 2.6), head, ellipse(21.6, hy + 1, 1.5, 1.2), triangle(16.8, hy - 2, 16, hy - 4.4, 18.4, hy - 2.6)],
        near: ko ? legsUp([9, 14], 0.8) : paws(f, 20.5, 7), tail: [capsule(6, 15.5, 1.2, 14, 2.1), ellipse(2, 13.5, 2, 1.8)],
        paint: [[[ellipse(14, 18.2, 4, 1), ellipse(21.4, hy + 1.4, 1.3, 0.8)], BELLY]], eye: [19.6, hy - 0.8], nose: [23, hy + 0.6] });
    }
    const [near, far] = gallop(frameOf(pose, f), [8.5, 15.5], [15, 15], 0.85), head = ellipse(18.5, 9.6, 3.3, 3.1), snout = ellipse(21.3, 10.8, 1.7, 1.4);
    return render(g, pose, blink, { fur: STRIPE, body: [ellipse(11.5, 13, 6, 3.6), ellipse(9, 14.2, 3.8, 3.4), head, snout, triangle(16.6, 7.2, 17, 2.8, 18.6, 6.4)],
      near, far, tail: bushy(6, 12, 0.42 + 0.6 * lag(soft), 2.2, 2.6),
      paint: [[[ellipse(14, 15.2, 4, 1.3), ellipse(21, 11.6, 1.6, 0.8)], BELLY]], eye: [19.5, 8.8], nose: [23, 10.4] });
  },

  // the otter: long and low, dark brown with a light face, small round ears, a thick tail
  otter(g, pose, f, soft, blink) {
    if (pose === 'duck' || pose === 'ko') {
      const ko = pose === 'ko', head = ellipse(20.5, 15.6, 3, 2.8), snout = ellipse(23, 16.4, 1.7, 1.3);
      return render(g, pose, blink, { fur: BROWN, body: [capsule(4.5, 16.6, 17, 16.6, ko ? 2.8 : 2.6), head, snout, ellipse(18.6, 13.2, 1, 0.9)],
        near: ko ? legsUp([7, 14], 1) : paws(f, 21.5, 7), tail: [capsule(4.5, 16.8, 0.5, 17.6, 1.4)],
        paint: [[[snout, ellipse(21.5, 17, 2, 1), ellipse(11, 18.4, 5, 0.9)], EAR]], eye: [21, 15], nose: [24.4, 15.8] });
    }
    const [near, far] = gallop(frameOf(pose, f), [8, 16], [16, 14.5], 1), head = ellipse(20.3, 8.3, 3.4, 3.3), snout = ellipse(23, 9.5, 1.8, 1.5);
    const [tx, ty] = swing(5.5, 14, 1.9 + 0.3 * lag(soft), 2.8), [ex, ey] = swing(tx, ty, 2.05 + 0.5 * lag(soft), 2.2);
    return render(g, pose, blink, { fur: BROWN, body: [capsule(6, 14, 15.5, 11.8, 3.8), capsule(15.5, 11.8, 19, 9, 2.8), head, snout, ellipse(18.3, 5, 1.2, 1.1)],
      near, far, tail: [capsule(5.5, 14, tx, ty, 1.8), capsule(tx, ty, ex, ey, 0.9)],
      paint: [[[snout, ellipse(22, 10.5, 2.5, 1.4), ellipse(12, 15.8, 4.5, 1.2)], EAR]], eye: [21, 7.4], nose: [24.6, 8.9] });
  },

  // the skunk: round and fluffy, black with a white stripe from its head down its back, a big bushy tail (on the spring)
  skunk(g, pose, f, soft, blink) {
    const bushy = (x, y, a) => { const [mx, my] = swing(x, y, a, 4.2), [tx, ty] = swing(mx, my, a - 1, 3.4); return [capsule(x, y, mx, my, 2.3), capsule(mx, my, tx, ty, 2.5)]; };
    if (pose === 'duck' || pose === 'ko') {
      const ko = pose === 'ko', head = ellipse(19.5, 16, 3, 2.6), snout = ellipse(22.2, 16.9, 1.6, 1.2);
      return render(g, pose, blink, { fur: SKUNK, body: [ellipse(11.5, 16, 8, ko ? 3.2 : 3), head, snout, ellipse(18, 13.6, 0.9, 0.9)],
        near: ko ? legsUp([8, 14], 0.9) : paws(f, 20.5, 6.5), tail: [capsule(4.5, 15, 0.8, 13, 2), ellipse(1.5, 12.5, 1.6, 1.6)],
        paint: [[[capsule(19.5, 13.6, 6, ko ? 13.6 : 13.3, 0.9)], BELLY]], eye: [20.2, 15.4], nose: [23.6, 16.6] });
    }
    const [near, far] = gallop(frameOf(pose, f), [8, 15.5], [14.5, 15.5], 0.9), head = ellipse(18.8, 12.6, 3.3, 3), snout = ellipse(21.8, 13.8, 1.8, 1.2);
    const a = 0.48 + 0.35 * lag(soft), tail = bushy(6, 10, a), fur = () => g.px.map((c) => +(c === SKUNK));
    return render(g, pose, blink, { fur: SKUNK, body: [ellipse(10.5, 11.2, 6.5, 7.2)], near, far, tail,
      paint: [[[capsule(16, 6.5, 6.5, 5.6, 0.9)], BELLY]], // the stripe down its back
      after: () => g.paint([ellipse(...swing(...swing(6, 10, a, 4.2), a - 1, 2.9), 1.3, 1.3)], BELLY, fur()), // the tail's white tip
      over: [[[head, snout, ellipse(17.2, 9.8, 1, 1)], SKUNK]],
      last: () => g.paint([capsule(20.6, 11.2, 17.6, 9.8, 0.7)], BELLY, fur()), // and up its forehead
      eye: [19.5, 12], nose: [23.4, 13.6] });
  },

  // the wolf: the fox's build, in grey (dark grey socks and ear tips)
  wolf(g, ...args) {
    const r = DRAW.fox(g, ...args);
    for (let i = 0; i < g.px.length; i++) g.px[i] = g.px[i] === FOX ? WOLF : g.px[i] === BROWN ? WOLF_DARK : g.px[i];
    return r;
  },

  // the boar: dark and stocky, bristles along its back, a pink snout, little white tusks, a thin tail
  boar(g, pose, f, soft, blink) {
    if (pose === 'duck' || pose === 'ko') {
      const ko = pose === 'ko', hy = ko ? 16 : 15.7, head = ellipse(18.8, hy, 3.5, 3), snout = ellipse(22.3, hy + 0.9, 1.7, 1.6);
      return render(g, pose, blink, { fur: BOAR, body: [ellipse(11.5, ko ? 16.5 : 16.2, 8, 3), head, snout, triangle(16, hy - 2.1, 15.5, hy - 4.5, 17.8, hy - 2.7)],
        near: ko ? legsUp([8, 14], 1) : paws(f, 20, 6.5), paint: [[[snout], SNOUT]], dots: [[22.5, hy + 0.9, OUT], [21, hy + 2.5, BELLY]], eye: [19.2, hy - 1],
        after: (m) => spikes(g, m, (x, y) => x < 17 && (ko ? y > 16 : y < 14)) });
    }
    const [near, far] = gallop(frameOf(pose, f), [8, 15.8], [15, 15.5], 1), [tx, ty] = swing(4.4, 10, 1.33 + 0.6 * lag(soft), 3.2);
    const head = ellipse(18.3, 11.2, 3.9, 3.8), snout = ellipse(22.3, 12.6, 1.9, 1.9);
    return render(g, pose, blink, { fur: BOAR, body: [ellipse(11.5, 11.8, 7.3, 4.8), head, snout, triangle(15.4, 8.2, 15.9, 3.4, 18.2, 7.5)],
      near, far, tail: [capsule(4.4, 10, tx, ty, 0.6)], paint: [[[snout], SNOUT]], dots: [[22.6, 12.4, OUT], [21, 14.6, BELLY], [21.8, 13.9, BELLY]], eye: [18.8, 9.9],
      after: (m) => spikes(g, m, (x, y) => x < 17 && y < 10) });
  },

  // the bear: big and brown, round ears, a light snout, a stubby tail
  bear(g, pose, f, soft, blink) {
    if (pose === 'duck' || pose === 'ko') {
      const ko = pose === 'ko', head = ellipse(19.8, 15.4, 3.4, 3), snout = ellipse(22.8, 16.4, 1.8, 1.3);
      return render(g, pose, blink, { fur: BARK, body: [ellipse(11.5, ko ? 16.2 : 15.8, 8.5, ko ? 3 : 3.3), head, snout, ellipse(17.8, 12.6, 1.1, 1.1)],
        near: ko ? legsUp([7.5, 14], 1.4) : paws(f, 20.5, 6.5), tail: [ellipse(2.8, 15, 1.1, 1.1)], paint: [[[snout], WOOD]], eye: [20.4, 14.6], nose: [24.4, 16] });
    }
    const [near, far] = gallop(frameOf(pose, f), [7.5, 14.5], [15, 14.5], 1.5), snout = ellipse(22.4, 10.6, 1.9, 1.5);
    return render(g, pose, blink, { fur: BARK, body: [ellipse(11, 11.5, 7.5, 5), ellipse(12.5, 8.2, 4.5, 3.5), ellipse(19, 9.3, 3.7, 3.5), snout, ellipse(16.8, 5.8, 1.4, 1.4), ellipse(19.8, 5.6, 1.3, 1.3)],
      near, far, tail: [ellipse(3.3, 9.6 + 1.2 * lag(soft), 1.2, 1.2)], paint: [[[snout], WOOD]], eye: [20, 8.4], nose: [24.2, 10.2] });
  },

  // the cheetah: slim and long-legged, golden with black spots, black tear lines from its eyes, a long ringed tail
  cheetah(g, pose, f, soft, blink) {
    const spots = (dy) => [[7, 8.5], [9.5, 8], [12, 8.3], [14.5, 8.8], [8.5, 10.5], [11, 10.6], [13.5, 10.8], [6, 10]].map(([x, y]) => [x, y + dy, OUT]);
    if (pose === 'duck' || pose === 'ko') {
      const ko = pose === 'ko', hy = ko ? 15.8 : 15.6, muzzle = ellipse(22, hy + 1, 1.5, 1.1);
      return render(g, pose, blink, { fur: CHEETAH, body: [ellipse(11.5, 16.5, 8, 2.6), ellipse(19.8, hy, 2.8, 2.5), muzzle, ellipse(18.4, hy - 2.4, 0.9, 0.9)],
        near: ko ? legsUp([8, 14], 0.8) : paws(f, 20.5, 6.5), tail: [capsule(4, 16, 0, 17, 0.8)],
        paint: [[[muzzle, ellipse(12, 18.4, 5, 0.8)], BELLY]], dots: [...spots(6.5), [21, hy + 0.6, OUT], [21, hy + 1.4, OUT]], eye: [20.4, hy - 0.8], nose: [23.4, hy + 0.6] });
    }
    const [near, far] = gallop(frameOf(pose, f), [8, 12.8], [15, 12.8], 0.85), muzzle = ellipse(22.1, 9, 1.4, 1.1);
    const sway = pose === 'run' ? [0.35, 0, -0.35, 0][f] : 0; // the tail swings with the stride, its tip whipping the other way
    const a = 1.1 + 0.45 * lag(soft) + sway, [mx, my] = swing(5.5, 10, a, 4), [tx, ty] = swing(mx, my, a + 0.5 - sway * 1.8, 3.3);
    return render(g, pose, blink, { fur: CHEETAH, body: [ellipse(11.5, 10.8, 6.5, 3), ellipse(15.5, 11.2, 2.6, 2.8), ellipse(19.6, 7.6, 3.3, 3.1), muzzle, ellipse(17.6, 4.8, 1.1, 1.1), ellipse(20.6, 4.4, 1.1, 1.1)],
      near, far, tail: [capsule(5.5, 10, mx, my, 0.8), capsule(mx, my, tx, ty, 0.8)], last: () => { g.dot(mx, my, OUT); g.dot(tx, ty, BELLY); },
      paint: [[[muzzle, ellipse(13, 13.3, 4.5, 0.9)], BELLY]], dots: [...spots(0.3).slice(0, 6), [20.6, 8.6, OUT], [21, 9.3, OUT], [19.6, 9, PINK]], eye: [20.5, 6.6], nose: [23.2, 8.6] });
  },

  // the rhino: big and grey, a great horn on its nose and a small one behind it, skin folds, thick short legs
  rhino(g, pose, f, soft, blink) {
    if (pose === 'duck' || pose === 'ko') {
      const ko = pose === 'ko', head = capsule(17, 15.4, 22.6, 16.6, 2.3);
      return render(g, pose, blink, { fur: RHINO, body: [ellipse(11.5, ko ? 16.3 : 16, 8.5, 3.2), head, triangle(16.2, 14, 16.4, 11.6, 17.8, 13.6)],
        near: ko ? legsUp([7.5, 14], 1.4) : paws(f, 20, 6.5), tail: [capsule(3.2, 15, 1.6, 16.5, 0.5)],
        paint: [[[capsule(10, 13.4, 10, 18.6, 0.5), capsule(15, 13.4, 15, 18.6, 0.5)], RHINO_DARK]],
        over: [[[triangle(21.5, 15, 23, 10.6, 24.2, 15.6), triangle(19.4, 14.4, 20, 12.4, 21, 14.4)], EAR]], eye: [19.4, 15], nose: [24.5, 17] });
    }
    const [near, far] = gallop(frameOf(pose, f), [7.5, 15], [14.5, 15], 1.5), [tx, ty] = swing(3.6, 9.5, 1.45 + 0.6 * lag(soft), 2.5);
    return render(g, pose, blink, { fur: RHINO, body: [ellipse(11, 11.5, 7.5, 5), capsule(16.5, 10, 22, 12.4, 3), triangle(15.4, 7.6, 15.9, 3.6, 17.8, 7.2)],
      near, far, tail: [capsule(3.6, 9.5, tx, ty, 0.5)],
      paint: [[[capsule(9.5, 7, 9.5, 16, 0.5), capsule(14.5, 7.6, 14.5, 15, 0.5)], RHINO_DARK]],
      over: [[[triangle(21.4, 10.4, 23.4, 4.2, 24.4, 11), triangle(19, 9, 19.8, 6.6, 21, 9)], EAR]], eye: [18.6, 10], nose: [24.6, 12.6] });
  },

  // the sabre-tooth cat: a tiger's stripes, a big head, the mouth open, two long white fangs reaching below its chin
  sabre(g, pose, f, soft, blink) {
    const stripes = (dy) => [7, 10, 13].map((x) => capsule(x, 8 + dy, x - 0.6, 10.2 + dy, 0.6));
    if (pose === 'duck' || pose === 'ko') {
      const ko = pose === 'ko', hy = ko ? 15.6 : 15.2, muzzle = ellipse(22.6, hy + 0.6, 2, 1.2);
      return render(g, pose, blink, { fur: TAN, body: [ellipse(11.5, 16.4, 8, 2.6), ellipse(19.5, hy, 3.6, 3.2), muzzle, ellipse(17.4, hy - 2.8, 1, 1)],
        near: ko ? legsUp([8, 14], 1.2) : paws(f, 20.5, 6.5), tail: [capsule(3.4, 15.5, 1.5, 15, 1)],
        paint: [[[muzzle], BELLY], [stripes(6), BROWN]],
        over: [[[capsule(22, hy + 1.6, 22.2, hy + 3.8, 0.6)], BELLY]], eye: [20.4, hy - 1.2], nose: [24.2, hy] });
    }
    const [near, far] = gallop(frameOf(pose, f), [7.5, 13.6], [15.5, 13.6], 1.1), muzzle = ellipse(22.8, 9.4, 2, 1.3), [tx, ty] = swing(3.8, 9.5, 1.15 + 0.6 * lag(soft), 2.1);
    return render(g, pose, blink, { fur: TAN, body: [ellipse(11, 11.2, 7, 3.4), ellipse(15, 10.8, 3, 3.2), ellipse(19.4, 8.6, 3.8, 3.5), muzzle, ellipse(21.4, 12.4, 1.6, 0.9), ellipse(17, 5.2, 1.2, 1.1)],
      near, far, tail: [capsule(3.8, 9.5, tx, ty, 1)],
      paint: [[[muzzle, ellipse(21.4, 12.4, 1.4, 0.7)], BELLY], [stripes(0), BROWN]],
      over: [[[capsule(22.2, 10.4, 22.5, 14.4, 0.6)], BELLY]], dots: [[23, 11, OUT], [24, 11, OUT]], eye: [20.4, 7.6], nose: [24.6, 8.8] });
  },

  // the dino: the blocky runner of Google's game, drawn like the others (filled, outlined, a lighter belly); its shape
  // pixel by pixel, its legs stepping two by two
  dino(g, pose, f, soft, blink) {
    const run = [
      '...............xxxxxx...',
      '..............xxxxxxxx..',
      '..............xxxxxxxx..',
      '..............xxxx......',
      '..............xxxxxx....',
      '.............xxxx.......',
      '....x.......xxxxx.......',
      '....x......xxxxxxxx.....',
      '....xx....xxxxxx.x......',
      '....xxx..xxxxxxx........',
      '....xxxxxxxxxxxx........',
      '.....xxxxxxxxxxx........',
      '......xxxxxxxxx.........',
      '.......xxxxxxxx.........',
      '........xxxxxx..........',
    ];
    const steps = [ // a stride: legs apart, the back leg passing (knee up), legs crossed, the front leg passing; and standing
      ['.........xx..xx.........', '........xx....xx........', '.......xx......xx.......', '.......xxx......xxx.....'],
      ['.........xx..xx.........', '........xx...xx.........', '.............xx.........', '.............xxx........'],
      ['.........xx..xx.........', '..........xxxx..........', '.........xx..xx.........', '........xxx..xxx........'],
      ['.........xx..xx.........', '.........xx...xx........', '.........xx.............', '.........xxx............'],
      ['.........xx..xx.........', '.........xx..xx.........', '.........xx..xx.........', '.........xxx.xxx........'],
    ];
    const duck = [
      '.................xxxxxx..',
      '....x......xxxxxxxxxxxxx.',
      '....xxx..xxxxxxxxxxxxxxx.',
      '....xxxxxxxxxxxxxxxxx....',
      '.....xxxxxxxxxxxxxxxxx...',
      '......xxxx..xx...........',
    ];
    const low = pose === 'duck' || pose === 'ko', k = pose === 'idle' || pose === 'hurt' ? 4 : pose === 'jump' ? (f ? 2 : 0) : frameOf(pose, f);
    const rows = low ? [...duck, ...(f && pose === 'duck' ? ['.......x....xx..........', '.......xx....x..........'] : ['.......xx...x...........', '............xx..........'])] : [...run, ...steps[k]];
    const top = FOOT + 1 - rows.length, shape = (x, y) => rows[y - top]?.[x] === 'x';
    const mask = g.layer([shape], DINO, OUT);
    g.paint([(x, y) => y >= top + (low ? 3 : 9) && y <= top + (low ? 4 : 14) && x >= (low ? 7 : 9) && x <= (low ? 19 : 14)], DINO_LIGHT, mask); // the belly (not the legs)
    const eye = low ? [19, top + 1] : [17, top + 1];
    const teeth = low ? [[21, top + 2], [23, top + 2], [21, top + 4]] : [[19, top + 2], [21, top + 2], [18, top + 4]];
    for (const [x, y] of teeth) g.dot(x, y, BELLY);
    eyes(g, pose, eye, blink);
    return { mask, head: [eye[0] - 1, eye[1] - 5] };
  },
});

// ------------------------------------------------------------------------------------------------------------ rigs
// An animal can be a rig (animals/<kind>.js, see the cat): joints, shapes on them, legs that bend to reach their paws,
// chains (a tail, ears) that the body's motion swings, and a pose for each move and frame. Its shapes are distances (how
// far a point lies outside them), so they join smoothly. Each frame is drawn into a grid just big enough for it, with its
// offset (ox, oy) from the 26×20 box the game places every animal by: a tail can reach out of the box. With ?old in the
// address, the animals are drawn as they were (DRAW), to compare.
const RIGS = { rabbit, cat, dog, fox, hedgehog, squirrel, otter, skunk, wolf, boar, bear, cheetah, rhino, sabre, dino };
const LEGACY = typeof location !== 'undefined' && /[?&]old\b/.test(location.search);
export const rigged = (kind) => !LEGACY && !!RIGS[kind];
const NAMED = { OUT, FUR, EAR, PINK, INK, BERRY, ORANGE, LEAF, FAINT, LIGHT, FOX, BELLY, TAN, BROWN, GINGER, STRIPE, YELLOW, BARK, WOOD,
  FISH, LEAF_DARK, GRAPE, WOLF, BOAR, SNOUT, WOLF_DARK, SKUNK, CHEETAH, RHINO, RHINO_DARK, DINO, DINO_LIGHT };

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
function posed(rig, name, frame) {
  const p = poseOf(rig, name, frame);
  const J = { ...rig.joints, ...p.joints }, a = Math.atan2(J.chest[1] - J.hip[1], J.chest[0] - J.hip[0]);
  const F = { spine: jointFrame(J.hip, a, p.flip), hip: jointFrame(J.hip, a, p.flip), chest: jointFrame(J.chest, a, p.flip), head: jointFrame(J.head, p.headAngle || 0) };
  return { p, J, F, a, torso: { ...rig.torso, ...p.torso } };
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
  if (!rigged(kind)) return;
  const rig = RIGS[kind], P = posed(rig, pose, frame), was = body.at || [x, y];
  if (body.kind !== kind || dt > 0.2 || Math.hypot(x - was[0], y - was[1]) > 40) { body.kind = kind; body.chains = {}; } // (a new start)
  for (const name in rig.chains) {
    const c = chainRest(rig, P, name);
    let pts = body.chains[name];
    if (!pts || pts.length !== c.links + 1) pts = body.chains[name] = restPoints(c).map((q) => ({ p: plus(q, [x, y]), v: [0, 0] }));
    const from = pts[0].p, to = plus(c.root, [x, y]), n = Math.ceil(dt * 120);
    for (let i = 1; i <= n; i++) stepChain(pts, c, mix(from, to, i / n), dt / n, wind);
  }
  body.at = [x, y];
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
function rigFrame(kind, pose, frame, blink, body, scale = 1) {
  const rig = RIGS[kind], P = posed(rig, pose, frame), chains = {};
  const live = body?.kind === kind && body.chains && body.at;
  for (const name in rig.chains) {
    const pts = live && body.chains[name] ? body.chains[name].map((q) => minus(q.p, body.at)) : restPoints(chainRest(rig, P, name));
    chains[name] = pts.map(([x, y]) => [Math.round(x * 4) / 4, Math.round(y * 4) / 4]);
  }
  const key = `${kind} ${pose} ${frame} ${blink} ${scale} ${JSON.stringify(chains)}`;
  let s = rigFrames.get(key);
  if (s) { rigFrames.delete(key); rigFrames.set(key, s); return s; } // (the most recent last)
  s = drawRig(rig, P, pose, blink, chains, scale);
  rigFrames.set(key, s);
  if (rigFrames.size > 400) rigFrames.delete(rigFrames.keys().next().value);
  return s;
}

// draw a rig in a pose, back to front as DRAW does: soft chains (a tail), the far legs, the body (torso, shapes, ears,
// near legs, joined smoothly), the markings on it (paint; spikes; socks; dark ear tips), the near paws outlined over the
// belly (over: lying low), things on top (top: horns, fangs, a head over a round body, outlined), chains in front (front:
// lop ears), single pixels (dots), the face. The collision mask: the far legs and the body. (recolor: one palette name
// for another, everywhere: the wolf is a grey fox)
function drawRig(rig, P, pose, blink, chains, S = 1) {
  const { p, F, torso } = P, k = rig.smooth ?? 1, fur = NAMED[rig.fur];
  const placed = (s) => ({ s, f: s.on ? F[s.on] : null }); // a shape with its frame
  const sd = ({ s, f }, x, y) => { const [lx, ly] = f ? toLocal(f, x, y) : [x, y]; return sdShape(s, lx, ly); };
  const body = [...(p.ownShapes ? [] : rig.shapes || []), ...(p.shapes || [])].map(placed); // (ownShapes: the pose's alone)
  if (torso.r > 0) { // the torso: along the spine from the hip to the chest, reaching past both (an ellipse, or a capsule)
    const len = Math.hypot(P.J.chest[0] - P.J.hip[0], P.J.chest[1] - P.J.hip[1]), half = len / 2;
    body.unshift(placed(torso.capsule ? { on: 'spine', capsule: [-torso.ends, 0, len + torso.ends, 0, torso.r] } : { on: 'spine', ellipse: [half, 0, half + torso.ends, torso.r] }));
  }
  const legs = Object.entries(rig.legs || {}).map(([name, L]) => {
    const root = p.roots?.[name] || toWorld(F[L.on], L.at), [knee, paw] = reach(root, p.paws[name], L.thigh, L.shin, L.bend);
    const pad = p.pad && !L.far ? [paw[0], paw[1] + 0.3, ...p.pad] : L.foot ? [paw[0] + L.foot[0] - 0.8, paw[1] + 0.3, ...L.foot] : null; // a paw flat on the ground (a foot: always)
    return { far: L.far, r: L.r, parts: [[...root, ...knee, L.r], [...knee, ...paw, L.r]], pad, sock: [...mix(knee, paw, 0.35), ...paw, L.r] };
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
    (c.front ? front : soft).push({ color: NAMED[c.color] || fur, parts, marks: (c.marks || []).map(([t, color, mr]) => [along(t), NAMED[color], mr]) });
  }
  const tops = [...(rig.top || []), ...(p.top || [])].map((t) => ({ color: NAMED[t.color] || fur, shapes: t.shapes.map(placed), paint: t.paint || [] }));
  const dots = (p.dots || rig.dots || []).map((d) => [toWorld(d.on ? F[d.on] : null, d.at), NAMED[d.color] || OUT]);

  // the frame's bounds: every shape's box (turned with its frame), one more pixel for the outline
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const fit = ([x, y], r = 0) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
  const fitShape = ({ s, f }) => { const [a, b, c, d] = extent(s); for (const q of [[a, b], [c, b], [a, d], [c, d]]) fit(toWorld(f, q)); };
  body.forEach(fitShape);
  for (const t of tops) t.shapes.forEach(fitShape);
  for (const L of [...legs, ...soft, ...front]) for (const [ax, ay, bx, by, r] of L.parts) { fit([ax, ay], r); fit([bx, by], r); }
  for (const L of legs) if (L.pad) { fit([L.pad[0] - L.pad[2], L.pad[1] - L.pad[3]]); fit([L.pad[0] + L.pad[2], L.pad[1] + L.pad[3]]); }
  for (const e of ears) for (const q of e.tri) fit(q);
  for (const [q] of dots) fit(q);
  // drawn S times bigger (the giant dino: its shapes finer, its outline still one pixel); nothing below the feet's row
  // (the ground). (ox, oy: in the bigger pixels)
  const ox = Math.floor(x0 * S) - 1, oy = Math.floor(y0 * S) - 1, g = new Grid(Math.ceil(x1 * S) + 1 - ox, Math.min(Math.ceil(y1 * S) + 1, (FOOT + 1) * S) - oy);
  const inside = (d) => [(x, y) => d((x + ox + 0.5) / S, (y + oy + 0.5) / S) <= 0]; // (tested at the pixel's middle)
  const n = Math.round(S), pixel = { dot: (x, y, c) => { for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) g.dot(Math.round(x) * S - ox + a, Math.round(y) * S - oy + b, c); } }; // (a dot: S by S)
  const chain = (t) => {
    const m = g.layer(inside((x, y) => Math.min(...t.parts.map((c) => sdCapsule(x, y, c)))), t.color, OUT);
    for (const [[mx, my], color, r] of t.marks) {
      if (r) g.paint(inside((x, y) => Math.hypot(x - mx, y - my) - r), color, m);
      else pixel.dot(mx, my, color);
    }
  };

  soft.forEach(chain);
  const farMask = g.layer(inside((x, y) => legs.filter((L) => L.far).reduce((d, L) => Math.min(d, legSd(L, x, y)), Infinity)), fur, OUT);
  const bodyMask = g.layer(inside((x, y) => {
    let d = body.reduce((d, b, i) => (i ? smin(d, sd(b, x, y), k * (b.s.smooth ?? 1)) : sd(b, x, y)), Infinity);
    for (const e of ears) d = smin(d, sdTriangle(x, y, e.tri), k * 0.4);
    for (const L of legs) if (!L.far) d = smin(d, legSd(L, x, y), k * 0.5);
    return d;
  }), fur, OUT);
  for (const m of p.paint || rig.paint || []) g.paint(inside((x, y) => sd(placed(m), x, y)), NAMED[m.color], bodyMask);
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
  if (rig.socks) g.paint(inside((x, y) => Math.min(...legs.map((L) => sdCapsule(x, y, L.sock)))), NAMED[rig.socks], union(farMask, bodyMask));
  for (const e of ears) if (e.c.tipColor) g.paint(inside((x, y) => Math.max(sdTriangle(x, y, e.tri), Math.hypot(x - e.tip[0], y - e.tip[1]) - (e.c.tipSize || 2))), NAMED[e.c.tipColor], bodyMask);
  const overMask = over.length ? g.layer(inside((x, y) => over.reduce((d, L) => Math.min(d, sdEllipse(x, y, L.pad)), Infinity)), fur, OUT) : farMask.map(() => 0);
  for (const t of tops) {
    const m = g.layer(inside((x, y) => Math.min(...t.shapes.map((b) => sd(b, x, y)))), t.color, OUT);
    for (const q of t.paint) g.paint(inside((x, y) => sd(placed(q), x, y)), NAMED[q.color], m);
  }
  front.forEach(chain);
  for (const [[x, y], c] of dots) pixel.dot(x, y, c);
  if (rig.recolor) { const to = {}; for (const a in rig.recolor) to[NAMED[a]] = NAMED[rig.recolor[a]]; for (let i = 0; i < g.px.length; i++) g.px[i] = to[g.px[i]] ?? g.px[i]; }
  const face = rig.face, eye = toWorld(F.head, face.eye);
  eyes(pixel, pose, eye, blink);
  if (face.nose) { const nose = toWorld(F.head, face.nose); pixel.dot(nose[0], nose[1], NAMED[face.noseColor] || OUT); }
  return sprite(g, union(farMask, bodyMask, overMask), { ox, oy, head: [(eye[0] - 1) * S, (eye[1] - 6) * S] });
}

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

export function rock(rnd) {
  const w = 9 + Math.floor(rnd() * 4), g = new Grid(w + 2, 8);
  const mask = g.layer([ellipse(w / 2 + 1, 7, w / 2, 5)], FAINT, INK);
  g.dot(w / 2 - 1, 4, LIGHT); g.dot(w / 2, 3, LIGHT); g.dot(w / 2 + 1, 3, LIGHT);
  return sprite(g, mask);
}

// a fallen log, its cut end toward the runner
export function log(rnd) {
  const w = 14 + Math.floor(rnd() * 6), g = new Grid(w + 2, 9);
  const mask = g.layer([capsule(3.5, 5, w - 3, 5, 3.4)], BARK, OUT);
  for (let x = 4; x < w - 5; x += 3 + Math.floor(rnd() * 2)) g.dot(x, 3 + Math.floor(rnd() * 4), BROWN);
  g.layer([ellipse(3.5, 5, 2.4, 3.4)], WOOD, OUT);
  g.dot(3, 4, BARK); g.dot(3, 5, BARK);
  return sprite(g, mask);
}

// a leafy branch hanging from the trees above, down to DUCK_UNDER
export function branch(rnd) {
  const g = new Grid(26, DUCK_UNDER + 1), b = g.h - 1, x0 = 6 + rnd() * 6;
  const stem = [capsule(x0, -2, x0 + 3, b - 12, 1.5), capsule(x0 + 3, b - 12, 13, b - 5, 1.2)];
  const leaves = [ellipse(13, b - 3.2, 6.5, 3.6), ellipse(7.5, b - 5, 4.2, 3.2), ellipse(19, b - 5.5, 4.2, 3.2), ellipse(12.5, b - 7.5, 4.5, 3),
    ...Array.from({ length: 4 }, (_, i) => ellipse(x0 + 0.8 * i + (i % 2 ? 4 : -3), 6 + i * ((b - 20) / 4), 2.6, 1.6))];
  const mask = union(g.layer(stem, BARK, OUT), g.layer(leaves, LEAF, OUT));
  for (let y = 1; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const i = y * g.w + x;
    if (g.px[i] === LEAF && (!mask[i + g.w] || y === g.h - 1 || (x * 7 + y * 3) % 11 === 0)) g.px[i] = LEAF_DARK;
  }
  for (let k = 0; k < 3; k++) if (rnd() < 0.5) g.layer([ellipse(7 + k * 5 + rnd() * 2, b - 2 + rnd() * 1.5, 1.2, 1.2)], BERRY, OUT);
  return sprite(g, mask);
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

// each animal's face, for the high scores
export const FACE = {
  rabbit: fromRows(['.ooooo.', 'oewwweo', 'oekwkeo', 'oewpweo', '.owwwo.', '..ooo..'], { o: OUT, e: EAR, w: FUR, k: OUT, p: PINK }),
  cat: fromRows(['oo...oo', 'ogooogo', 'ogkgkgo', 'oggpggo', '.owwwo.', '..ooo..'], { o: OUT, g: GINGER, w: BELLY, k: OUT, p: PINK }),
  dog: fromRows(['.ooooo.', 'obtttbo', 'obktkbo', 'obwkwbo', '.owwwo.', '..ooo..'], { o: OUT, b: BROWN, t: TAN, w: FUR, k: OUT }),
  fox: fromRows(['oo...oo', 'ofooofo', 'ofkfkfo', 'owfkfwo', '.owwwo.', '..ooo..'], { o: OUT, f: FOX, w: BELLY, k: OUT }),
  hedgehog: fromRows(['o.o.o.o', 'obbbbbo', 'obkekbo', 'obeeebo', '.oeneo.', '..ooo..'], { o: OUT, b: BROWN, e: EAR, k: OUT, n: OUT }),
  squirrel: fromRows(['o.....o', 'oro.oro', 'orkrkro', 'orrwrro', '.owwwo.', '..ooo..'], { o: OUT, r: STRIPE, w: BELLY, k: OUT }),
  otter: fromRows(['.ooooo.', 'obbbbbo', 'obkbkbo', 'obenebo', '.oeeeo.', '..ooo..'], { o: OUT, b: BROWN, e: EAR, k: OUT, n: OUT }),
  skunk: fromRows(['oo...oo', 'osowoso', 'oswwwso', 'osswsso', '.ospso.', '..ooo..'], { o: OUT, s: SKUNK, w: BELLY, p: PINK }),
  wolf: fromRows(['oo...oo', 'ogooogo', 'ogkgkgo', 'owgngwo', '.owwwo.', '..ooo..'], { o: OUT, g: WOLF, w: BELLY, k: OUT, n: OUT }),
  boar: fromRows(['oo...oo', 'obooobo', 'obkbkbo', 'obsssbo', 'wosnsow', '..ooo..'], { o: OUT, b: BOAR, s: SNOUT, n: OUT, k: OUT, w: BELLY }),
  bear: fromRows(['oo...oo', 'obbbbbo', 'obkbkbo', 'obwnwbo', '.owwwo.', '..ooo..'], { o: OUT, b: BARK, w: WOOD, k: OUT, n: OUT }),
  cheetah: fromRows(['oo...oo', 'oyyyyyo', 'oykykyo', 'okynyko', '.owwwo.', '..ooo..'], { o: OUT, y: CHEETAH, w: BELLY, k: OUT, n: OUT }),
  rhino: fromRows(['...e...', '..oeo..', 'orrerro', 'orkrkro', 'orrrrro', '.ooooo.'], { o: OUT, r: RHINO, e: EAR, k: OUT }),
  sabre: fromRows(['oo...oo', 'ottttto', 'otktkto', 'ottntto', '.wowow.', '..ooo..'], { o: OUT, t: TAN, w: BELLY, k: OUT, n: OUT }),
  dino: fromRows(['..ooooo', '.oddddo', '.okdddo', '.oddooo', 'oddddo.', 'oooooo.'], { o: OUT, d: DINO, k: OUT }),
};

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
const ham = food(12, 9, (g) => {
  g.layer([capsule(1.5, 2, 3.5, 3.5, 0.7), ellipse(1, 1.4, 1, 1)], BELLY, OUT);
  g.layer([ellipse(7, 5, 4.2, 3.4)], BERRY, OUT); g.layer([ellipse(7.6, 5.4, 2.2, 1.6)], PINK); g.dot(6, 3, LIGHT);
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
export const FOOD = { carrot: carrot(), bone: bone(), fish: fish(), grapes: grapes(), apple, acorn, shell, beetle, sausage, mushroom, berries, drumstick, leaf, ham, roast };

// ---------------------------------------------------------------------------------------------------------- the sky
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
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255), l = 0.3 * r + 0.59 * g + 0.11 * b;
    return [k, l > 0.8 ? '#fff4b8' : l > 0.5 ? '#ffd23f' : '#e3a21a'];
  })), bg: `${pal.bg} gold` });
}

// the ice age (the sabre-tooth's power): obstacles turned to ice
// (bg: the background a whole world palette needs, or none: a palette for sprites only, its key made from the original's)
const recolor = (map, bg) => { const made = {}; return (pal) => (made[pal.bg] ||= { ...Object.fromEntries(Object.entries(pal).map(([k, hex]) => {
  if (k === 'bg') return [k, hex];
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return [k, map(+k, 0.3 * r + 0.59 * g + 0.11 * b)];
})), bg: bg || `${pal.bg} ${Object.keys(made).length}${map.name}` }); };
export const icy = recolor(function ice(k, l) { return k === OUT ? '#3a5f7a' : l > 0.75 ? '#e8f6ff' : l > 0.45 ? '#a9dcf2' : '#6fb4d6'; });

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
export function text(ctx, s, x, y, color, align = 'left') {
  s = String(s).toUpperCase();
  if (align === 'center') x -= textWidth(s) / 2;
  if (align === 'right') x -= textWidth(s);
  x = Math.round(x);
  ctx.fillStyle = color;
  [...s].forEach((ch, i) => {
    const gl = GLYPHS[ch] || GLYPHS[' '];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (+gl[r] & (4 >> c)) ctx.fillRect(x + i * 4 + c, y + r, 1, 1);
  });
}

// do two sprites overlap, pixel for pixel (by their masks)?
export function hits(a, ax, ay, b, bx, by) {
  ax = Math.round(ax + (a.ox || 0)); ay = Math.round(ay + (a.oy || 0)); bx = Math.round(bx + (b.ox || 0)); by = Math.round(by + (b.oy || 0));
  const x0 = Math.max(ax, bx), x1 = Math.min(ax + a.w, bx + b.w), y0 = Math.max(ay, by), y1 = Math.min(ay + a.h, by + b.h);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (a.mask[(y - ay) * a.w + x - ax] && b.mask[(y - by) * b.w + x - bx]) return true;
  return false;
}
