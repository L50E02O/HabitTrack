import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorio public si no existe
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Colores del tema de la app
const backgroundColor = '#1a1a1a'; // Fondo oscuro
const primaryColor = '#4a90e2'; // Azul principal
const accentColor = '#6bcf7f'; // Verde para el ícono de hábito

// SVG para el icono (una planta/hoja que representa crecimiento de hábitos)
const iconSvg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="${backgroundColor}"/>
  <g transform="translate(256, 256)">
    <!-- Círculo de fondo -->
    <circle cx="0" cy="0" r="200" fill="${primaryColor}" opacity="0.2"/>
    
    <!-- Planta/Hábito - Hoja principal -->
    <path d="M -80 -60 Q -100 -100 -80 -140 Q -60 -100 -40 -80 Q -60 -40 -80 -60 Z" 
          fill="${accentColor}" opacity="0.9"/>
    
    <!-- Hoja secundaria -->
    <path d="M 40 -80 Q 20 -120 40 -160 Q 60 -120 80 -100 Q 60 -60 40 -80 Z" 
          fill="${accentColor}" opacity="0.7"/>
    
    <!-- Tallo -->
    <line x1="0" y1="0" x2="0" y2="-140" stroke="${accentColor}" stroke-width="12" stroke-linecap="round"/>
    
    <!-- Círculo central (representa el hábito) -->
    <circle cx="0" cy="-20" r="25" fill="${primaryColor}"/>
    
    <!-- Líneas de crecimiento -->
    <path d="M -60 -40 Q -40 -60 -20 -40" stroke="${primaryColor}" stroke-width="4" fill="none" opacity="0.6"/>
    <path d="M 20 -40 Q 40 -60 60 -40" stroke="${primaryColor}" stroke-width="4" fill="none" opacity="0.6"/>
  </g>
</svg>
`;

async function generateIcons() {
  try {
    console.log('🎨 Generando iconos PWA...');
    
    // Generar icon-192.png
    await sharp(Buffer.from(iconSvg))
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✅ icon-192.png creado');
    
    // Generar icon-512.png
    await sharp(Buffer.from(iconSvg))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✅ icon-512.png creado');
    
    // Generar badge.png (96x96 para notificaciones)
    await sharp(Buffer.from(iconSvg))
      .resize(96, 96)
      .png()
      .toFile(path.join(publicDir, 'badge.png'));
    console.log('✅ badge.png creado');
    
    console.log('✨ Todos los iconos generados exitosamente!');
  } catch (error) {
    console.error('❌ Error generando iconos:', error);
    process.exit(1);
  }
}

generateIcons();

