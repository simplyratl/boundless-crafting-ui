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
  onDragHighlight: (targetId: string | null) => void;
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
    onDragHighlight,
  },
  ref
) {
  const getGameElement = (elementId: string) => {
    return gameElements.find((el) => el.id === elementId);
  };

  return (
    <div
      ref={ref}
      className="flex-1 min-h-0 bg-muted relative overflow-hidden bg-[radial-gradient(circle,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[length:30px_30px] z-20 touch-none"
    >
      {/* Remove zone gradient indicator - bottom on mobile, left on desktop */}
      <div
        className={`absolute left-0 md:left-0 bottom-0 md:top-0 right-0 md:right-auto top-auto md:bottom-0 h-16 md:h-auto md:w-24 bg-gradient-to-t md:bg-gradient-to-r from-red-500/50 to-transparent pointer-events-none transition-opacity duration-200 z-50 ${
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
              canvasElements={canvasElements}
              gameElement={gameElement}
              onDragEnd={onDragEnd}
              onCombine={onCombine}
              onRemove={onRemove}
              containerRef={ref as React.RefObject<HTMLDivElement>}
              isCombining={isCombining}
              isHighlighted={isHighlighted}
              onNearRemoveZone={onNearRemoveZone}
              onDragHighlight={onDragHighlight}
            />
          );
        })}
      </AnimatePresence>
      {canvasElements.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground text-sm md:text-lg text-center pointer-events-none px-4">
          Drag elements from below to craft
        </div>
      )}
    </div>
  );
});
