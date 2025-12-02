// Simple script to create placeholder icons
import fs from 'fs';
import path from 'path';

// Create a simple SVG icon
const svgIcon = `
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="20" fill="url(#grad1)"/>
  <text x="64" y="45" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="white">CE</text>
  <text x="64" y="75" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" fill="white" opacity="0.8">Context Engine</text>
</svg>
`;

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Write the SVG icon
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon);

console.log('Placeholder SVG icon created in public/icons/icon.svg');
console.log('You can convert this to different sizes (16x16, 32x32, 48x48, 128x128) for production use');