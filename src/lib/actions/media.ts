"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB — mesmo limite dos buckets no SQL

export type UploadState = { error: string | null };

function validateImage(file: File | null): string | null {
  if (!file || file.size === 0) return "Escolha uma imagem.";
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Formato não aceito. Use JPG, PNG, WEBP ou GIF.";
  }
  if (file.size > MAX_BYTES) {
    return "Imagem muito grande (máximo 5MB).";
  }
  return null;
}

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type.split("/")[1] || "jpg";
}

export async function uploadAvatar(
  _prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const file = formData.get("avatar") as File | null;
  const validationError = validateImage(file);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada, entre novamente." };

  const path = `${user.id}/avatar.${extensionFor(file!)}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file!, { upsert: true, cacheControl: "3600" });

  if (uploadError) return { error: "Falha ao enviar a imagem." };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // Evita cache de navegador/CDN servindo a foto antiga depois de trocar.
  const bustedUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: dbError } = await supabase
    .from("profiles")
    .update({ avatar_url: bustedUrl })
    .eq("id", user.id);

  if (dbError) return { error: "Imagem enviada, mas falhou ao salvar no perfil." };

  revalidatePath("/perfil/[username]", "page");
  revalidatePath("/feed");
  return { error: null };
}
