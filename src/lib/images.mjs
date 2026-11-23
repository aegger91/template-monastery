// Reads intrinsic width/height of local JPEG, PNG and SVG files so every
// <img> gets width/height attributes (no layout shift).
import fs from 'node:fs';
import path from 'node:path';

const cache = new Map();

function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

function svgSize(text) {
  const vb = text.match(/viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/);
  return vb ? { width: Math.round(+vb[1]), height: Math.round(+vb[2]) } : null;
}

export function imageSize(publicDir, src) {
  if (!src || /^(https?:|data:)/.test(src)) return null;
  if (cache.has(src)) return cache.get(src);
  const file = path.join(publicDir, src.replace(/^\//, ''));
  let size = null;
  try {
    const buf = fs.readFileSync(file);
    if (/\.jpe?g$/i.test(file)) size = jpegSize(buf);
    else if (/\.png$/i.test(file)) size = { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    else if (/\.svg$/i.test(file)) size = svgSize(buf.toString('utf8'));
  } catch {
    size = null;
  }
  cache.set(src, size);
  return size;
}
