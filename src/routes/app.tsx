import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireRole } from "@/components/AppShell";

export const Route = createFileRoute("/app")({
  component: () => <RequireRole role="student"><Outlet /></RequireRole>,
});
