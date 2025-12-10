"use client";

import { useState, useMemo } from "react";
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

  const discoveredElements = elements.filter((el) => el.discovered);

  const filteredElements = useMemo(() => {
    return discoveredElements.filter((element) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        element.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === "all" ||
        categorizeElement(element.id, element.emoji) === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [discoveredElements, searchQuery, selectedCategory]);

  // Count elements per category for badges
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

  return (
    <aside className="md:order-first w-full md:w-72 md:min-w-72 bg-sidebar border-t md:border-t-0 md:border-r border-sidebar-border flex flex-col p-3 md:p-4 z-10 relative max-h-[40vh] md:max-h-none overflow-hidden">
      {/* Header - Hidden on mobile */}
      <div className="hidden md:flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-xl font-bold text-sidebar-foreground">Elements</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {discoveredElements.length}
        </span>
      </div>

      {/* Search */}
      <div className="mb-2 md:mb-3 shrink-0">
        <input
          type="text"
          placeholder="Search elements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 md:py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
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

      {/* Elements list */}
      <div className="flex-1 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto min-h-0 scrollbar-thin scrollbar-hide md:scrollbar-thin">
        <div className="flex md:grid md:grid-cols-1 gap-2 p-1 min-w-max md:min-w-0">
          {filteredElements.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4 w-full">
              No elements found
            </div>
          ) : (
            filteredElements.map((element) => (
              <motion.div
                key={element.id}
                className={`bg-secondary rounded-lg py-2 px-3 flex items-center gap-2 md:gap-3 cursor-grab border border-transparent hover:bg-accent hover:border-primary active:bg-accent active:border-primary transition-colors select-none touch-none ${
                  element.isNew ? "ring-2 ring-yellow-400/50" : ""
                }`}
                draggable={false}
                onPointerDown={(e) => {
                  e.preventDefault();
                  onDragStart(element, e);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-xl md:text-2xl leading-none shrink-0">
                  {element.emoji}
                </span>
                <span className="text-xs md:text-sm font-medium text-secondary-foreground leading-tight whitespace-nowrap md:whitespace-normal md:break-words">
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
