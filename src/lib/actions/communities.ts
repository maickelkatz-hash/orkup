"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateImage, extensionFor } from "@/lib/media/validate";
import type { UploadState } from "@/lib/actions/media";

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

// Só o criador consegue de fato gravar (a policy de storage só libera a
// própria pasta do usuário, e aqui checamos creator_id antes de tentar).
export async function uploadCommunityAvatar(
  _prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const communityId = String(formData.get("communityId") || "");
  const file = formData.get("avatar") as File | null;
  const validationError = validateImage(file);
  if (validationError) return { error: validationError };
  if (!communityId) return { error: "Comunidade inválida." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada, entre novamente." };

  const { data: community } = await supabase
    .from("communities")
    .select("creator_id")
    .eq("id", communityId)
    .maybeSingle();

  if (!community || community.creator_id !== user.id) {
    return { error: "Só o moderador da comunidade pode trocar a foto." };
  }

  const path = `${user.id}/community-${communityId}.${extensionFor(file!)}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file!, { upsert: true, cacheControl: "3600" });

  if (uploadError) return { error: "Falha ao enviar a imagem." };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  const bustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: dbError } = await supabase
    .from("communities")
    .update({ avatar_url: bustedUrl })
    .eq("id", communityId);

  if (dbError) return { error: "Imagem enviada, mas falhou ao salvar na comunidade." };

  revalidatePath("/comunidades");
  revalidatePath("/comunidades/[id]", "page");
  return { error: null };
}

// Moderação — só o dono da comunidade (creator_id) consegue de fato
// executar essas três (a RLS da migration 0006 recusa qualquer outra
// pessoa mesmo que tente chamar a action direto).
export async function deleteTopic(formData: FormData) {
  const topicId = String(formData.get("topicId") || "");
  const communityId = String(formData.get("communityId") || "");
  if (!topicId || !communityId) return;

  const supabase = await createClient();
  await supabase.from("topics").delete().eq("id", topicId);

  revalidatePath(`/comunidades/${communityId}`);
}

export async function removeMember(formData: FormData) {
  const communityId = String(formData.get("communityId") || "");
  const userId = String(formData.get("userId") || "");
  if (!communityId || !userId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Ninguém remove a si mesmo por aqui — pra isso já existe "Sair".
  if (!user || user.id === userId) return;

  await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", userId);

  revalidatePath(`/comunidades/${communityId}`);
}

export async function deleteReply(formData: FormData) {
  const replyId = String(formData.get("replyId") || "");
  const communityId = String(formData.get("communityId") || "");
  const topicId = String(formData.get("topicId") || "");
  if (!replyId || !communityId || !topicId) return;

  const supabase = await createClient();
  await supabase.from("replies").delete().eq("id", replyId);

  revalidatePath(`/comunidades/${communityId}/topicos/${topicId}`);
}

export async function deleteCommunity(formData: FormData) {
  const communityId = String(formData.get("communityId") || "");
  if (!communityId) return;

  const supabase = await createClient();
  await supabase.from("communities").delete().eq("id", communityId);

  revalidatePath("/comunidades");
  redirect("/comunidades");
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
