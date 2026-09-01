"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function becomeFan(formData: FormData) {
  const targetId = String(formData.get("targetId") || "");
  if (!targetId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === targetId) return;

  await supabase.from("fans").insert({ fan_id: user.id, target_id: targetId });

  revalidatePath("/perfil/[username]", "page");
}

export async function removeFan(formData: FormData) {
  const targetId = String(formData.get("targetId") || "");
  if (!targetId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("fans").delete().eq("fan_id", user.id).eq("target_id", targetId);

  revalidatePath("/perfil/[username]", "page");
}
