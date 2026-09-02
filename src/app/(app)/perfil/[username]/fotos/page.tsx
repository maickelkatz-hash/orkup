import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Álbum de fotos do perfil. Não é uma tabela nova — reúne, em grade, todos
// os posts com foto de uma pessoa (posts.image_url), na mesma ordem
// cronológica do resto do produto (mais recente primeiro). A visibilidade
// segue a RLS de "posts" (dono, amigos aceitos), então não precisa de
// nenhuma lógica extra de permissão aqui.
export default async function FotosPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const { data: photos } = await supabase
    .from("posts")
    .select("id, image_url, body, created_at")
    .eq("author_id", profile.id)
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-6 mb-4">
        <p className="text-sm mb-1">
          <Link href={`/perfil/${profile.username}`} style={{ color: "var(--blue)" }}>
            ← {profile.display_name}
          </Link>
        </p>
        <h1 className="text-lg font-bold">Fotos</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {photos?.length ?? 0} foto{(photos?.length ?? 0) === 1 ? "" : "s"}
        </p>
      </div>

      {(!photos || photos.length === 0) && (
        <div className="card p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          Nenhuma foto ainda.
        </div>
      )}

      {photos && photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <Link
              key={photo.id}
              href={`/perfil/${profile.username}#post-${photo.id}`}
              className="block aspect-square overflow-hidden rounded"
              style={{ background: "var(--border)" }}
              title={photo.body || undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- grade simples de miniaturas, sem necessidade de otimização do next/image aqui */}
              <img
                src={photo.image_url ?? ""}
                alt={photo.body || "Foto"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
