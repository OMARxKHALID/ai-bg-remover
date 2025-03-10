import { ProcessingCallback, ImageProcessingResult } from "@/types";
import { RemovalSettings } from "@/types";
import { pipeline, env } from "@huggingface/transformers";
import { ModelType } from "@/types/settings";
import { toast } from "sonner";

env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_DIMENSION = 1024;

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
  },
  settings: RemovalSettings
) => {
  const { data } = imageData;
  const { width, height } = imageData;
  const scaleX = width / mask.width;
  const scaleY = height / mask.height;

  const maskData = new Float32Array(mask.data);
  const enhancedMask = new Float32Array(maskData.length);

  // First pass: Enhance edges
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      const idx = y * mask.width + x;
      let maskValue = maskData[idx];

      // Improved threshold logic
      const threshold = settings.threshold;
      const softness = settings.softness;
      const edgeEnhancement = settings.edgeEnhancement;

      // Apply threshold with improved softness
      if (
        maskValue > threshold - softness &&
        maskValue < threshold + softness
      ) {
        maskValue = (maskValue - (threshold - softness)) / (2 * softness);
      } else {
        maskValue = maskValue > threshold ? 1 : 0;
      }

      // Enhanced edge detection
      if (edgeEnhancement > 0 && maskValue > 0 && maskValue < 1) {
        let neighbors = 0;
        let neighborCount = 0;
        let edgeDetected = false;

        // Check surrounding pixels for edges
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < mask.width && ny >= 0 && ny < mask.height) {
              const neighborValue = maskData[ny * mask.width + nx];
              neighbors += neighborValue;
              neighborCount++;

              if (Math.abs(neighborValue - maskValue) > 0.3) {
                edgeDetected = true;
              }
            }
          }
        }

        if (edgeDetected) {
          const avgNeighbor = neighbors / neighborCount;
          const edgeFactor = edgeEnhancement * 0.5;
          maskValue =
            maskValue > avgNeighbor
              ? Math.min(1, maskValue + edgeFactor)
              : Math.max(0, maskValue - edgeFactor);
        }
      }

      enhancedMask[idx] = maskValue;
    }
  }

  // Second pass: Clean up isolated pixels
  if (settings.cleanup) {
    const cleanMask = new Float32Array(enhancedMask);
    for (let y = 1; y < mask.height - 1; y++) {
      for (let x = 1; x < mask.width - 1; x++) {
        const idx = y * mask.width + x;
        const current = enhancedMask[idx];

        // Count different neighbors
        let differentNeighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nidx = (y + dy) * mask.width + (x + dx);
            if (Math.abs(enhancedMask[nidx] - current) > 0.5) {
              differentNeighbors++;
            }
          }
        }

        // Remove isolated pixels
        if (differentNeighbors >= 6) {
          cleanMask[idx] = 1 - current;
        }
      }
    }
    enhancedMask.set(cleanMask);
  }

  // Apply the enhanced mask
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const maskX = Math.min(Math.floor(x / scaleX), mask.width - 1);
      const maskY = Math.min(Math.floor(y / scaleY), mask.height - 1);
      const maskValue = enhancedMask[maskY * mask.width + maskX];

      const index = (y * width + x) * 4;
      data[index + 3] = Math.round(255 * (1 - maskValue));
    }
  }
};

export const removeBackground = async (
  imageUrl: string,
  settings: RemovalSettings,
  onProgress?: ProcessingCallback
): Promise<string> => {
  try {
    const updateProgress = (progress: number, status?: string) => {
      if (typeof onProgress === "function") {
        onProgress(Math.min(100, Math.round(progress)), status);
      }
    };

    updateProgress(0, "Loading AI model...");
    const model = await loadModel(settings.model);
    updateProgress(20, "Model loaded, processing image...");

    const image = await loadImageFromUrl(imageUrl);
    const canvas = await resizeImage(image);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");

    updateProgress(40, "Analyzing image...");

    // Convert canvas to base64 for model input
    const base64Image = canvas.toDataURL("image/png");
    const segmentation = await model(base64Image);
    updateProgress(60, "Generating mask...");

    // Use generateMask to create the mask
    const maskData = await generateMask(image, []); // Pass any points if needed

    // Get the output canvas ready
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext("2d");
    if (!outputCtx) throw new Error("Failed to get canvas context");

    // Draw original image
    outputCtx.drawImage(canvas, 0, 0);
    const outputImageData = outputCtx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Apply mask with settings
    applyMask(outputImageData, maskData, {
      ...settings,
      threshold: settings.threshold, // Use the threshold directly
    });

    outputCtx.putImageData(outputImageData, 0, 0);
    updateProgress(80, "Applying background color...");

    // Apply background color if not transparent
    if (settings.backgroundColor !== "transparent") {
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height;
      const finalCtx = finalCanvas.getContext("2d");
      if (!finalCtx) throw new Error("Failed to get canvas context");

      finalCtx.fillStyle = settings.backgroundColor;
      finalCtx.fillRect(0, 0, canvas.width, canvas.height);
      finalCtx.drawImage(outputCanvas, 0, 0);
    }

    updateProgress(100, "Done!");
    return outputCanvas.toDataURL("image/png");
  } catch (error) {
    console.error("Error removing background:", error);
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

const loadImageFromUrl = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image loading failed"));
    img.src = url;
  });

