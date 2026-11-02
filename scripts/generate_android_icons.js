import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.resolve(__dirname, '../src/assets/Logo.png');
const resDir = path.resolve(__dirname, '../android/app/src/main/res');

const densities = [
  { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
];

async function generateAndroidIcons() {
  console.log('🤖 Generando iconos de Android para SIAT desde Logo.png...');

  if (!fs.existsSync(logoPath)) {
    throw new Error(`Logo no encontrado en: ${logoPath}`);
  }

  // 1. Eliminar drawable-v24/ic_launcher_foreground.xml obsoleto si existe
  const obsoleteVectorForeground = path.resolve(resDir, 'drawable-v24', 'ic_launcher_foreground.xml');
  if (fs.existsSync(obsoleteVectorForeground)) {
    fs.unlinkSync(obsoleteVectorForeground);
    console.log(' 🗑️ Eliminado vector por defecto de Android (drawable-v24/ic_launcher_foreground.xml)');
  }

  // 2. Asegurar color de fondo blanco en values/ic_launcher_background.xml
  const valuesDir = path.resolve(resDir, 'values');
  if (!fs.existsSync(valuesDir)) {
    fs.mkdirSync(valuesDir, { recursive: true });
  }
  const bgXmlPath = path.resolve(valuesDir, 'ic_launcher_background.xml');
  const bgXmlContent = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FFFFFF</color>\n</resources>\n`;
  fs.writeFileSync(bgXmlPath, bgXmlContent, 'utf-8');
  console.log(' 🎨 Verificado fondo blanco en values/ic_launcher_background.xml');

  // 3. Generar para cada densidad
  for (const d of densities) {
    const targetDir = path.resolve(resDir, d.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // A) ic_launcher_foreground.png (Adaptive Icon Foreground, 108dp base)
    // El logo ocupa el ~70% para no ser recortado por máscaras circulares o squircle
    const fgLogoSize = Math.round(d.fgSize * 0.70);
    const fgPadding = Math.round((d.fgSize - fgLogoSize) / 2);

    const resizedFgLogo = await sharp(logoPath)
      .resize(fgLogoSize, fgLogoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: d.fgSize,
        height: d.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{ input: resizedFgLogo, top: fgPadding, left: fgPadding }])
    .png()
    .toFile(path.resolve(targetDir, 'ic_launcher_foreground.png'));

    // B) ic_launcher.png (Legacy Square/Rounded)
    const iconLogoSize = Math.round(d.size * 0.74);
    const iconPadding = Math.round((d.size - iconLogoSize) / 2);
    const radius = Math.round(d.size * 0.18);

    const roundedSvg = Buffer.from(
      `<svg width="${d.size}" height="${d.size}"><rect x="0" y="0" width="${d.size}" height="${d.size}" rx="${radius}" ry="${radius}" fill="#FFFFFF"/></svg>`
    );

    const resizedIconLogo = await sharp(logoPath)
      .resize(iconLogoSize, iconLogoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp(roundedSvg)
      .png()
      .composite([{ input: resizedIconLogo, top: iconPadding, left: iconPadding }])
      .toFile(path.resolve(targetDir, 'ic_launcher.png'));

    // C) ic_launcher_round.png (Legacy Circular)
    const roundLogoSize = Math.round(d.size * 0.68);
    const roundPadding = Math.round((d.size - roundLogoSize) / 2);

    const circleSvg = Buffer.from(
      `<svg width="${d.size}" height="${d.size}"><circle cx="${d.size / 2}" cy="${d.size / 2}" r="${d.size / 2}" fill="#FFFFFF"/></svg>`
    );

    const resizedRoundLogo = await sharp(logoPath)
      .resize(roundLogoSize, roundLogoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp(circleSvg)
      .png()
      .composite([{ input: resizedRoundLogo, top: roundPadding, left: roundPadding }])
      .toFile(path.resolve(targetDir, 'ic_launcher_round.png'));

    console.log(` ✅ Generados iconos en ${d.dir} (ic_launcher ${d.size}x${d.size}, foreground ${d.fgSize}x${d.fgSize})`);
  }

  console.log('\n🚀 ¡Todos los iconos de Android Launcher fueron generados exitosamente con Logo.png!');
}

generateAndroidIcons().catch((err) => {
  console.error('❌ Error generando iconos de Android:', err);
  process.exit(1);
});

