import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_MILESTONES } from "@/lib/milestones";

export async function getOrCreateStartup(userId: string) {
  const { data } = await supabase.from("startups").select("*").eq("user_id", userId).maybeSingle();
  return data;
}

export async function ensureMilestones(startupId: string) {
  const { data: existing } = await supabase.from("milestones").select("name").eq("startup_id", startupId);
  const have = new Set((existing ?? []).map((m) => m.name));
  const toInsert = DEFAULT_MILESTONES
    .map((name, i) => ({ name, position: i, startup_id: startupId }))
    .filter((m) => !have.has(m.name));
  if (toInsert.length) await supabase.from("milestones").insert(toInsert);
}

export async function setMilestone(startupId: string, name: string, completed: boolean) {
  await supabase.from("milestones").update({ completed, updated_at: new Date().toISOString() })
    .eq("startup_id", startupId).eq("name", name);
}
