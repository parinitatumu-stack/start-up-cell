import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { GraduationCap, Mail } from "lucide-react";

export const Route = createFileRoute("/app/mentor")({ component: MentorPage });

function MentorPage() {
  const { user } = useSession();
  const { data } = useQuery({
    queryKey: ["mentor", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data: startup } = await supabase.from("startups").select("*").eq("user_id", user!.id).maybeSingle();
      if (!startup) return null;
      const { data: assign } = await supabase.from("mentor_assignments").select("*, mentors(*)").eq("startup_id", startup.id).maybeSingle();
      const { data: suggestions } = await supabase.rpc("list_mentors_directory", { _domain: startup.domain ?? "" });
      return { startup, assign, suggestions: suggestions ?? [] };
    },
  });

  return (
    <>
      <PageHeader eyebrow="Mentor" title="Your guide through the cell." description="Mentors are domain experts assigned by admin." />
      {!data?.assign ? (
        <div className="card-soft p-8">
          <p className="text-muted-foreground">No mentor assigned yet. Suggested matches based on your startup domain:</p>
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            {data?.suggestions?.length ? data.suggestions.map((m) => (
              <div key={m.id} className="p-5 rounded-lg border border-border bg-card">
                <div className="font-display text-xl">{m.name}</div>
                <div className="text-sm text-muted-foreground">{m.designation} · {m.domain}</div>
                <p className="text-sm mt-2">{m.bio}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground">An admin will assign one soon.</p>}
          </div>
        </div>
      ) : (
        <div className="card-soft p-8 max-w-2xl">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-aqua/15 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-aqua" /></div>
            <div className="flex-1">
              <div className="font-display text-3xl">{data.assign.mentors.name}</div>
              <div className="text-muted-foreground">{data.assign.mentors.designation} · {data.assign.mentors.domain}</div>
              <p className="mt-3 text-sm">{data.assign.mentors.bio}</p>
              {data.assign.mentors.email && <div className="mt-3 inline-flex items-center gap-2 text-aqua text-sm"><Mail className="w-4 h-4" />{data.assign.mentors.email}</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
