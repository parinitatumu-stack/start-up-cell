import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/startups")({ component: AdminStartups });

function AdminStartups() {
  const { data = [] } = useQuery({
    queryKey: ["admin-startups"],
    queryFn: async () => {
      const { data } = await supabase.from("startups").select("*, profiles(name,email), mentor_assignments(mentors(name))").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  return (
    <>
      <PageHeader eyebrow="Pipeline" title="All startups" description="Every startup registered in the cell." />
      <div className="card-soft overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Startup</TableHead><TableHead>Founder</TableHead><TableHead>Domain</TableHead>
            <TableHead>Status</TableHead><TableHead>Mentor</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {data.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-semibold">{s.name}<div className="text-xs text-muted-foreground">{s.description}</div></TableCell>
                <TableCell>{(s.profiles as { name?: string } | null)?.name ?? "—"}</TableCell>
                <TableCell>{s.domain}</TableCell>
                <TableCell><span className="text-xs px-2 py-1 rounded bg-aqua/15 text-navy uppercase tracking-wider">{s.status}</span></TableCell>
                <TableCell>{(s.mentor_assignments as { mentors?: { name?: string } }[] | null)?.[0]?.mentors?.name ?? <span className="text-muted-foreground">unassigned</span>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
