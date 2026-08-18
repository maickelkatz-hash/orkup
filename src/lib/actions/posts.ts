"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export async function createPost(formData: FormData) {
  const body = String(formData.get("body") || "").trim();
  const image = formData.get("image") as File | null;
  if (!body && (!image || image.size === 0)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const hasValidImage =
    !!image &&
    image.size > 0 &&
    ALLOWED_IMAGE_TYPES.includes(image.type) &&
    image.size <= MAX_IMAGE_BYTES;

  // Formato/tamanho inválido e sem texto: não há o que publicar.
  if (image && image.size > 0 && !hasValidImage && !body) return;

  let imageUrl: string | null = null;

  if (hasValidImage) {
    const ext = image!.type.split("/")[1] || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(path, image!, { cacheControl: "3600" });

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("post-images").getPublicUrl(path);
      imageUrl = publicUrl;
    }
  }

  if (!body && !imageUrl) return;

  await supabase
    .from("posts")
    .insert({ author_id: user.id, body: body || "", image_url: imageUrl });
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
