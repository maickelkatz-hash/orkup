"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPost(formData: FormData) {
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("posts").insert({ author_id: user.id, body });
  revalidatePath("/feed");
  revalidatePath("/perfil/[username]", "page");
}

export async function toggleLike(formData: FormData) {
  const postId = String(formData.get("postId") || "");
  if (!postId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
  } else {
    await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
  }

  revalidatePath("/feed");
  revalidatePath("/perfil/[username]", "page");
}

export async function addComment(formData: FormData) {
  const postId = String(formData.get("postId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!postId || !body) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, body });

  revalidatePath("/feed");
  revalidatePath("/perfil/[username]", "page");
}
