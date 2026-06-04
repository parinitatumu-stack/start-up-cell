import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { setMilestone } from "@/lib/startup";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/app/proposal")({ component: ProposalPage });

function ProposalPage() {
  const { user } = useSession();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["proposal", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data: startup } = await supabase.from("startups").select("*").eq("user_id", user!.id).maybeSingle();
      if (!startup) return { startup: null, proposal: null };
      const { data: proposal } = await supabase.from("proposals").select("*").eq("startup_id", startup.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      return { startup, proposal };
    },
  });

  const [form, setForm] = useState({ problem_statement: "", solution: "", target_audience: "", business_model: "" });
  useEffect(() => {
    if (data?.proposal) setForm(data.proposal as never);
    else if (data?.startup) setForm({
      problem_statement: data.startup.problem_statement ?? "",
      solution: data.startup.solution ?? "",
      target_audience: data.startup.target_audience ?? "",
      business_model: data.startup.business_model ?? "",
    });
  }, [data]);

  if (!data?.startup) return (
    <>
      <PageHeader title="Submit a proposal" description="Register your startup first to submit a proposal." />
      <Link to="/app/startup"><Button className="bg-aqua text-navy hover:bg-aqua-bright">Go to startup</Button></Link>
    </>
  );

  const submit = async () => {
    if (data.proposal) {
      const { error } = await supabase.from("proposals").update({ ...form, status: "pending" }).eq("id", data.proposal.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("proposals").insert({ ...form, startup_id: data.startup.id, status: "pending" });
      if (error) return toast.error(error.message);
    }
    await setMilestone(data.startup.id, "Proposal Submitted", true);
    await notify(user!.id, "Proposal submitted", `Your proposal for “${data.startup.name}” is under review.`);
    toast.success("Proposal submitted.");
    qc.invalidateQueries();
  };

  return (
    <>
      <PageHeader eyebrow="Proposal" title="Make your case." description="A clear proposal accelerates mentor assignment and incubation." />
      <div className="card-soft p-8 max-w-4xl space-y-5">
        {data.proposal && (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
            data.proposal.status === "approved" ? "bg-aqua/20 text-navy" :
            data.proposal.status === "rejected" ? "bg-destructive/15 text-destructive" :
            "bg-sand text-navy"
          }`}>Status: {data.proposal.status}</div>
        )}
        {data.proposal?.comments && (
          <div className="p-4 bg-muted rounded-md text-sm">
            <div className="eyebrow mb-1">Reviewer comments</div>{data.proposal.comments}
          </div>
        )}
        {([
          ["problem_statement", "Problem"],
          ["solution", "Solution"],
          ["target_audience", "Target audience"],
          ["business_model", "Business model"],
        ] as const).map(([k, label]) => (
          <div key={k}>
            <label className="eyebrow">{label}</label>
            <Textarea rows={3} className="mt-2" value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
          </div>
        ))}
        <Button onClick={submit} className="bg-aqua text-navy hover:bg-aqua-bright">
          {data.proposal ? "Resubmit proposal" : "Submit proposal"}
        </Button>
      </div>
    </>
  );
}
