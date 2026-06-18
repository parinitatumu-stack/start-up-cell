import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Rocket, Handshake, Target } from "lucide-react";
import { useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ mode: (s.mode as string) === "signup" ? "signup" : "signin" }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const { session } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode as "signin" | "signup");
  const [tab, setTab] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
      const role = data?.role ?? "student";
      navigate({ to: role === "admin" ? "/admin" : "/app", replace: true });
    })();
  }, [session, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth" },
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* LEFT: light editorial panel */}
      <aside className="relative bg-ivory text-navy p-10 lg:p-16 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <Logo className="text-navy" />
        </div>

        <div className="max-w-md mt-12">
          <div className="flex items-center gap-3 text-[11px] tracking-[0.22em] uppercase text-aqua">
            <span className="w-8 h-px bg-aqua" /> Student Innovation Portal
          </div>
          <h1 className="font-display text-5xl md:text-6xl leading-[1.05] mt-8 tracking-tight">
            {mode === "signup" ? <>Start your <span className="italic text-aqua">startup</span> journey.</> : <>Sign in to your <span className="italic text-aqua">startup</span> journey.</>}
          </h1>
          <p className="text-navy-3 mt-6 leading-relaxed">
            One platform for college students to register startups, connect with mentors, track milestones, and walk into any pitch — completely ready.
          </p>

          <div className="mt-10 space-y-5">
            {[
              { Icon: Rocket, t: "Register your startup", d: "Submit proposals & track approvals" },
              { Icon: Handshake, t: "Connect with mentors", d: "Domain-matched expert guidance" },
              { Icon: Target, t: "Check pitch readiness", d: "Score across 7 key dimensions" },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center shadow-sm">
                  <Icon className="w-5 h-5 text-aqua" />
                </div>
                <div>
                  <div className="font-semibold">{t}</div>
                  <div className="text-sm text-muted-foreground">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-6 text-xs text-muted-foreground">
          <div>FEDF · Front End Development Frameworks & UI Engineering</div>
          <div className="mt-1">Section 13 · KL Hyderabad</div>
        </div>
      </aside>

      {/* RIGHT: navy form panel */}
      <section className="surface-navy-grid p-10 lg:p-16 flex flex-col">
        <div className="flex items-center justify-between">
          <Logo className="text-ivory" />
          <Link to="/" className="text-[11px] tracking-[0.22em] uppercase text-ivory/60 hover:text-aqua inline-flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </Link>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <h2 className="font-display text-5xl text-ivory">
              {mode === "signup" ? <>Welcome <span className="italic text-aqua">in.</span></> : <>Welcome <span className="italic text-aqua">back.</span></>}
            </h2>
            <p className="eyebrow mt-2">{mode === "signup" ? "Create your account" : "Sign in to your account"}</p>

            <div className="mt-8 grid grid-cols-2 p-1 rounded-lg bg-navy-2/60 border border-aqua/10">
              {(["student", "admin"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`py-2.5 text-[11px] tracking-[0.22em] uppercase rounded-md transition ${tab === t ? "bg-aqua text-navy font-semibold" : "text-ivory/60 hover:text-ivory"}`}>
                  {t}
                </button>
              ))}
            </div>
            {tab === "admin" && (
              <p className="text-[11px] text-ivory/50 mt-2">Admin role is granted by an existing admin. Sign in or sign up first, then ask an admin to elevate your account.</p>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              {mode === "signup" && (
                <div>
                  <Label className="text-[11px] tracking-[0.22em] uppercase text-ivory/70">Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required
                    placeholder="Ada Lovelace"
                    className="mt-2 bg-navy-2/60 border-aqua/10 text-ivory placeholder:text-ivory/30 h-12" />
                </div>
              )}
              <div>
                <Label className="text-[11px] tracking-[0.22em] uppercase text-ivory/70">Email Address</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="you@university.edu"
                  className="mt-2 bg-navy-2/60 border-aqua/10 text-ivory placeholder:text-ivory/30 h-12" />
              </div>
              <div>
                <Label className="text-[11px] tracking-[0.22em] uppercase text-ivory/70">Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  placeholder="••••••••"
                  className="mt-2 bg-navy-2/60 border-aqua/10 text-ivory placeholder:text-ivory/30 h-12" />
              </div>

              <Button type="submit" disabled={busy}
                className="w-full bg-aqua text-navy hover:bg-aqua-bright h-12 text-[11px] tracking-[0.22em] uppercase font-semibold rounded-md">
                {busy ? "Working…" : <>{mode === "signup" ? `Create ${tab} account` : `Sign in as ${tab}`} <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-ivory/10" /></div>
                <div className="relative flex justify-center"><span className="bg-navy px-3 text-[10px] tracking-[0.3em] uppercase text-ivory/40">or</span></div>
              </div>

              <Button type="button" onClick={onGoogle} disabled={busy} variant="outline"
                className="w-full bg-transparent border-ivory/15 text-ivory hover:bg-ivory/5 hover:text-aqua h-12 text-[11px] tracking-[0.22em] uppercase">
                Continue with Google
              </Button>
            </form>

            <div className="mt-8 text-center">
              <div className="text-[11px] tracking-[0.22em] uppercase text-ivory/40 mb-2">— {mode === "signup" ? "Already have an account?" : "New here?"} —</div>
              <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-ivory hover:text-aqua">
                {mode === "signup" ? <>Sign in instead →</> : <>Create one <span className="text-aqua">→</span></>}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
