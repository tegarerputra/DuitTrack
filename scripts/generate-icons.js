// Simple icon generator for DuitTrack PWA
// Creates basic PNG icons from text

import fs from 'fs';
import path from 'path';

// Create a simple PNG header (PNG signature + IHDR chunk for RGBA image)
function createPNG(width, height, pixels) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdr = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // length
    Buffer.from('IHDR'),
    ihdrData,
    Buffer.from([ihdrCrc >>> 24, (ihdrCrc >>> 16) & 0xFF, (ihdrCrc >>> 8) & 0xFF, ihdrCrc & 0xFF])
  ]);

  // Simple IDAT chunk with minimal compressed data
  const simpleData = Buffer.from([0x78, 0x9C, 0x01, 0x01, 0x00, 0x00, 0xFE, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x01]);
  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), simpleData]));
  const idat = Buffer.concat([
    Buffer.from([0, 0, 0, simpleData.length]),
    Buffer.from('IDAT'),
    simpleData,
    Buffer.from([idatCrc >>> 24, (idatCrc >>> 16) & 0xFF, (idatCrc >>> 8) & 0xFF, idatCrc & 0xFF])
  ]);

  // IEND chunk
  const iendCrc = crc32(Buffer.from('IEND'));
  const iend = Buffer.concat([
    Buffer.from([0, 0, 0, 0]),
    Buffer.from('IEND'),
    Buffer.from([iendCrc >>> 24, (iendCrc >>> 16) & 0xFF, (idatCrc >>> 8) & 0xFF, iendCrc & 0xFF])
  ]);

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Simple CRC32 implementation
function crc32(data) {
  const crcTable = [];
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 1) ? (0xEDB88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    crcTable[i] = crc;
  }

  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Use base64 encoded minimal PNG images instead
function createMinimalPNG() {
  // This is a minimal 1x1 transparent PNG
  const base64PNG = `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zwAAAABJRU5ErkJggg==`;
  return Buffer.from(base64PNG, 'base64');
}

// Generate proper icon images using a better approach
// Since we can't easily generate complex images, let's create simple colored squares

function createColoredSquare(size, color) {
  // Create a simple PNG with solid color
  // This is a basic approach - in a real app you'd use proper image generation

  // For now, create a better base64 encoded PNG
  const data = [];

  // PNG signature
  data.push(...[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // Create a simple colored square as base64
  const coloredSquareBase64 = {
    192: `iVBORw0KGgoAAAANSUhEUgAAAMAAAADAAQMAAABoEv5EAAAABlBMVEVmfuraP6L/////l0+rAAAACklEQVR4nO3BMQEAAADCIPuntsYOYAAAAAAAAAAAAAAAAAAAAAA+AQAABAAaWzTnAAAAAElFTkSuQmCC`,
    512: `iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAQMAAADOtka5AAAABlBMVEVmfuraP6L/////l0+rAAAACklEQVR4nO3BMQEAAADCIPuntsYOYAAAAAAAAAAAAAAAAAAAAAA+AQAABAAaWzTnAAAAAElFTkSuQmCC`
  };

  return Buffer.from(coloredSquareBase64[size] || coloredSquareBase64[192], 'base64');
}

// Generate icons
console.log('Generating PWA icons...');

try {
  const staticDir = path.join(process.cwd(), 'static');

  // Generate 192x192 icon
  const icon192 = createColoredSquare(192);
  fs.writeFileSync(path.join(staticDir, 'pwa-192x192.png'), icon192);
  console.log('✓ Created pwa-192x192.png');

  // Generate 512x512 icon
  const icon512 = createColoredSquare(512);
  fs.writeFileSync(path.join(staticDir, 'pwa-512x512.png'), icon512);
  console.log('✓ Created pwa-512x512.png');

  console.log('PWA icons generated successfully!');
} catch (error) {
  console.error('Error generating icons:', error);
}