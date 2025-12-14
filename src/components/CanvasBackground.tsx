"use client";

import { useRef, useEffect, useCallback } from "react";
import { CanvasElement } from "@/types/game";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
}

interface CanvasBackgroundProps {
  canvasElements: CanvasElement[];
}

export function CanvasBackground({ canvasElements }: CanvasBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const containerSizeRef = useRef({ width: 0, height: 0 });

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    const spacing = 40; // Grid spacing for particles
    const cols = Math.ceil(width / spacing);
    const rows = Math.ceil(height / spacing);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * spacing + spacing / 2;
        const y = j * spacing + spacing / 2;
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          size: 1.5,
          opacity: 0.15,
        });
      }
    }
    return particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
        containerSizeRef.current = { width, height };
        particlesRef.current = initParticles(width, height);
      }
    });

    resizeObserver.observe(canvas.parentElement!);

    return () => {
      resizeObserver.disconnect();
    };
  }, [initParticles]);

  useEffect(() => {
    const animate = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const { width, height } = containerSizeRef.current;
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      const elements = canvasElements;

      // Influence radius and strength
      const influenceRadius = 120;
      const maxDisplacement = 15;

      particles.forEach((particle) => {
        let totalDx = 0;
        let totalDy = 0;
        let closestDistance = Infinity;

        // Calculate influence from all canvas elements
        elements.forEach((element) => {
          // Element center (assuming ~80px element with some offset for center)
          const elementCenterX = element.x + 50;
          const elementCenterY = element.y + 30;

          const dx = particle.baseX - elementCenterX;
          const dy = particle.baseY - elementCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < influenceRadius && distance > 0) {
            // Particles are pushed away from elements
            const force = (1 - distance / influenceRadius) * maxDisplacement;
            totalDx += (dx / distance) * force;
            totalDy += (dy / distance) * force;
            closestDistance = Math.min(closestDistance, distance);
          }
        });

        // Apply displacement with easing
        const targetX = particle.baseX + totalDx;
        const targetY = particle.baseY + totalDy;
        particle.x += (targetX - particle.x) * 0.1;
        particle.y += (targetY - particle.y) * 0.1;

        // Adjust opacity based on proximity to elements
        let targetOpacity = 0.12;
        if (closestDistance < influenceRadius) {
          // Fade out particles closer to elements, brighten ones at the edge
          const normalizedDist = closestDistance / influenceRadius;
          if (normalizedDist < 0.3) {
            targetOpacity = 0.05;
          } else {
            targetOpacity = 0.12 + (1 - normalizedDist) * 0.2;
          }
        }
        particle.opacity += (targetOpacity - particle.opacity) * 0.08;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 100, 120, ${particle.opacity})`;
        ctx.fill();
      });

      // Draw subtle connection lines between nearby particles that are displaced
      ctx.strokeStyle = "rgba(100, 100, 120, 0.4)";
      ctx.lineWidth = 0.5;
      particles.forEach((p1, i) => {
        const displacement1 =
          Math.abs(p1.x - p1.baseX) + Math.abs(p1.y - p1.baseY);
        if (displacement1 > 2) {
          particles.slice(i + 1).forEach((p2) => {
            const displacement2 =
              Math.abs(p2.x - p2.baseX) + Math.abs(p2.y - p2.baseY);
            if (displacement2 > 2) {
              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < 50) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            }
          });
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [canvasElements]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  );
}
