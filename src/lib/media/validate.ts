// Helpers puros de validação de imagem — em arquivo separado dos Server
// Actions porque um módulo "use server" só pode exportar funções async
// (toda export vira uma Server Action); funções síncronas como estas
// não podem morar em lib/actions/*.ts.

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB — mesmo limite dos buckets no SQL

export function validateImage(file: File | null): string | null {
  if (!file || file.size === 0) return "Escolha uma imagem.";
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Formato não aceito. Use JPG, PNG, WEBP ou GIF.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Imagem muito grande (máximo 5MB).";
  }
  return null;
}

export function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type.split("/")[1] || "jpg";
}
