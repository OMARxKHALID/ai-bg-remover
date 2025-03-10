import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ProcessingStep } from "@/types";
import ImageUploader from "@/components/ImageUploader";
import ImagePreview from "@/components/ImagePreview";
import { ThemeToggle } from "@/components/ThemeToggle";
import { removeBackground } from "@/utils/imageProcessing";
import { Logo } from "@/components/Logo";
import { RemovalSettings } from "@/types/settings";

const Index = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [settings, setSettings] = useState<RemovalSettings>({
    model: "Xenova/segformer-b2-finetuned-ade-512-512",
    threshold: 0.2,
    softness: 0.2,
    edgeEnhancement: 0.3,
    cleanup: true,
    backgroundColor: "transparent",
    preserveDetails: true,
    removeShades: true,
    finetuneMode: false,
  });

  useEffect(() => {
    return () => {
      if (processedImageUrl && !processedImageUrl.startsWith("data:")) {
        URL.revokeObjectURL(processedImageUrl);
      }
    };
  }, [processedImageUrl]);

  const handleImageUpload = (file: File) => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    const url = URL.createObjectURL(file);
    setOriginalFile(file);
    setOriginalImageUrl(url);
    setProcessedImageUrl(null);
    setProcessingSteps([]);
  };

  const addProcessingStep = (
    message: string,
    status: ProcessingStep["status"]
  ) => {
    setProcessingSteps((prev) => [
      ...prev,
      { message, status, timestamp: Date.now() },
    ]);
  };

  const processImage = async () => {
    if (!originalFile || !originalImageUrl) {
      toast.error("Please upload an image first");
      return;
    }

    const processId = `process-${Date.now()}`;

    try {
      setIsModelLoading(true);
      setIsProcessing(true);
      setProcessingSteps([]);
      setProgress(0);

      toast.loading("Initializing background removal...", {
        id: processId,
        duration: Infinity,
      });

      const processedImageData = await removeBackground(
        originalImageUrl,
        settings,
        (progress: number, status?: string) => {
          setProgress(progress);
          toast.loading(
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {status || "Processing image"}
              </span>
            </div>,
            {
              id: processId,
              duration: Infinity,
            }
          );
          if (status) {
            addProcessingStep(status, "processing");
          }
        }
      );

      const processedBlob = await (await fetch(processedImageData)).blob();
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImageUrl(processedUrl);
      setProgress(100);
      addProcessingStep("Background removed successfully", "completed");

      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-medium">Background removed successfully!</p>
          <p className="text-xs text-muted-foreground">
            Processing completed in{" "}
            {((Date.now() - Number(processId.split("-")[1])) / 1000).toFixed(1)}
            s
          </p>
        </div>,
        {
          id: processId,
          duration: 5000,
        }
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(
        <div className="flex flex-col gap-1">
          <p className="font-medium">Processing failed</p>
          <p className="text-xs text-destructive-foreground/80">
            {errorMessage}
          </p>
        </div>,
        {
          id: processId,
          duration: 5000,
        }
      );
      addProcessingStep("Processing failed", "error");
    } finally {
      setIsModelLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between px-3 sm:px-6">
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 container py-3 sm:py-6 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-4">
          {!originalImageUrl ? (
            <ImageUploader
              onImageUpload={handleImageUpload}
              isProcessing={isProcessing}
            />
          ) : (
            <ImagePreview
              originalUrl={originalImageUrl}
              processedUrl={processedImageUrl}
              isProcessing={isProcessing}
              isModelLoading={isModelLoading}
              processingSteps={processingSteps}
              progress={progress}
              settings={settings}
              onSettingsChange={setSettings}
              setOriginalImageUrl={setOriginalImageUrl}
              onReprocess={processImage}
            />
          )}
        </div>
      </main>

      <footer className="border-t py-3 mt-auto">
        <div className="container text-center text-xs text-muted-foreground px-3">
          <p>Powered by CleanCanvas AI</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
