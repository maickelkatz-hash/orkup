"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Campos que aceitam string livre (com limite de tamanho aplicado no banco via check).
const TEXT_FIELDS = ["quem_sou", "activities", "books", "music", "occupation", "employer", "education"] as const;

// Campos de escolha fixa (enum no banco) — string vazia vira null (limpa o campo).
const ENUM_FIELDS = [
  "relationship_status",
  "platform_interest",
  "has_children",
  "sexual_orientation",
] as const;

export async function updateProfileDetails(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const update: Record<string, string | boolean | null> = {};

  for (const field of TEXT_FIELDS) {
    const value = formData.get(field);
    if (value !== null) update[field] = String(value).trim() || null;
  }

  for (const field of ENUM_FIELDS) {
    const value = formData.get(field);
    if (value !== null) update[field] = String(value) || null;
  }

  const birthDate = formData.get("birth_date");
  if (birthDate !== null) update.birth_date = String(birthDate) || null;

  const smokes = formData.get("smokes");
  if (smokes !== null) update.smokes = smokes === "sim" ? true : smokes === "nao" ? false : null;

  const bio = formData.get("bio");
  if (bio !== null) update.bio = String(bio).trim().slice(0, 300) || null;

  if (Object.keys(update).length === 0) return;

  // RLS (profiles_update_own) já garante que só dá pra atualizar o próprio perfil.
  await supabase.from("profiles").update(update).eq("id", user.id);

  revalidatePath("/perfil/[username]", "page");
}
