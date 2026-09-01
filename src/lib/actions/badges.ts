"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BADGE_TYPES = ["fiel", "legal", "sexy"] as const;
type BadgeType = (typeof BADGE_TYPES)[number];

function isBadgeType(value: string): value is BadgeType {
  return (BADGE_TYPES as readonly string[]).includes(value);
}

// Alterna o voto: se a pessoa já votou naquele selo, remove; senão, adiciona.
// Um clique, um resultado — sem precisar de dois botões (votar/desfazer) na UI.
export async function toggleBadge(formData: FormData) {
  const profileId = String(formData.get("profileId") || "");
  const badgeType = String(formData.get("badgeType") || "");
  if (!profileId || !isBadgeType(badgeType)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === profileId) return;

  const { data: existing } = await supabase
    .from("profile_badges")
    .select("profile_id")
    .eq("profile_id", profileId)
    .eq("voter_id", user.id)
    .eq("badge_type", badgeType)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("profile_badges")
      .delete()
      .eq("profile_id", profileId)
      .eq("voter_id", user.id)
      .eq("badge_type", badgeType);
  } else {
    await supabase
      .from("profile_badges")
      .insert({ profile_id: profileId, voter_id: user.id, badge_type: badgeType });
  }

  revalidatePath("/perfil/[username]", "page");
}
