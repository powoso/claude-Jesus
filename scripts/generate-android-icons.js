const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'favicon.svg');
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const svgBuffer = fs.readFileSync(svgPath);

// Android adaptive icon: foreground is 108dp with 72dp visible area (66.7%)
// We need to render the SVG content centered in 108dp canvas
// The SVG viewBox is 0 0 512 512 with rounded rect clipping
// For the foreground, we want just the cross/sunrise content on transparent bg

// Create foreground SVG (content centered with adaptive icon safe zone padding)
// Adaptive icons: 108x108 grid, only 72x72 center is guaranteed visible = 33% padding each side
const foregroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" fill="none">
  <defs>
    <radialGradient id="glow" cx="50%" cy="62%" r="45%">
      <stop offset="0%" stop-color="#F5D990" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#D4A84B" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#7C9070" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Sunrise glow -->
  <ellipse cx="54" cy="71.7" rx="54.8" ry="38" fill="url(#glow)"/>
  <!-- Sunrise rays -->
  <g stroke="#F5D990" stroke-opacity="0.35" stroke-width="0.63" stroke-linecap="round">
    <line x1="54" y1="65.4" x2="12.66" y2="42.19"/>
    <line x1="54" y1="65.4" x2="8.44" y2="59.06"/>
    <line x1="54" y1="65.4" x2="16.88" y2="75.94"/>
    <line x1="54" y1="65.4" x2="21.09" y2="29.53"/>
    <line x1="54" y1="65.4" x2="95.34" y2="42.19"/>
    <line x1="54" y1="65.4" x2="99.56" y2="59.06"/>
    <line x1="54" y1="65.4" x2="91.13" y2="75.94"/>
    <line x1="54" y1="65.4" x2="86.91" y2="29.53"/>
    <line x1="54" y1="65.4" x2="37.97" y2="16.88"/>
    <line x1="54" y1="65.4" x2="70.03" y2="16.88"/>
    <line x1="54" y1="65.4" x2="54" y2="12.66"/>
  </g>
  <!-- Horizon line -->
  <line x1="0" y1="71.7" x2="108" y2="71.7" stroke="#F5D990" stroke-opacity="0.2" stroke-width="0.42"/>
  <!-- Sun semicircle -->
  <path d="M37.97 71.7 A16.03 16.03 0 0 1 70.03 71.7" fill="#F5D990" fill-opacity="0.5"/>
  <!-- Cross shadow -->
  <rect x="50.63" y="20.67" width="7.59" height="54.84" rx="1.27" fill="#5A6B52" fill-opacity="0.3" transform="translate(0.84,0.84)"/>
  <rect x="37.13" y="35.44" width="34.59" height="7.59" rx="1.27" fill="#5A6B52" fill-opacity="0.3" transform="translate(0.84,0.84)"/>
  <!-- Cross -->
  <rect x="50.2" y="20.04" width="7.59" height="55.9" rx="1.27" fill="white"/>
  <rect x="36.7" y="34.81" width="34.59" height="7.59" rx="1.27" fill="white"/>
</svg>`;

// Full icon (for ic_launcher.png and ic_launcher_round.png) - with background
const fullIconSvg = svgBuffer.toString();

// Android density sizes for adaptive icon foreground: 108dp base
// mdpi: 108px, hdpi: 162px, xhdpi: 216px, xxhdpi: 324px, xxxhdpi: 432px
const foregroundSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

// Launcher icon sizes
// mdpi: 48px, hdpi: 72px, xhdpi: 96px, xxhdpi: 144px, xxxhdpi: 192px
const launcherSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function generate() {
  // Generate foreground icons (for adaptive icons)
  for (const [dir, size] of Object.entries(foregroundSizes)) {
    const outPath = path.join(androidResDir, dir, 'ic_launcher_foreground.png');
    await sharp(Buffer.from(foregroundSvg))
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${dir}/ic_launcher_foreground.png (${size}px)`);
  }

  // Generate launcher icons (full logo with background)
  for (const [dir, size] of Object.entries(launcherSizes)) {
    // Regular launcher icon
    const launcherPath = path.join(androidResDir, dir, 'ic_launcher.png');
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(launcherPath);
    console.log(`Generated ${dir}/ic_launcher.png (${size}px)`);

    // Round launcher icon (same content, circular clip is handled by Android)
    const roundPath = path.join(androidResDir, dir, 'ic_launcher_round.png');
    const roundBuffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
    
    // Create circular mask
    const circle = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
    );
    
    await sharp(roundBuffer)
      .composite([{ input: await sharp(circle).resize(size, size).png().toBuffer(), blend: 'dest-in' }])
      .png()
      .toFile(roundPath);
    console.log(`Generated ${dir}/ic_launcher_round.png (${size}px)`);
  }

  console.log('\nAll Android icons generated!');
}

generate().catch(console.error);
