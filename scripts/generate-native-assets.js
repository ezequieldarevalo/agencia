// Generate native splash screen and app icon assets for Android and iOS
// Run: node scripts/generate-native-assets.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SVG_ICON = path.join(ROOT, 'public', 'icons', 'icon.svg');

// ---- SPLASH SCREEN ----
async function generateSplash() {
  const svgBuffer = fs.readFileSync(SVG_ICON);

  // Android splash drawables
  const androidSplashSizes = [
    { dir: 'drawable', w: 480, h: 800 },
    { dir: 'drawable-port-hdpi', w: 480, h: 800 },
    { dir: 'drawable-port-mdpi', w: 320, h: 480 },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
    { dir: 'drawable-land-hdpi', w: 800, h: 480 },
    { dir: 'drawable-land-mdpi', w: 480, h: 320 },
    { dir: 'drawable-land-xhdpi', w: 1280, h: 720 },
    { dir: 'drawable-land-xxhdpi', w: 1600, h: 960 },
    { dir: 'drawable-land-xxxhdpi', w: 1920, h: 1280 },
  ];

  for (const { dir, w, h } of androidSplashSizes) {
    const outDir = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', dir);
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'splash.png');

    // Icon size is ~40% of the smallest dimension
    const iconSize = Math.round(Math.min(w, h) * 0.4);

    await sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: { r: 3, g: 7, b: 18, alpha: 1 }, // #030712
      },
    })
      .composite([{
        input: await sharp(svgBuffer).resize(iconSize, iconSize).png().toBuffer(),
        gravity: 'centre',
      }])
      .png()
      .toFile(outPath);

    console.log(`✓ Android splash: ${dir} (${w}x${h})`);
  }

  // iOS splash screens (all same size scaled)
  const iosSplashDir = path.join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset');
  const iosSplashSize = 2732;
  const iosIconSize = Math.round(iosSplashSize * 0.25);

  const splashBuffer = await sharp({
    create: {
      width: iosSplashSize,
      height: iosSplashSize,
      channels: 4,
      background: { r: 3, g: 7, b: 18, alpha: 1 },
    },
  })
    .composite([{
      input: await sharp(svgBuffer).resize(iosIconSize, iosIconSize).png().toBuffer(),
      gravity: 'centre',
    }])
    .png()
    .toBuffer();

  for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
    await sharp(splashBuffer).toFile(path.join(iosSplashDir, name));
    console.log(`✓ iOS splash: ${name}`);
  }
}

// ---- APP ICONS ----
async function generateAppIcons() {
  const svgBuffer = fs.readFileSync(SVG_ICON);

  // Android mipmap icons
  const androidIconSizes = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 },
  ];

  for (const { dir, size } of androidIconSizes) {
    const outDir = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', dir);
    fs.mkdirSync(outDir, { recursive: true });

    // Regular icon
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, 'ic_launcher.png'));

    // Round icon
    const roundMask = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`
    );

    await sharp(svgBuffer)
      .resize(size, size)
      .composite([{ input: roundMask, blend: 'dest-in' }])
      .png()
      .toFile(path.join(outDir, 'ic_launcher_round.png'));

    // Foreground (for adaptive icons)
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, 'ic_launcher_foreground.png'));

    console.log(`✓ Android icon: ${dir} (${size}x${size})`);
  }

  // iOS App Icon (1024x1024)
  const iosIconDir = path.join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');

  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(iosIconDir, 'AppIcon-512@2x.png'));

  console.log('✓ iOS icon: AppIcon-512@2x.png (1024x1024)');
}

async function main() {
  console.log('🎨 Generating native assets...\n');

  console.log('--- Splash Screens ---');
  await generateSplash();

  console.log('\n--- App Icons ---');
  await generateAppIcons();

  console.log('\n✅ All native assets generated!');
}

main().catch(console.error);
