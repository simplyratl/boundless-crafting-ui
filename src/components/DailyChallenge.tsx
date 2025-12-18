"use client";

import { DailyChallenge } from "@/types/game";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

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
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-primary/20 bg-card/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{challenge.emoji}</span>
              <div className="flex-1">
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
            <span
              className={`text-[10px] px-2 py-1 rounded-full border ${
                completed
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/30"
              }`}
            >
              {completed ? "Completed" : "In progress"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <h3 className="font-semibold text-sm text-foreground">
            {challenge.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {challenge.description}
          </p>
          {/* {!completed && onComplete && (
            <div className="pt-2">
              <Button size="sm" variant="secondary" className="w-full text-xs" onClick={onComplete}>
                Mark as done
              </Button>
            </div>
          )} */}
        </CardContent>
      </Card>
    </motion.div>
  );
}
