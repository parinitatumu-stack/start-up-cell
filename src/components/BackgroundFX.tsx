import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

/**
 * Ambient atmosphere layer for content areas.
 * - Soft floating teal orbs
 * - Subtle animated grid
 * - Gentle mouse-reactive glow
 * Pointer-events: none. Fixed behind content.
 */
export function BackgroundFX() {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const x = useTransform(sx, (v) => `${v * 100}%`);
  const y = useTransform(sy, (v) => `${v * 100}%`);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth);
      my.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.18] bg-grid-soft" />

      {/* Floating orbs */}
      <motion.div
        className="absolute -top-32 -left-24 w-[34rem] h-[34rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--aqua) 28%, transparent), transparent 65%)" }}
        animate={{ y: [0, 24, 0], x: [0, 14, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-40 w-[40rem] h-[40rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--aqua) 18%, transparent), transparent 65%)" }}
        animate={{ y: [0, -30, 0], x: [0, -16, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 left-1/3 w-[36rem] h-[36rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--navy-3) 28%, transparent), transparent 65%)" }}
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Mouse-reactive glow */}
      <motion.div
        className="absolute w-[28rem] h-[28rem] rounded-full blur-3xl opacity-40"
        style={{
          left: x, top: y, x: "-50%", y: "-50%",
          background: "radial-gradient(circle, color-mix(in oklab, var(--aqua) 22%, transparent), transparent 70%)",
        }}
      />
    </div>
  );
}
