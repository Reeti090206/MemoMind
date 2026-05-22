"use client";

import React, { useEffect, useRef } from "react";

export default function TerrainLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    // Initialize waves representing 14 parallel topographic lines
    const waveCount = 14;
    const waves: {
      yOffset: number;
      amplitude: number;
      frequency: number;
      speed: number;
      phase: number;
      color: string;
      glowColor: string;
    }[] = [];

    for (let i = 0; i < waveCount; i++) {
      const ratio = i / waveCount;
      waves.push({
        yOffset: height * 0.15 + ratio * height * 0.7,
        amplitude: 20 + ratio * 35,
        frequency: 0.0012 - ratio * 0.0004,
        speed: 0.0015 + (1 - ratio) * 0.0015,
        phase: ratio * Math.PI * 2,
        color: i % 3 === 0 
          ? "rgba(139, 92, 246, 0.09)" // cyber-purple
          : i % 3 === 1 
          ? "rgba(6, 182, 212, 0.08)"  // cyber-cyan
          : "rgba(244, 63, 94, 0.06)",  // cyber-rose
        glowColor: i % 3 === 0 
          ? "rgba(139, 92, 246, 0.18)" 
          : i % 3 === 1 
          ? "rgba(6, 182, 212, 0.16)" 
          : "rgba(244, 63, 94, 0.12)"
      });
    }

    // Drifting particles
    const particleCount = 20;
    const particles: {
      x: number;
      y: number;
      speedX: number;
      speedY: number;
      size: number;
      alpha: number;
      hue: number;
    }[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 1.5 + 1,
        alpha: Math.random() * 0.25 + 0.1,
        hue: i % 2 === 0 ? 268 : 188 // purple or cyan
      });
    }

    let time = 0;
    const render = () => {
      time += 0.4;
      
      // Deep, cinematic background clearing
      ctx.fillStyle = "#020204";
      ctx.fillRect(0, 0, width, height);

      // Smooth mouse coordinates with lerp (0.05 speed gives nice smooth lag)
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Draw subtle mouse radial glow
      if (mouse.targetX > 0 || mouse.targetY > 0) {
        const glowGrd = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          320
        );
        glowGrd.addColorStop(0, "rgba(139, 92, 246, 0.035)");
        glowGrd.addColorStop(0.5, "rgba(6, 182, 212, 0.015)");
        glowGrd.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glowGrd;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 320, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render topographic waves
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.lineWidth = 1.0;

        // Draw line segments across screen width
        for (let x = 0; x <= width; x += 15) {
          // Base math wave
          let y = wave.yOffset + Math.sin(x * wave.frequency + time * wave.speed + wave.phase) * wave.amplitude;
          
          // Mouse proximity distortion
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 280) {
            const force = (280 - dist) / 280;
            // Distort vertically with smooth sine transition
            y += Math.sin(dist * 0.04 - time * 0.03) * 22 * force;
          }

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Apply a glowing stroke when mouse is close to the wave center
        const waveCenterDist = Math.abs(mouse.y - wave.yOffset);
        if (waveCenterDist < 120) {
          ctx.strokeStyle = wave.glowColor;
          ctx.lineWidth = 1.25;
        } else {
          ctx.strokeStyle = wave.color;
        }

        ctx.stroke();
      });

      // Drifting particle nodes
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap particles
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Reactive mouse displacement for particles
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 220) {
          const force = (220 - dist) / 220;
          p.x += (dx / dist) * force * 0.35;
          p.y += (dy / dist) * force * 0.35;
        }

        // Draw particle
        ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glowing particle aura if close to mouse
        if (dist < 160) {
          ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${p.alpha * 0.4})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-50 pointer-events-none block"
      style={{ background: "#020204" }}
    />
  );
}
