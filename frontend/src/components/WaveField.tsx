"use client";

import { useEffect, useRef } from "react";

/**
 * WaveField — a quiet, monochrome line field rendered on a 2D canvas.
 *
 * Deliberately restrained: thin horizontal contour lines drifting on layered
 * sine noise, near-black on black, with a single faint cool highlight. No
 * gradients, no purple, no particles-as-confetti. It should read as the surface
 * of an instrument, not a screensaver.
 */
export default function WaveField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const LINES = 22;
    const wave = (x: number, t: number, seed: number) =>
      Math.sin(x * 0.0016 + t + seed) * 26 +
      Math.sin(x * 0.0041 + t * 0.6 + seed * 2) * 14 +
      Math.sin(x * 0.0007 - t * 0.4 + seed) * 38;

    const render = (time: number) => {
      const t = time * 0.00018;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < LINES; i++) {
        const p = i / (LINES - 1);
        const baseY = h * 0.12 + p * h * 0.82;
        const seed = i * 0.55;
        // Lines nearer vertical centre glow ever so slightly cool.
        const centerBias = 1 - Math.abs(p - 0.5) * 2;
        const alpha = 0.04 + centerBias * 0.05;

        ctx.beginPath();
        for (let x = -40; x <= w + 40; x += 14) {
          const y = baseY + wave(x, t + i * 0.18, seed) * (0.4 + p * 0.9);
          if (x === -40) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle =
          centerBias > 0.78
            ? `rgba(96,135,200,${alpha + 0.02})`
            : `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.55]"
      aria-hidden
    />
  );
}
