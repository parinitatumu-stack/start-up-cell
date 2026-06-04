import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { setMilestone } from "@/lib/startup";
import { notify } from "@/lib/notify";

const LIFECYCLE = ["draft", "submitted", "under_review", "approved", "incubation_applied", "incubation_approved"] as const;
type Stage = typeof LIFECYCLE[number];

const STAGE_LABEL: Record<Stage, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  incubation_applied: "Incubation Applied",
  incubation_approved: "Incubation Approved",
};

export const Route = createFileRoute("/admin/startups")({ component: AdminStartups });

function AdminStartups() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-startups"],
    queryFn: async () => {
      const { data } = await supabase.from("startups")
        .select("*, profiles(name,email), mentor_assignments(mentors(name))")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const updateStatus = async (id: string, status: Stage, userId: string, name: string) => {
    const { error } = await supabase.from("startups").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    if (status === "incubation_applied") await setMilestone(id, "Incubation Applied", true);
    if (status === "incubation_approved") await setMilestone(id, "Incubation Approved", true);
    await notify(userId, "Startup status updated", `“${name}” → ${STAGE_LABEL[status]}`);
    toast.success(`Status: ${STAGE_LABEL[status]}`);
    qc.invalidateQueries();
  };

  return (
    <>
      <PageHeader eyebrow="Pipeline" title="All startups" description="Every startup registered in the cell. Move them through the lifecycle." />
      <div className="card-soft overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Startup</TableHead><TableHead>Founder</TableHead><TableHead>Domain</TableHead>
            <TableHead>Lifecycle stage</TableHead><TableHead>Mentor</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {data.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-semibold">{s.name}<div className="text-xs text-muted-foreground">{s.description}</div></TableCell>
                <TableCell>{s.founder_name ?? (s.profiles as { name?: string } | null)?.name ?? "—"}</TableCell>
                <TableCell>{s.domain}</TableCell>
                <TableCell>
                  <Select value={s.status as Stage} onValueChange={(v) => updateStatus(s.id, v as Stage, s.user_id, s.name)}>
                    <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LIFECYCLE.map((st) => <SelectItem key={st} value={st}>{STAGE_LABEL[st]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{(s.mentor_assignments as { mentors?: { name?: string } }[] | null)?.[0]?.mentors?.name ?? <span className="text-muted-foreground">unassigned</span>}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No startups yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
