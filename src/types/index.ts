export type { RemovalSettings } from "./settings";
import type { RemovalSettings } from "./settings";

export type ProcessingStatus = "processing" | "completed" | "error";
export interface ProcessingStep {
  message: string;
  status: ProcessingStatus;
  timestamp: number;
}
export interface ImagePreviewProps {
  originalUrl: string;
  processedUrl?: string;
  isProcessing: boolean;
  isModelLoading: boolean;
  progress: number;
  processingSteps: ProcessingStep[];
  settings: RemovalSettings;
  onSettingsChange: (settings: RemovalSettings) => void;
  setOriginalImageUrl: (url: string | null) => void;
  onReprocess: () => void;
}
export interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
}
export type PreviewTab = "original" | "processed";
export interface Point {
  x: number;
  y: number;
  type: "foreground" | "background";
}

export interface ProcessingCallback {
  (progress: number, status?: string): void;
}

export interface ImageProcessingResult {
  imageUrl: string;
  mask?: ImageData;
}
