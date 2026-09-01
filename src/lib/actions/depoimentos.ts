"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createDepoimento(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!profileId || !body) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Um depoimento por autor por perfil (unique constraint na tabela) — se já
  // existe um recusado, o autor não pode escrever outro (evita spam de reenvio).
  await supabase.from("depoimentos").insert({
    profile_id: profileId,
    author_id: user.id,
    body: body.slice(0, 1000),
  });

  revalidatePath("/perfil/[username]", "page");
}

export async function respondDepoimento(formData: FormData) {
  const depoimentoId = String(formData.get("depoimentoId") || "");
  const decision = String(formData.get("decision") || "");
  if (!depoimentoId || !["approved", "rejected"].includes(decision)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS garante que só o dono do perfil (profile_id = auth.uid()) consegue mudar o status.
  await supabase
    .from("depoimentos")
    .update({ status: decision, responded_at: new Date().toISOString() })
    .eq("id", depoimentoId);

  revalidatePath("/perfil/[username]", "page");
}

export async function deleteDepoimento(formData: FormData) {
  const depoimentoId = String(formData.get("depoimentoId") || "");
  if (!depoimentoId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("depoimentos").delete().eq("id", depoimentoId);

  revalidatePath("/perfil/[username]", "page");
}
