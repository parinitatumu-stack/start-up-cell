import { motion, useInView, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export function FadeIn({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className = "", delay = 0, stagger = 0.07 }: { children: ReactNode; className?: string; delay?: number; stagger?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Bar({ value, delay = 0 }: { value: number; delay?: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="bar-track">
      <motion.div
        className="bar-fill"
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ duration: 1.2, ease, delay }}
      />
    </div>
  );
}

export function CountUp({ to, duration = 1.4, className = "" }: { to: number; duration?: number; className?: string }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());
  const [val, setVal] = useState("0");
  useEffect(() => {
    const unsub = rounded.on("change", setVal);
    const controls = animate(mv, to, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => { unsub(); controls.stop(); };
  }, [to, duration, mv, rounded]);
  return <span className={className}>{val}</span>;
}
