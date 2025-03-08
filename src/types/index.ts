// Core types
export type ProcessingStatus = "processing" | "completed" | "error";

// Processing Steps
export interface ProcessingStep {
  message: string;
  status: ProcessingStatus;
  timestamp: number;
}

// Component Props
export interface ImagePreviewProps {
  originalUrl: string;
  processedUrl?: string;
  isProcessing: boolean;
  progress: number;
  processingSteps: ProcessingStep[];
  setOriginalImageUrl: (url: string | null) => void;
  onReprocess: () => void;
}

export interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
}

export type PreviewTab = "original" | "processed";
