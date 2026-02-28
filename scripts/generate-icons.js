const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = '/home/user/claude-Jesus/public/favicon.svg';
const publicDir = '/home/user/claude-Jesus/public';
const svgBuffer = fs.readFileSync(svgPath);

// Create a maskable version of the SVG with extra padding (safe zone)
// Android adaptive icons need a 10% safe zone on each side
// The original SVG is 512x512, we need to add padding so content fits in 80% of area
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
  <rect width="640" height="640" fill="#7C9070"/>
  <g transform="translate(64, 64)">
    ${svgBuffer.toString().replace(/<\/?svg[^>]*>/g, '')}
  </g>
</svg>`;

async function generate() {
  const sizes = [
    // PWA icons
    { name: 'icon-72.png', size: 72 },
    { name: 'icon-96.png', size: 96 },
    { name: 'icon-128.png', size: 128 },
    { name: 'icon-144.png', size: 144 },
    { name: 'icon-152.png', size: 152 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-384.png', size: 384 },
    { name: 'icon-512.png', size: 512 },
  ];
  
  const maskableSizes = [
    { name: 'icon-maskable-192.png', size: 192 },
    { name: 'icon-maskable-512.png', size: 512 },
  ];

  // Generate regular icons from the SVG
  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, name));
    console.log(`Generated ${name}`);
  }

  // Generate maskable icons (with padding for safe zone)
  for (const { name, size } of maskableSizes) {
    await sharp(Buffer.from(maskableSvg))
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, name));
    console.log(`Generated ${name} (maskable)`);
  }

  console.log('All icons generated!');
}

generate().catch(console.error);
