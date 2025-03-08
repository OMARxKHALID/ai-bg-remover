import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = "md",
  className = "",
}) => {
  const percentage = (value / max) * 100;

  return (
    <div
      className={cn(
        "relative w-full rounded-full",
        "bg-secondary dark:bg-secondary/25",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full transition-all duration-300 ease-in-out",
          "bg-primary dark:bg-primary",
          size === "sm" ? "h-1" : size === "lg" ? "h-3" : "h-2"
        )}
        style={{ width: `${percentage}%`, minWidth: "2px" }}
      />
    </div>
  );
};

export default ProgressBar;
