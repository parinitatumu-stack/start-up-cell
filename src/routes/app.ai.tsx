import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, AlertTriangle, TrendingUp, Lightbulb, Shield, ArrowRight } from "lucide-react";

const SCORE_LABELS: Record<string, string> = {
  business_clarity: "Business Clarity",
  problem_definition: "Problem Definition",
  solution_strength: "Solution Strength",
  market_potential: "Market Potential",
  business_model_viability: "Business Model Viability",
  innovation_level: "Innovation Level",
  team_readiness: "Team Readiness",
};

export const Route = createFileRoute("/app/ai")({ component: AiPage });

function ScoreBar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5"><span className="text-foreground">{label}</span><span className="font-semibold">{v}</span></div>
      <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-aqua" style={{ width: `${v}%` }} /></div>
    </div>
  );
}

function List({ icon: Icon, title, items, tone = "neutral" }: { icon: typeof Sparkles; title: string; items: string[]; tone?: "good" | "warn" | "neutral" }) {
  const color = tone === "good" ? "text-aqua" : tone === "warn" ? "text-orange-500" : "text-foreground";
  return (
    <div className="card-soft p-5">
      <div className={`flex items-center gap-2 ${color}`}><Icon className="w-4 h-4" /><p className="eyebrow">{title}</p></div>
      <ul className="mt-3 space-y-1.5 text-sm">{items?.map((it, i) => <li key={i} className="flex gap-2"><span className={`mt-1.5 w-1 h-1 rounded-full bg-current shrink-0 ${color}`} />{it}</li>)}</ul>
    </div>
  );
}

function AiPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["ai-eval", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data: startup } = await supabase.from("startups").select("*").eq("user_id", user!.id).maybeSingle();
      if (!startup) return null;
      const { data: history } = await supabase.from("ai_evaluations").select("*").eq("startup_id", startup.id).order("created_at", { ascending: false });
      return { startup, history: history ?? [] };
    },
  });

  if (!data?.startup) return <p className="text-muted-foreground">Register your startup first to run AI evaluation.</p>;
  const latest = data.history[0];

  const run = async () => {
    setBusy(true);
    try {
      const payload = {
        name: data.startup.name, domain: data.startup.domain, description: data.startup.description,
        vision: data.startup.vision, problem: data.startup.problem_statement, solution: data.startup.solution,
        target_audience: data.startup.target_audience, market_opportunity: data.startup.market_opportunity,
        business_model: data.startup.business_model, innovation: data.startup.innovation_description,
        expected_impact: data.startup.expected_impact,
      };
      const { data: r, error } = await supabase.functions.invoke("evaluate-pitch", { body: payload });
      if (error) throw error;
      if (r.error) throw new Error(r.error);
      await supabase.from("ai_evaluations").insert({
        startup_id: data.startup.id,
        scores: r.scores, feedback: { strengths: r.strengths, weaknesses: r.weaknesses, risks: r.risks, improvements: r.improvements, next_steps: r.next_steps, summary: r.summary },
        overall_score: r.overall_score,
      });
      toast.success("Evaluation complete.");
      qc.invalidateQueries();
    } catch (e) {
      toast.error("AI evaluation failed. " + (e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader eyebrow="AI Pitch Check" title="Are you investor-ready?"
        description="Gemini evaluates your startup across 7 dimensions. Every run produces a fresh, specific report."
        action={<Button onClick={run} disabled={busy} className="bg-aqua text-navy hover:bg-aqua-bright">
          {busy ? "Evaluating…" : <>Run evaluation <ArrowRight className="w-4 h-4 ml-2" /></>}
        </Button>} />

      {!latest ? (
        <div className="card-soft p-10 text-center">
          <Sparkles className="w-8 h-8 mx-auto text-aqua" />
          <h3 className="font-display text-3xl mt-3">No evaluation yet</h3>
          <p className="text-muted-foreground">Click "Run evaluation" to score your startup.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card-navy p-8 lg:col-span-1 text-center">
            <p className="eyebrow">Overall Pitch Readiness</p>
            <div className="font-display text-7xl text-aqua mt-2">{Math.round(Number(latest.overall_score ?? 0))}</div>
            <div className="text-ivory/50 text-sm">/ 100</div>
            <p className="mt-4 text-ivory/70 text-sm">{(latest.feedback as { summary?: string }).summary}</p>
          </div>
          <div className="card-soft p-6 lg:col-span-2 space-y-3">
            <p className="eyebrow mb-1">Scores</p>
            {Object.entries(latest.scores as Record<string, number>).map(([k, v]) => (
              <ScoreBar key={k} label={SCORE_LABELS[k] ?? k} value={Number(v)} />
            ))}
          </div>
          {(() => {
            const fb = latest.feedback as { strengths: string[]; weaknesses: string[]; risks: string[]; improvements: string[]; next_steps: string[] };
            return (
              <>
                <List icon={TrendingUp} title="Strengths" items={fb.strengths} tone="good" />
                <List icon={AlertTriangle} title="Weaknesses" items={fb.weaknesses} tone="warn" />
                <List icon={Shield} title="Risks" items={fb.risks} tone="warn" />
                <List icon={Lightbulb} title="Improvements" items={fb.improvements} />
                <List icon={ArrowRight} title="Next steps" items={fb.next_steps} tone="good" />
              </>
            );
          })()}
        </div>
      )}

      {data.history.length > 1 && (
        <div className="mt-10">
          <p className="eyebrow mb-3">Evaluation history</p>
          <div className="card-soft divide-y">
            {data.history.map((h) => (
              <div key={h.id} className="px-5 py-3 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
                <span className="font-display text-xl">{Math.round(Number(h.overall_score ?? 0))}/100</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
