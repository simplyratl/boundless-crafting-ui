"use client";

import { useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "motion/react";
import { GameElement, CanvasElement } from "@/types/game";

interface DraggableElementProps {
  canvasElement: CanvasElement;
  gameElement: GameElement;
  onDragEnd: (id: string, x: number, y: number) => void;
  onCombine: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isCombining?: boolean;
  isHighlighted?: boolean;
  onNearRemoveZone?: (near: boolean) => void;
}

export function DraggableElement({
  canvasElement,
  gameElement,
  onDragEnd,
  onCombine,
  onRemove,
  containerRef,
  isCombining = false,
  isHighlighted = false,
  onNearRemoveZone,
}: DraggableElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(canvasElement.x);
  const y = useMotionValue(canvasElement.y);

  // Scale up slightly when dragging for visual feedback
  const scale = useMotionValue(1);
  const boxShadow = useTransform(
    scale,
    [1, 1.1],
    ["0 2px 8px rgba(0,0,0,0.15)", "0 8px 24px rgba(0,0,0,0.25)"]
  );

  const zIndex = useMotionValue(1);

  const handleDragStart = useCallback(() => {
    scale.set(1.1);
    zIndex.set(1000);
    onNearRemoveZone?.(false);
  }, [scale, zIndex, onNearRemoveZone]);

  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Update position directly for smooth 60fps dragging
      const newX = canvasElement.x + info.offset.x;
      x.set(newX);
      y.set(canvasElement.y + info.offset.y);

      // Check if near remove zone (left edge)
      const REMOVE_ZONE_THRESHOLD = 80;
      onNearRemoveZone?.(newX < REMOVE_ZONE_THRESHOLD);
    },
    [canvasElement.x, canvasElement.y, x, y, onNearRemoveZone]
  );

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      scale.set(1);
      zIndex.set(1);
      onNearRemoveZone?.(false);

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      // Get the current pointer position
      let pointerX: number;
      if ("clientX" in event) {
        pointerX = event.clientX;
      } else if (event.changedTouches?.[0]) {
        pointerX = event.changedTouches[0].clientX;
      } else {
        pointerX = rect.left + canvasElement.x + info.offset.x + 40;
      }

      // Check if dragged outside canvas (e.g., to sidebar) - remove element
      if (pointerX < rect.left) {
        onRemove(canvasElement.id);
        return;
      }

      let newX = canvasElement.x + info.offset.x;
      let newY = canvasElement.y + info.offset.y;

      // Keep within bounds
      const elementWidth = 80;
      const elementHeight = 80;
      newX = Math.max(0, Math.min(newX, rect.width - elementWidth));
      newY = Math.max(0, Math.min(newY, rect.height - elementHeight));

      onDragEnd(canvasElement.id, newX, newY);
      onCombine(canvasElement.id, newX, newY);
    },
    [
      canvasElement.id,
      canvasElement.x,
      canvasElement.y,
      containerRef,
      onDragEnd,
      onCombine,
      onRemove,
      scale,
      zIndex,
    ]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onRemove(canvasElement.id);
    },
    [canvasElement.id, onRemove]
  );

  return (
    <motion.div
      ref={elementRef}
      className={`min-w-24 max-w-40 bg-card rounded-lg py-2 px-3 flex items-center gap-2 border-2 will-change-transform active:cursor-grabbing select-none transition-colors ${
        isHighlighted
          ? "border-primary ring-2 ring-primary/50"
          : isCombining
          ? "border-primary/50"
          : "border-border"
      }`}
      style={{
        x,
        y,
        scale,
        boxShadow,
        zIndex,
        position: "absolute",
        touchAction: "none",
        userSelect: "none",
        cursor: isCombining ? "wait" : "grab",
        pointerEvents: isCombining ? "none" : "auto",
      }}
      drag={!isCombining}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onContextMenu={handleContextMenu}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: isCombining ? 0.7 : 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      whileHover={{ zIndex: 100 }}
    >
      <span
        className={`text-2xl leading-none flex-shrink-0 ${
          isCombining ? "animate-pulse" : ""
        }`}
      >
        {gameElement.emoji}
      </span>
      <span className="text-sm font-medium text-card-foreground leading-tight break-words">
        {gameElement.name}
      </span>
    </motion.div>
  );
}
