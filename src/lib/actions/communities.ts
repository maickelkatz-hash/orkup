"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createCommunity(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: community, error } = await supabase
    .from("communities")
    .insert({ name, description, creator_id: user.id })
    .select("id")
    .single();

  if (error || !community) return;

  // O criador entra automaticamente como membro.
  await supabase
    .from("community_members")
    .insert({ community_id: community.id, user_id: user.id });

  revalidatePath("/comunidades");
  redirect(`/comunidades/${community.id}`);
}

export async function joinCommunity(formData: FormData) {
  const communityId = String(formData.get("communityId") || "");
  if (!communityId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("community_members")
    .insert({ community_id: communityId, user_id: user.id });

  revalidatePath("/comunidades");
  revalidatePath("/comunidades/[id]", "page");
}

export async function leaveCommunity(formData: FormData) {
  const communityId = String(formData.get("communityId") || "");
  if (!communityId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", user.id);

  revalidatePath("/comunidades");
  revalidatePath("/comunidades/[id]", "page");
}

export async function createTopic(formData: FormData) {
  const communityId = String(formData.get("communityId") || "");
  const title = String(formData.get("title") || "").trim();
  if (!communityId || !title) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: topic, error } = await supabase
    .from("topics")
    .insert({ community_id: communityId, author_id: user.id, title })
    .select("id")
    .single();

  if (error || !topic) return;

  redirect(`/comunidades/${communityId}/topicos/${topic.id}`);
}

export async function createReply(formData: FormData) {
  const topicId = String(formData.get("topicId") || "");
  const communityId = String(formData.get("communityId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!topicId || !body) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("replies").insert({ topic_id: topicId, author_id: user.id, body });

  revalidatePath(`/comunidades/${communityId}/topicos/${topicId}`);
}
