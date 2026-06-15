import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle2, Circle, Rocket, Sparkles, GraduationCap, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

export const Route = createFileRoute("/app/")({
  component: StudentDashboard,
});

function StatBadge({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "warn" }) {
  const cls = tone === "good" ? "bg-aqua/15 text-navy border-aqua/40"
    : tone === "warn" ? "bg-sand text-navy border-sand"
    : "bg-muted text-foreground border-border";
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />{label}: <span className="font-semibold">{value}</span>
    </div>
  );
}

function StudentDashboard() {
  const { user } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["student-dash", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: startup } = await supabase.from("startups").select("*").eq("user_id", user!.id).maybeSingle();
      if (!startup) return { startup: null };
      const [milestones, proposal, mentorAssign, evals, mvp, demo] = await Promise.all([
        supabase.from("milestones").select("*").eq("startup_id", startup.id).order("position"),
        supabase.from("proposals").select("*").eq("startup_id", startup.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("mentor_assignments").select("*, mentors(*)").eq("startup_id", startup.id).maybeSingle(),
        supabase.from("ai_evaluations").select("*").eq("startup_id", startup.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("mvp_submissions").select("*").eq("startup_id", startup.id).maybeSingle(),
        supabase.from("demo_day_registrations").select("*").eq("startup_id", startup.id).maybeSingle(),
      ]);
      return {
        startup,
        milestones: milestones.data ?? [],
        proposal: proposal.data,
        mentor: mentorAssign.data,
        evaluation: evals.data,
        mvp: mvp.data,
        demo: demo.data,
      };
    },
  });

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;

  if (!data?.startup) {
    return (
      <>
        <PageHeader eyebrow="Welcome" title="Let's get your startup on the map."
          description="Register your venture, articulate the problem you're solving, and start your journey through the cell." />
        <div className="card-soft p-10 text-center max-w-2xl mx-auto">
          <Rocket className="w-10 h-10 mx-auto text-aqua" />
          <h2 className="font-display text-3xl mt-4">Register your startup</h2>
          <p className="text-muted-foreground mt-2">All your milestones, mentor assignment, proposals and AI evaluations live around your startup record.</p>
          <Link to="/app/startup" className="inline-block mt-6">
            <Button className="bg-aqua text-navy hover:bg-aqua-bright">Create startup <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </Link>
        </div>
      </>
    );
  }

  const { startup, milestones = [], proposal, mentor, evaluation } = data;
  const done = milestones.filter((m) => m.completed).length;
  const pct = milestones.length ? Math.round((done / milestones.length) * 100) : 0;
  const aiScore = evaluation?.overall_score ?? null;

  return (
    <>
      <PageHeader eyebrow={startup.domain} title={startup.name}
        description={startup.description ?? "Your startup at a glance."}
        action={<div className="flex gap-2 flex-wrap justify-end">
          <StatBadge label="Status" value={startup.status} tone="good" />
          <StatBadge label="Proposal" value={proposal?.status ?? "none"} tone={proposal?.status === "approved" ? "good" : "neutral"} />
        </div>} />

      <Stagger className="grid lg:grid-cols-3 gap-6" stagger={0.08}>
        <StaggerItem className="lg:col-span-2">
          <div className="card-glass hover-lift p-8 h-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="eyebrow">Progress</p>
                <h3 className="font-display text-2xl mt-1">{done} of {milestones.length} milestones</h3>
              </div>
              <div className="text-right">
                <div className="font-display text-5xl text-aqua text-glow-soft">{pct}%</div>
              </div>
            </div>
            <Progress value={pct} className="h-2 [&>div]:bg-aqua" />
            <ul className="mt-6 space-y-1">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 transition">
                  {m.completed ? <CheckCircle2 className="w-4 h-4 text-aqua" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                  <span className={m.completed ? "text-foreground" : "text-muted-foreground"}>{m.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </StaggerItem>

        <div className="space-y-6">
          <StaggerItem>
            <div className="card-feature hover-lift p-6 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-aqua/15 blur-2xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-aqua" /><p className="eyebrow">AI Pitch Readiness</p></div>
                {aiScore != null ? (
                  <>
                    <div className="font-display text-6xl text-aqua text-glow-soft">{Math.round(Number(aiScore))}<span className="text-xl text-ivory/50">/100</span></div>
                    <Link to="/app/ai" className="text-aqua text-sm inline-flex items-center mt-2 hover:text-aqua-bright">View full report <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
                  </>
                ) : (
                  <>
                    <p className="text-ivory/70 text-sm mt-1">Run your first evaluation to see how investor-ready you are.</p>
                    <Link to="/app/ai" className="text-aqua text-sm inline-flex items-center mt-3 hover:text-aqua-bright">Run evaluation <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
                  </>
                )}
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="card-soft hover-lift p-6">
              <div className="flex items-center gap-2 mb-1"><GraduationCap className="w-4 h-4 text-aqua" /><p className="eyebrow">Mentor</p></div>
              {mentor?.mentors ? (
                <>
                  <div className="font-display text-2xl mt-1">{mentor.mentors.name}</div>
                  <div className="text-sm text-muted-foreground">{mentor.mentors.designation} · {mentor.mentors.domain}</div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm mt-1">An admin will assign a domain-matched mentor soon.</p>
              )}
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="card-soft hover-lift p-6">
              <div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-aqua" /><p className="eyebrow">Proposal</p></div>
              <div className="font-display text-2xl mt-1 capitalize">{proposal?.status ?? "Not submitted"}</div>
              {proposal?.comments && <p className="text-sm text-muted-foreground mt-1">Reviewer: {proposal.comments}</p>}
              <Link to="/app/proposal" className="text-aqua text-sm inline-flex items-center mt-2 hover:text-aqua-bright">Manage proposal <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
            </div>
          </StaggerItem>
        </div>
      </Stagger>
    </>
  );
}
