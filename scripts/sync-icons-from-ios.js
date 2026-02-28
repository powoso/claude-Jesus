const sharp = require('sharp');
const path = require('path');

const iosIconPath = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png');
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const publicDir = path.join(__dirname, '..', 'public');

// Android launcher icon sizes (with rounded corners like iOS)
const launcherSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Android adaptive icon foreground sizes (108dp base, scaled per density)
const foregroundSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

// PWA icon sizes
const pwaSizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  const iosIcon = sharp(iosIconPath);
  const metadata = await iosIcon.metadata();
  console.log(`iOS icon: ${metadata.width}x${metadata.height}`);

  // Generate Android launcher icons (ic_launcher.png) from iOS icon
  for (const [dir, size] of Object.entries(launcherSizes)) {
    const outPath = path.join(androidResDir, dir, 'ic_launcher.png');
    await sharp(iosIconPath).resize(size, size).png().toFile(outPath);
    console.log(`  ${dir}/ic_launcher.png (${size}px)`);
  }

  // Generate round launcher icons
  for (const [dir, size] of Object.entries(launcherSizes)) {
    const roundPath = path.join(androidResDir, dir, 'ic_launcher_round.png');
    const resized = await sharp(iosIconPath).resize(size, size).png().toBuffer();
    const circle = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
    );
    await sharp(resized)
      .composite([{ input: await sharp(circle).resize(size, size).png().toBuffer(), blend: 'dest-in' }])
      .png()
      .toFile(roundPath);
    console.log(`  ${dir}/ic_launcher_round.png (${size}px, round)`);
  }

  // Generate adaptive icon foreground from iOS icon
  // Adaptive icons: 108dp grid where only the center 72dp is fully visible (66.7%)
  // We need to center the content in the 108dp canvas
  for (const [dir, fgSize] of Object.entries(foregroundSizes)) {
    const contentSize = Math.round(fgSize * 0.667); // ~72dp equivalent
    const padding = Math.round((fgSize - contentSize) / 2);
    
    const resizedContent = await sharp(iosIconPath).resize(contentSize, contentSize).png().toBuffer();
    
    // Create transparent canvas and composite the icon centered
    const canvas = await sharp({
      create: { width: fgSize, height: fgSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).png().toBuffer();
    
    await sharp(canvas)
      .composite([{ input: resizedContent, top: padding, left: padding }])
      .png()
      .toFile(path.join(androidResDir, dir, 'ic_launcher_foreground.png'));
    console.log(`  ${dir}/ic_launcher_foreground.png (${fgSize}px, adaptive fg)`);
  }

  // Generate PWA icons from iOS icon
  for (const size of pwaSizes) {
    await sharp(iosIconPath).resize(size, size).png().toFile(path.join(publicDir, `icon-${size}.png`));
    console.log(`  public/icon-${size}.png (${size}px)`);
  }

  // Generate maskable icons (with extra padding for safe zone)
  for (const size of [192, 512]) {
    const contentSize = Math.round(size * 0.8);
    const padding = Math.round((size - contentSize) / 2);
    const resized = await sharp(iosIconPath).resize(contentSize, contentSize).png().toBuffer();
    const canvas = await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 124, g: 144, b: 112, alpha: 255 } }
    }).png().toBuffer();
    await sharp(canvas)
      .composite([{ input: resized, top: padding, left: padding }])
      .png()
      .toFile(path.join(publicDir, `icon-maskable-${size}.png`));
    console.log(`  public/icon-maskable-${size}.png (${size}px, maskable)`);
  }

  console.log('\nAll icons synced from iOS icon!');
}

generate().catch(console.error);
