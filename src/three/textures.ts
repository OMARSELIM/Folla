import * as THREE from 'three';

export interface ProceduralTextureSet {
  floorTile: THREE.CanvasTexture;
  rug: THREE.CanvasTexture;
  wood: THREE.CanvasTexture;
  quilt: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const anisotropy = Math.min(8, Math.max(1, maxAnisotropy));

  // 1. Andalusian Zellige Courtyard Floor Tile Texture
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = 512;
  tileCanvas.height = 512;
  const tCtx = tileCanvas.getContext('2d')!;
  tCtx.fillStyle = '#EFE4CF';
  tCtx.fillRect(0, 0, 512, 512);

  // Warm limestone grid tiles
  const step = 128;
  for (let y = 0; y < 512; y += step) {
    for (let x = 0; x < 512; x += step) {
      tCtx.fillStyle = ((x + y) / step) % 2 === 0 ? '#F4ECDC' : '#EADCC3';
      tCtx.fillRect(x + 2, y + 2, step - 4, step - 4);

      // Subtle Islamic 8-point geometric star diamond inlay at corners
      tCtx.strokeStyle = 'rgba(15, 107, 78, 0.22)';
      tCtx.lineWidth = 2;
      const cx = x + step / 2;
      const cy = y + step / 2;
      tCtx.save();
      tCtx.translate(cx, cy);
      tCtx.strokeRect(-14, -14, 28, 28);
      tCtx.rotate(Math.PI / 4);
      tCtx.strokeStyle = 'rgba(199, 131, 24, 0.24)';
      tCtx.strokeRect(-14, -14, 28, 28);
      tCtx.restore();
    }
  }
  const floorTile = new THREE.CanvasTexture(tileCanvas);
  floorTile.colorSpace = THREE.SRGBColorSpace;
  floorTile.wrapS = THREE.RepeatWrapping;
  floorTile.wrapT = THREE.RepeatWrapping;
  floorTile.repeat.set(5, 5);
  floorTile.anisotropy = anisotropy;

  // 2. Woven Prayer & Living Rug Texture
  const rugCanvas = document.createElement('canvas');
  rugCanvas.width = 512;
  rugCanvas.height = 512;
  const rCtx = rugCanvas.getContext('2d')!;
  rCtx.fillStyle = '#FAF3E4';
  rCtx.fillRect(0, 0, 512, 512);

  // Outer emerald border
  rCtx.strokeStyle = '#0F6B4E';
  rCtx.lineWidth = 28;
  rCtx.strokeRect(20, 20, 472, 472);

  // Inner saffron gold trim
  rCtx.strokeStyle = '#C78318';
  rCtx.lineWidth = 8;
  rCtx.strokeRect(46, 46, 420, 420);

  // Center medallion
  rCtx.fillStyle = '#E8F3EE';
  rCtx.beginPath();
  rCtx.arc(256, 256, 135, 0, Math.PI * 2);
  rCtx.fill();
  rCtx.strokeStyle = '#0F6B4E';
  rCtx.lineWidth = 5;
  rCtx.stroke();

  rCtx.save();
  rCtx.translate(256, 256);
  for (let i = 0; i < 8; i++) {
    rCtx.rotate(Math.PI / 4);
    rCtx.fillStyle = i % 2 === 0 ? 'rgba(15, 107, 78, 0.22)' : 'rgba(199, 131, 24, 0.25)';
    rCtx.fillRect(-45, -45, 90, 90);
  }
  rCtx.restore();

  const rug = new THREE.CanvasTexture(rugCanvas);
  rug.colorSpace = THREE.SRGBColorSpace;
  rug.anisotropy = anisotropy;

  // 3. Warm Honey Wood Grain Texture
  const woodCanvas = document.createElement('canvas');
  woodCanvas.width = 256;
  woodCanvas.height = 256;
  const wCtx = woodCanvas.getContext('2d')!;
  wCtx.fillStyle = '#A86E3E';
  wCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 42; i++) {
    wCtx.fillStyle = i % 2 === 0 ? 'rgba(72, 42, 18, 0.12)' : 'rgba(225, 180, 125, 0.08)';
    wCtx.fillRect(0, i * 6, 256, 3);
  }
  const wood = new THREE.CanvasTexture(woodCanvas);
  wood.colorSpace = THREE.SRGBColorSpace;
  wood.wrapS = THREE.RepeatWrapping;
  wood.wrapT = THREE.RepeatWrapping;
  wood.anisotropy = anisotropy;

  // 4. Cozy Patterned Quilt Texture
  const quiltCanvas = document.createElement('canvas');
  quiltCanvas.width = 256;
  quiltCanvas.height = 256;
  const qCtx = quiltCanvas.getContext('2d')!;
  qCtx.fillStyle = '#5BA98B';
  qCtx.fillRect(0, 0, 256, 256);
  qCtx.strokeStyle = 'rgba(250, 246, 238, 0.45)';
  qCtx.lineWidth = 4;
  for (let y = 0; y < 256; y += 64) {
    for (let x = 0; x < 256; x += 64) {
      qCtx.strokeRect(x + 8, y + 8, 48, 48);
      qCtx.fillStyle = 'rgba(230, 185, 86, 0.35)';
      qCtx.beginPath();
      qCtx.arc(x + 32, y + 32, 8, 0, Math.PI * 2);
      qCtx.fill();
    }
  }
  const quilt = new THREE.CanvasTexture(quiltCanvas);
  quilt.colorSpace = THREE.SRGBColorSpace;
  quilt.anisotropy = anisotropy;

  // 5. Soft Radial Contact Shadow Texture
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(28, 42, 36, 0.55)');
  grad.addColorStop(0.6, 'rgba(28, 42, 36, 0.2)');
  grad.addColorStop(1, 'rgba(28, 42, 36, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(shadowCanvas);

  return {
    floorTile,
    rug,
    wood,
    quilt,
    contactShadow,
    dispose: () => {
      floorTile.dispose();
      rug.dispose();
      wood.dispose();
      quilt.dispose();
      contactShadow.dispose();
    },
  };
}
