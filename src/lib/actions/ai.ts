"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateAiReply, detectsCrisisSignal } from "@/lib/ai/reply";

export async function confirmBirthdate(formData: FormData) {
  const birthdate = String(formData.get("birthdate") || "").trim();
  if (!birthdate || !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Auto-declarada — a verificação documental forte é um processo à parte
  // (selo de verificação pago, seção 4.1). Aqui é só o portão de idade
  // mínima exigido antes de liberar o Amigo IA (seção 11.3).
  await supabase.from("profiles").update({ birthdate }).eq("id", user.id);

  revalidatePath("/amigo-ia");
}

export async function sendAiMessage(formData: FormData) {
  const conversationId = String(formData.get("conversationId") || "");
  const body = String(formData.get("body") || "").trim();
  if (!conversationId || !body) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const userFlaggedCrisis = detectsCrisisSignal(body);

  await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    role: "user",
    body,
    flagged_crisis: userFlaggedCrisis,
  });

  const reply = await generateAiReply(body);

  await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    body: reply.body,
    flagged_crisis: reply.crisis,
  });

  revalidatePath("/amigo-ia");
}
