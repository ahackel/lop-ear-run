// node tools/icons.mjs — draws the app icons (icons/*.png) from the game's own pixel art: the rabbit running, stretched
// in a hop over the ground line (with bits of the ground under it, as in the game), on nothing (transparent). Each icon is the same 32×32 picture, scaled by whole pixels. Where a background is a must (the
// maskable icon, which Android crops to a shape, and the iPhone's, which turns transparency black) it is the sky.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { animal, PALETTES } from '../art.js';

const SKY = '#bfe6f2', OUT = 1, INK = 5;
const rabbit = animal('rabbit', 'run', 6, 0.45); // its run, high in a hop: stretched out, the hind legs pushing back, the front paws reaching
const GROUND = 27, GAP = 4; // the ground line's row; how high over it the rabbit hops
const BITS = [[2, 29, 3], [8, 30, 1], [13, 29, 2], [19, 30, 3], [25, 29, 1], [29, 30, 2]]; // the ground's bits under it: [x, y, length]
const pal = PALETTES.day;
const at = (x, y) => (x >= 0 && y >= 0 && x < rabbit.w && y < rabbit.h ? rabbit.px[y * rabbit.w + x] : 0);
// where it is drawn: its pixels, centered (the hind foot touches the grid's left edge, and loses its outline there:
// put back, one column further left)
let x0 = rabbit.w, x1 = -1, y0 = rabbit.h, y1 = -1;
for (let y = 0; y < rabbit.h; y++) for (let x = 0; x < rabbit.w; x++) if (at(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
const edge = Array.from({ length: rabbit.h }, (_, y) => at(0, y) && at(0, y) !== OUT);
if (edge.some(Boolean)) x0 -= 1;
const ox = Math.floor((32 - (x1 - x0 + 1)) / 2) - x0, oy = GROUND - GAP - 1 - y1;

// the picture: a color for each logical pixel (null: transparent)
function color(x, y, bg) {
  const rx = x - ox, ry = y - oy;
  if (x >= 0 && x < 32 && (y === GROUND || BITS.some(([bx, by, n]) => y === by && x >= bx && x < bx + n))) return pal[INK];
  if (rx === -1 && edge[ry]) return pal[OUT];
  return at(rx, ry) ? pal[at(rx, ry)] : bg;
}

function png(size, scale, bg = null) {
  const off = (size - 32 * scale) / 2, raw = Buffer.alloc(size * (size * 4 + 1));
  for (let Y = 0; Y < size; Y++) {
    raw[Y * (size * 4 + 1)] = 0;
    for (let X = 0; X < size; X++) {
      const hex = color(Math.floor((X - off) / scale), Math.floor((Y - off) / scale), bg), i = Y * (size * 4 + 1) + 1 + X * 4;
      if (hex) { raw[i] = parseInt(hex.slice(1, 3), 16); raw[i + 1] = parseInt(hex.slice(3, 5), 16); raw[i + 2] = parseInt(hex.slice(5, 7), 16); raw[i + 3] = 255; }
    }
  }
  const chunk = (type, data) => {
    const td = Buffer.concat([Buffer.from(type), data]), out = Buffer.alloc(td.length + 8);
    out.writeUInt32BE(data.length, 0); td.copy(out, 4); out.writeUInt32BE(crc(td), td.length + 4);
    return out;
  };
  const head = Buffer.alloc(13);
  head.writeUInt32BE(size, 0); head.writeUInt32BE(size, 4); head[8] = 8; head[9] = 6; // 8 bit RGBA
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
const CRC = Array.from({ length: 256 }, (_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

mkdirSync(new URL('../icons/', import.meta.url), { recursive: true });
for (const [name, size, scale, bg] of [['icon-192', 192, 6], ['icon-512', 512, 16], ['maskable-512', 512, 12, SKY], ['apple-touch-icon', 180, 5, SKY], ['favicon', 64, 2]]) {
  writeFileSync(new URL(`../icons/${name}.png`, import.meta.url), png(size, scale, bg));
}
console.log('icons/ written');
