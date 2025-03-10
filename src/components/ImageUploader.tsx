import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadCloud, ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImageUploaderProps } from "@/types";

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  isProcessing,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const validateAndUpload = useCallback(
    (file: File) => {
      if (isProcessing) {
        toast.error("Please wait for the current image to finish processing");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB");
        return;
      }

      onImageUpload(file);
    },
    [isProcessing, onImageUpload]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        validateAndUpload(file);
      }
    },
    [validateAndUpload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();

      const file = e.target.files?.[0];
      if (file) {
        validateAndUpload(file);
      }
    },
    [validateAndUpload]
  );

  return (
    <div className="space-y-3">
      <Card className="p-4 flex items-center justify-between bg-gradient-to-r from-background to-accent/5">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Upload Image</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Drag & drop or click to upload
        </p>
      </Card>
      <Card className="relative overflow-hidden bg-gradient-to-br from-background to-accent/5">
        <div
          className={cn(
            "relative min-h-[40vh] sm:min-h-[60vh] flex flex-col items-center justify-center p-4 sm:p-8",
            "border-2 border-dashed border-primary/20 rounded-xl m-1",
            "transition-all duration-200",
            dragActive && "border-primary/50 bg-primary/5 scale-[0.99]"
          )}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <div className="absolute inset-0 bg-grid-primary/5 [mask-image:linear-gradient(0deg,transparent,black)]" />

          <div className="relative flex flex-col items-center gap-4 sm:gap-6 px-2 sm:px-4 text-center max-w-md mx-auto">
            <div
              className={cn(
                "p-3 sm:p-4 rounded-full bg-primary/5",
                "transition-transform duration-200",
                dragActive ? "scale-110" : "scale-100"
              )}
            >
              <UploadCloud className="h-8 w-8 sm:h-12 sm:w-12 text-primary/80" />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <h3 className="text-xl sm:text-2xl font-semibold">
                Drop your image here
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Supports JPG, PNG and WEBP up to 10MB
              </p>
            </div>

            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => document.getElementById("file-upload")?.click()}
              className="w-full sm:w-auto"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Choose File
            </Button>
          </div>

          <input
            id="file-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
            disabled={isProcessing}
          />
        </div>
      </Card>
    </div>
  );
};

export default ImageUploader;
