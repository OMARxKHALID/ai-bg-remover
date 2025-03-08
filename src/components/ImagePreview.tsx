import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePreviewProps, PreviewTab } from "@/types";
import ProgressBar from "@/components/ui/progress-bar";
import { Download } from "lucide-react";
import { exportImage } from "@/utils/imageProcessing";
import { toast } from "sonner";

const ImagePreview: React.FC<ImagePreviewProps> = ({
  originalUrl,
  processedUrl,
  isProcessing,
  progress,
  setOriginalImageUrl,
}) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>("original");

  useEffect(() => {
    if (processedUrl) {
      setActiveTab("processed");
    } else {
      setActiveTab("original");
    }
  }, [processedUrl]);

  const handleDownload = async () => {
    if (!processedUrl) return;

    try {
      const blob = await exportImage(processedUrl, "png");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "processed-image.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded successfully");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  if (!originalUrl) return null;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-background to-accent/5">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as PreviewTab)}
        className="flex flex-col h-full"
      >
        <div className="px-2 sm:px-4 pt-3 sm:pt-4 flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 sm:pb-4 gap-3">
          <TabsList className="w-full sm:w-auto bg-muted/50 p-1 rounded-lg">
            <TabsTrigger
              value="original"
              className="flex-1 sm:flex-none text-sm data-[state=active]:bg-background"
            >
              Original
            </TabsTrigger>
            <TabsTrigger
              value="processed"
              disabled={!processedUrl}
              className="flex-1 sm:flex-none text-sm data-[state=active]:bg-background"
            >
              Processed
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {processedUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="flex-1 sm:flex-none hover:bg-accent/50 text-xs sm:text-sm"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Download
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOriginalImageUrl(null)}
              className="flex-1 sm:flex-none hover:bg-accent/50 text-xs sm:text-sm"
            >
              Upload New
            </Button>
          </div>
        </div>

        <div className="relative flex-1 min-h-[30vh] sm:min-h-[40vh] max-h-[60vh] sm:max-h-[70vh]">
          {isProcessing && (
            <div className="absolute inset-0 z-10 bg-background/50 rounded-lg" />
          )}

          <div className="h-full p-2 sm:p-4 relative">
            <TabsContent
              value="original"
              className="mt-0 h-full relative data-[state=active]:block"
            >
              <div className="h-full w-full flex items-center justify-center">
                <img
                  src={originalUrl}
                  alt="Original image"
                  className="max-w-full max-h-[50vh] sm:max-h-[60vh] object-contain rounded-lg"
                />
              </div>
            </TabsContent>

            <TabsContent
              value="processed"
              className="mt-0 h-full relative data-[state=active]:block checkerboard-bg rounded-lg"
            >
              <div className="h-full w-full flex items-center justify-center">
                {processedUrl ? (
                  <img
                    src={processedUrl}
                    alt="Processed image"
                    className="max-w-full max-h-[50vh] sm:max-h-[60vh] object-contain rounded-lg"
                  />
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    No processed image available.
                  </p>
                )}
              </div>
            </TabsContent>

            {isProcessing && (
              <div className="absolute bottom-0 left-0 w-full z-20">
                <ProgressBar
                  value={progress}
                  max={100}
                  size="sm"
                  className="w-full border-t border-muted"
                />
              </div>
            )}
          </div>
        </div>
      </Tabs>
    </Card>
  );
};

export default ImagePreview;
