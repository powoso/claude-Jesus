const sharp = require('sharp');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'favicon.svg');
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// Splash screen: centered logo on sage green background
function createSplashSvg(width, height) {
  const logoSize = Math.min(width, height) * 0.3;
  const x = (width - logoSize) / 2;
  const y = (height - logoSize) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#7C9070"/>
    <svg x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" viewBox="0 0 512 512" fill="none">
      <defs>
        <radialGradient id="glow" cx="50%" cy="62%" r="45%">
          <stop offset="0%" stop-color="#F5D990" stop-opacity="0.9"/>
          <stop offset="50%" stop-color="#D4A84B" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#7C9070" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="256" cy="340" rx="260" ry="180" fill="url(#glow)"/>
      <g stroke="#F5D990" stroke-opacity="0.35" stroke-width="3" stroke-linecap="round">
        <line x1="256" y1="310" x2="60" y2="200"/>
        <line x1="256" y1="310" x2="40" y2="280"/>
        <line x1="256" y1="310" x2="80" y2="360"/>
        <line x1="256" y1="310" x2="100" y2="140"/>
        <line x1="256" y1="310" x2="452" y2="200"/>
        <line x1="256" y1="310" x2="472" y2="280"/>
        <line x1="256" y1="310" x2="432" y2="360"/>
        <line x1="256" y1="310" x2="412" y2="140"/>
        <line x1="256" y1="310" x2="180" y2="80"/>
        <line x1="256" y1="310" x2="332" y2="80"/>
        <line x1="256" y1="310" x2="256" y2="60"/>
      </g>
      <line x1="0" y1="340" x2="512" y2="340" stroke="#F5D990" stroke-opacity="0.2" stroke-width="2"/>
      <path d="M180 340 A76 76 0 0 1 332 340" fill="#F5D990" fill-opacity="0.5"/>
      <rect x="240" y="98" width="36" height="260" rx="6" fill="#5A6B52" fill-opacity="0.3" transform="translate(4,4)"/>
      <rect x="176" y="168" width="164" height="36" rx="6" fill="#5A6B52" fill-opacity="0.3" transform="translate(4,4)"/>
      <rect x="238" y="95" width="36" height="265" rx="6" fill="white"/>
      <rect x="174" y="165" width="164" height="36" rx="6" fill="white"/>
    </svg>
  </svg>`;
}

// Android splash screen sizes
const splashScreens = [
  // Portrait
  { dir: 'drawable', w: 480, h: 800 },
  { dir: 'drawable-port-mdpi', w: 320, h: 480 },
  { dir: 'drawable-port-hdpi', w: 480, h: 800 },
  { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
  { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
  { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
  // Landscape
  { dir: 'drawable-land-mdpi', w: 480, h: 320 },
  { dir: 'drawable-land-hdpi', w: 800, h: 480 },
  { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
  { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
  { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
];

async function generate() {
  for (const { dir, w, h } of splashScreens) {
    const svg = createSplashSvg(w, h);
    const outPath = path.join(androidResDir, dir, 'splash.png');
    await sharp(Buffer.from(svg)).resize(w, h).png().toFile(outPath);
    console.log(`Generated ${dir}/splash.png (${w}x${h})`);
  }
  console.log('\nAll splash screens generated!');
}

generate().catch(console.error);
