import { motion } from "motion/react";
import { useMemo } from "react";

/**
 * Ambient atmosphere layer.
 * - Very subtle animated grid
 * - Two small, low-opacity navy/aqua glows (no longer dominant)
 * - Sparse floating particles (10–80px, 5–15% opacity)
 * Pointer-events: none. Sits behind content.
 */
export function BackgroundFX() {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const size = 10 + Math.round(Math.random() * 70); // 10–80px
        return {
          id: i,
          size,
          left: Math.random() * 100,
          top: Math.random() * 100,
          duration: 22 + Math.random() * 28,
          delay: Math.random() * 10,
          drift: 20 + Math.random() * 50,
          opacity: 0.05 + Math.random() * 0.1, // 5–15%
          aqua: Math.random() > 0.35,
        };
      }),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      {/* Very subtle animated grid */}
      <div className="absolute inset-0 opacity-[0.08] bg-grid-soft" />

      {/* Small, soft ambient glows — kept behind content, low opacity */}
      <motion.div
        className="absolute top-[12%] left-[8%] w-[22rem] h-[22rem] rounded-full blur-3xl opacity-[0.18]"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--aqua) 28%, transparent), transparent 70%)" }}
        animate={{ y: [0, 18, 0], x: [0, 10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[10%] right-[6%] w-[26rem] h-[26rem] rounded-full blur-3xl opacity-[0.14]"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--navy-3) 35%, transparent), transparent 70%)" }}
        animate={{ y: [0, -22, 0], x: [0, -12, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Sparse floating particles */}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full blur-[2px]"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            background: p.aqua
              ? "radial-gradient(circle, color-mix(in oklab, var(--aqua) 70%, transparent), transparent 70%)"
              : "radial-gradient(circle, color-mix(in oklab, var(--ivory) 80%, transparent), transparent 70%)",
            boxShadow: p.aqua
              ? "0 0 18px color-mix(in oklab, var(--aqua) 35%, transparent)"
              : undefined,
          }}
          animate={{
            y: [0, -p.drift, 0],
            x: [0, p.drift * 0.4, 0],
            opacity: [p.opacity, p.opacity * 1.6, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
