import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/app/notifications")({ component: NotifPage });

function NotifPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["notifs", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      const unread = (data ?? []).filter((n) => !n.read).map((n) => n.id);
      if (unread.length) await supabase.from("notifications").update({ read: true }).in("id", unread);
      qc.invalidateQueries({ queryKey: ["notif-count"] });
      return data ?? [];
    },
  });

  return (
    <>
      <PageHeader eyebrow="Inbox" title="Notifications" description="Everything important the cell sent your way." />
      <div className="card-soft divide-y">
        {data.length === 0 && <div className="p-8 text-center text-muted-foreground"><Bell className="w-6 h-6 mx-auto mb-2" />No notifications yet.</div>}
        {data.map((n) => (
          <div key={n.id} className="p-5">
            <div className="flex justify-between items-baseline gap-4">
              <div className="font-semibold">{n.title}</div>
              <div className="text-xs text-muted-foreground shrink-0">{new Date(n.created_at).toLocaleString()}</div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
          </div>
        ))}
      </div>
    </>
  );
}
