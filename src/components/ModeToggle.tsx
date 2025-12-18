"use client";

import { GameMode } from "@/types/game";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Boxes } from "lucide-react";

interface ModeToggleProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <Tabs
      value={mode}
      onValueChange={(value) => onModeChange(value as GameMode)}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="discovery" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Discovery</span>
        </TabsTrigger>
        <TabsTrigger value="sandbox" className="flex items-center gap-2">
          <Boxes className="w-4 h-4" />
          <span className="hidden sm:inline">Sandbox</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
