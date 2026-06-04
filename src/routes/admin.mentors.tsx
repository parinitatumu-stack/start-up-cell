import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { setMilestone } from "@/lib/startup";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/admin/mentors")({ component: AdminMentors });

function AdminMentors() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-mentors"],
    queryFn: async () => {
      const [mentors, startups] = await Promise.all([
        supabase.from("mentors").select("*").order("name"),
        supabase.from("startups").select("*, mentor_assignments(mentor_id)").order("created_at", { ascending: false }),
      ]);
      return { mentors: mentors.data ?? [], startups: startups.data ?? [] };
    },
  });

  const assign = async (startupId: string, mentorId: string, userId: string, startupName: string) => {
    // upsert via delete+insert (UNIQUE on startup_id)
    await supabase.from("mentor_assignments").delete().eq("startup_id", startupId);
    const { error } = await supabase.from("mentor_assignments").insert({ startup_id: startupId, mentor_id: mentorId });
    if (error) return toast.error(error.message);
    await setMilestone(startupId, "Mentor Assigned", true);
    await notify(userId, "Mentor assigned", `A mentor has been assigned to “${startupName}”.`);
    toast.success("Mentor assigned.");
    qc.invalidateQueries();
  };

  return (
    <>
      <PageHeader eyebrow="Mentor desk" title="Assign mentors" description="Match startups to domain-aligned mentors." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {data?.startups.map((s) => {
            const current = (s.mentor_assignments as { mentor_id: string }[] | null)?.[0]?.mentor_id ?? "";
            const matches = data.mentors.filter((m) => m.domain.toLowerCase().includes((s.domain ?? "").toLowerCase().split(" ")[0]));
            return (
              <div key={s.id} className="card-soft p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.domain}</div>
                  {matches.length > 0 && <div className="text-xs text-aqua mt-1">Suggested: {matches.map((m) => m.name).join(", ")}</div>}
                </div>
                <Select value={current} onValueChange={(v) => assign(s.id, v, s.user_id, s.name)}>
                  <SelectTrigger className="w-60"><SelectValue placeholder="Assign mentor…" /></SelectTrigger>
                  <SelectContent>{data.mentors.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} — {m.domain}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
        <div className="card-soft p-5">
          <p className="eyebrow mb-3">Mentor roster</p>
          <ul className="space-y-3">
            {data?.mentors.map((m) => (
              <li key={m.id}>
                <div className="font-semibold">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.designation} · {m.domain}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
