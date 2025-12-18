"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GameElement,
  CanvasElement,
  GameMode,
  DailyChallenge,
} from "@/types/game";
import { Sidebar } from "@/components/Sidebar";
import { Canvas } from "@/components/Canvas";
import { combineElements, fetchDailyGoal } from "@/lib/api";
import { playPickupSound, playDropSound } from "@/lib/sounds";
import { Button } from "@/components/ui/button";
import { DailyChallengeCard } from "@/components/DailyChallenge";
import { ModeToggle } from "@/components/ModeToggle";

// Initial base elements
const INITIAL_ELEMENTS: GameElement[] = [
  { id: "water", name: "Water", emoji: "💧", discovered: true },
  { id: "fire", name: "Fire", emoji: "🔥", discovered: true },
  { id: "earth", name: "Earth", emoji: "🌍", discovered: true },
  { id: "air", name: "Air", emoji: "💨", discovered: true },
];

const STORAGE_KEY = "boundless-crafting-elements";
const MODE_STORAGE_KEY = "boundless-crafting-mode";
const CHALLENGE_STATUS_KEY = "boundless-crafting-challenge-status";

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
  const [gameMode, setGameMode] = useState<GameMode>("discovery");
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(
    null
  );
  const [challengeCompleted, setChallengeCompleted] = useState(false);
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
  const draggingElementRef = useRef<GameElement | null>(null);

  // Keep ref in sync with state for use in event listeners
  useEffect(() => {
    draggingElementRef.current = draggingElement;
  }, [draggingElement]);

  const persistChallengeStatus = useCallback(
    (challenge: DailyChallenge, completed: boolean) => {
      if (typeof window === "undefined") return;
      const payload = {
        challengeId: challenge.id,
        completed,
        completedAt: new Date().toISOString(),
      };
      localStorage.setItem(CHALLENGE_STATUS_KEY, JSON.stringify(payload));
    },
    []
  );

  const completeTodayChallenge = useCallback(() => {
    if (!dailyChallenge) return;
    setChallengeCompleted(true);
    persistChallengeStatus(dailyChallenge, true);
  }, [dailyChallenge, persistChallengeStatus]);

  // Load game mode and daily challenge on mount
  useEffect(() => {
    let cancelled = false;

    // Load saved mode or default to discovery
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as GameMode;
    if (savedMode === "discovery" || savedMode === "sandbox") {
      setGameMode(savedMode);
    }

    const loadDailyGoal = async () => {
      try {
        const goal = await fetchDailyGoal();

        if (cancelled) return;

        setDailyChallenge({
          id: goal.id,
          title: goal.title,
          hint: goal.hint,
          targetEmoji: goal.targetEmoji,
          date: goal.date,
          targetName: goal.targetName,
        });
      } catch (err) {
        console.error("Failed to load daily goal", err);
      }
    };

    loadDailyGoal();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load completion state for today's challenge
  useEffect(() => {
    if (!dailyChallenge) return;
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(CHALLENGE_STATUS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        challengeId?: string;
        completed?: boolean;
      };
      if (parsed.challengeId === dailyChallenge.id && parsed.completed) {
        setChallengeCompleted(true);
      } else {
        setChallengeCompleted(false);
      }
    } catch (err) {
      console.error("Failed to load challenge status", err);
    }
  }, [dailyChallenge]);

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

  // Save game mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, gameMode);
  }, [gameMode]);

  // Handle mode change
  const handleModeChange = useCallback((newMode: GameMode) => {
    setGameMode(newMode);
  }, []);

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
        const isDailyChallenge = gameMode === "discovery";
        const dailyGoalIdToSend =
          isDailyChallenge && !challengeCompleted
            ? dailyChallenge?.id ?? null
            : null;

        const result = await combineElements(
          firstName,
          secondName,
          dailyGoalIdToSend
        );
        const newElementId = result.name.toLowerCase().replace(/\s+/g, "-");

        if (result.hasCompletedDaily && !challengeCompleted) {
          completeTodayChallenge();
        }

        // Add to discovered elements if new
        setElements((prev) => {
          const exists = prev.some((el) => el.id === newElementId);
          if (!exists) {
            // Clear isNew flag after 1.5 seconds
            setTimeout(() => {
              setElements((current) =>
                current.map((el) =>
                  el.id === newElementId ? { ...el, isNew: false } : el
                )
              );
            }, 1500);

            return [
              ...prev,
              {
                id: newElementId,
                name: result.name,
                emoji: result.emoji,
                discovered: true,
                isNew: true,
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
    [dailyChallenge, challengeCompleted, completeTodayChallenge, gameMode]
  );

  const handleDragStart = useCallback(
    (element: GameElement, e: React.PointerEvent | PointerEvent) => {
      setDraggingElement(element);
      setDragPosition({ x: e.clientX - 40, y: e.clientY - 40 });
      playPickupSound();
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

  const handlePointerUpInternal = useCallback(
    async (e: React.PointerEvent | { clientX: number; clientY: number }) => {
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
          playDropSound();
        }
      }
    },
    [draggingElement, canvasElements, findGameElement, combineWithAPI]
  );

  // Wrapper for React event handlers
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      handlePointerUpInternal(e);
    },
    [handlePointerUpInternal]
  );

  // Global pointer event handlers for mobile touch dragging
  useEffect(() => {
    if (!draggingElement) return;

    const handleGlobalMove = (e: PointerEvent) => {
      if (draggingElementRef.current && canvasRef.current) {
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
    };

    const handleGlobalUp = (e: PointerEvent) => {
      handlePointerUpInternal({
        clientX: e.clientX,
        clientY: e.clientY,
      });
    };

    window.addEventListener("pointermove", handleGlobalMove);
    window.addEventListener("pointerup", handleGlobalUp);
    window.addEventListener("pointercancel", handleGlobalUp);

    return () => {
      window.removeEventListener("pointermove", handleGlobalMove);
      window.removeEventListener("pointerup", handleGlobalUp);
      window.removeEventListener("pointercancel", handleGlobalUp);
    };
  }, [draggingElement, canvasElements, handlePointerUpInternal]);

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
      className="flex flex-col md:flex-row w-screen overflow-hidden relative touch-none"
      style={{ height: "100dvh" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
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
        onDragHighlight={setHighlightedElementId}
      />
      <Sidebar
        elements={elements}
        onDragStart={handleDragStart}
        isDragging={!!draggingElement}
      />

      {/* Loading indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed top-4 right-4 z-9999 bg-card px-4 py-2 rounded-lg border border-border shadow-lg flex items-center gap-2"
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
            <span className="text-2xl leading-none shrink-0">
              {draggingElement.emoji}
            </span>
            <span className="text-sm font-medium text-card-foreground leading-tight wrap-break-word">
              {draggingElement.name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode toggle and daily challenge (float away from sidebar) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 z-30 flex flex-col gap-3 w-[min(90vw,360px)]">
        <ModeToggle mode={gameMode} onModeChange={handleModeChange} />
        {gameMode === "discovery" && dailyChallenge && (
          <DailyChallengeCard
            challenge={dailyChallenge}
            completed={challengeCompleted}
            onComplete={completeTodayChallenge}
          />
        )}
      </div>

      <div className="absolute bottom-[calc(35vh+1rem)] md:bottom-4 right-4 z-20">
        <Button size="sm" onClick={() => setElements(resetElements())}>
          Reset game
        </Button>
      </div>
    </main>
  );
}
