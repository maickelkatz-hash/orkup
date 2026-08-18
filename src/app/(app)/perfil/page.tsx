import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// /perfil sozinho (sem username) não existe como página própria — isso
// dava 404 (só existe a rota dinâmica /perfil/[username]). Como quase
// sempre quem cai aqui quer ver o próprio perfil, redireciona pra lá em
// vez de mostrar um erro.
export default async function PerfilIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/feed");

  redirect(`/perfil/${profile.username}`);
}
