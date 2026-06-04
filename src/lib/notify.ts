import { supabase } from "@/integrations/supabase/client";

export async function notify(userId: string, title: string, message: string) {
  await supabase.from("notifications").insert({ user_id: userId, title, message });
}
