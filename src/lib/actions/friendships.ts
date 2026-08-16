"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendFriendRequest(formData: FormData) {
  const addresseeId = String(formData.get("addresseeId") || "");
  if (!addresseeId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === addresseeId) return;

  await supabase
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id: addresseeId });

  revalidatePath("/perfil/[username]", "page");
}

export async function respondFriendRequest(formData: FormData) {
  const friendshipId = String(formData.get("friendshipId") || "");
  const decision = String(formData.get("decision") || "");
  if (!friendshipId || !["accepted", "declined"].includes(decision)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("friendships")
    .update({ status: decision, responded_at: new Date().toISOString() })
    .eq("id", friendshipId)
    .eq("addressee_id", user.id);

  revalidatePath("/perfil/[username]", "page");
  revalidatePath("/feed");
}

export async function removeFriendship(formData: FormData) {
  const friendshipId = String(formData.get("friendshipId") || "");
  if (!friendshipId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  revalidatePath("/perfil/[username]", "page");
  revalidatePath("/feed");
}
