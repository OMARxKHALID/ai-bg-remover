/// <reference types="vite/client" />

// Add canvas toBlob types - to be explicit
interface HTMLCanvasElement {
  toBlob(
    callback: (blob: Blob | null) => void,
    type?: string,
    quality?: number
  ): void;
}
