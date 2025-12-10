"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GameElement, CanvasElement } from "@/types/game";
import { Sidebar } from "@/components/Sidebar";
import { Canvas } from "@/components/Canvas";
import { combineElements } from "@/lib/api";

// Initial base elements
const INITIAL_ELEMENTS: GameElement[] = [
  { id: "water", name: "Water", emoji: "💧", discovered: true },
  { id: "fire", name: "Fire", emoji: "🔥", discovered: true },
  { id: "earth", name: "Earth", emoji: "🌍", discovered: true },
  { id: "air", name: "Air", emoji: "💨", discovered: true },
];

const STORAGE_KEY = "boundless-crafting-elements";

// Load elements from localStorage
const loadElements = (): GameElement[] => {
  if (typeof window === "undefined") return INITIAL_ELEMENTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as GameElement[];
      // Merge with initial elements to ensure base elements are always present
      const ids = new Set(parsed.map((el) => el.id));
      const merged = [...parsed];
      for (const el of INITIAL_ELEMENTS) {
        if (!ids.has(el.id)) {
          merged.push(el);
        }
      }
      return merged;
    }
  } catch (e) {
    console.error("Failed to load elements from localStorage:", e);
  }
  return INITIAL_ELEMENTS;
};

const resetElements = (): GameElement[] => {
  if (typeof window === "undefined") return INITIAL_ELEMENTS;
  localStorage.removeItem(STORAGE_KEY);
  return INITIAL_ELEMENTS;
};

let elementIdCounter = 0;

