import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, AlertTriangle, TrendingUp, Lightbulb, Shield, ArrowRight, Loader2 } from "lucide-react";
import { FadeIn, Stagger, StaggerItem, Reveal, Bar } from "@/components/motion";
import { motion } from "motion/react";

const SCORE_LABELS: Record<string, string> = {
  business_clarity: "Business Clarity",
  problem_definition: "Problem Definition",
  solution_strength: "Solution Strength",
  market_potential: "Market Potential",
  business_model_viability: "Business Model Viability",
  innovation_level: "Innovation Level",
  team_readiness: "Team Readiness",
};

const CHIPS = [
  "Team Readiness", "Market Potential", "Innovation",
  "Business Clarity", "Solution Strength", "Problem Definition", "Business Model",
];

export const Route = createFileRoute("/app/ai")({ component: AiPage });

function AnalysisPanel({
  icon: Icon, title, items, tone,
}: { icon: typeof Sparkles; title: string; items: string[]; tone: "good" | "warn" | "risk" | "neutral" | "step" }) {
  const palette = {
    good:    { ring: "border-aqua/30",      dot: "bg-aqua",    label: "text-aqua",    bg: "bg-aqua/5" },
    warn:    { ring: "border-amber-400/40", dot: "bg-amber-400", label: "text-amber-500", bg: "bg-amber-50/50" },
    risk:    { ring: "border-rose-400/40",  dot: "bg-rose-500",  label: "text-rose-600",  bg: "bg-rose-50/40" },
    neutral: { ring: "border-border",       dot: "bg-foreground", label: "text-foreground", bg: "bg-muted/40" },
    step:    { ring: "border-aqua/25",      dot: "bg-aqua",    label: "text-aqua",    bg: "bg-card" },
  }[tone];
  return (
    <div className={`card-soft hover-lift p-6 border ${palette.ring} ${palette.bg}`}>
      <div className={`flex items-center gap-2 ${palette.label}`}>
        <Icon className="w-4 h-4" />
        <p className="eyebrow !text-current">{title}</p>
      </div>
      {tone === "step" ? (
        <ol className="mt-4 space-y-3">
          {items?.map((it, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="font-mono-x text-[10px] text-aqua border border-aqua/40 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-foreground leading-relaxed">{it}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mt-4 space-y-2 text-sm">
          {items?.map((it, i) => (
            <li key={i} className="flex gap-2.5 leading-relaxed">
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${palette.dot}`} />
              <span className="text-foreground">{it}</span>
            </li>
          ))}
        </ul>
      )}
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

  if (!data?.startup) {
    return (
      <FadeIn>
        <div className="card-soft p-12 text-center max-w-2xl mx-auto">
          <Sparkles className="w-10 h-10 mx-auto text-aqua" />
          <h2 className="font-display text-3xl mt-4">Register your startup first</h2>
          <p className="text-muted-foreground mt-2">The pitch readiness engine evaluates your registered startup.</p>
        </div>
      </FadeIn>
    );
  }
  const latest = data.history[0];
  const overall = latest ? Math.round(Number(latest.overall_score ?? 0)) : 0;
  const ready = overall >= 70;

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
        scores: r.scores,
        feedback: { strengths: r.strengths, weaknesses: r.weaknesses, risks: r.risks, improvements: r.improvements, next_steps: r.next_steps, summary: r.summary },
        overall_score: r.overall_score,
      });
      toast.success("Evaluation complete.");
      qc.invalidateQueries();
    } catch (e) {
      toast.error("AI evaluation failed. " + (e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-16">
      {/* HERO — editorial two-column */}
      <section className="grid lg:grid-cols-12 gap-10 lg:gap-14 pt-2">
        {/* LEFT — editorial */}
        <FadeIn className="lg:col-span-6 flex flex-col justify-center">
          <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase text-aqua font-mono-x mb-7 px-3 py-1.5 rounded-full border border-aqua/30 bg-aqua/5 self-start">
            <span className="w-1 h-1 rounded-full bg-aqua shadow-[0_0_8px_var(--aqua)]" />
            Gemini-powered evaluation
          </span>
          <h1 className="font-display text-6xl md:text-7xl xl:text-[5.5rem] leading-[0.95] tracking-tight text-foreground">
            Are you<br />
            <span className="italic text-aqua text-glow">investor-ready</span><span className="text-foreground">?</span>
          </h1>
          <p className="mt-7 text-lg text-muted-foreground leading-relaxed max-w-xl">
            A Gemini-powered, investor-grade analysis of your startup across seven critical dimensions.
            Every run produces a fresh, specific report — not a checklist.
          </p>

          <Stagger className="mt-8 flex flex-wrap gap-2.5 max-w-xl" stagger={0.04}>
            {CHIPS.map((c) => (
              <StaggerItem key={c}>
                <span className="chip">{c}</span>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="mt-10">
            <Button onClick={run} disabled={busy} size="lg"
              className="bg-aqua text-navy hover:bg-aqua-bright font-semibold text-[11px] tracking-[0.22em] uppercase px-8 h-12 rounded-md shadow-[0_10px_40px_-10px_color-mix(in_oklab,var(--aqua)_60%,transparent)]">
              {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Evaluating…</> : <>Run evaluation <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </div>
        </FadeIn>

        {/* RIGHT — premium evaluation card */}
        <FadeIn delay={0.15} className="lg:col-span-6">
          <div className="relative card-feature p-8 md:p-10 overflow-hidden">
            {/* aqua glow blob */}
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-aqua/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-aqua/10 blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Overall Readiness</p>
                {latest && (
                  ready ? <span className="badge-ready">Pitch Ready</span>
                        : <span className="badge-ready" style={{ background: "color-mix(in oklab, #f59e0b 18%, transparent)", borderColor: "color-mix(in oklab, #f59e0b 45%, transparent)", color: "#fbbf24" }}>In Progress</span>
                )}
              </div>

              {latest ? (
                <>
                  <div className="mt-4 flex items-baseline gap-3">
                    <motion.div
                      key={overall}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className="font-display text-[7rem] md:text-[8.5rem] leading-none text-aqua text-glow-soft"
                    >
                      {overall}
                    </motion.div>
                    <div className="text-ivory/60 text-xl pb-3">/ 100</div>
                  </div>
                  <p className="text-ivory/75 text-sm leading-relaxed max-w-md">
                    {(latest.feedback as { summary?: string }).summary}
                  </p>

                  <div className="mt-8 space-y-4 pt-6 border-t border-aqua/15">
                    {Object.entries(latest.scores as Record<string, number>).map(([k, v], i) => (
                      <div key={k}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-ivory/85">{SCORE_LABELS[k] ?? k}</span>
                          <span className="font-mono-x text-aqua">{Math.round(Number(v))}</span>
                        </div>
                        <Bar value={Number(v)} delay={0.2 + i * 0.08} />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="mt-12 text-center py-10">
                  <Sparkles className="w-10 h-10 mx-auto text-aqua/70" />
                  <h3 className="font-display text-3xl mt-4 text-ivory">Awaiting your first run</h3>
                  <p className="text-ivory/60 text-sm mt-2 max-w-sm mx-auto">
                    Click <span className="text-aqua">Run evaluation</span> to generate your first investor-grade report.
                  </p>
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ANALYSIS — premium panels */}
      {latest && (() => {
        const fb = latest.feedback as { strengths: string[]; weaknesses: string[]; risks: string[]; improvements: string[]; next_steps: string[] };
        return (
          <Reveal>
            <div className="mb-8">
              <p className="eyebrow">Deep analysis</p>
              <h2 className="font-display text-4xl md:text-5xl mt-2 tracking-tight">Your investor report.</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <AnalysisPanel icon={TrendingUp} title="Strengths" items={fb.strengths} tone="good" />
              <AnalysisPanel icon={AlertTriangle} title="Weaknesses" items={fb.weaknesses} tone="warn" />
              <AnalysisPanel icon={Shield} title="Risks" items={fb.risks} tone="risk" />
              <AnalysisPanel icon={Lightbulb} title="Recommendations" items={fb.improvements} tone="neutral" />
              <div className="md:col-span-2">
                <AnalysisPanel icon={ArrowRight} title="Next Steps · Action Plan" items={fb.next_steps} tone="step" />
              </div>
            </div>
          </Reveal>
        );
      })()}

      {/* HISTORY */}
      {data.history.length > 1 && (
        <Reveal>
          <p className="eyebrow mb-3">Evaluation history</p>
          <div className="card-soft divide-y overflow-hidden">
            {data.history.map((h) => (
              <div key={h.id} className="px-6 py-4 flex justify-between items-center hover:bg-muted/40 transition">
                <span className="text-sm text-muted-foreground font-mono-x">{new Date(h.created_at).toLocaleString()}</span>
                <span className="font-display text-2xl text-navy">{Math.round(Number(h.overall_score ?? 0))}<span className="text-sm text-muted-foreground">/100</span></span>
              </div>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
