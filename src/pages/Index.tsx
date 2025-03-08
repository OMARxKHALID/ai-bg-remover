import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProcessingStep } from "@/types";
import ImageUploader from "@/components/ImageUploader";
import ImagePreview from "@/components/ImagePreview";
import { ThemeToggle } from "@/components/ThemeToggle";
import { removeBackground, loadImage } from "@/utils/imageProcessing";
import { Wand2 } from "lucide-react";

const Index = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return () => {
      if (processedImageUrl && !processedImageUrl.startsWith("data:")) {
        URL.revokeObjectURL(processedImageUrl);
      }
    };
  }, [processedImageUrl]);

  // Handle image upload
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

  // Process the image
  const processImage = async () => {
    if (!originalFile || !originalImageUrl) {
      toast.error("Please upload an image first");
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingSteps([]);
      setProgress(0);

      const progressInterval = setInterval(
        () => setProgress((p) => Math.min(p + 1, 95)),
        100
      );

      const img = await loadImage(originalFile);
      addProcessingStep("Removing background using AI", "processing");

      const processedBlob = await removeBackground(img, (progress) =>
        setProgress(Math.min(95, Math.round(progress * 100)))
      );

      setProcessedImageUrl(URL.createObjectURL(processedBlob));
      clearInterval(progressInterval);
      setProgress(100);
      addProcessingStep("Background removed successfully", "completed");
      toast.success("Background removed successfully");
    } catch (error) {
      toast.error(
        `Failed to process image: ${
          (error as Error).message || "Unknown error"
        }`
      );
      addProcessingStep("Processing failed", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReprocess = () => {
    processImage();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Wand2 className="h-5 w-5 text-primary" />
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Background Remover
            </span>
          </h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 container py-6">
        <div className="max-w-5xl mx-auto h-full flex flex-col gap-6">
          {!originalImageUrl ? (
            <ImageUploader
              onImageUpload={handleImageUpload}
              isProcessing={isProcessing}
            />
          ) : (
            <div className="flex flex-col flex-1">
              <ImagePreview
                originalUrl={originalImageUrl}
                processedUrl={processedImageUrl || undefined}
                isProcessing={isProcessing}
                processingSteps={processingSteps}
                progress={progress}
                setOriginalImageUrl={setOriginalImageUrl}
                onReprocess={handleReprocess}
              />

              <div className="flex items-center justify-center gap-4 mt-6">
                {!processedImageUrl && (
                  <Button onClick={processImage} disabled={isProcessing}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    {isProcessing ? "Processing..." : "Remove Background"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