export default function Home() {
  const [elements, setElements] = useState<GameElement[]>(INITIAL_ELEMENTS);
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [draggingElement, setDraggingElement] = useState<GameElement | null>(
    null
  );
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [combiningIds, setCombiningIds] = useState<string[]>([]);
  const [highlightedElementId, setHighlightedElementId] = useState<
    string | null
  >(null);
  const [showRemoveZone, setShowRemoveZone] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load elements from localStorage on mount
  useEffect(() => {
    setElements(loadElements());
  }, []);

  // Save elements to localStorage when they change
  useEffect(() => {
    if (elements.length > INITIAL_ELEMENTS.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
    }
  }, [elements]);

  const generateId = () => {
    elementIdCounter += 1;
    return `canvas-${elementIdCounter}`;
  };

  // Helper to find game element by id
  const findGameElement = useCallback(
    (elementId: string) => elements.find((el) => el.id === elementId),
    [elements]
  );

  // Combine two elements using the API
  const combineWithAPI = useCallback(
    async (firstName: string, secondName: string) => {
      setIsLoading(true);
      try {
        const result = await combineElements(firstName, secondName);
        const newElementId = result.name.toLowerCase().replace(/\s+/g, "-");

        // Add to discovered elements if new
        setElements((prev) => {
          const exists = prev.some((el) => el.id === newElementId);
          if (!exists) {
            return [
              ...prev,
              {
                id: newElementId,
                name: result.name,
                emoji: result.emoji,
                discovered: true,
              },
            ];
          }
          return prev;
        });

        return { id: newElementId, name: result.name, emoji: result.emoji };
      } catch (error) {
        console.error("Failed to combine elements:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleDragStart = useCallback(
    (element: GameElement, e: React.PointerEvent) => {
      setDraggingElement(element);
      setDragPosition({ x: e.clientX - 40, y: e.clientY - 40 });
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggingElement && canvasRef.current) {
        setDragPosition({ x: e.clientX - 40, y: e.clientY - 40 });

        // Check for potential combine targets to highlight
        const rect = canvasRef.current.getBoundingClientRect();
        const dropX = e.clientX - rect.left - 40;
        const dropY = e.clientY - rect.top - 40;

        const targetElement = canvasElements.find(
          (el) => Math.abs(el.x - dropX) < 60 && Math.abs(el.y - dropY) < 60
        );

        setHighlightedElementId(targetElement?.id || null);
      }
    },
    [draggingElement, canvasElements]
  );

  const handlePointerUp = useCallback(
    async (e: React.PointerEvent) => {
      setHighlightedElementId(null);

      if (!draggingElement || !canvasRef.current) {
        setDraggingElement(null);
        return;
      }

      // Clear dragging state immediately to stop ghost following mouse
      const currentDraggingElement = draggingElement;
      setDraggingElement(null);

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 40;
      const y = e.clientY - rect.top - 40;

      // Only drop if within canvas bounds
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const dropX = Math.max(0, Math.min(x, rect.width - 80));
        const dropY = Math.max(0, Math.min(y, rect.height - 80));

        // Check if dropping onto an existing element for combining
        const targetElement = canvasElements.find(
          (el) => Math.abs(el.x - dropX) < 60 && Math.abs(el.y - dropY) < 60
        );

        if (targetElement) {
          // Get the target element's game info
          const targetGameElement = findGameElement(targetElement.elementId);
          if (targetGameElement) {
            // Add a temporary element for the dropped item at target position
            const tempId = generateId();
            setCanvasElements((prev) => [
              ...prev,
              {
                id: tempId,
                elementId: currentDraggingElement.id,
                x: targetElement.x,
                y: targetElement.y,
              },
            ]);

            // Set combining state for animation
            setCombiningIds([targetElement.id, tempId]);

            // Try to combine via API
            const result = await combineWithAPI(
              currentDraggingElement.name,
              targetGameElement.name
            );

            setCombiningIds([]);

            if (result) {
              // Replace both elements with the result
              setCanvasElements((prev) => {
                const newElement: CanvasElement = {
                  id: generateId(),
                  elementId: result.id,
                  x: targetElement.x,
                  y: targetElement.y,
                };
                return prev
                  .filter(
                    (el) => el.id !== targetElement.id && el.id !== tempId
                  )
                  .concat(newElement);
              });
            } else {
              // Failed, remove temp element and offset it
              setCanvasElements((prev) =>
                prev.map((el) =>
                  el.id === tempId ? { ...el, x: el.x + 40, y: el.y + 40 } : el
                )
              );
            }
          }
        } else {
          // No target, just place the element
          setCanvasElements((prev) => [
            ...prev,
            {
              id: generateId(),
              elementId: currentDraggingElement.id,
              x: dropX,
              y: dropY,
            },
          ]);
        }
      }
    },
    [draggingElement, canvasElements, findGameElement, combineWithAPI]
  );

  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      // Skip update if element is being combined
      if (combiningIds.includes(id)) return;

      setCanvasElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, x, y } : el))
      );
    },
    [combiningIds]
  );

  const handleRemove = useCallback((id: string) => {
    setCanvasElements((prev) => prev.filter((el) => el.id !== id));
  }, []);

  const handleCombine = useCallback(
    async (draggedId: string, finalX: number, finalY: number) => {
      // Clear any highlight when combining
      setHighlightedElementId(null);

      const dragged = canvasElements.find((el) => el.id === draggedId);
      if (!dragged) return;

      // Use the final position passed in for accurate overlap detection
      const draggedX = finalX;
      const draggedY = finalY;

      // Find overlapping elements (within 60px) using the final position
      const overlapping = canvasElements.find(
        (el) =>
          el.id !== draggedId &&
          Math.abs(el.x - draggedX) < 60 &&
          Math.abs(el.y - draggedY) < 60
      );

      if (!overlapping) return;

      // Get game elements for both
      const draggedGameElement = findGameElement(dragged.elementId);
      const overlappingGameElement = findGameElement(overlapping.elementId);

      if (!draggedGameElement || !overlappingGameElement) return;

      // Move dragged element to overlap position for visual merge
      setCanvasElements((prev) =>
        prev.map((el) =>
          el.id === draggedId
            ? { ...el, x: overlapping.x, y: overlapping.y }
            : el
        )
      );

      // Set combining state for animation
      setCombiningIds([draggedId, overlapping.id]);

      // Combine via API
      const result = await combineWithAPI(
        draggedGameElement.name,
        overlappingGameElement.name
      );

      setCombiningIds([]);

      if (result) {
        // Replace both elements with the result
        const newElement: CanvasElement = {
          id: generateId(),
          elementId: result.id,
          x: overlapping.x,
          y: overlapping.y,
        };

        setCanvasElements((prev) =>
          prev
            .filter((el) => el.id !== draggedId && el.id !== overlapping.id)
            .concat(newElement)
        );
      }
    },
    [canvasElements, findGameElement, combineWithAPI]
  );

  return (
    <main
      className="flex w-screen h-screen overflow-hidden relative"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <Sidebar elements={elements} onDragStart={handleDragStart} />
      <Canvas
        ref={canvasRef}
        canvasElements={canvasElements}
        gameElements={elements}
        onDragEnd={handleDragEnd}
        onCombine={handleCombine}
        onRemove={handleRemove}
        combiningIds={combiningIds}
        highlightedElementId={highlightedElementId}
        showRemoveZone={showRemoveZone}
        onNearRemoveZone={setShowRemoveZone}
      />

      {/* Loading indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed top-4 right-4 z-[9999] bg-card px-4 py-2 rounded-lg border border-border shadow-lg flex items-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-card-foreground">Combining...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag ghost element */}
      <AnimatePresence>
        {draggingElement && (
          <motion.div
            className="fixed pointer-events-none z-9999 min-w-24 max-w-40 bg-card rounded-lg py-2 px-3 flex items-center gap-2 border border-border shadow-lg"
            style={{
              left: dragPosition.x,
              top: dragPosition.y,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 0.9 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <span className="text-2xl leading-none flex-shrink-0">
              {draggingElement.emoji}
            </span>
            <span className="text-sm font-medium text-card-foreground leading-tight break-words">
              {draggingElement.name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 right-4 z-20">
        <button
          className="bg-primary text-primary-foreground px-2"
          onClick={() => setElements(resetElements())}
        >
          Reset Game
        </button>
      </div>
    </main>
  );
}
