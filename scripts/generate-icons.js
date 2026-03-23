// Generate PNG icons from SVG for PWA and native apps
// Run: node scripts/generate-icons.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = path.join(__dirname, '..', 'public', 'icons', 'icon.svg');
const outputDir = path.join(__dirname, '..', 'public', 'icons');

// Check if we have a tool to convert SVG to PNG
// Try sharp (Node.js), then fall back to ImageMagick/rsvg
async function generateIcons() {
  let useSharp = false;
  
  try {
    require.resolve('sharp');
    useSharp = true;
  } catch {
    // sharp not installed
  }

  if (useSharp) {
    const sharp = require('sharp');
    const svgBuffer = fs.readFileSync(svgPath);
    
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${outputPath}`);
    }
  } else {
    // Try using rsvg-convert or ImageMagick convert
    let cmd = '';
    try {
      execSync('which rsvg-convert', { stdio: 'ignore' });
      cmd = 'rsvg-convert';
    } catch {
      try {
        execSync('which convert', { stdio: 'ignore' });
        cmd = 'convert';
      } catch {
        console.log('⚠ No image converter found. Install one of:');
        console.log('  npm install sharp');
        console.log('  sudo apt install librsvg2-bin');
        console.log('  sudo apt install imagemagick');
        console.log('');
        console.log('Creating placeholder PNGs with canvas fallback...');
        createPlaceholders();
        return;
      }
    }

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      if (cmd === 'rsvg-convert') {
        execSync(`rsvg-convert -w ${size} -h ${size} "${svgPath}" -o "${outputPath}"`);
      } else {
        execSync(`convert -background none -resize ${size}x${size} "${svgPath}" "${outputPath}"`);
      }
      console.log(`✓ Generated ${outputPath}`);
    }
  }
  
  console.log('\n✅ All icons generated!');
}

function createPlaceholders() {
  // Create minimal 1x1 transparent PNGs as placeholders
  // Users should replace these with real icons
  const minimalPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    if (!fs.existsSync(outputPath)) {
      fs.writeFileSync(outputPath, minimalPng);
      console.log(`⚠ Created placeholder ${outputPath} (replace with real ${size}x${size} icon)`);
    }
  }
  console.log('\n⚠ Placeholder icons created. Replace with real PNGs for production.');
}

generateIcons().catch(console.error);
