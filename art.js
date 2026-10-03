// Pixel art for Lop Ear Run. Sprites are small grids of palette indices, filled from shapes (ellipses, capsules,
// triangles) and outlined, so ears and tails can swing to any angle. Each sprite comes with a collision mask (ears and
// tails are soft: they never count).

export const W = 300, H = 90, GROUND = 78; // the world in art pixels; GROUND: the y of the ground line

// palette indices
const OUT = 1, FUR = 2, EAR = 3, PINK = 4, INK = 5, BERRY = 6, ORANGE = 7, LEAF = 8, FAINT = 9, LIGHT = 10, FOX = 11, BELLY = 12,
  TAN = 14, BROWN = 15, GINGER = 16, STRIPE = 17, CACTUS = 18, CACTUS_DARK = 19, CACTUS_LIGHT = 20, YELLOW = 21, BARK = 22,
  WOOD = 23, FISH = 24, LEAF_DARK = 25, GRAPE = 27, WOLF = 28, BOAR = 29, SNOUT = 30, WOLF_DARK = 31, SKUNK = 32, CHEETAH = 33, RHINO = 34, RHINO_DARK = 35;
export const COLOR = { INK, DIM: 13, BERRY, YELLOW, ENERGY: 26, LEAF, FAINT, WHITE: BELLY, ICE: FISH };

