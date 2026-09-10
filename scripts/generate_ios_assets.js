import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');
const iosDir = path.resolve(publicDir, 'ios');
const logoPath = path.resolve(publicDir, 'Logo.png');

if (!fs.existsSync(iosDir)) {
  fs.mkdirSync(iosDir, { recursive: true });
}

// 1. Iconos de iOS (con padding del 10% y fondo nítido)
const iconSizes = [
  { name: 'apple-touch-icon-180x180.png', size: 180 },
  { name: 'apple-touch-icon-167x167.png', size: 167 },
  { name: 'apple-touch-icon-152x152.png', size: 152 },
  { name: 'apple-touch-icon-120x120.png', size: 120 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 }
];

// 2. Splash Screens para iOS (Fondo azul SIAT #0F172A con logo centrado)
const splashScreens = [
  { name: 'apple-splash-2048-2732.png', width: 2048, height: 2732, logoSize: 512 },
  { name: 'apple-splash-1668-2388.png', width: 1668, height: 2388, logoSize: 450 },
  { name: 'apple-splash-1536-2048.png', width: 1536, height: 2048, logoSize: 400 },
  { name: 'apple-splash-1284-2778.png', width: 1284, height: 2778, logoSize: 380 },
  { name: 'apple-splash-1170-2532.png', width: 1170, height: 2532, logoSize: 350 },
  { name: 'apple-splash-1125-2436.png', width: 1125, height: 2436, logoSize: 340 },
  { name: 'apple-splash-828-1792.png', width: 828, height: 1792, logoSize: 280 },
  { name: 'apple-splash-750-1334.png', width: 750, height: 1334, logoSize: 250 },
  { name: 'apple-splash-siat.png', width: 1170, height: 2532, logoSize: 350 }
];

async function generateAssets() {
  console.log('🎨 Generando iconos de iOS redimensionados con Sharp...');

  for (const item of iconSizes) {
    const paddedLogoSize = Math.round(item.size * 0.82);
    const padding = Math.round((item.size - paddedLogoSize) / 2);

    const resizedLogoBuffer = await sharp(logoPath)
      .resize(paddedLogoSize, paddedLogoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // Guardar en public/ios/ y en public/
    await sharp({
      create: {
        width: item.size,
        height: item.size,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // Fondo #0F172A
      }
    })
    .composite([{ input: resizedLogoBuffer, top: padding, left: padding }])
    .png()
    .toFile(path.resolve(iosDir, item.name));

    // Copia en public/ para máxima compatibilidad
    fs.copyFileSync(path.resolve(iosDir, item.name), path.resolve(publicDir, item.name));
    console.log(` ✅ Generado: ${item.name} (${item.size}x${item.size})`);
  }

  console.log('\n📱 Generando Splash Screens oficiales de iOS (#0F172A)...');

  for (const splash of splashScreens) {
    const resizedLogo = await sharp(logoPath)
      .resize(splash.logoSize, splash.logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const top = Math.round((splash.height - splash.logoSize) / 2);
    const left = Math.round((splash.width - splash.logoSize) / 2);

    await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // Azul SIAT
      }
    })
    .composite([{ input: resizedLogo, top, left }])
    .png()
    .toFile(path.resolve(iosDir, splash.name));

    fs.copyFileSync(path.resolve(iosDir, splash.name), path.resolve(publicDir, splash.name));
    console.log(` ✅ Generado: ${splash.name} (${splash.width}x${splash.height})`);
  }

  console.log('\n🎉 ¡Todos los assets de iOS y Splash screens fueron generados con éxito!');
}

generateAssets().catch(err => {
  console.error('Error generando assets:', err);
  process.exit(1);
});
