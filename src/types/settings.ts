export type ModelType =
  | "Xenova/segformer-b0-finetuned-ade-512-512"
  | "Xenova/segformer-b2-finetuned-ade-512-512";

export interface RemovalSettings {
  model: ModelType;
  threshold: number;
  softness: number;
  edgeEnhancement: number;
  cleanup: boolean;
  backgroundColor: string;
  preserveDetails: boolean;
  removeShades: boolean;
  finetuneMode: boolean;
}

export const defaultSettings: RemovalSettings = {
  model: "Xenova/segformer-b2-finetuned-ade-512-512",
  threshold: 0.35,
  softness: 0.3,
  edgeEnhancement: 0.4,
  cleanup: true,
  backgroundColor: "transparent",
  preserveDetails: true,
  removeShades: true,
  finetuneMode: false,
};

export interface ImageSegmentationOptions {
  model: ModelType;
  stride?: number;
  quantize?: boolean;
  cleanup?: boolean;
}