const loadModel = async (modelName: ModelType) => {
  try {
    return await pipeline("image-segmentation", modelName);
  } catch (error) {
    console.error("Error loading model:", error);
    if (modelName !== "Xenova/segformer-b0-finetuned-ade-512-512") {
      toast.error(
        "Failed to load preferred model, falling back to basic model"
      );
      return await pipeline(
        "image-segmentation",
        "Xenova/segformer-b0-finetuned-ade-512-512"
      );
    }
    throw error;
  }
};

export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

interface Point {
  x: number;
  y: number;
  type: "foreground" | "background";
}

export const processImageWithPoints = async (
  imageUrl: string,
  points: Point[],
  settings: RemovalSettings,
  onProgress?: ProcessingCallback
): Promise<ImageProcessingResult> => {
  try {
    const updateProgress = (progress: number, status?: string) => {
      if (typeof onProgress === "function") {
        onProgress(Math.min(100, Math.round(progress)), status);
      }
    };

    updateProgress(0, "Loading AI model...");
    const model = await loadModel(settings.model);

    const image = await loadImageFromUrl(imageUrl);
    const canvas = await resizeImage(image);
    updateProgress(20, "Processing image...");

    // Convert canvas to base64 for model input
    const base64Image = canvas.toDataURL("image/png");

    // Process image without points first
    const segmentation = await model(base64Image);
    updateProgress(60, "Generating mask...");

    // Create mask from segmentation
    const maskData = {
      data: new Float32Array(segmentation[0].score),
      width: canvas.width,
      height: canvas.height,
    };

    // Apply points influence to the mask
    points.forEach((point) => {
      const radius = 5; // Influence radius
      const value = point.type === "foreground" ? 1 : 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = Math.floor(point.x + dx);
          const y = Math.floor(point.y + dy);

          if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            const influence = Math.max(0, 1 - distance / radius);
            const idx = y * canvas.width + x;
            maskData.data[idx] =
              value * influence + maskData.data[idx] * (1 - influence);
          }
        }
      }
    });

    // Apply the mask
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const ctx = outputCanvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");

    ctx.drawImage(canvas, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    applyMask(imageData, maskData, {
      ...settings,
      threshold: 1 - settings.threshold, // Invert threshold to keep foreground
    });

    ctx.putImageData(imageData, 0, 0);
    updateProgress(100, "Done!");

    return {
      imageUrl: outputCanvas.toDataURL("image/png"),
      mask: imageData,
    };
  } catch (error) {
    console.error("Error processing image with points:", error);
    throw error;
  }
};

export const createMaskPreview = (
  originalImage: HTMLImageElement,
  mask: ImageData,
  settings: RemovalSettings
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  canvas.width = originalImage.width;
  canvas.height = originalImage.height;

  // Draw original image
  ctx.drawImage(originalImage, 0, 0);

  // Overlay mask with semi-transparency
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const maskValue = mask.data[i / 4];
    if (maskValue > settings.threshold) {
      imageData.data[i + 3] = Math.round(255 * (1 - maskValue)); // Alpha channel
    }
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas;
};

// Add this helper function for mask generation
const generateMask = async (
  image: HTMLImageElement,
  points: Point[] = []
): Promise<ImageData> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  canvas.width = image.width;
  canvas.height = image.height;

  // Create a default mask
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = new Float32Array(canvas.width * canvas.height);

  // Initialize with default values
  for (let i = 0; i < data.length; i++) {
    data[i] = 0.5; // Default mask value
  }

  // Apply points influence
  points.forEach((point) => {
    const radius = 5; // Influence radius
    const value = point.type === "foreground" ? 1 : 0;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = Math.floor(point.x + dx);
        const y = Math.floor(point.y + dy);
        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - distance / radius);
          const idx = y * canvas.width + x;
          data[idx] = value * influence + data[idx] * (1 - influence);
        }
      }
    }
  });

  // Convert to ImageData format
  for (let i = 0; i < data.length; i++) {
    const value = Math.round(data[i] * 255);
    const idx = i * 4;
    imageData.data[idx] = value;
    imageData.data[idx + 1] = value;
    imageData.data[idx + 2] = value;
    imageData.data[idx + 3] = 255; // Fully opaque
  }

  return imageData;
};

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
