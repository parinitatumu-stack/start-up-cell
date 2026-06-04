import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Rocket, FileText, GraduationCap, Sparkles, Users, Trophy } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function Stat({ icon: Icon, label, value }: { icon: typeof Rocket; label: string; value: string | number }) {
  return (
    <div className="card-soft p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">{label}</p>
          <div className="font-display text-4xl mt-1">{value}</div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-aqua/10 flex items-center justify-center"><Icon className="w-5 h-5 text-aqua" /></div>
      </div>
    </div>
  );
}

function AdminOverview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [students, startups, pending, approved, mentors, assigns, evals] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("startups").select("id", { count: "exact", head: true }),
        supabase.from("proposals").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("proposals").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("mentors").select("id", { count: "exact", head: true }),
        supabase.from("mentor_assignments").select("id", { count: "exact", head: true }),
        supabase.from("ai_evaluations").select("overall_score"),
      ]);
      const scores = (evals.data ?? []).map((r) => Number(r.overall_score ?? 0)).filter((n) => n > 0);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return {
        students: students.count ?? 0, startups: startups.count ?? 0,
        pending: pending.count ?? 0, approved: approved.count ?? 0,
        mentors: mentors.count ?? 0, assigns: assigns.count ?? 0, avgScore: avg,
      };
    },
  });

  return (
    <>
      <PageHeader eyebrow="Admin overview" title="Cell at a glance" description="Realtime metrics across the entire incubation pipeline." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Stat icon={Users} label="Students" value={data?.students ?? "—"} />
        <Stat icon={Rocket} label="Startups" value={data?.startups ?? "—"} />
        <Stat icon={FileText} label="Pending proposals" value={data?.pending ?? "—"} />
        <Stat icon={Trophy} label="Approved proposals" value={data?.approved ?? "—"} />
        <Stat icon={GraduationCap} label="Mentor assignments" value={`${data?.assigns ?? 0} / ${data?.mentors ?? 0}`} />
        <Stat icon={Sparkles} label="Avg pitch readiness" value={data?.avgScore ? `${data.avgScore}/100` : "—"} />
      </div>
    </>
  );
}
