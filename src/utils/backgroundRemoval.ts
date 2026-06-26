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
// generator paints behind every figure. We kill green pixels by alpha and then
// despill any greenish fringe so edges don't read as a halo.
const chromaKeyGreen = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    // "Green-ness": how much green dominates the other channels.
    const greenDominance = g - Math.max(r, b);
    if (greenDominance > 60 && g > 90) {
      // Solid green backdrop -> fully transparent.
      d[i + 3] = 0;
    } else if (greenDominance > 15) {
      // Edge spill: fade alpha proportionally and pull green down toward
      // the average of red/blue so the silhouette doesn't glow lime.
      const spill = (greenDominance - 15) / 45; // 0..~1
      d[i + 3] = Math.max(0, Math.round(d[i + 3] * (1 - spill * 0.85)));
      const target = (r + b) / 2;
      d[i + 1] = Math.round(g + (target - g) * Math.min(1, spill * 1.2));
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
