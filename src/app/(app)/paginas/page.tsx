import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createPage, followPage, unfollowPage } from "@/lib/actions/pages";
import { Avatar } from "@/components/Avatar";

export default async function PaginasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: pages } = await supabase
    .from("pages")
    .select("id, slug, name, bio, avatar_url, verified, owner_id, page_followers(user_id)")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-4 mb-6">
        <h2 className="font-bold mb-3">Criar uma Página</h2>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
          Páginas são para marcas, projetos e artistas — quem segue vê os
          posts na mesma linha do tempo cronológica dos amigos, sem
          algoritmo. O selo de verificação nunca aumenta alcance.
        </p>
        <form action={createPage} className="space-y-2">
          <input
            type="text"
            name="name"
            required
            placeholder="Nome da página"
            className="input-field"
          />
          <input
            type="text"
            name="slug"
            placeholder="endereço (ex: minha-marca) — opcional"
            className="input-field"
          />
          <textarea
            name="bio"
            rows={2}
            placeholder="Sobre a página"
            className="input-field"
          />
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">
              Criar página
            </button>
          </div>
        </form>
      </div>

      {(pages ?? []).map((p) => {
        const followers = (p.page_followers ?? []) as { user_id: string }[];
        const isFollowing = followers.some((f) => f.user_id === user.id);
        const isOwner = p.owner_id === user.id;
        return (
          <div key={p.id} className="card p-4 mb-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Avatar avatarUrl={p.avatar_url} initials={p.name.slice(0, 2).toUpperCase()} size={44} />
              <div>
                <Link href={`/paginas/${p.slug}`} className="font-semibold hover:underline">
                  {p.name}
                  {p.verified && (
                    <span className="verified-badge" title="Página verificada">✓</span>
                  )}
                </Link>
                {p.bio && (
                  <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                    {p.bio}
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  {followers.length} seguidor{followers.length === 1 ? "" : "es"}
                </p>
              </div>
            </div>
            {!isOwner &&
              (isFollowing ? (
                <form action={unfollowPage}>
                  <input type="hidden" name="pageId" value={p.id} />
                  <button type="submit" className="btn-secondary text-sm shrink-0">
                    Deixar de seguir
                  </button>
                </form>
              ) : (
                <form action={followPage}>
                  <input type="hidden" name="pageId" value={p.id} />
                  <button type="submit" className="btn-primary text-sm shrink-0">
                    Seguir
                  </button>
                </form>
              ))}
          </div>
        );
      })}

      {(pages ?? []).length === 0 && (
        <div className="card p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          Nenhuma página ainda. Que tal criar a primeira?
        </div>
      )}
    </div>
  );
}
