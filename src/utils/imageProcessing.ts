import { ProcessingCallback } from "@/types";
import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = false;

const MAX_DIMENSION = 1024;

// Processing callback type

// Optimized resize function
const resizeImage = async (
  image: HTMLImageElement
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  let { width, height } = image;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
};

const applyMask = (
  imageData: ImageData,
  mask: {
    data: Float32Array | Uint8Array | Uint8ClampedArray;
    width: number;
    height: number;
  }
) => {
  const { data } = imageData;
  const { width, height } = imageData;
  const scaleX = width / mask.width;
  const scaleY = height / mask.height;

  const maskData = new Float32Array(mask.data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const maskX = Math.min(Math.floor(x / scaleX), mask.width - 1);
      const maskY = Math.min(Math.floor(y / scaleY), mask.height - 1);
      let maskValue = maskData[maskY * mask.width + maskX];
      // can be chnage later
      const threshold = 0.4;
      const softness = 0.25;

      maskValue =
        maskValue > threshold
          ? maskValue < threshold + softness
            ? (maskValue - threshold) / softness
            : 1
          : 0;

      const index = (y * width + x) * 4;
      data[index + 3] = Math.round(255 * (1 - maskValue));
    }
  }
};

export const removeBackground = async (
  imageElement: HTMLImageElement,
  updateProgress: ProcessingCallback
): Promise<Blob> => {
  try {
    const canvas = await resizeImage(imageElement);
    updateProgress(20);

    const segmenter = await pipeline(
      "image-segmentation",
      "Xenova/segformer-b0-finetuned-ade-512-512"
    );
    updateProgress(40);

    const imageUrl = canvas.toDataURL("image/png");
    const result = await segmenter(imageUrl);
    updateProgress(60);

    if (!result?.[0]?.mask) throw new Error("Segmentation failed");

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;

    const ctx = outputCanvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyMask(imageData, result[0].mask);
    ctx.putImageData(imageData, 0, 0);

    updateProgress(80);

    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Failed to create blob")),
        "image/png",
        1.0
      );
    });
  } catch (error) {
    console.error("Background removal failed:", error);
    throw error;
  }
};

export const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image loading failed"));
    img.src = URL.createObjectURL(file);
  });

export const exportImage = async (
  imageUrl: string,
  format: "png" | "jpeg" | "webp" = "png"
): Promise<Blob> => {
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(img, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Failed to export image")),
      `image/${format === "jpeg" ? "jpeg" : format}`,
      format === "jpeg" ? 0.9 : 1
    );
  });
};

export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
