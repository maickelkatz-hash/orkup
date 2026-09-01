"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createRecado(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!profileId || !body) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("recados").insert({
    profile_id: profileId,
    author_id: user.id,
    body: body.slice(0, 500),
  });

  revalidatePath("/perfil/[username]", "page");
}

export async function deleteRecado(formData: FormData) {
  const recadoId = String(formData.get("recadoId") || "");
  if (!recadoId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS já garante que só autor do recado ou dono do mural conseguem apagar.
  await supabase.from("recados").delete().eq("id", recadoId);

  revalidatePath("/perfil/[username]", "page");
}
