import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { setMilestone } from "@/lib/startup";
import { notify } from "@/lib/notify";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Mentor = { id: string; name: string; domain: string; designation: string | null; email: string | null; bio: string | null };

export const Route = createFileRoute("/admin/mentors")({ component: AdminMentors });

function AdminMentors() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Mentor> | null>(null);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-mentors"],
    queryFn: async () => {
      const [mentors, startups] = await Promise.all([
        supabase.from("mentors").select("*").order("name"),
        supabase.from("startups").select("*, mentor_assignments(mentor_id)").order("created_at", { ascending: false }),
      ]);
      return { mentors: (mentors.data ?? []) as Mentor[], startups: startups.data ?? [] };
    },
  });

  const assign = async (startupId: string, mentorId: string, userId: string, startupName: string) => {
    await supabase.from("mentor_assignments").delete().eq("startup_id", startupId);
    const { error } = await supabase.from("mentor_assignments").insert({ startup_id: startupId, mentor_id: mentorId });
    if (error) return toast.error(error.message);
    await setMilestone(startupId, "Mentor Assigned", true);
    await notify(userId, "Mentor assigned", `A mentor has been assigned to “${startupName}”.`);
    toast.success("Mentor assigned.");
    qc.invalidateQueries();
  };

  const openNew = () => { setEditing({ name: "", domain: "", designation: "", email: "", bio: "" }); setOpen(true); };
  const openEdit = (m: Mentor) => { setEditing(m); setOpen(true); };

  const save = async () => {
    if (!editing?.name || !editing?.domain) return toast.error("Name and domain are required.");
    const payload = {
      name: editing.name, domain: editing.domain,
      designation: editing.designation || null, email: editing.email || null, bio: editing.bio || null,
    };
    const res = editing.id
      ? await supabase.from("mentors").update(payload).eq("id", editing.id)
      : await supabase.from("mentors").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing.id ? "Mentor updated." : "Mentor added.");
    setOpen(false); setEditing(null); qc.invalidateQueries();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this mentor? Any assignments to startups will also be removed.")) return;
    await supabase.from("mentor_assignments").delete().eq("mentor_id", id);
    const { error } = await supabase.from("mentors").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Mentor deleted.");
    qc.invalidateQueries();
  };

  return (
    <>
      <PageHeader eyebrow="Mentor desk" title="Mentors & assignments"
        description="Match startups to domain-aligned mentors. Add, edit, or remove mentors from the roster."
        action={<Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew} className="bg-aqua text-navy hover:bg-aqua-bright"><Plus className="w-4 h-4 mr-2" />Add mentor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? "Edit mentor" : "Add mentor"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
              <div><Label>Domain</Label><Input value={editing?.domain ?? ""} onChange={(e) => setEditing({ ...editing!, domain: e.target.value })} placeholder="AgriTech, FinTech, …" /></div>
              <div><Label>Designation</Label><Input value={editing?.designation ?? ""} onChange={(e) => setEditing({ ...editing!, designation: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={editing?.email ?? ""} onChange={(e) => setEditing({ ...editing!, email: e.target.value })} /></div>
              <div><Label>Bio</Label><Textarea rows={3} value={editing?.bio ?? ""} onChange={(e) => setEditing({ ...editing!, bio: e.target.value })} /></div>
              <Button onClick={save} className="w-full bg-aqua text-navy hover:bg-aqua-bright">Save</Button>
            </div>
          </DialogContent>
        </Dialog>} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <p className="eyebrow">Assign mentors to startups</p>
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
          {data?.startups.length === 0 && <p className="text-sm text-muted-foreground">No startups registered yet.</p>}
        </div>
        <div className="card-soft p-5">
          <p className="eyebrow mb-3">Mentor roster</p>
          <ul className="space-y-3">
            {data?.mentors.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-2 group">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.designation} · {m.domain}</div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(m.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
