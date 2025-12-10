"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  PanInfo,
  AnimatePresence,
} from "motion/react";
import { GameElement, CanvasElement } from "@/types/game";
import {
  playPickupSound,
  playDropSound,
  playNewElementSound,
} from "@/lib/sounds";

interface DraggableElementProps {
  canvasElement: CanvasElement;
  gameElement: GameElement;
  canvasElements: CanvasElement[];
  onDragEnd: (id: string, x: number, y: number) => void;
  onCombine: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isCombining?: boolean;
  isHighlighted?: boolean;
  onNearRemoveZone?: (near: boolean) => void;
  onDragHighlight?: (targetId: string | null) => void;
}

export function DraggableElement({
  canvasElement,
  gameElement,
  canvasElements,
  onDragEnd,
  onCombine,
  onRemove,
  containerRef,
  isCombining = false,
  isHighlighted = false,
  onNearRemoveZone,
  onDragHighlight,
}: DraggableElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const hasPlayedNewSound = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
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
    // Clear any long press timer when dragging starts
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
    scale.set(1.1);
    zIndex.set(1000);
    onNearRemoveZone?.(false);
    playPickupSound();
  }, [scale, zIndex, onNearRemoveZone]);

  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      // Update position directly for smooth 60fps dragging
      const newX = canvasElement.x + info.offset.x;
      const newY = canvasElement.y + info.offset.y;
      x.set(newX);
      y.set(newY);

      // Check if near remove zone
      // On mobile: bottom edge (sidebar at bottom), on desktop: left edge
      const REMOVE_ZONE_THRESHOLD = 80;
      const isMobile = window.innerWidth < 768;
      const nearBottom = newY > rect.height - REMOVE_ZONE_THRESHOLD - 80; // 80 for element height
      onNearRemoveZone?.(isMobile ? nearBottom : newX < REMOVE_ZONE_THRESHOLD);

      // Check for overlapping elements to highlight for combine
      const overlappingElement = canvasElements.find(
        (el) =>
          el.id !== canvasElement.id &&
          Math.abs(el.x - newX) < 60 &&
          Math.abs(el.y - newY) < 60
      );
      onDragHighlight?.(overlappingElement?.id || null);
    },
    [
      canvasElement.id,
      canvasElement.x,
      canvasElement.y,
      x,
      y,
      onNearRemoveZone,
      containerRef,
      canvasElements,
      onDragHighlight,
    ]
  );

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      scale.set(1);
      zIndex.set(1);
      onNearRemoveZone?.(false);
      onDragHighlight?.(null);

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      // Get the current pointer position
      let pointerX: number;
      let pointerY: number;
      if ("clientX" in event) {
        pointerX = event.clientX;
        pointerY = event.clientY;
      } else if (event.changedTouches?.[0]) {
        pointerX = event.changedTouches[0].clientX;
        pointerY = event.changedTouches[0].clientY;
      } else {
        pointerX = rect.left + canvasElement.x + info.offset.x + 40;
        pointerY = rect.top + canvasElement.y + info.offset.y + 40;
      }

      // Check if dragged outside canvas - remove element
      // On mobile (bottom sidebar): check if dragged below canvas
      // On desktop (left sidebar): check if dragged left of canvas
      const isMobile = window.innerWidth < 768;
      if (isMobile ? pointerY > rect.bottom : pointerX < rect.left) {
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
      playDropSound();
    },
    [
      canvasElement.id,
      canvasElement.x,
      canvasElement.y,
      containerRef,
      onDragEnd,
      onCombine,
      onRemove,
      onNearRemoveZone,
      onDragHighlight,
      scale,
      zIndex,
    ]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      playDropSound();
      onRemove(canvasElement.id);
    },
    [canvasElement.id, onRemove]
  );

  // Long press handler for mobile - hold to remove
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only enable long press on touch devices
      if (e.pointerType !== "touch") return;

      longPressTimer.current = setTimeout(() => {
        setIsLongPressing(true);
        playDropSound();
        onRemove(canvasElement.id);
      }, 500); // 500ms hold to remove
    },
    [canvasElement.id, onRemove]
  );

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
  }, []);

  const handlePointerCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Play new element sound when element is first created as new
  useEffect(() => {
    if (gameElement.isNew && !hasPlayedNewSound.current) {
      hasPlayedNewSound.current = true;
      playNewElementSound();
    }
  }, [gameElement.isNew]);

  return (
    <motion.div
      ref={elementRef}
      className={`will-change-transform active:cursor-grabbing select-none ${
        isLongPressing ? "opacity-50" : ""
      }`}
      style={{
        x,
        y,
        scale,
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
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: isCombining ? 0.7 : 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      whileHover={{ zIndex: 100 }}
    >
      {/* Ray effect for new elements - positioned behind the card */}
      <AnimatePresence>
        {gameElement.isNew && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ray.svg"
              alt=""
              className="size-70 opacity-80"
              aria-hidden="true"
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Card content */}
      <motion.div
        className={`relative min-w-24 max-w-40 bg-card rounded-lg py-2 px-3 flex items-center gap-2 border-2 transition-colors ${
          isHighlighted
            ? "border-primary ring-2 ring-primary/50"
            : isCombining
            ? "border-primary/50"
            : "border-border"
        }`}
        style={{ boxShadow }}
      >
        <span
          className={`text-2xl leading-none shrink-0 ${
            isCombining ? "animate-pulse" : ""
          }`}
        >
          {gameElement.emoji}
        </span>
        <span className="text-sm font-medium text-card-foreground leading-tight break-words">
          {gameElement.name}
        </span>
      </motion.div>
    </motion.div>
  );
}
