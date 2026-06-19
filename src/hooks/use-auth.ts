import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type Profile = { id: string; name: string | null; email: string | null; role: "student" | "admin" };
type AuthState = { session: Session | null; user: User | null; loading: boolean };

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setSession(null);
      } else {
        setSession(data.session);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (event !== "INITIAL_SESSION") setLoading(false);

      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void router.invalidate();
        if (event === "SIGNED_OUT") qc.clear();
        else void qc.invalidateQueries();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, qc]);

  const value = useMemo<AuthState>(() => ({
    session,
    user: session?.user ?? null,
    loading,
  }), [session, loading]);

  return createElement(AuthContext.Provider, { value }, children);
}

export function useSession() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useSession must be used within AuthProvider");
  return auth;
}

export function useProfile(user: User | null) {
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      const fallbackProfile: Profile = {
        id: user.id,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? null,
        email: user.email ?? null,
        role: "student",
      };

      if (error) return fallbackProfile;
      if (data) return data as Profile;

      const { data: created, error: createError } = await supabase
        .from("profiles")
        .insert(fallbackProfile)
        .select("*")
        .single();
      if (createError) return fallbackProfile;
      return created as Profile;
    },
  });
}
