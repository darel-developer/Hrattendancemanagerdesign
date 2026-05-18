const zlib = require('zlib');
const fs = require('fs');

// CRC32 table
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const lb = Buffer.alloc(4); lb.writeUInt32BE(data.length, 0);
  const cb = Buffer.alloc(4); cb.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([lb, tb, data, cb]);
}

function encodePNG(rgba, w, h) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA

  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter None
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4, d = y * (1 + w * 4) + 1 + x * 4;
      raw[d] = rgba[s]; raw[d+1] = rgba[s+1]; raw[d+2] = rgba[s+2]; raw[d+3] = rgba[s+3];
    }
  }
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })), pngChunk('IEND', Buffer.alloc(0))]);
}

function drawIcon(size) {
  const rgba = new Uint8Array(size * size * 4);
  const sc = size / 512;

  function blend(x, y, r, g, b, a) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    const sa = a / 255, da = rgba[i+3] / 255, oa = sa + da * (1 - sa);
    if (oa > 0) {
      rgba[i]   = Math.round((r * sa + rgba[i]   * da * (1 - sa)) / oa);
      rgba[i+1] = Math.round((g * sa + rgba[i+1] * da * (1 - sa)) / oa);
      rgba[i+2] = Math.round((b * sa + rgba[i+2] * da * (1 - sa)) / oa);
      rgba[i+3] = Math.round(oa * 255);
    }
  }

  // Rounded rect background #6366F1
  const cr = Math.round(80 * sc);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inside = (x >= cr && x < size - cr) || (y >= cr && y < size - cr);
      if (!inside) {
        const cx = x < cr ? cr : size - 1 - cr, cy = y < cr ? cr : size - 1 - cr;
        inside = (x - cx) ** 2 + (y - cy) ** 2 <= cr * cr;
      }
      if (inside) blend(x, y, 0x63, 0x66, 0xF1, 255);
    }
  }

  // Filled circle with anti-aliasing
  function fillCircle(svgCx, svgCy, svgR, r, g, b, a) {
    const cx = svgCx * sc, cy = svgCy * sc, rad = svgR * sc;
    for (let y = Math.floor(cy - rad - 1); y <= Math.ceil(cy + rad + 1); y++) {
      for (let x = Math.floor(cx - rad - 1); x <= Math.ceil(cx + rad + 1); x++) {
        const dist = Math.sqrt((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2);
        if (dist < rad + 0.5) {
          const alpha = Math.min(1, rad + 0.5 - dist);
          blend(x, y, r, g, b, Math.round(a * alpha));
        }
      }
    }
  }

  fillCircle(176, 176, 64, 255, 255, 255, 255);
  fillCircle(336, 176, 64, 255, 255, 255, Math.round(255 * 0.7));

  // Filled rounded rect
  function fillRoundedRect(svgX, svgY, svgW, svgH, svgRx, r, g, b, a) {
    const x0 = Math.round(svgX * sc), y0 = Math.round(svgY * sc);
    const w = Math.round(svgW * sc), h = Math.round(svgH * sc), rx = Math.round(svgRx * sc);
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        const lx = x - x0, ly = y - y0;
        let inside = (lx >= rx && lx < w - rx) || (ly >= rx && ly < h - rx);
        if (!inside) {
          const ccx = lx < rx ? rx : w - 1 - rx, ccy = ly < rx ? rx : h - 1 - rx;
          inside = (lx - ccx) ** 2 + (ly - ccy) ** 2 <= rx * rx;
        }
        if (inside) blend(x, y, r, g, b, a);
      }
    }
  }

  fillRoundedRect(64, 288, 384, 48, 24, 255, 255, 255, 255);
  fillRoundedRect(64, 368, 256, 48, 24, 255, 255, 255, Math.round(255 * 0.6));

  return Buffer.from(rgba);
}

for (const size of [192, 512]) {
  const pixels = drawIcon(size);
  const png = encodePNG(pixels, size, size);
  const outPath = `public/icon-${size}.png`;
  fs.writeFileSync(outPath, png);
  console.log(`Generated ${outPath} (${png.length} bytes)`);
}
