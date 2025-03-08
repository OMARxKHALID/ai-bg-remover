import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProcessingStep } from "@/types";
import ImageUploader from "@/components/ImageUploader";
import ImagePreview from "@/components/ImagePreview";
import { ThemeToggle } from "@/components/ThemeToggle";
import { removeBackground, loadImage } from "@/utils/imageProcessing";
import { Wand2 } from "lucide-react";
import { Logo } from "@/components/Logo";

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
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(errorMessage, {
        duration: 2000,
      });
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
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 container py-4 sm:py-6 px-3 sm:px-6">
        <div className="max-w-5xl mx-auto h-full flex flex-col gap-4 sm:gap-6">
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

              <div className="flex items-center justify-center gap-4 mt-4 sm:mt-6">
                {!processedImageUrl && (
                  <Button
                    onClick={processImage}
                    disabled={isProcessing}
                    className="text-sm sm:text-base w-full sm:w-auto"
                  >
                    <Wand2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    {isProcessing ? "Processing..." : "Remove Background"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-3 sm:py-4 mt-auto">
        <div className="container text-center text-xs sm:text-sm text-muted-foreground px-3 sm:px-6">
          <p>Powered by CleanCanvas AI</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
