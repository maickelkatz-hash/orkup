"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateImage, extensionFor } from "@/lib/media/validate";

export type UploadState = { error: string | null };

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
