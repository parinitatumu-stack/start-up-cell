import { supabase } from "@/integrations/supabase/client";

export const PITCH_CHECKLIST_ITEMS = [
  "Proposal Completed",
  "Mentor Assigned",
  "Team Formed",
  "Prototype Uploaded",
  "Pitch Deck Uploaded",
  "Market Validation Completed",
];

export async function ensurePitchChecklist(startupId: string) {
  const { data: existing } = await supabase.from("pitch_checklist").select("name").eq("startup_id", startupId);
  const have = new Set((existing ?? []).map((m) => m.name));
  const toInsert = PITCH_CHECKLIST_ITEMS
    .map((name, i) => ({ name, position: i, startup_id: startupId }))
    .filter((m) => !have.has(m.name));
  if (toInsert.length) await supabase.from("pitch_checklist").insert(toInsert);
}

export async function togglePitchItem(startupId: string, name: string, completed: boolean) {
  await supabase.from("pitch_checklist").update({ completed, updated_at: new Date().toISOString() })
    .eq("startup_id", startupId).eq("name", name);
}
