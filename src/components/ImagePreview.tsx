import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tabs as SettingsTabs,
  TabsContent as SettingsTabsContent,
  TabsList as SettingsTabsList,
  TabsTrigger as SettingsTabsTrigger,
} from "@/components/ui/tabs";
import { ImagePreviewProps, PreviewTab } from "@/types";
import ProgressBar from "@/components/ui/progress-bar";
import { Download, Wand2, Settings2, X, RotateCcw } from "lucide-react";
import { exportImage } from "@/utils/imageProcessing";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ModelType, RemovalSettings } from "@/types/settings";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const defaultSettings: RemovalSettings = {
  model: "Xenova/segformer-b2-finetuned-ade-512-512" as ModelType,
  threshold: 0.2,
  softness: 0.2,
  edgeEnhancement: 0.3,
  cleanup: true,
  backgroundColor: "transparent",
  preserveDetails: true,
  removeShades: true,
  finetuneMode: false,
};

const ImagePreview: React.FC<ImagePreviewProps> = ({
  originalUrl,
  processedUrl,
  isProcessing,
  progress,
  setOriginalImageUrl,
  onReprocess,
  settings,
  onSettingsChange,
  isModelLoading,
}) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>("original");
  const [showSettings, setShowSettings] = useState(false);

  React.useEffect(() => {
    if (processedUrl) {
      setActiveTab("processed");
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

  const handleResetSettings = () => {
    onSettingsChange(defaultSettings);
    toast.success("Settings reset to default");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="relative space-y-3">
      <Card className="p-4 bg-gradient-to-r from-background to-accent/5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              title="Refresh page"
            >
              <Wand2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Background Remover</h2>
            </button>
          </div>
          <p className="hidden sm:block text-sm text-muted-foreground">
            Remove background from your images instantly
          </p>
        </div>
      </Card>

      <div className="flex flex-col lg:flex-row gap-3">
        <Card className="flex-1 overflow-hidden bg-gradient-to-br from-background to-accent/5">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as PreviewTab)}
            className="flex flex-col h-full"
          >
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <TabsList className="bg-muted/50 h-9">
                <TabsTrigger value="original" className="text-sm px-4">
                  Original
                </TabsTrigger>
                <TabsTrigger
                  value="processed"
                  disabled={!processedUrl}
                  className="text-sm px-4"
                >
                  Processed
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOriginalImageUrl(null)}
                  className="h-9"
                >
                  <span className="hidden sm:inline">Upload New</span>
                  <span className="sm:hidden">New</span>
                </Button>
                {processedUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                    className="h-9"
                  >
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={showSettings ? "default" : "outline"}
                  onClick={() => setShowSettings(!showSettings)}
                  className="h-9 lg:hidden"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="relative flex-1 min-h-[30vh] sm:min-h-[40vh] max-h-[60vh] sm:max-h-[70vh]">
              {isProcessing && (
                <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm" />
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
                      className={`max-w-full max-h-[50vh] sm:max-h-[60vh] object-contain rounded-lg ${
                        isProcessing ? "bg-gray-200" : ""
                      }`}
                    />
                    {!processedUrl && !isProcessing && (
                      <Button
                        size="lg"
                        onClick={isProcessing ? undefined : onReprocess}
                        className="absolute bottom-4 right-4 shadow-lg hover:shadow-xl transition-shadow bg-primary/90 backdrop-blur-sm"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Remove Background
                      </Button>
                    )}
                  </div>
                </TabsContent>
                <TabsContent
                  value="processed"
                  className="mt-0 h-full relative data-[state=active]:block checkerboard-bg rounded-lg"
                >
                  <div className="h-full w-full flex items-center justify-center">
                    {processedUrl ? (
                      <>
                        <img
                          src={processedUrl}
                          alt="Processed image"
                          className="max-w-full max-h-[50vh] sm:max-h-[60vh] object-contain rounded-lg"
                        />
                        <Button
                          size="lg"
                          onClick={onReprocess}
                          className="absolute bottom-4 right-4 shadow-lg hover:shadow-xl transition-shadow bg-primary/90 backdrop-blur-sm"
                          disabled={isProcessing}
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          Reprocess
                        </Button>
                      </>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground">
                        No processed image available.
                      </p>
                    )}
                  </div>
                </TabsContent>

                {isProcessing && (
                  <div className="absolute bottom-0 left-0 right-0 z-20 bg-background/80">
                    <div className="space-y-2">
                      <ProgressBar
                        value={progress}
                        max={100}
                        size="md"
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Tabs>
        </Card>

        <Card
          className={cn(
            "lg:w-80 shrink-0 transition-all duration-300 ease-in-out overflow-hidden",
            "fixed lg:relative inset-y-0 right-0 z-50 lg:z-0",
            "bg-card/95 backdrop-blur-sm lg:backdrop-blur-none lg:bg-card",
            "lg:translate-x-0",
            showSettings ? "translate-x-0" : "translate-x-full",
            "border-l lg:border"
          )}
        >
          <div className="h-full p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Processing Settings</h3>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleResetSettings}
                  title="Reset to defaults"
                  className="h-8 w-8"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowSettings(false)}
                  className="h-8 w-8 lg:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Model</label>
                  <Select
                    value={settings.model}
                    onValueChange={(value: ModelType) =>
                      onSettingsChange({ ...settings, model: value })
                    }
                    disabled={isProcessing || isModelLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Xenova/segformer-b2-finetuned-ade-512-512">
                        Standard (Better Quality)
                      </SelectItem>
                      <SelectItem value="Xenova/segformer-b0-finetuned-ade-512-512">
                        Basic (Faster)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">
                        Fine-tune Mode
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Enable for more precise control
                      </p>
                    </div>
                    <Switch
                      checked={settings.finetuneMode}
                      onCheckedChange={(checked) =>
                        onSettingsChange({
                          ...settings,
                          finetuneMode: checked,
                        })
                      }
                      disabled={isProcessing}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Threshold</label>
                      <span className="text-sm text-muted-foreground">
                        {settings.threshold.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[settings.threshold]}
                      onValueChange={([value]) =>
                        onSettingsChange({ ...settings, threshold: value })
                      }
                      min={0.05}
                      max={0.95}
                      step={0.05}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">
                        Edge Softness
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {settings.softness.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[settings.softness]}
                      onValueChange={([value]) =>
                        onSettingsChange({ ...settings, softness: value })
                      }
                      min={0}
                      max={1}
                      step={0.05}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">
                        Edge Enhancement
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {settings.edgeEnhancement.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[settings.edgeEnhancement]}
                      onValueChange={([value]) =>
                        onSettingsChange({
                          ...settings,
                          edgeEnhancement: value,
                        })
                      }
                      min={0}
                      max={1}
                      step={0.05}
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
        {showSettings && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ImagePreview;
