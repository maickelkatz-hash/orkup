"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function createPage(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  let slug = slugify(slugInput || name);
  if (slug.length < 3) slug = `${slug}-pagina`.slice(0, 40);

  const { data: page, error } = await supabase
    .from("pages")
    .insert({ owner_id: user.id, name, bio: bio || null, slug })
    .select("slug")
    .single();

  if (error || !page) return;

  revalidatePath("/paginas");
  redirect(`/paginas/${page.slug}`);
}

export async function followPage(formData: FormData) {
  const pageId = String(formData.get("pageId") || "");
  if (!pageId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("page_followers").insert({ page_id: pageId, user_id: user.id });

  revalidatePath("/paginas");
  revalidatePath("/paginas/[slug]", "page");
  revalidatePath("/feed");
}

export async function unfollowPage(formData: FormData) {
  const pageId = String(formData.get("pageId") || "");
  if (!pageId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("page_followers")
    .delete()
    .eq("page_id", pageId)
    .eq("user_id", user.id);

  revalidatePath("/paginas");
  revalidatePath("/paginas/[slug]", "page");
  revalidatePath("/feed");
}

// Só o dono da página pode postar em nome dela — a RLS também garante
// isso no banco, aqui é só pra não deixar a UI tentar em vão.
export async function createPagePost(formData: FormData) {
  const pageId = String(formData.get("pageId") || "");
  const pageSlug = String(formData.get("pageSlug") || "");
  const body = String(formData.get("body") || "").trim();
  const image = formData.get("image") as File | null;
  if (!pageId) return;
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
    .insert({ author_id: user.id, page_id: pageId, body: body || "", image_url: imageUrl });

  revalidatePath("/feed");
  if (pageSlug) revalidatePath(`/paginas/${pageSlug}`);
}
