import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { setMilestone } from "@/lib/startup";
import { Upload, FileText } from "lucide-react";

const SLOTS = ["10:00 AM", "11:00 AM", "01:00 PM", "02:30 PM", "04:00 PM"];

export const Route = createFileRoute("/app/demo-day")({ component: DemoDayPage });

function DemoDayPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data } = useQuery({
    queryKey: ["demo", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data: startup } = await supabase.from("startups").select("*").eq("user_id", user!.id).maybeSingle();
      if (!startup) return null;
      const [reg, jury] = await Promise.all([
        supabase.from("demo_day_registrations").select("*").eq("startup_id", startup.id).maybeSingle(),
        supabase.from("jury_members").select("*"),
      ]);
      return { startup, reg: reg.data, jury: jury.data ?? [] };
    },
  });
  const [form, setForm] = useState({ pitch_title: "", deck_url: "", slot: SLOTS[0], presenter_name: "" });
  useEffect(() => { if (data?.reg) setForm(data.reg as never); }, [data]);

  if (!data?.startup) return <p className="text-muted-foreground">Register your startup first.</p>;

  const uploadDeck = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/${data.startup.id}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("pitch-decks").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: signed } = await supabase.storage.from("pitch-decks").createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl ?? path;
      setForm((f) => ({ ...f, deck_url: url }));
      toast.success("Deck uploaded.");
    } catch (e) {
      toast.error("Upload failed: " + (e as Error).message);
    } finally { setUploading(false); }
  };

  const save = async () => {
    if (data.reg) await supabase.from("demo_day_registrations").update(form).eq("id", data.reg.id);
    else await supabase.from("demo_day_registrations").insert({ ...form, startup_id: data.startup.id });
    await setMilestone(data.startup.id, "Pitch Deck Uploaded", !!form.deck_url);
    toast.success("Demo Day registration saved.");
    qc.invalidateQueries();
  };

  return (
    <>
      <PageHeader eyebrow="Demo Day" title="Book your pitch slot." description="Lock in your slot, upload your deck, and meet the jury." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card-soft p-8 lg:col-span-2 space-y-5">
          <div><label className="eyebrow">Pitch title</label><Input className="mt-2" value={form.pitch_title ?? ""} onChange={(e) => setForm({ ...form, pitch_title: e.target.value })} /></div>
          <div><label className="eyebrow">Presenter name</label><Input className="mt-2" value={form.presenter_name ?? ""} onChange={(e) => setForm({ ...form, presenter_name: e.target.value })} /></div>
          <div>
            <label className="eyebrow">Pitch deck</label>
            <input ref={fileRef} type="file" accept=".pdf,.ppt,.pptx,.key"
              className="hidden" onChange={(e) => e.target.files?.[0] && uploadDeck(e.target.files[0])} />
            <div className="mt-2 flex gap-2 items-center">
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="w-4 h-4 mr-2" />{uploading ? "Uploading…" : form.deck_url ? "Replace deck" : "Upload deck"}
              </Button>
              {form.deck_url && (
                <a href={form.deck_url} target="_blank" rel="noreferrer" className="text-aqua text-sm inline-flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />View uploaded deck
                </a>
              )}
            </div>
            <Input className="mt-2" placeholder="…or paste a link (Google Slides, Notion, PDF)"
              value={form.deck_url ?? ""} onChange={(e) => setForm({ ...form, deck_url: e.target.value })} />
          </div>
          <div>
            <label className="eyebrow">Slot</label>
            <Select value={form.slot ?? SLOTS[0]} onValueChange={(v) => setForm({ ...form, slot: v })}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>{SLOTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={save} className="bg-aqua text-navy hover:bg-aqua-bright">{data.reg ? "Update registration" : "Register for Demo Day"}</Button>
        </div>
        <div className="card-soft p-6">
          <p className="eyebrow">Jury Panel</p>
          <ul className="mt-4 space-y-3">
            {data.jury.map((j) => (
              <li key={j.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-aqua/15 text-aqua flex items-center justify-center font-semibold">{j.name.slice(0,1)}</div>
                <div><div className="text-sm font-semibold">{j.name}</div><div className="text-xs text-muted-foreground">{j.designation}</div></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
