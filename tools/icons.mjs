// node tools/icons.mjs — draws the app icons (icons/*.png) from the game's own pixel art: the rabbit on a meadow.
// Each icon is the same 32×32 picture, scaled by whole pixels; the maskable one keeps it inside the safe circle.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { animal, PALETTES } from '../art.js';

const SKY = '#bfe6f2', GRASS = '#62b04f', GRASS_DARK = '#3f8a3a', CLOUD = '#ffffff';
const rabbit = animal('rabbit', 'idle', 0, 0.15);
const pal = PALETTES.day;

// the picture: a color for each logical pixel; outside 0…31 the sky and the meadow go on
function color(x, y) {
  const rx = x - 5, ry = y - 6; // the rabbit, its feet on row 25
  if (rx >= 0 && ry >= 0 && rx < rabbit.w && ry < rabbit.h && rabbit.px[ry * rabbit.w + rx]) return pal[rabbit.px[ry * rabbit.w + rx]];
  if (y === 26) return GRASS_DARK;
  if (y > 26) return GRASS;
  if (y === 25 && [1, 3, 27, 29].includes(x)) return GRASS_DARK; // tufts
  if ((y === 4 && x >= 21 && x <= 26) || (y === 5 && x >= 19 && x <= 28)) return CLOUD;
  return SKY;
}

function png(size, scale) {
  const off = (size - 32 * scale) / 2, raw = Buffer.alloc(size * (size * 4 + 1));
  for (let Y = 0; Y < size; Y++) {
    raw[Y * (size * 4 + 1)] = 0;
    for (let X = 0; X < size; X++) {
      const hex = color(Math.floor((X - off) / scale), Math.floor((Y - off) / scale)), i = Y * (size * 4 + 1) + 1 + X * 4;
      raw[i] = parseInt(hex.slice(1, 3), 16); raw[i + 1] = parseInt(hex.slice(3, 5), 16); raw[i + 2] = parseInt(hex.slice(5, 7), 16); raw[i + 3] = 255;
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
for (const [name, size, scale] of [['icon-192', 192, 6], ['icon-512', 512, 16], ['maskable-512', 512, 12], ['apple-touch-icon', 180, 5], ['favicon', 64, 2]]) {
  writeFileSync(new URL(`../icons/${name}.png`, import.meta.url), png(size, scale));
}
console.log('icons/ written');
