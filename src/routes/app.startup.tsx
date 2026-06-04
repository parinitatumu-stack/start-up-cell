import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ensureMilestones, setMilestone } from "@/lib/startup";
import { notify } from "@/lib/notify";

const DOMAINS = ["AgriTech", "FinTech", "HealthTech", "EdTech", "AI & Data Science", "Other"];

const FIELDS = [
  ["name", "Startup name", "input"],
  ["domain", "Domain", "select"],
  ["founder_name", "Founder name", "input"],
  ["team_members", "Team members (comma-separated)", "input"],
  ["contact_email", "Contact email", "input"],
  ["contact_number", "Contact number", "input"],
  ["description", "One-line description", "input"],
  ["vision", "Vision", "textarea"],
  ["problem_statement", "Problem statement", "textarea"],
  ["solution", "Proposed solution", "textarea"],
  ["target_audience", "Target audience", "input"],
  ["market_opportunity", "Market opportunity", "textarea"],
  ["business_model", "Business model", "textarea"],
  ["innovation_description", "Innovation", "textarea"],
  ["expected_impact", "Expected impact", "textarea"],
] as const;

export const Route = createFileRoute("/app/startup")({ component: StartupPage });

function StartupPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data: startup, isLoading } = useQuery({
    queryKey: ["my-startup", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("startups").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => { if (startup) setForm(startup as never); }, [startup]);

  const save = async () => {
    if (!user) return;
    if (!form.name || !form.domain) return toast.error("Name and domain are required.");
    const payload = { ...form, user_id: user.id, name: form.name, domain: form.domain };
    if (startup) {
      const { error } = await supabase.from("startups").update(payload).eq("id", startup.id);
      if (error) return toast.error(error.message);
      toast.success("Startup updated.");
    } else {
      const { data, error } = await supabase.from("startups").insert({ ...payload, status: "draft" }).select().single();
      if (error) return toast.error(error.message);
      await ensureMilestones(data.id);
      await setMilestone(data.id, "Startup Registered", true);
      await notify(user.id, "Startup registered", `Your startup “${data.name}” is live in the cell.`);
      toast.success("Startup created.");
    }
    qc.invalidateQueries();
  };

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <>
      <PageHeader eyebrow={startup ? "Edit" : "Register"} title={startup ? "Your startup" : "Register your startup"}
        description="The richer your inputs, the sharper the AI pitch evaluation, mentor match, and proposal review." />
      <div className="card-soft p-8 max-w-4xl space-y-5">
        {FIELDS.map(([key, label, kind]) => (
          <div key={key}>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
            {kind === "textarea" ? (
              <Textarea rows={3} className="mt-1.5" value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            ) : kind === "select" ? (
              <select
                className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form[key] ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              >
                <option value="">Select a domain…</option>
                {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <Input className="mt-1.5" value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            )}
          </div>
        ))}
        <Button onClick={save} className="bg-aqua text-navy hover:bg-aqua-bright">{startup ? "Save changes" : "Create startup"}</Button>
      </div>
    </>
  );
}
