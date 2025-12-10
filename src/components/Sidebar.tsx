"use client";

import { GameElement } from "@/types/game";
import { motion } from "motion/react";

interface SidebarProps {
  elements: GameElement[];
  onDragStart: (element: GameElement, e: React.PointerEvent) => void;
}

export function Sidebar({ elements, onDragStart }: SidebarProps) {
  const discoveredElements = elements.filter((el) => el.discovered);

  return (
    <aside className="w-72 min-w-72 bg-sidebar border-r border-sidebar-border flex flex-col p-5 z-10 relative">
      <h2 className="text-2xl font-bold mb-2 text-sidebar-foreground">
        Elements
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        {discoveredElements.length} discovered
      </p>
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2 p-1">
          {discoveredElements.map((element) => (
            <motion.div
              key={element.id}
              className="bg-secondary rounded-lg py-2 px-3 flex items-center gap-3 cursor-grab border border-transparent hover:bg-accent hover:border-primary transition-colors select-none"
              draggable={false}
              onPointerDown={(e) => {
                e.preventDefault();
                onDragStart(element, e);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-2xl leading-none shrink-0">
                {element.emoji}
              </span>
              <span className="text-sm font-medium text-secondary-foreground leading-tight break-words">
                {element.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </aside>
  );
}
