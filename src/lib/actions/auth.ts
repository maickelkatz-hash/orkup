"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error: string | null };

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const displayName = String(formData.get("displayName") || "").trim();
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();

  if (!email || !password || !displayName || !username) {
    return { error: "Preencha todos os campos." };
  }
  if (password.length < 8) {
    return { error: "A senha precisa ter pelo menos 8 caracteres." };
  }
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return {
      error:
        "O nome de usuário deve ter 3-20 letras minúsculas, números ou _.",
    };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/feed`,
      data: {
        display_name: displayName,
        username,
        initials: initialsFrom(displayName),
      },
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { error: "Já existe uma conta com esse e-mail. Tente entrar." };
    }
    return { error: error.message };
  }

  // Se "Confirm email" estiver ativado no projeto Supabase, o signUp não
  // retorna uma sessão — o usuário só entra depois de clicar no link
  // enviado por e-mail. Se estiver desativado, já vem com sessão e vai
  // direto para o feed.
  if (!data.session) {
    redirect(`/confirmar-email?email=${encodeURIComponent(email)}`);
  }

  redirect("/feed");
}

export async function resendConfirmation(email: string) {
  if (!email) return { error: "E-mail inválido." };
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/confirm?next=/feed` },
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  redirect("/feed");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
