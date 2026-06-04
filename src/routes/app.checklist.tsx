import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect } from "react";
import { ensurePitchChecklist, PITCH_CHECKLIST_ITEMS, togglePitchItem } from "@/lib/checklist";
import { ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/app/checklist")({ component: ChecklistPage });

function ChecklistPage() {
  const { user } = useSession();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["pitch-checklist", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data: startup } = await supabase.from("startups").select("id,name").eq("user_id", user!.id).maybeSingle();
      if (!startup) return null;
      await ensurePitchChecklist(startup.id);
      const { data: items } = await supabase.from("pitch_checklist").select("*").eq("startup_id", startup.id).order("position");
      return { startup, items: items ?? [] };
    },
  });

  useEffect(() => { qc.invalidateQueries({ queryKey: ["pitch-checklist"] }); }, [qc]);

  if (!data?.startup) return <p className="text-muted-foreground">Register your startup first.</p>;

  const items = data.items.length ? data.items : PITCH_CHECKLIST_ITEMS.map((name, i) => ({ id: name, name, completed: false, position: i }));
  const done = items.filter((i) => i.completed).length;

  const toggle = async (name: string, completed: boolean) => {
    await togglePitchItem(data.startup.id, name, completed);
    qc.invalidateQueries({ queryKey: ["pitch-checklist"] });
  };

  return (
    <>
      <PageHeader eyebrow="Pitch Preparation Checklist" title="Are you pitch-ready?"
        description="Tick off each item before Demo Day. This checklist tracks preparation only — it does not affect your AI quality score." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card-soft p-6 lg:col-span-1">
          <div className="flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-aqua" /><p className="eyebrow">Preparation</p></div>
          <div className="font-display text-6xl text-navy mt-2">{done}<span className="text-2xl text-muted-foreground">/{items.length}</span></div>
          <p className="text-sm text-muted-foreground mt-3">Complete every item to walk in fully prepared.</p>
        </div>
        <div className="card-soft p-6 lg:col-span-2 space-y-1">
          {items.map((it) => (
            <label key={it.name} className="flex items-center gap-3 py-3 px-3 rounded-md hover:bg-muted/40 cursor-pointer">
              <Checkbox checked={!!it.completed} onCheckedChange={(v) => toggle(it.name, !!v)} />
              <span className={it.completed ? "text-foreground" : "text-muted-foreground"}>{it.name}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
