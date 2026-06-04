import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 font-display text-2xl ${className}`}>
      <span className="inline-block w-2 h-2 rounded-full bg-aqua shadow-[0_0_10px_var(--aqua)]" />
      <span className="font-medium tracking-tight">Startup<span className="text-aqua italic ml-1.5">Cell</span></span>
    </Link>
  );
}
