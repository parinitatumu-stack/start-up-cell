import { Link, Outlet, useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { useProfile, useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, LayoutDashboard, Rocket, FileText, GraduationCap, Trophy, Sparkles, Users, ShieldCheck, BookOpen, type LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

type NavItem = { to: string; label: string; icon: LucideIcon };

const studentNav: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/startup", label: "My Startup", icon: Rocket },
  { to: "/app/proposal", label: "Proposal", icon: FileText },
  { to: "/app/mentor", label: "Mentor", icon: GraduationCap },
  { to: "/app/mvp", label: "MVP", icon: BookOpen },
  { to: "/app/demo-day", label: "Demo Day", icon: Trophy },
  { to: "/app/ai", label: "AI Pitch Check", icon: Sparkles },
];

const adminNav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/startups", label: "Startups", icon: Rocket },
  { to: "/admin/proposals", label: "Proposals", icon: FileText },
  { to: "/admin/mentors", label: "Mentors", icon: GraduationCap },
  { to: "/admin/stories", label: "Success Stories", icon: Trophy },
  { to: "/admin/users", label: "Users", icon: Users },
];

export function AppShell({ children, role }: { children: ReactNode; role: "student" | "admin" }) {
  const nav = role === "admin" ? adminNav : studentNav;
  const location = useLocation();
  const router = useRouter();
  const { user } = useSession();
  const { data: profile } = useProfile(user);
  const navigate = useNavigate();

  const { data: unread = 0 } = useQuery({
    queryKey: ["notif-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true })
        .eq("user_id", user!.id).eq("read", false);
      return count ?? 0;
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("notifs-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => router.invalidate()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, router]);

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 surface-navy shrink-0 flex flex-col">
        <div className="px-6 py-6"><Logo className="text-ivory" /></div>
        <div className="px-3 mb-2 mt-2 text-[10px] tracking-[0.25em] uppercase text-ivory/40 px-6">
          {role === "admin" ? "Admin console" : "Founder workspace"}
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== `/${role === "admin" ? "admin" : "app"}` && location.pathname.startsWith(to));
            return (
              <Link key={to} to={to}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition ${active ? "bg-aqua text-navy font-semibold" : "text-ivory/70 hover:bg-navy-2 hover:text-ivory"}`}>
                <Icon className="w-4 h-4" />{label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-aqua/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-aqua/20 text-aqua flex items-center justify-center font-semibold">
              {(profile?.name ?? "?").slice(0,1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-ivory truncate">{profile?.name ?? "—"}</div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-aqua">{role}</div>
            </div>
          </div>
          <Button onClick={signOut} variant="outline" className="w-full bg-transparent border-ivory/15 text-ivory/80 hover:bg-navy-2 hover:text-aqua text-xs">
            <LogOut className="w-3.5 h-3.5 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {role === "admin" ? <ShieldCheck className="w-4 h-4 text-aqua" /> : <Sparkles className="w-4 h-4 text-aqua" />}
            <span className="text-foreground font-medium">{role === "admin" ? "Admin Console" : "Founder Workspace"}</span>
          </div>
          <Link to="/app/notifications" className="relative inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-muted">
            <Bell className="w-4 h-4 text-foreground" />
            {unread > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-aqua text-navy text-[10px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
          </Link>
        </header>
        <div className="flex-1 p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}

export function RequireRole({ role, children }: { role: "student" | "admin"; children: ReactNode }) {
  const { session, loading } = useSession();
  const { user } = useSession();
  const { data: profile, isLoading } = useProfile(user);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || isLoading) return;
    if (!session) { navigate({ to: "/auth", replace: true }); return; }
    if (profile && profile.role !== role) {
      navigate({ to: profile.role === "admin" ? "/admin" : "/app", replace: true });
    }
  }, [loading, isLoading, session, profile, role, navigate]);

  if (loading || isLoading || !session || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading…</div>;
  }
  if (profile.role !== role) return null;
  return <AppShell role={role}>{children}</AppShell>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-8 pb-6 border-b border-border">
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="font-display text-4xl md:text-5xl tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground mt-2 max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}
