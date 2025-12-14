"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { GameElement } from "@/types/game";
import { motion } from "motion/react";
import { Category, CATEGORIES, categorizeElement } from "@/lib/categories";

interface SidebarProps {
  elements: GameElement[];
  onDragStart: (element: GameElement, e: React.PointerEvent) => void;
}

export function Sidebar({ elements, onDragStart }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [longPressElement, setLongPressElement] = useState<GameElement | null>(
    null
  );
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const discoveredElements = elements.filter((el) => el.discovered);

  const filteredElements = useMemo(() => {
    return discoveredElements.filter((element) => {
      const matchesSearch =
        searchQuery === "" ||
        element.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        categorizeElement(element.id, element.emoji) === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [discoveredElements, searchQuery, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<Category, number> = {
      all: discoveredElements.length,
      basic: 0,
      nature: 0,
      weather: 0,
      life: 0,
      food: 0,
      objects: 0,
      science: 0,
      misc: 0,
    };
    discoveredElements.forEach((element) => {
      const category = categorizeElement(element.id, element.emoji);
      counts[category]++;
    });
    return counts;
  }, [discoveredElements]);

  const handlePointerMoveRef = useRef<((e: PointerEvent) => void) | null>(null);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (handlePointerMoveRef.current) {
      window.removeEventListener("pointermove", handlePointerMoveRef.current);
      handlePointerMoveRef.current = null;
    }
    setLongPressElement(null);
    touchStartRef.current = null;
  }, []);

  const handlePointerDown = useCallback(
    (element: GameElement, e: React.PointerEvent) => {
      if (e.pointerType === "touch") {
        // On touch, start long press timer
        const startPos = { x: e.clientX, y: e.clientY };
        touchStartRef.current = startPos;

        // Create move handler that cancels on scroll
        const moveHandler = (moveEvent: PointerEvent) => {
          const dx = Math.abs(moveEvent.clientX - startPos.x);
          const dy = Math.abs(moveEvent.clientY - startPos.y);
          if (dx > 8 || dy > 8) {
            clearLongPress();
          }
        };
        handlePointerMoveRef.current = moveHandler;
        window.addEventListener("pointermove", moveHandler);

        longPressTimerRef.current = setTimeout(() => {
          // Trigger vibration feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
          // Remove the scroll-cancel listener since long press succeeded
          if (handlePointerMoveRef.current) {
            window.removeEventListener(
              "pointermove",
              handlePointerMoveRef.current
            );
            handlePointerMoveRef.current = null;
          }

          // Immediately start the drag with the stored touch position
          const syntheticEvent = {
            clientX: startPos.x,
            clientY: startPos.y,
            pointerType: "touch",
            preventDefault: () => {},
            stopPropagation: () => {},
          } as unknown as React.PointerEvent;

          onDragStart(element, syntheticEvent);
          setLongPressElement(element);

          // Clear the long press state after a short delay to show visual feedback
          setTimeout(() => {
            setLongPressElement(null);
          }, 100);
        }, 200); // 200ms long press
      } else {
        // On desktop, start drag immediately
        e.preventDefault();
        onDragStart(element, e);
      }
    },
    [onDragStart, clearLongPress]
  );

  const handlePointerUp = useCallback(() => {
    clearLongPress();
  }, [clearLongPress]);

  return (
    <aside className="md:order-first w-full md:w-72 md:min-w-72 bg-sidebar border-t md:border-t-0 md:border-r border-sidebar-border flex flex-col p-2 md:p-4 z-10 relative max-h-[35vh] md:max-h-none overflow-hidden">
      {/* Header - Hidden on mobile */}
      <div className="hidden md:flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-xl font-bold text-sidebar-foreground">Elements</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {discoveredElements.length}
        </span>
      </div>

      {/* Search and filters row on mobile */}
      <div className="flex gap-2 mb-2 md:mb-3 shrink-0">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-0 px-2 py-1 md:px-3 md:py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
        <span className="md:hidden text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg flex items-center">
          {discoveredElements.length}
        </span>
      </div>

      {/* Category filters */}
      <div className="flex gap-1 mb-2 md:mb-3 overflow-x-auto pb-1 scrollbar-hide shrink-0">
        {CATEGORIES.map((category) => {
          const count = categoryCounts[category.id];
          if (category.id !== "all" && count === 0) return null;

          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
              title={category.name}
            >
              <span>{category.emoji}</span>
              <span className="hidden md:inline">{category.name}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Elements grid - scrollable on both mobile and desktop */}
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin touch-pan-y overscroll-contain">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-1 gap-1.5 md:gap-2 p-1">
          {filteredElements.length === 0 ? (
            <div className="col-span-full text-sm text-muted-foreground text-center py-4">
              No elements found
            </div>
          ) : (
            filteredElements.map((element) => (
              <motion.div
                key={element.id}
                className={`bg-secondary rounded-lg py-1.5 px-2 md:py-2 md:px-3 flex flex-col md:flex-row items-center gap-1 md:gap-3 cursor-grab border border-transparent hover:bg-accent hover:border-primary active:bg-accent active:border-primary transition-colors select-none touch-manipulation ${
                  element.isNew ? "ring-2 ring-yellow-400/50" : ""
                } ${
                  longPressElement?.id === element.id
                    ? "scale-105 ring-2 ring-primary"
                    : ""
                }`}
                draggable={false}
                onPointerDown={(e) => handlePointerDown(element, e)}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-2xl md:text-2xl leading-none shrink-0">
                  {element.emoji}
                </span>
                <span className="text-[10px] md:text-sm font-medium text-secondary-foreground leading-tight text-center md:text-left line-clamp-1 md:line-clamp-none">
                  {element.name}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
