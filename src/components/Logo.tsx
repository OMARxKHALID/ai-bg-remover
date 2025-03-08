import { Wand2 } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="p-1.5 rounded-lg bg-primary/10">
        <Wand2 className="w-5 h-5 text-primary" />
      </div>
      <div className="hidden sm:block">
        <h1 className="text-xl font-semibold">
          <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            CleanCanvas AI
          </span>
        </h1>
        <p className="text-xs text-muted-foreground">Background Remover</p>
      </div>
    </div>
  );
}
