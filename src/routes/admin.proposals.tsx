import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { setMilestone } from "@/lib/startup";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/admin/proposals")({ component: AdminProposals });

function AdminProposals() {
  const qc = useQueryClient();
  const [comments, setComments] = useState<Record<string, string>>({});

  const { data = [] } = useQuery({
    queryKey: ["admin-proposals"],
    queryFn: async () => {
      const { data } = await supabase.from("proposals").select("*, startups(name, domain, user_id, id)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const decide = async (p: typeof data[number], status: "approved" | "rejected") => {
    const c = comments[p.id] ?? p.comments ?? "";
    const { error } = await supabase.from("proposals").update({ status, comments: c }).eq("id", p.id);
    if (error) return toast.error(error.message);
    const startup = p.startups as { id: string; user_id: string; name: string } | null;
    if (startup) {
      if (status === "approved") {
        await setMilestone(startup.id, "Proposal Approved", true);
        await supabase.from("startups").update({ status: "approved" }).eq("id", startup.id);
      }
      await notify(startup.user_id, `Proposal ${status}`, `Your proposal for “${startup.name}” was ${status}.${c ? ` Note: ${c}` : ""}`);
    }
    toast.success(`Proposal ${status}.`);
    qc.invalidateQueries();
  };

  return (
    <>
      <PageHeader eyebrow="Review queue" title="Proposals" description="Approve, reject, or send back with comments." />
      <div className="space-y-4">
        {data.map((p) => {
          const s = p.startups as { name?: string; domain?: string } | null;
          return (
            <div key={p.id} className="card-soft p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-2xl">{s?.name}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{s?.domain}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded uppercase tracking-wider ${
                  p.status === "approved" ? "bg-aqua/15 text-navy" :
                  p.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-sand text-navy"
                }`}>{p.status}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4 text-sm">
                <div><div className="eyebrow mb-1">Problem</div>{p.problem_statement}</div>
                <div><div className="eyebrow mb-1">Solution</div>{p.solution}</div>
                <div><div className="eyebrow mb-1">Audience</div>{p.target_audience}</div>
                <div><div className="eyebrow mb-1">Model</div>{p.business_model}</div>
              </div>
              <Textarea rows={2} className="mt-4" placeholder="Reviewer comments…"
                value={comments[p.id] ?? p.comments ?? ""} onChange={(e) => setComments({ ...comments, [p.id]: e.target.value })} />
              <div className="flex gap-2 mt-3">
                <Button onClick={() => decide(p, "approved")} className="bg-aqua text-navy hover:bg-aqua-bright">Approve</Button>
                <Button onClick={() => decide(p, "rejected")} variant="outline">Reject</Button>
              </div>
            </div>
          );
        })}
        {data.length === 0 && <p className="text-muted-foreground">No proposals yet.</p>}
      </div>
    </>
  );
}
