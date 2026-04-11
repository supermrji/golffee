#!/usr/bin/env node
// Pure Node.js PNG generator – no external deps
const fs = require('fs');
const zlib = require('zlib');

const W = 180, H = 180;
const img = Buffer.alloc(W * H * 4, 0);

function px(x, y, r, g, b, a = 255) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  img[i] = r; img[i+1] = g; img[i+2] = b; img[i+3] = a;
}

function circle(cx, cy, rad, r, g, b, a = 255) {
  for (let y = Math.floor(cy - rad - 1); y <= Math.ceil(cy + rad + 1); y++) {
    for (let x = Math.floor(cx - rad - 1); x <= Math.ceil(cx + rad + 1); x++) {
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (d <= rad) { px(x, y, r, g, b, a); }
      else if (d <= rad + 1) {
        const alpha = Math.round((rad + 1 - d) * a);
        px(x, y, r, g, b, alpha);
      }
    }
  }
}

function rect(x1, y1, x2, y2, r, g, b, a = 255) {
  for (let y = Math.max(0,y1); y <= Math.min(H-1,y2); y++)
    for (let x = Math.max(0,x1); x <= Math.min(W-1,x2); x++)
      px(x, y, r, g, b, a);
}

// ── Background: very dark green ─────────────────────────────
rect(0, 0, W-1, H-1, 10, 18, 12);

// ── Golf green (ellipse at bottom half) ─────────────────────
// Draw a wide flat oval
for (let dy = -28; dy <= 28; dy++) {
  const rw = Math.round(68 * Math.sqrt(1 - (dy/28)**2));
  rect(90 - rw, 138 + dy, 90 + rw, 138 + dy, 18, 52, 28);
}

// ── Flag pole ───────────────────────────────────────────────
rect(87, 36, 90, 138, 230, 230, 230);

// ── Flag (right-pointing triangle from pole, emerald) ───────
for (let fy = 36; fy <= 90; fy++) {
  const prog = (fy - 36) / 54; // 0 at top, 1 at bottom
  const fw = Math.round(52 * (1 - prog)); // wide at top, narrows down
  rect(91, fy, 91 + fw, fy, 52, 211, 153);
}

// ── Golf ball (white, with subtle shadow) ───────────────────
circle(60, 142, 13, 240, 240, 240);
// Dimples
circle(56, 138, 2.5, 210, 210, 210);
circle(63, 136, 2.5, 210, 210, 210);
circle(58, 144, 2.5, 210, 210, 210);
circle(65, 144, 2,   210, 210, 210);

// ── Hole (dark circle on the green) ─────────────────────────
circle(113, 144, 7, 6, 12, 8);

// ── PNG encode ───────────────────────────────────────────────
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const tb = Buffer.from(type);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([len, tb, data, crcVal]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 4)] = 0;
  img.copy(raw, y * (1 + W * 4) + 1, y * W * 4, (y + 1) * W * 4);
}

const idat = zlib.deflateSync(raw, { level: 9 });

const png = Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = 'public/apple-touch-icon.png';
fs.writeFileSync(out, png);
console.log(`✓ ${out} (${W}x${H}, ${png.length} bytes)`);
