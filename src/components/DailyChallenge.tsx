"use client";

import { useState } from "react";
import { DailyChallenge } from "@/types/game";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronUp, Lightbulb, X } from "lucide-react";

interface DailyChallengeProps {
  challenge: DailyChallenge;
  completed?: boolean;
  onComplete?: () => void;
}

export function DailyChallengeCard({
  challenge,
  completed,
  onComplete,
}: DailyChallengeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsVisible(true)}
        className="bg-card/95 backdrop-blur-sm border-primary/20"
      >
        <span className="text-lg mr-2">{challenge.targetEmoji}</span>
        Show Quest
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-primary/20 bg-card/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-3xl">{challenge.targetEmoji}</span>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base">Today&apos;s Quest</CardTitle>
                <CardDescription className="text-xs">
                  {new Date(challenge.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`text-[10px] px-2 py-1 rounded-full border whitespace-nowrap ${
                  completed
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                }`}
              >
                {completed ? "Completed" : "In progress"}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground">
                  {challenge.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {challenge.hint}
                </p>
                {!completed && (
                  <div className="pt-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowHint(!showHint)}
                      className="w-full text-xs"
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      {showHint ? "Hide Hint" : "Show Hint"}
                    </Button>
                    <AnimatePresence>
                      {showHint && challenge.targetName && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-2 p-2 bg-primary/5 border border-primary/10 rounded text-xs text-muted-foreground"
                        >
                          Try to create:{" "}
                          <span className="font-semibold text-foreground">
                            {challenge.targetName}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
