import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImagePreviewProps, PreviewTab } from "@/types";
import ProgressBar from "@/components/ui/progress-bar";

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

  if (!originalUrl) return null;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-background to-accent/5">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as PreviewTab)}
        className="flex flex-col h-full"
      >
        <div className="px-4 pt-4 flex items-center justify-between border-b pb-4">
          <TabsList className="w-auto bg-muted/50 p-1 rounded-lg">
            <TabsTrigger
              value="original"
              className="data-[state=active]:bg-background"
            >
              Original
            </TabsTrigger>
            <TabsTrigger
              value="processed"
              disabled={!processedUrl}
              className="data-[state=active]:bg-background"
            >
              Processed
            </TabsTrigger>
          </TabsList>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setOriginalImageUrl(null)}
            className="hover:bg-accent/50"
          >
            Upload New
          </Button>
        </div>

        <div className="relative flex-1 min-h-[40vh] max-h-[70vh]">
          {isProcessing && (
            <div className="absolute inset-0 z-10 bg-background/50 rounded-lg" />
          )}

          <div className="h-full p-4 relative">
            <TabsContent
              value="original"
              className="mt-0 h-full relative data-[state=active]:block"
            >
              <div className="h-full w-full flex items-center justify-center">
                <img
                  src={originalUrl}
                  alt="Original image"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
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
                    className="max-w-full max-h-[60vh] object-contain rounded-lg"
                  />
                ) : (
                  <p className="text-center text-muted-foreground">
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
                  size="md"
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
