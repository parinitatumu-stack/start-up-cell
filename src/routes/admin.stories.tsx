import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/stories")({ component: AdminStories });

function AdminStories() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-stories"],
    queryFn: async () => (await supabase.from("success_stories").select("*").order("year", { ascending: false })).data ?? [],
  });
  const [f, setF] = useState({ startup_name: "", founder_name: "", domain: "", achievement: "", description: "", year: new Date().getFullYear() });

  const add = async () => {
    if (!f.startup_name || !f.founder_name) return toast.error("Startup and founder are required.");
    const { error } = await supabase.from("success_stories").insert(f);
    if (error) return toast.error(error.message);
    toast.success("Success story published.");
    setF({ startup_name: "", founder_name: "", domain: "", achievement: "", description: "", year: new Date().getFullYear() });
    qc.invalidateQueries();
  };

  const remove = async (id: string) => {
    await supabase.from("success_stories").delete().eq("id", id);
    qc.invalidateQueries();
  };

  return (
    <>
      <PageHeader eyebrow="Showcase" title="Success stories" description="Celebrate ventures that made it out of the cell." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card-soft p-6 space-y-3 lg:col-span-1">
          <p className="eyebrow">New story</p>
          <Input placeholder="Startup name" value={f.startup_name} onChange={(e) => setF({ ...f, startup_name: e.target.value })} />
          <Input placeholder="Founder name" value={f.founder_name} onChange={(e) => setF({ ...f, founder_name: e.target.value })} />
          <Input placeholder="Domain" value={f.domain} onChange={(e) => setF({ ...f, domain: e.target.value })} />
          <Input placeholder="Achievement (headline)" value={f.achievement} onChange={(e) => setF({ ...f, achievement: e.target.value })} />
          <Input type="number" placeholder="Year" value={f.year} onChange={(e) => setF({ ...f, year: Number(e.target.value) })} />
          <Textarea rows={3} placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <Button onClick={add} className="bg-aqua text-navy hover:bg-aqua-bright w-full">Publish</Button>
        </div>
        <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
          {data.map((s) => (
            <div key={s.id} className="card-soft p-5 relative">
              <button onClick={() => remove(s.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              <div className="eyebrow">{s.domain} · {s.year}</div>
              <div className="font-display text-2xl mt-1">{s.startup_name}</div>
              <div className="text-sm text-muted-foreground">{s.founder_name}</div>
              <div className="mt-3 text-aqua font-semibold">{s.achievement}</div>
              <p className="text-sm mt-2">{s.description}</p>
            </div>
          ))}
          {data.length === 0 && <p className="text-muted-foreground">No stories yet.</p>}
        </div>
      </div>
    </>
  );
}
