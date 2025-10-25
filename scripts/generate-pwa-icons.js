#!/usr/bin/env node

/**
 * Simple PWA Icon Generator for DuitTrack
 * Creates placeholder PNG icons using canvas (for development)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 DuitTrack PWA Icon Generator');
console.log('================================\n');

const staticDir = path.join(__dirname, '..', 'static');

// Ensure static directory exists
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
  console.log('✅ Created static directory');
}

// Create a simple 1x1 PNG with proper header (valid PNG)
// This is a minimal valid PNG file that browsers will accept
function createMinimalPNG(width, height) {
  // This creates a minimal valid PNG file (magenta square as placeholder)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  ]);

  // For simplicity, create a data URL-based approach
  // We'll write SVG files that work as fallback
  return null;
}

// Generate SVG-based icons (browsers support SVG for PWA icons)
const sizes = [
  { size: 16, filename: 'favicon-16x16.png' },
  { size: 32, filename: 'favicon-32x32.png' },
  { size: 192, filename: 'pwa-192x192.png' },
  { size: 512, filename: 'pwa-512x512.png' },
];

sizes.forEach(({ size, filename }) => {
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="grad-${size}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow-${size}">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background with gradient -->
  <rect width="${size}" height="${size}" fill="url(#grad-${size})" rx="${size * 0.15}"/>

  <!-- Emoji/Icon -->
  <text
    x="50%"
    y="50%"
    font-size="${size * 0.65}"
    text-anchor="middle"
    dominant-baseline="central"
    fill="white"
    font-family="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif"
    filter="url(#shadow-${size})"
  >💰</text>

  <!-- Subtle shine effect -->
  <circle cx="${size * 0.3}" cy="${size * 0.3}" r="${size * 0.15}" fill="white" opacity="0.2"/>
</svg>`;

  const svgPath = path.join(staticDir, filename.replace('.png', '.svg'));
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✅ Created ${filename.replace('.png', '.svg')} (${size}x${size})`);
});

console.log('\n🎉 Icon generation complete!');
console.log('\n📝 Note: Generated as SVG files. Update manifest.json to use .svg extension');
console.log('   or use an online tool like https://realfavicongenerator.net/ to create PNG icons.');
console.log('\n💡 For production, consider using proper PNG icons with your brand logo.');