export const PALETTES = {
  day: { bg: '#f7f6f0', 1: '#3a3a3a', 2: '#fdfbf6', 3: '#e3d2c2', 4: '#f19bb2', 5: '#535353', 6: '#d6455f', 7: '#ee8a2a', 8: '#62b04f', 9: '#dedbd0',
    10: '#f7f6f0', 11: '#d9682b', 12: '#fdfbf6', 13: '#9a9a94', 14: '#dfa45e', 15: '#8a5a3b', 16: '#f2a65a', 17: '#c46f34', 18: '#6eae4c',
    19: '#3e7a39', 20: '#a6d46c', 21: '#ffcf3a', 22: '#7a5236', 23: '#e2bd86', 24: '#7aa5cf', 25: '#3f8a3a', 26: '#5dbb4c', 27: '#7d4f9e', 28: '#8e919c', 29: '#5e4c40', 30: '#c9a395', 31: '#5a5c66', 32: '#585866', 33: '#e2b25a', 34: '#9a968f', 35: '#77736d' },
  night: { bg: '#1d2033', 1: '#141625', 2: '#f4f1ea', 3: '#d3c3b3', 4: '#e88aa3', 5: '#c3c6d8', 6: '#e8607e', 7: '#ee8a2a', 8: '#4f9a48', 9: '#2e3350',
    10: '#1d2033', 11: '#d9682b', 12: '#f4f1ea', 13: '#6a7090', 14: '#cf975a', 15: '#7a5038', 16: '#e69a52', 17: '#b06232', 18: '#4f9446',
    19: '#2f6232', 20: '#86bd5e', 21: '#ffd24a', 22: '#6b4a33', 23: '#cfa974', 24: '#6f98c4', 25: '#2f6e35', 26: '#5dbb4c', 27: '#a274c4', 28: '#a3a6b3', 29: '#6e5a4c', 30: '#c39a8c', 31: '#6a6c78', 32: '#6c6c7a', 33: '#d4a650', 34: '#8e8a84', 35: '#6c6862' },
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

// a sprite: { w, h, px (palette indices), mask, draw(ctx, x, y, palette) }; drawn into a canvas per palette, on first use
function sprite(g, mask, extra) {
  const canvases = {};
  return {
    w: g.w, h: g.h, px: g.px, mask, ...extra,
    draw(ctx, x, y, pal) {
      let c = canvases[pal.bg];
      if (!c) {
        c = canvases[pal.bg] = new OffscreenCanvas(g.w, g.h);
        const cx = c.getContext('2d'), img = cx.createImageData(g.w, g.h);
        for (let i = 0; i < g.px.length; i++) {
          const k = g.px[i];
          if (!k) continue;
          const hex = pal[k];
          img.data.set([parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255], i * 4);
        }
        cx.putImageData(img, 0, 0);
      }
      ctx.drawImage(c, Math.round(x), Math.round(y));
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
  bear: { name: 'BEAR', food: 'honey', ...tune(3.14, 1.36, 0.95, 1.2, 1.71, 0.71, 1.43, 250, 2.3, 0.83) },
  cheetah: { name: 'CHEETAH', food: 'drumstick', ...tune(3.36, 1.39, 1.08, 1.1, 1.79, 0.69, 1.47, 300, 2.4, 0.81) },
  rhino: { name: 'RHINO', food: 'leaf', ...tune(3.57, 1.43, 0.95, 1.15, 1.86, 0.66, 1.51, 300, 2.5, 0.79) },
  sabre: { name: 'SABRE-TOOTH', food: 'ham', ...tune(3.79, 1.46, 1, 1.2, 1.93, 0.63, 1.56, 300, 2.7, 0.78) },
  dino: { name: 'DINO', food: 'fern', ...tune(4.0, 1.5, 1, 1.25, 2.0, 0.6, 1.6, 300, 2.8, 0.76) }, // the hardest
};

// where a run is in its stride (phase 0…1) → { frame, lift }: the rabbit hops (crouched on the ground, stretched out
// as it rises, gathered as it falls), the others gallop
export function stride(kind, phase) {
  if (kind === 'rabbit') {
    if (phase < 0.3) return { frame: 0, lift: 0 };
    const q = (phase - 0.3) / 0.7;
    return { frame: q < 0.5 ? 1 : 2, lift: Math.round(Math.sin(Math.PI * q) * 4) };
  }
  const frame = Math.floor(phase * 4) % 4;
  return { frame, lift: frame === 0 ? 1 : 0 };
}

const animals = new Map();
export function animal(kind, pose, frame = 0, soft = 0.4, blink = false, wiggle = 0) {
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
      tail = [4, 9.5, k % 2 ? 0.95 : 0.55];
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
      tailAt = [4, 10.5, 0.35 + tailA * 0.6];
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
      tail = [6, 10.5, 0.5 + tailA * 0.5];
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
      near, far, tail: bushy(6, 12, 0.2 + soft * 0.5, 2.2, 2.6),
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
    const [tx, ty] = swing(4.5, 14, 1.9 + soft * 0.2, 3), [ex, ey] = swing(tx, ty, 2.1 + soft * 0.2, 2.6);
    return render(g, pose, blink, { fur: BROWN, body: [capsule(6, 14, 15.5, 11.8, 3.8), capsule(15.5, 11.8, 19, 9, 2.8), head, snout, ellipse(18.3, 5, 1.2, 1.1)],
      near, far, tail: [capsule(4.5, 14, tx, ty, 1.8), capsule(tx, ty, ex, ey, 1.1)],
      paint: [[[snout, ellipse(22, 10.5, 2.5, 1.4), ellipse(12, 15.8, 4.5, 1.2)], EAR]], eye: [21, 7.4], nose: [24.6, 8.9] });
  },

  // the skunk: round and fluffy, black with a white stripe from its head down its back, a big bushy tail (on the spring)
  skunk(g, pose, f, soft, blink) {
    const bushy = (x, y, a) => { const [mx, my] = swing(x, y, a, 5), [tx, ty] = swing(mx, my, a - 1, 4); return [capsule(x, y, mx, my, 2.3), capsule(mx, my, tx, ty, 2.7)]; };
    if (pose === 'duck' || pose === 'ko') {
      const ko = pose === 'ko', head = ellipse(19.5, 16, 3, 2.6), snout = ellipse(22.2, 16.9, 1.6, 1.2);
      return render(g, pose, blink, { fur: SKUNK, body: [ellipse(11.5, 16, 8, ko ? 3.2 : 3), head, snout, ellipse(18, 13.6, 0.9, 0.9)],
        near: ko ? legsUp([8, 14], 0.9) : paws(f, 20.5, 6.5), tail: [capsule(4.5, 15, 0.8, 13, 2), ellipse(1.5, 12.5, 1.6, 1.6)],
        paint: [[[capsule(19.5, 13.6, 6, ko ? 13.6 : 13.3, 0.9)], BELLY]], eye: [20.2, 15.4], nose: [23.6, 16.6] });
    }
    const [near, far] = gallop(frameOf(pose, f), [8, 15.5], [14.5, 15.5], 0.9), head = ellipse(18.8, 12.6, 3.3, 3), snout = ellipse(21.8, 13.8, 1.8, 1.2);
    const a = 0.3 + soft * 0.4, tail = bushy(5, 10, a), fur = () => g.px.map((c) => +(c === SKUNK));
    return render(g, pose, blink, { fur: SKUNK, body: [ellipse(10.5, 11.2, 6.5, 7.2)], near, far, tail,
      paint: [[[capsule(16, 6.5, 6.5, 5.6, 0.9)], BELLY]], // the stripe down its back
      after: () => g.paint([ellipse(...swing(...swing(5, 10, a, 5), a - 1, 3.4), 1.3, 1.3)], BELLY, fur()), // the tail's white tip
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
    const [near, far] = gallop(frameOf(pose, f), [8, 15.8], [15, 15.5], 1), [tx, ty] = swing(4.4, 10, 1.2 + soft * 0.3, 3);
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
      near, far, tail: [ellipse(3.3, 9.6, 1.2, 1.2)], paint: [[[snout], WOOD]], eye: [20, 8.4], nose: [24.2, 10.2] });
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
    const [near, far] = gallop(frameOf(pose, f), [8, 12.5], [15, 12.5], 0.85), muzzle = ellipse(22, 8.6, 1.5, 1.1);
    const a = 1.1 + soft * 0.4, [mx, my] = swing(4.5, 9.5, a, 4), [tx, ty] = swing(mx, my, a + 0.5, 3.5);
    return render(g, pose, blink, { fur: CHEETAH, body: [ellipse(11.5, 10.5, 7, 3), ellipse(15.5, 11, 2.8, 3), ellipse(19.8, 7.4, 2.8, 2.6), muzzle, ellipse(18.5, 5, 1, 1)],
      near, far, tail: [capsule(4.5, 9.5, mx, my, 0.8), capsule(mx, my, tx, ty, 0.8)], last: () => { g.dot(mx, my, OUT); g.dot(tx, ty, BELLY); },
      paint: [[[muzzle, ellipse(13, 13, 4.5, 0.9)], BELLY]], dots: [...spots(0), [21, 7.8, OUT], [21, 8.6, OUT], [21.6, 9.4, OUT]], eye: [20.4, 6.6], nose: [23.4, 8.2] });
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
    const [near, far] = gallop(frameOf(pose, f), [7.5, 15], [14.5, 15], 1.5), [tx, ty] = swing(3.6, 9.5, 1.3 + soft * 0.3, 2.6);
    return render(g, pose, blink, { fur: RHINO, body: [ellipse(11, 11.5, 7.5, 5), capsule(16.5, 10, 22, 12.4, 3), triangle(15.4, 7.6, 15.9, 3.6, 17.8, 7.2)],
      near, far, tail: [capsule(3.6, 9.5, tx, ty, 0.5)],
      paint: [[[capsule(9.5, 7, 9.5, 16, 0.5), capsule(14.5, 7.6, 14.5, 15, 0.5)], RHINO_DARK]],
      over: [[[triangle(21.4, 10.4, 23.4, 4.2, 24.4, 11), triangle(19, 9, 19.8, 6.6, 21, 9)], EAR]], eye: [18.6, 10], nose: [24.6, 12.6] });
  },

  // the sabre-tooth cat: a tiger's stripes, a big head, the mouth open, two long white fangs reaching below its chin
  sabre(g, pose, f, soft, blink) {
    const stripes = (dy) => [7, 10, 13].map((x) => capsule(x, 7.4 + dy, x - 0.6, 10 + dy, 0.6));
    if (pose === 'duck' || pose === 'ko') {
      const ko = pose === 'ko', hy = ko ? 15.6 : 15.2, muzzle = ellipse(22.6, hy + 0.6, 2, 1.2);
      return render(g, pose, blink, { fur: TAN, body: [ellipse(11.5, 16.2, 8.5, 3), ellipse(19.5, hy, 3.8, 3.3), muzzle, ellipse(17.4, hy - 2.8, 1, 1)],
        near: ko ? legsUp([8, 14], 1.2) : paws(f, 20.5, 6.5), tail: [capsule(3.4, 15.5, 1.5, 15, 1)],
        paint: [[[muzzle], BELLY], [stripes(6), BROWN]],
        over: [[[capsule(22, hy + 1.6, 22.2, hy + 3.8, 0.6)], BELLY]], eye: [20.4, hy - 1.2], nose: [24.2, hy] });
    }
    const [near, far] = gallop(frameOf(pose, f), [7.5, 14.5], [15.5, 14.5], 1.3), muzzle = ellipse(22.8, 9.4, 2, 1.3), [tx, ty] = swing(3.8, 9.5, 1 + soft * 0.3, 2);
    return render(g, pose, blink, { fur: TAN, body: [ellipse(11, 11.5, 7.5, 4.5), ellipse(14.5, 10.5, 3.8, 4.2), ellipse(19.4, 8.6, 4, 3.6), muzzle, ellipse(21.4, 12.4, 1.6, 0.9), ellipse(17, 5.2, 1.2, 1.1)],
      near, far, tail: [capsule(3.8, 9.5, tx, ty, 1)],
      paint: [[[muzzle, ellipse(21.4, 12.4, 1.4, 0.7)], BELLY], [stripes(0), BROWN]],
      over: [[[capsule(22.2, 10.4, 22.5, 14.4, 0.6)], BELLY]], dots: [[23, 11, OUT], [24, 11, OUT]], eye: [20.4, 7.6], nose: [24.6, 8.8] });
  },

  // the dino: drawn pixel by pixel, flat and blocky like the runner of Google's game (dark by day, light at night)
  dino(g, pose, f, soft, blink) {
    const run = [
      '...............xxxxxxx..',
      '..............xx.xxxxxx.',
      '..............xxxxxxxxx.',
      '..............xxxxxxxxx.',
      '..............xxxxx.....',
      '..............xxxxxxx...',
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
    const step = [
      ['.........xx.xx..........', '.........x...x..........', '.........x...xx.........', '.........xx.............'],
      ['.........xx.xx..........', '.........xx..x..........', '.............x..........', '.............xx.........'],
    ];
    const duck = [
      '.................xxxxxxx..',
      '....x......xxxxxxxx.xxxxx.',
      '....xxx..xxxxxxxxxxxxxxxx.',
      '....xxxxxxxxxxxxxxxxxxxxx.',
      '.....xxxxxxxxxxxxxxxx.....',
      '......xxxxxxxxxxxxxxxxx...',
      '.......xxxx..xx...........',
    ];
    const low = pose === 'duck' || pose === 'ko';
    const rows = low ? [...duck, ...(f && pose === 'duck' ? ['........x....xx...........', '........xx....x...........'] : ['........xx...x............', '.............xx...........'])]
      : [...run, ...(pose === 'idle' ? ['.........xx.xx..........', '.........x...x..........', '.........x...x..........', '.........xx..xx.........'] : step[frameOf(pose, f) % 2])];
    const top = FOOT + 1 - rows.length, mask = new Uint8Array(g.w * g.h);
    rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'x') { g.px[(top + y) * g.w + x] = INK; mask[(top + y) * g.w + x] = 1; } }));
    const [ex, ey] = low ? [20, top + 1] : [16, top + 1]; // the eye: a hole, an X when hurt or out
    if (pose === 'hurt' || pose === 'ko') for (const [dx, dy] of [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]) g.dot(ex + dx, ey + dy, LIGHT);
    else if (!blink) g.dot(ex, ey, LIGHT);
    return { mask, head: [ex + 1, ey - 4] };
  },
});

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
  dino: fromRows(['..xxxxx', '.xx.xxx', '.xxxxxx', '.xxx...', 'xxxxx..', 'x.x....'], { x: INK }),
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
const carrot = fromRows([
  '.g.g.',
  '..g..',
  '.ooo.',
  '.ooo.',
  '.oo..',
  '..o..',
  '..o..',
], { g: LEAF, o: ORANGE });
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
const acorn = food(8, 9, (g) => {
  g.layer([ellipse(4, 5.8, 2.4, 2.6)], WOOD, OUT); g.layer([ellipse(4, 3.3, 3.2, 1.7)], BARK, OUT); g.dot(4, 0, BARK); g.dot(3, 5, LIGHT);
});
const shell = food(10, 8, (g) => {
  const m = g.layer([ellipse(5, 4.4, 4.2, 3.4), ellipse(5, 7, 1.6, 0.9)], EAR, OUT);
  g.paint([capsule(5, 7, 2, 2, 0.4), capsule(5, 7, 5, 1.5, 0.4), capsule(5, 7, 8, 2, 0.4)], TAN, m);
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
const honey = food(9, 9, (g) => {
  g.layer([ellipse(4.5, 5.5, 3.6, 3.2)], WOOD, OUT); g.layer([ellipse(4.5, 2.2, 2.6, 1)], YELLOW, OUT); g.dot(3, 5, LIGHT);
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
const fern = food(9, 10, (g) => {
  g.layer([capsule(4.5, 1, 4.5, 9.5, 0.45)], LEAF_DARK);
  for (let y = 2; y < 9; y += 2) { const w = 1 + (y > 3 && y < 8 ? 2 : 1); g.layer([capsule(4.5, y, 4.5 - w, y - 1, 0.6), capsule(4.5, y, 4.5 + w, y - 1, 0.6)], LEAF); }
});
export const FOOD = { carrot, bone: bone(), fish: fish(), grapes: grapes(), apple, acorn, shell, beetle, sausage, mushroom, honey, drumstick, leaf, ham, fern };

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

// the ice age (the sabre-tooth's power): obstacles turned to ice; chrome mode (the dino's): the world in the greys of
// Google's game
// (bg: the background a whole world palette needs, or none: a palette for sprites only, its key made from the original's)
const recolor = (map, bg) => { const made = {}; return (pal) => (made[pal.bg] ||= { ...Object.fromEntries(Object.entries(pal).map(([k, hex]) => {
  if (k === 'bg') return [k, hex];
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return [k, map(+k, 0.3 * r + 0.59 * g + 0.11 * b)];
})), bg: bg || `${pal.bg} ${Object.keys(made).length}${map.name}` }); };
export const icy = recolor(function ice(k, l) { return k === OUT ? '#3a5f7a' : l > 0.75 ? '#e8f6ff' : l > 0.45 ? '#a9dcf2' : '#6fb4d6'; });
export const chrome = recolor((k, l) => (k === OUT || k === INK ? '#535353' : l > 0.8 ? '#ffffff' : l > 0.5 ? '#bdbdbd' : '#535353'), '#f7f7f7');

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
  ax = Math.round(ax); ay = Math.round(ay); bx = Math.round(bx); by = Math.round(by);
  const x0 = Math.max(ax, bx), x1 = Math.min(ax + a.w, bx + b.w), y0 = Math.max(ay, by), y1 = Math.min(ay + a.h, by + b.h);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (a.mask[(y - ay) * a.w + x - ax] && b.mask[(y - by) * b.w + x - bx]) return true;
  return false;
}
