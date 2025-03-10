import { Wand2 } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="p-1.5 rounded-lg bg-primary/10">
        <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
      </div>
      <div>
        <h1 className="text-lg sm:text-xl font-semibold">
          <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            CleanCanvas AI
          </span>
        </h1>
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          Background Remover
        </p>
      </div>
    </div>
  );
}
