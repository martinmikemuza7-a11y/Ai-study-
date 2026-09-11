import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // Raw RGBA pixel buffer: each scanline starts with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // Calculate gradient & center shield circle
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isInside = dist < (width * 0.42);

      if (isInside) {
        // Indigo / purple core with sparkle
        const factor = 1 - (dist / (width * 0.42));
        rawData[pixelOffset] = Math.min(255, Math.floor(r * 0.6 + 99 * factor));
        rawData[pixelOffset + 1] = Math.min(255, Math.floor(g * 0.6 + 102 * factor));
        rawData[pixelOffset + 2] = Math.min(255, Math.floor(b * 0.8 + 241 * factor));
        rawData[pixelOffset + 3] = 255;
      } else {
        // Dark slate navy background
        rawData[pixelOffset] = 15;
        rawData[pixelOffset + 1] = 23;
        rawData[pixelOffset + 2] = 42;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Standard CRC32 for PNG chunks
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
    }
  }
  return ~c >>> 0;
}

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

fs.writeFileSync('public/pwa-192x192.png', createPng(192, 192, 79, 70, 229));
fs.writeFileSync('public/pwa-512x512.png', createPng(512, 512, 79, 70, 229));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPng(512, 512, 67, 56, 202));
fs.writeFileSync('public/apple-touch-icon.png', createPng(180, 180, 79, 70, 229));

console.log('PWA PNG icons generated successfully!');
