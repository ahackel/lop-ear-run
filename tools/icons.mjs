// node tools/icons.mjs — draws the app icons (icons/*.png) from the game's own pixel art: the rabbit sitting on the
// ground line, sat up tall to look about (with bits of the ground under it, as in the game), on nothing (transparent).
// Each icon is filled by the picture, scaled by as many whole pixels as still show the rabbit, the line and its bits
// (the favicon: the line, the bits cut off; the maskable icon: smaller, in the middle, which Android keeps whatever
// shape it crops to); the line runs on to its edges. Where a background is a must (the maskable icon, and the iPhone's,
// which turns transparency black) it is the sky. The iOS app's icon (app/ios/…/AppIcon.appiconset) is the iPhone's at
// 1024 px, without an alpha channel (the App Store turns one away).
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { animal, PALETTES } from '../art.js';

const SKY = '#bfe6f2', OUT = 1, INK = 5;
const rabbit = animal('rabbit', 'idle', 46); // sitting (its 8 s loop of 80 frames), sat up tall to look about, half way through that
const GROUND = 24, GAP = 0; // the ground line's row (the picture in the middle, top to bottom); how high over it the rabbit is
const BITS = [[2, 2, 3], [8, 3, 1], [13, 2, 2], [19, 3, 3], [25, 2, 1], [29, 3, 2]].map(([x, y, n]) => [x, GROUND + y, n]); // the ground's bits under it: [x, y, length]
const pal = PALETTES.day;
const at = (x, y) => (x >= 0 && y >= 0 && x < rabbit.w && y < rabbit.h ? rabbit.px[y * rabbit.w + x] : 0);
// where it is drawn: its pixels, centered (the hind foot touches the grid's left edge, and loses its outline there:
// put back, one column further left)
let x0 = rabbit.w, x1 = -1, y0 = rabbit.h, y1 = -1;
for (let y = 0; y < rabbit.h; y++) for (let x = 0; x < rabbit.w; x++) if (at(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
const edge = Array.from({ length: rabbit.h }, (_, y) => at(0, y) && at(0, y) !== OUT);
if (edge.some(Boolean)) x0 -= 1;
const ox = Math.floor((32 - (x1 - x0 + 1)) / 2) - x0, oy = GROUND - GAP - 1 - y1;

// what has to show: the rabbit, the line, (low: and its bits) → its middle and its height, in logical pixels
const TOP = oy + y0, LINE = GROUND, LOW = GROUND + 3, MID_X = ox + (x0 + x1 + 1) / 2;
const shown = (bits) => { const bottom = bits ? LOW : LINE; return { cx: MID_X, cy: (TOP + bottom + 1) / 2, h: bottom + 1 - TOP }; };

// the picture: a color for each logical pixel (null: transparent); the line and its bits go on both ways
function color(x, y, bg) {
  const rx = x - ox, ry = y - oy, bx = ((x % 32) + 32) % 32;
  if (y === GROUND || BITS.some(([x0, by, n]) => y === by && bx >= x0 && bx < x0 + n)) return pal[INK];
  if (rx === -1 && edge[ry]) return pal[OUT];
  return at(rx, ry) ? pal[at(rx, ry)] : bg;
}

// an icon size pixels square: what shows (see shown) in its middle, each logical pixel scale pixels (none given: as
// many as fit; opaque: no alpha channel, for a background on every pixel)
function png(size, { scale, bg = null, bits = true, opaque = false } = {}) {
  const v = shown(bits), k = scale || Math.floor(size / v.h), offX = Math.round(size / 2 - v.cx * k), offY = Math.round(size / 2 - v.cy * k);
  const n = opaque ? 3 : 4, raw = Buffer.alloc(size * (size * n + 1));
  for (let Y = 0; Y < size; Y++) {
    raw[Y * (size * n + 1)] = 0;
    for (let X = 0; X < size; X++) {
      const hex = color(Math.floor((X - offX) / k), Math.floor((Y - offY) / k), bg), i = Y * (size * n + 1) + 1 + X * n;
      if (hex) { raw[i] = parseInt(hex.slice(1, 3), 16); raw[i + 1] = parseInt(hex.slice(3, 5), 16); raw[i + 2] = parseInt(hex.slice(5, 7), 16); if (!opaque) raw[i + 3] = 255; }
    }
  }
  const chunk = (type, data) => {
    const td = Buffer.concat([Buffer.from(type), data]), out = Buffer.alloc(td.length + 8);
    out.writeUInt32BE(data.length, 0); td.copy(out, 4); out.writeUInt32BE(crc(td), td.length + 4);
    return out;
  };
  const head = Buffer.alloc(13);
  head.writeUInt32BE(size, 0); head.writeUInt32BE(size, 4); head[8] = 8; head[9] = opaque ? 2 : 6; // 8 bit RGB(A)
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
const CRC = Array.from({ length: 256 }, (_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

mkdirSync(new URL('../icons/', import.meta.url), { recursive: true });
for (const [name, size, how] of [['icon-192', 192], ['icon-512', 512], ['maskable-512', 512, { scale: 12, bg: SKY }], ['apple-touch-icon', 180, { bg: SKY }], ['favicon', 64, { bits: false }]]) {
  writeFileSync(new URL(`../icons/${name}.png`, import.meta.url), png(size, how));
}
writeFileSync(new URL('../app/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png', import.meta.url), png(1024, { bg: SKY, opaque: true }));
console.log('icons/ and the iOS app icon written');
