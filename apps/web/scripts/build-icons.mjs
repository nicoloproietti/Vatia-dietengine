/**
 * Genera le icone dell'app (quadrate, a tutto fondo: iOS ci applica da
 * sé la maschera con gli angoli tondi). Verde brand, "V" bianca.
 *
 *   node apps/web/scripts/build-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(here, '../public');

const GREEN = [0x0f, 0x8a, 0x43];
const WHITE = [0xff, 0xff, 0xff];

/** Distanza di un punto dal segmento AB, per disegnare tratti spessi. */
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function crc32(buf) {
  let c;
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  // "V": due tratti che scendono al centro-basso e risalgono a destra
  const s = size;
  const top = s * 0.30;
  const bottom = s * 0.72;
  const left = s * 0.28;
  const right = s * 0.72;
  const mid = s * 0.5;
  const half = s * 0.075;      // metà spessore del tratto
  const aa = s * 0.012;        // ammorbidimento dei bordi

  const raw = Buffer.alloc(s * (s * 4 + 1));
  let p = 0;
  for (let y = 0; y < s; y++) {
    raw[p++] = 0;              // filtro "none" per riga
    for (let x = 0; x < s; x++) {
      const cx = x + 0.5;
      const cy = y + 0.5;
      const d = Math.min(
        distToSegment(cx, cy, left, top, mid, bottom),
        distToSegment(cx, cy, mid, bottom, right, top),
      );
      // 1 dentro la V, 0 fuori, sfumato sul bordo
      const k = Math.max(0, Math.min(1, (half - d) / aa + 0.5));
      for (let c = 0; c < 3; c++) raw[p++] = Math.round(GREEN[c] + (WHITE[c] - GREEN[c]) * k);
      raw[p++] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(s, 0);
  ihdr.writeUInt32BE(s, 4);
  ihdr[8] = 8;    // bit depth
  ihdr[9] = 6;    // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  const buf = png(size);
  writeFileSync(resolve(OUT_DIR, name), buf);
  console.log(`${name} — ${size}×${size}, ${(buf.length / 1024).toFixed(1)} kB`);
}
