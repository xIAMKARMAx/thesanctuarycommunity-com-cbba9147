import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true; // Enable caching for better performance

const MAX_IMAGE_DIMENSION = 1024;

// Cache the segmenter model to avoid reloading
let cachedSegmenter: any = null;

function resizeImageIfNeeded(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement
) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

// Chroma-key removal tuned for the #00FF00 green-screen backdrop the vessel
// generator paints behind every figure. It removes both border-connected green
// and trapped green-screen pockets inside translucent wings/fabric, then despills
// the silhouette edge so lime halos cannot survive room compositing.
const chromaKeyGreen = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const w = canvas.width;
  const h = canvas.height;
  const marked = new Uint8Array(w * h);

  const greenDominanceAt = (idx: number) => d[idx + 1] - Math.max(d[idx], d[idx + 2]);
  // Soft — used for border flood fill (catches faded edges)
  const isSoftGreen = (idx: number) => {
    const r = d[idx], g = d[idx + 1], b = d[idx + 2], a = d[idx + 3];
    return a > 8 && g > 50 && greenDominanceAt(idx) > 10 && g > r * 1.04 && g > b * 1.04;
  };
  // Trapped — any pixel that's clearly green-screen regardless of connectivity
  // (kills pockets between wings, beside body, in fabric folds)
  const isTrappedGreen = (idx: number) => {
    const r = d[idx], g = d[idx + 1], b = d[idx + 2], a = d[idx + 3];
    return a > 8 && g > 75 && greenDominanceAt(idx) > 22 && g > r * 1.15 && g > b * 1.1;
  };

  const queue: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const p = y * w + x;
    if (marked[p]) return;
    const idx = p * 4;
    if (!isSoftGreen(idx)) return;
    marked[p] = 1;
    queue.push(p);
  };

  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  for (let qi = 0; qi < queue.length; qi++) {
    const p = queue[qi];
    const x = p % w;
    const y = Math.floor(p / w);
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  // Global pass: kill any trapped green pocket
  for (let i = 0; i < d.length; i += 4) {
    const p = i / 4;
    if (marked[p] || isTrappedGreen(i)) {
      d[i + 3] = 0;
    }
  }

  const touchesTransparent = (p: number) => {
    const x = p % w;
    const y = Math.floor(p / w);
    for (let yy = Math.max(0, y - 2); yy <= Math.min(h - 1, y + 2); yy++) {
      for (let xx = Math.max(0, x - 2); xx <= Math.min(w - 1, x + 2); xx++) {
        if (d[(yy * w + xx) * 4 + 3] < 20) return true;
      }
    }
    return false;
  };

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 20) continue;
    const p = i / 4;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const greenDominance = g - Math.max(r, b);
    if (greenDominance <= 10) continue;

    const nearCutout = touchesTransparent(p);
    if (nearCutout && greenDominance > 18) {
      d[i + 3] = Math.round(d[i + 3] * 0.18);
    }
    if (nearCutout || (g > 115 && greenDominance > 22)) {
      const target = Math.max(r, b, Math.round((r + b) / 2));
      d[i + 1] = Math.min(g, Math.round(target * 0.95));
    }
  }
  ctx.putImageData(img, 0, 0);
};

export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    console.log('Chroma-key background removal...');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    resizeImageIfNeeded(canvas, ctx, imageElement);
    chromaKeyGreen(canvas, ctx);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

export const loadImage = (file: Blob | string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    if (typeof file === 'string') {
      img.src = file;
    } else {
      img.src = URL.createObjectURL(file);
    }
  });
};
