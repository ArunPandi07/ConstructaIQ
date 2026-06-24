import * as THREE from 'three';

/**
 * Seeded pseudo-random number generator
 */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/**
 * Generate a simple noise value for procedural textures
 */
function noise2D(x: number, y: number, _random: () => number): number {
  const X = Math.floor(x);
  const Y = Math.floor(y);
  const fx = x - X;
  const fy = y - Y;

  // Smooth interpolation
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);

  // Hash function for grid corners
  const hash = (ix: number, iy: number) => {
    return (Math.sin(ix * 12.9898 + iy * 78.233) * 43758.5453) % 1;
  };

  // Interpolate between grid corners
  const a = hash(X, Y);
  const b = hash(X + 1, Y);
  const c = hash(X, Y + 1);
  const d = hash(X + 1, Y + 1);

  const k0 = a;
  const k1 = b - a;
  const k2 = c - a;
  const k3 = a - b - c + d;

  return k0 + k1 * u + k2 * v + k3 * u * v;
}

/**
 * Generate a concrete normal map using Canvas
 */
export function generateConcreteNormalMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  const random = seededRandom(42);
  const scale = 0.08; // Frequency of noise

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Generate multi-octave noise for surface detail
      let noiseValue = 0;
      let amplitude = 1.0;
      let frequency = 1.0;

      // 3 octaves of noise
      for (let octave = 0; octave < 3; octave++) {
        noiseValue +=
          noise2D(x * scale * frequency, y * scale * frequency, random) * amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
      }

      // Normalize to 0-1 range
      noiseValue = (noiseValue + 1.0) * 0.5;

      // Convert to normal map colors
      // Normal maps use RGB to store XYZ normals
      // Neutral (flat) is RGB(128, 128, 255)
      // We add slight bumps by varying R and G channels

      const bumpStrength = 20; // How much the normals deviate
      const centerValue = 128;

      const r = Math.max(
        0,
        Math.min(255, centerValue + (noiseValue - 0.5) * bumpStrength)
      );
      const g = Math.max(
        0,
        Math.min(255, centerValue + (noiseValue - 0.5) * bumpStrength * 0.7)
      );
      const b = 255; // Z component always points up

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255; // Alpha
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;

  return texture;
}

/**
 * Generate a concrete roughness map using Canvas
 */
export function generateConcreteRoughnessMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  const random = seededRandom(123);
  const scale = 0.1;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Generate noise for roughness variation
      const noiseValue = noise2D(x * scale, y * scale, random);

      // Map to roughness range (0.7 - 0.95) -> (179 - 242)
      const minRoughness = 179; // ~0.7 normalized
      const maxRoughness = 242; // ~0.95 normalized
      const roughnessValue = Math.floor(
        minRoughness + (noiseValue + 1) * 0.5 * (maxRoughness - minRoughness)
      );

      data[idx] = roughnessValue;
      data[idx + 1] = roughnessValue;
      data[idx + 2] = roughnessValue;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;

  return texture;
}

/**
 * Generate a brushed steel normal map using Canvas
 */
export function generateSteelBrushedNormalMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  const random = seededRandom(789);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Horizontal streaks for brushed metal effect
      const streakNoise = noise2D(x * 0.02, y * 0.3, random);

      const bumpStrength = 15;
      const centerValue = 128;

      // Vary mostly in X direction for horizontal brushing
      const r = Math.max(
        0,
        Math.min(255, centerValue + streakNoise * bumpStrength)
      );
      const g = centerValue; // Less variation in Y
      const b = 255;

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;

  return texture;
}

// Singleton cache for procedural textures
let concreteNormalMapCache: THREE.CanvasTexture | null = null;
let concreteRoughnessMapCache: THREE.CanvasTexture | null = null;
let steelBrushedNormalMapCache: THREE.CanvasTexture | null = null;

/**
 * Get or create concrete normal map (cached)
 */
export function getConcreteNormalMap(): THREE.CanvasTexture {
  if (!concreteNormalMapCache) {
    concreteNormalMapCache = generateConcreteNormalMap();
  }
  return concreteNormalMapCache;
}

/**
 * Get or create concrete roughness map (cached)
 */
export function getConcreteRoughnessMap(): THREE.CanvasTexture {
  if (!concreteRoughnessMapCache) {
    concreteRoughnessMapCache = generateConcreteRoughnessMap();
  }
  return concreteRoughnessMapCache;
}

/**
 * Get or create steel brushed normal map (cached)
 */
export function getSteelBrushedNormalMap(): THREE.CanvasTexture {
  if (!steelBrushedNormalMapCache) {
    steelBrushedNormalMapCache = generateSteelBrushedNormalMap();
  }
  return steelBrushedNormalMapCache;
}

/**
 * Procedural tile cladding albedo map
 */
