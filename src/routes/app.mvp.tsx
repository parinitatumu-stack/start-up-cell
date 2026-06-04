import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { setMilestone } from "@/lib/startup";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/app/mvp")({ component: MvpPage });

function MvpPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["mvp", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data: startup } = await supabase.from("startups").select("*").eq("user_id", user!.id).maybeSingle();
      if (!startup) return null;
      const { data: mvp } = await supabase.from("mvp_submissions").select("*").eq("startup_id", startup.id).maybeSingle();
      return { startup, mvp };
    },
  });
  const [form, setForm] = useState({ repo_url: "", demo_url: "", build_summary: "" });
  useEffect(() => { if (data?.mvp) setForm(data.mvp as never); }, [data]);

  if (!data?.startup) return <p className="text-muted-foreground">Register your startup first.</p>;

  const save = async () => {
    if (data.mvp) {
      await supabase.from("mvp_submissions").update({ ...form, status: "submitted" }).eq("id", data.mvp.id);
    } else {
      await supabase.from("mvp_submissions").insert({ ...form, startup_id: data.startup.id, status: "submitted" });
    }
    await setMilestone(data.startup.id, "MVP Submitted", true);
    await notify(user!.id, "MVP submitted", "Your MVP is in admin review.");
    toast.success("MVP submitted.");
    qc.invalidateQueries();
  };

  return (
    <>
      <PageHeader eyebrow="MVP" title="Ship something real." description="Drop your repo, your live demo, and a build summary. Admins review and unlock Demo Day." />
      <div className="card-soft p-8 max-w-3xl space-y-5">
        {data.mvp && <div className="text-xs uppercase tracking-wider text-aqua font-semibold">Status: {data.mvp.status}</div>}
        <div><label className="eyebrow">Repository URL</label><Input className="mt-2" value={form.repo_url ?? ""} onChange={(e) => setForm({ ...form, repo_url: e.target.value })} placeholder="https://github.com/..." /></div>
        <div><label className="eyebrow">Live Demo URL</label><Input className="mt-2" value={form.demo_url ?? ""} onChange={(e) => setForm({ ...form, demo_url: e.target.value })} placeholder="https://..." /></div>
        <div><label className="eyebrow">Build Summary</label><Textarea rows={4} className="mt-2" value={form.build_summary ?? ""} onChange={(e) => setForm({ ...form, build_summary: e.target.value })} /></div>
        <Button onClick={save} className="bg-aqua text-navy hover:bg-aqua-bright">{data.mvp ? "Update MVP" : "Submit MVP"}</Button>
      </div>
    </>
  );
}
