"use client";

import { forwardRef } from "react";
import { AnimatePresence } from "motion/react";
import { GameElement, CanvasElement } from "@/types/game";
import { DraggableElement } from "./DraggableElement";

interface CanvasProps {
  canvasElements: CanvasElement[];
  gameElements: GameElement[];
  onDragEnd: (id: string, x: number, y: number) => void;
  onCombine: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  combiningIds: string[];
  highlightedElementId: string | null;
  showRemoveZone: boolean;
  onNearRemoveZone: (near: boolean) => void;
}

export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(function Canvas(
  {
    canvasElements,
    gameElements,
    onDragEnd,
    onCombine,
    onRemove,
    combiningIds,
    highlightedElementId,
    showRemoveZone,
    onNearRemoveZone,
  },
  ref
) {
  const getGameElement = (elementId: string) => {
    return gameElements.find((el) => el.id === elementId);
  };

  return (
    <div
      ref={ref}
      className="flex-1 bg-muted relative overflow-hidden bg-[radial-gradient(circle,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[length:30px_30px] z-20"
    >
      {/* Remove zone gradient indicator */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-red-500/50 to-transparent pointer-events-none transition-opacity duration-200 z-50 ${
          showRemoveZone ? "opacity-100" : "opacity-0"
        }`}
      />
      <AnimatePresence>
        {canvasElements.map((canvasElement) => {
          const gameElement = getGameElement(canvasElement.elementId);
          if (!gameElement) return null;

          const isCombining = combiningIds.includes(canvasElement.id);
          const isHighlighted = highlightedElementId === canvasElement.id;

          return (
            <DraggableElement
              key={canvasElement.id}
              canvasElement={canvasElement}
              gameElement={gameElement}
              onDragEnd={onDragEnd}
              onCombine={onCombine}
              onRemove={onRemove}
              containerRef={ref as React.RefObject<HTMLDivElement>}
              isCombining={isCombining}
              isHighlighted={isHighlighted}
              onNearRemoveZone={onNearRemoveZone}
            />
          );
        })}
      </AnimatePresence>
      {canvasElements.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground text-lg text-center pointer-events-none">
          Drag elements from the sidebar to the canvas
        </div>
      )}
    </div>
  );
});