export function generateTileCladdingMap(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas 2D context");

  const tileW = 32;
  const tileH = 16;
  ctx.fillStyle = "#d8dce2";
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += tileH) {
    for (let x = 0; x < size; x += tileW) {
      const shade = 210 + Math.floor(((x + y) % 3) * 6);
      ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 4})`;
      ctx.fillRect(x + 1, y + 1, tileW - 2, tileH - 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural brick cladding albedo map
 */
export function generateBrickCladdingMap(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas 2D context");

  const brickW = 40;
  const brickH = 14;
  ctx.fillStyle = "#8a5a48";
  ctx.fillRect(0, 0, size, size);

  for (let row = 0; row < size / brickH; row++) {
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    for (let x = -offset; x < size; x += brickW) {
      const r = 160 + ((row * 7 + x) % 25);
      const g = 90 + ((row * 3 + x) % 18);
      const b = 70 + ((row + x) % 12);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x + 2, row * brickH + 2, brickW - 4, brickH - 4);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural wood floor albedo map (Herringbone pattern)
 */
export function generateWoodFloorMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas 2D context");

  const plankW = 120;
  const plankH = 30;
  
  // Base background
  ctx.fillStyle = "#111111"; // dark grout
  ctx.fillRect(0, 0, size, size);

  // Draw herringbone pattern
  // We draw at a 45 degree angle by rotating the context
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.rotate(Math.PI / 4);
  ctx.translate(-size, -size); // back up to cover the corners after rotation

  const drawArea = size * 2;
  
  for (let col = 0; col < drawArea / plankW; col++) {
    for (let row = 0; row < drawArea / plankH; row++) {
      const isA = col % 2 === 0;
      
      const x = col * plankW;
      const y = row * plankH;
      
      // Wood color variation
      const base = 120 + ((col * 7 + row * 11) % 40);
      ctx.fillStyle = `rgb(${base + 20}, ${base}, ${base - 30})`;
      
      if (isA) {
        ctx.fillRect(x + 1, y + 1, plankW - 2, plankH - 2);
        // Wood grain
        ctx.strokeStyle = `rgba(60, 40, 20, 0.15)`;
        for (let i = 0; i < plankW; i += 8) {
          ctx.beginPath();
          ctx.moveTo(x + i, y + 1);
          ctx.lineTo(x + i + 4, y + plankH - 1);
          ctx.stroke();
        }
      } else {
        // Interlocking column is shifted
        const yShift = y - (plankW / 2);
        ctx.fillRect(x + 1, yShift + 1, plankW - 2, plankH - 2);
        // Wood grain
        ctx.strokeStyle = `rgba(60, 40, 20, 0.15)`;
        for (let i = 0; i < plankW; i += 8) {
          ctx.beginPath();
          ctx.moveTo(x + i, yShift + 1);
          ctx.lineTo(x + i + 4, yShift + plankH - 1);
          ctx.stroke();
        }
      }
    }
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural road map with dashed lane markings
 */
function generateRoadMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas 2D context");

  // Asphalt base
  ctx.fillStyle = "#333333";
  ctx.fillRect(0, 0, size, size);
  
  // Add some noise
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for(let i=0; i<1000; i++) {
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }

  // Dashed white line down the middle
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 8;
  ctx.setLineDash([30, 30]); // 30px dash, 30px gap
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.stroke();
  
  // Solid yellow lines on edges
  ctx.setLineDash([]);
  ctx.strokeStyle = "#e6b800";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(20, 0); ctx.lineTo(20, size);
  ctx.moveTo(size - 20, 0); ctx.lineTo(size - 20, size);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural grass patch albedo map
 */
export function generateGrassMap(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas 2D context");

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const random = seededRandom(456);
  const scale = 0.15;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const n = noise2D(x * scale, y * scale, random);
      const g = Math.floor(90 + n * 35);
      data[idx] = Math.floor(g * 0.6);
      data[idx + 1] = g;
      data[idx + 2] = Math.floor(g * 0.45);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

let tileCladdingMapCache: THREE.CanvasTexture | null = null;
let brickCladdingMapCache: THREE.CanvasTexture | null = null;
let woodFloorMapCache: THREE.CanvasTexture | null = null;
let grassMapCache: THREE.CanvasTexture | null = null;
let pavingMapCache: THREE.CanvasTexture | null = null;
let roadMapCache: THREE.CanvasTexture | null = null;

export function getTileCladdingMap(): THREE.CanvasTexture {
  if (!tileCladdingMapCache) tileCladdingMapCache = generateTileCladdingMap();
  return tileCladdingMapCache;
}

export function getBrickCladdingMap(): THREE.CanvasTexture {
  if (!brickCladdingMapCache) brickCladdingMapCache = generateBrickCladdingMap();
  return brickCladdingMapCache;
}

export function getWoodFloorMap(): THREE.CanvasTexture {
  if (!woodFloorMapCache) woodFloorMapCache = generateWoodFloorMap();
  return woodFloorMapCache;
}

export function getGrassMap(): THREE.CanvasTexture {
  if (!grassMapCache) grassMapCache = generateGrassMap();
  return grassMapCache;
}

function generatePavingMap(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const slabSize = 24;
  const groutW = 2;
  const lightColor = '#d6d0c8';
  const groutColor = '#a8a29a';

  ctx.fillStyle = lightColor;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = groutColor;
  for (let x = 0; x < size; x += slabSize + groutW) {
    ctx.fillRect(x, 0, groutW, size);
  }
  for (let y = 0; y < size; y += slabSize + groutW) {
    ctx.fillRect(0, y, size, groutW);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function getPavingMap(): THREE.CanvasTexture {
  if (!pavingMapCache) pavingMapCache = generatePavingMap();
  return pavingMapCache;
}

export function getRoadMap(): THREE.CanvasTexture {
  if (!roadMapCache) roadMapCache = generateRoadMap();
  return roadMapCache;
}
